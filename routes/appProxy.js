/**
 * Proxy vers l'API SmartCRM (app SaaS) avec la clé tenant de l'utilisateur connecté.
 * Permet d'intégrer l'application au site (accès depuis le dashboard sans exposer la clé au frontend).
 */

const express = require("express");
const { requireAuth } = require("../middleware/auth");
const User = require("../models/User");

const router = express.Router();

const APP_BASE_URL = process.env.SMARTCRM_API_BASE_URL || process.env.SMARTCRM_APP_URL;

const FORWARD_HEADERS = [
  "content-type",
  "accept",
  "accept-language",
  "authorization",
];

function buildForwardUrl(originalUrl) {
  const base = (APP_BASE_URL || "").replace(/\/$/, "");
  if (!base) return null;
  const suffix = (originalUrl || "").replace(/^\/api\/app-proxy\/?/, "").replace(/^\//, "") || "";
  return suffix ? `${base}/${suffix}` : base;
}

async function proxyRequest(req, res) {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ message: "Non authentifié" });
  }

  const tenantKey = await User.getTenantApiKey(Number(userId));
  if (!tenantKey || typeof tenantKey !== "string") {
    return res.status(403).json({
      message: "Aucun accès application. Souscrivez à un abonnement pour y accéder.",
    });
  }

  const targetUrl = buildForwardUrl(req.originalUrl);
  if (!targetUrl) {
    return res.status(503).json({
      message: "Application non configurée (SMARTCRM_API_BASE_URL ou SMARTCRM_APP_URL).",
    });
  }

  const headers = {
    "x-api-key": tenantKey,
  };
  FORWARD_HEADERS.forEach((h) => {
    const v = req.headers[h];
    if (v) headers[h] = v;
  });

  let body = null;
  if (req.body !== undefined && req.method !== "GET" && req.method !== "HEAD") {
    body = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
  }

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: body || undefined,
    });

    const contentType = response.headers.get("content-type");
    const isJson = contentType && contentType.includes("application/json");
    let data = null;
    const text = await response.text();
    if (isJson && text) {
      try {
        data = JSON.parse(text);
      } catch (_) {
        data = text;
      }
    } else {
      data = text;
    }

    res.status(response.status);
    if (response.headers.get("content-type")) {
      res.setHeader("content-type", response.headers.get("content-type"));
    }
    if (typeof data === "object" && data !== null) {
      res.json(data);
    } else {
      res.send(data);
    }
  } catch (err) {
    console.error("App proxy error:", err.message);
    res.status(502).json({
      message: "Erreur lors de l'accès à l'application. Réessayez plus tard.",
    });
  }
}

router.use(requireAuth);
router.all("/*", proxyRequest);

module.exports = router;
