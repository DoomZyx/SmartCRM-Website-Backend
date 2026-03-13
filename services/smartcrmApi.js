/**
 * Service d'appel à l'API SmartCRM (SaaS) pour créer une instance (tenant)
 * après paiement Stripe. Uniquement côté backend, clé serveur en variable d'environnement.
 */

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
 * Crée une instance (tenant) sur le serveur SmartCRM.
 * @param {Object} body - { plan, name, countryCode?, clientId?, slug?, provisionTwilio?, provisionOpenAi?, buyOnMainAccount? }
 * @returns {Promise<{ instanceId: string, apiKey?: string, notes?: string }>}
 * @throws {Error} avec statusCode (400, 401, 409, 500, 502) et message selon la réponse API
 */
async function createInstance(body) {
  const baseUrl = process.env.SMARTCRM_API_BASE_URL;
  const serverApiKey = process.env.SMARTCRM_SERVER_API_KEY;

  if (!baseUrl || !serverApiKey) {
    const err = new Error("SmartCRM API non configurée (SMARTCRM_API_BASE_URL / SMARTCRM_SERVER_API_KEY)");
    err.statusCode = 503;
    throw err;
  }

  const url = `${baseUrl.replace(/\/$/, "")}/api/instances`;
  const response = await fetch(url, {
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
        notes: data.notes ?? undefined,
      };
    }
    return data || {};
  }

  const err = new Error(data?.message || data?.error || `SmartCRM API ${response.status}`);
  err.statusCode = response.status;
  err.responseBody = data;
  throw err;
}

module.exports = {
  getPlanSlug,
  createInstance,
};
