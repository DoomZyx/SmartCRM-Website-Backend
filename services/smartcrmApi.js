/**
 * Service d'appel à l'API SmartCRM (SaaS) pour créer une instance (tenant)
 * après paiement Stripe. Uniquement côté backend, clé serveur en variable d'environnement.
 */
const { logger } = require("../utils/logger");

/**
 * Construit un body multipart/form-data sans dépendance externe (Buffer + boundary).
 * @param {Array<{ name: string, buffer: Buffer, filename: string, mimeType: string }>} parts
 * @returns {{ body: Buffer, contentType: string }}
 */
function buildMultipartBody(parts) {
  const boundary = "----SmartCRMUpload" + Math.random().toString(36).slice(2) + Date.now();
  const sep = "\r\n";
  const chunks = [];
  for (const p of parts) {
    chunks.push(
      Buffer.from(`--${boundary}${sep}Content-Disposition: form-data; name="${p.name}"; filename="${p.filename.replace(/"/g, "%22")}"${sep}Content-Type: ${p.mimeType}${sep}${sep}`),
      p.buffer,
      Buffer.from(sep)
    );
  }
  chunks.push(Buffer.from(`--${boundary}--${sep}`));
  return {
    body: Buffer.concat(chunks),
    contentType: `multipart/form-data; boundary=${boundary}`,
  };
}

const DEFAULT_PLAN_SLUGS = {
  1: "echauffement",
  2: "mise_en_place",
  3: "standard",
  4: "premium",
  5: "premium",
};

/**
 * Retourne le slug plan pour l'API SmartCRM à partir du planId (1-5).
 * Priorité : SMARTCRM_PLAN_SLUG_1 .. SMARTCRM_PLAN_SLUG_5, sinon mapping par défaut.
 */
function getPlanSlug(planId) {
  const envSlug = process.env[`SMARTCRM_PLAN_SLUG_${planId}`];
  if (envSlug && typeof envSlug === "string" && envSlug.trim()) {
    return envSlug.trim();
  }
  return DEFAULT_PLAN_SLUGS[planId] || "standard";
}

/**
 * Crée une instance (tenant) sur le serveur.
 * @param {Object} body - { plan, name, countryCode?, clientId?, slug?, provisionTwilio?, provisionOpenAi?, buyOnMainAccount? }
 * @returns {Promise<{ instanceId: string, apiKey?: string, slug?: string, notes?: string, twilioNumber?: string, regulatoryBundlePending?: boolean, twilioTemporaryNumber?: string, bundleSid?: string }>}
 * @throws {Error} avec statusCode (400, 401, 409, 500, 502) et message selon la réponse API
 */
async function createInstance(body) {
  let baseUrl = process.env.SMARTCRM_API_BASE_URL;
  const serverApiKey = process.env.SMARTCRM_SERVER_API_KEY;

  if (!baseUrl || !serverApiKey) {
    logger.error(
      { baseUrl: !!baseUrl, serverApiKey: !!serverApiKey },
      "createInstance: config manquante",
    );
    const err = /** @type {Error & { statusCode?: number }} */ (new Error("SmartCRM API non configurée (SMARTCRM_API_BASE_URL / SMARTCRM_SERVER_API_KEY)"));
    err.statusCode = 503;
    throw err;
  }

  baseUrl = String(baseUrl).trim();
  if (!/^https?:\/\//i.test(baseUrl)) {
    const port = baseUrl.replace(/\D/g, "") || "8081";
    baseUrl = `http://localhost:${port}`;
  }
  const url = `${baseUrl.replace(/\/$/, "")}/api/instances`;
  let response;
  try {
  response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": serverApiKey,
    },
    body: JSON.stringify(body),
  });

  const contentType = response.headers.get("content-type");
  const isJson = contentType && contentType.includes("application/json");
  let data = null;
  if (isJson) {
    try {
      data = await response.json();
    } catch (_) {
      // body non JSON
    }
  }

  if (response.ok) {
    if (response.status === 201 && data) {
      return {
        instanceId: data.instanceId ?? data.instance_id ?? null,
        apiKey: data.apiKey ?? data.api_key ?? undefined,
        slug: data.slug ?? undefined,
        notes: data.notes ?? undefined,
        twilioNumber: data.twilioNumber ?? data.twilio_number ?? undefined,
        regulatoryBundlePending: data.regulatoryBundlePending ?? undefined,
        twilioTemporaryNumber: data.twilioTemporaryNumber ?? data.twilio_temporary_number ?? undefined,
        bundleSid: data.bundleSid ?? data.bundle_sid ?? undefined,
      };
    }
    return data || {};
  }

  logger.error(
    { status: response.status, body: data },
    "createInstance: app SmartCRM a répondu en erreur",
  );
  const err = /** @type {Error & { statusCode?: number, responseBody?: unknown }} */ (new Error(data?.message || data?.error || `SmartCRM API ${response.status}`));
  err.statusCode = response.status;
  err.responseBody = data;
  throw err;
  } catch (fetchErr) {
    if (/** @type {Error & { statusCode?: number }} */ (fetchErr).statusCode) throw fetchErr;
    const errMsg = fetchErr?.message || "fetch failed";
    const errCode = fetchErr?.code;
    const errCause = fetchErr?.cause?.message || fetchErr?.cause;
    logger.error(
      { err: errMsg, code: errCode, cause: errCause, url },
      "createInstance: fetch failed"
    );
    const err = /** @type {Error & { statusCode?: number }} */ (new Error("Impossible de joindre l'app SmartCRM: " + errMsg));
    err.statusCode = 503;
    throw err;
  }
}

/**
 * Envoie les infos restaurant (profil établissement) vers l'instance SmartCRM (Pricing.restaurantInfo).
 * Utilise la clé API tenant pour cibler la bonne instance. Ne fait rien si config ou clé absente.
 * @param {string} tenantApiKey - Clé API du tenant (user)
 * @param {Object} restaurantInfo - { nom, adresse, telephone, email, nombreCouverts }
 * @returns {Promise<void>}
 */
async function syncRestaurantInfoToInstance(tenantApiKey, restaurantInfo) {
  let baseUrl = process.env.SMARTCRM_API_BASE_URL;
  if (!baseUrl || !tenantApiKey || typeof tenantApiKey !== "string" || !tenantApiKey.trim()) {
    return;
  }
  if (!restaurantInfo || typeof restaurantInfo !== "object") {
    return;
  }
  baseUrl = String(baseUrl).trim();
  if (!/^https?:\/\//i.test(baseUrl)) {
    const port = baseUrl.replace(/\D/g, "") || "8081";
    baseUrl = `http://localhost:${port}`;
  }
  const url = `${baseUrl.replace(/\/$/, "")}/api/pricing`;
  try {
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": tenantApiKey.trim(),
      },
      body: JSON.stringify({ restaurantInfo }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      logger.warn(
        { status: response.status, message: data?.message || data?.error },
        "syncRestaurantInfoToInstance: app a répondu en erreur",
      );
    }
  } catch (fetchErr) {
    logger.warn({ err: fetchErr.message }, "syncRestaurantInfoToInstance: fetch failed");
  }
}

/**
 * Envoie les documents réglementaires (ID + justificatif) vers le bundle Twilio de l'instance.
 * @param {string} instanceId
 * @param {Object} [idDocument] - { buffer, mimetype, originalname } (multer)
 * @param {Object} [addressDocument] - { buffer, mimetype, originalname } (multer)
 * @returns {Promise<{ success: boolean, uploaded?: string[] }>}
 */
async function uploadRegulatoryDocuments(instanceId, idDocument, addressDocument) {
  let baseUrl = process.env.SMARTCRM_API_BASE_URL;
  const serverApiKey = process.env.SMARTCRM_SERVER_API_KEY;
  if (!baseUrl || !serverApiKey) {
    logger.warn("uploadRegulatoryDocuments: config manquante");
    return { success: false };
  }
  baseUrl = String(baseUrl).trim().replace(/\/$/, "");
  if (!idDocument && !addressDocument) return { success: true };
  const parts = [];
  if (idDocument && idDocument.buffer) {
    parts.push({
      name: "idDocument",
      buffer: idDocument.buffer,
      filename: idDocument.originalname || "id.pdf",
      mimeType: idDocument.mimetype || "application/pdf",
    });
  }
  if (addressDocument && addressDocument.buffer) {
    parts.push({
      name: "addressDocument",
      buffer: addressDocument.buffer,
      filename: addressDocument.originalname || "justificatif.pdf",
      mimeType: addressDocument.mimetype || "application/pdf",
    });
  }
  const { body, contentType } = buildMultipartBody(parts);
  try {
    const response = await fetch(`${baseUrl}/api/instances/${instanceId}/regulatory-documents`, {
      method: "POST",
      headers: {
        "Content-Type": contentType,
        "x-api-key": serverApiKey,
      },
      body: /** @type {BodyInit} */ (body),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      logger.warn({ status: response.status, message: data?.error }, "uploadRegulatoryDocuments: app a répondu en erreur");
      return { success: false };
    }
    return { success: true, uploaded: data.uploaded || [] };
  } catch (fetchErr) {
    logger.warn({ err: fetchErr.message }, "uploadRegulatoryDocuments: fetch failed");
    return { success: false };
  }
}

module.exports = {
  getPlanSlug,
  createInstance,
  syncRestaurantInfoToInstance,
  uploadRegulatoryDocuments,
};
