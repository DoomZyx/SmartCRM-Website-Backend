/**
 * Routes internes (appelées par l'app SmartCRM, pas par le front).
 * Sécurisées par X-Internal-Secret (env SMARTCRM_INTERNAL_SECRET ou WEBSITE_INTERNAL_SECRET).
 */
const User = require("../models/User");
const { sendLocalNumberAssignedEmail, sendAppReadyEmail } = require("../utils/emailService");
const { logger } = require("../utils/logger");

const FRONTEND_URL = (process.env.FRONTEND_URL || "https://www.mysmartfood.fr").replace(/\/$/, "");

function requireInternalSecret(req, res, next) {
  const secret = process.env.SMARTCRM_INTERNAL_SECRET || process.env.WEBSITE_INTERNAL_SECRET;
  const provided = req.headers["x-internal-secret"];
  if (!secret || !provided || provided !== secret) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

/**
 * POST /api/internal/notify-local-number-assigned
 * Body: { instanceId, twilioNumber }
 * Appelé par l'app SmartCRM quand le bundle est validé et le numéro local attribué.
 * Envoie un email au client (user lié à cette instance).
 */
async function notifyLocalNumberAssigned(req, res) {
  try {
    const { instanceId, twilioNumber } = req.body || {};
    if (!instanceId || !twilioNumber || typeof twilioNumber !== "string") {
      return res.status(400).json({ error: "instanceId et twilioNumber requis" });
    }

    const user = await User.findBySmartcrmInstanceId(instanceId);
    if (!user || !user.email) {
      logger.warn({ instanceId }, "notifyLocalNumberAssigned: utilisateur non trouvé pour cette instance");
      return res.status(200).json({ received: true });
    }

    await sendLocalNumberAssignedEmail(user.email, twilioNumber, user.name || null);
    return res.status(200).json({ received: true });
  } catch (err) {
    logger.error({ err: err.message }, "notifyLocalNumberAssigned");
    return res.status(500).json({ error: "Erreur serveur" });
  }
}

/**
 * POST /api/internal/notify-app-ready
 * Body: { userId, instanceId, apiKey }
 * Après création manuelle de l'instance : enregistre instance + clé, email au client (lien Mon espace).
 */
async function notifyAppReady(req, res) {
  try {
    const { userId, instanceId, apiKey } = req.body || {};
    const uid = userId != null ? parseInt(String(userId), 10) : NaN;
    if (!Number.isFinite(uid) || uid < 1) {
      return res.status(400).json({ error: "userId invalide" });
    }
    if (!instanceId || typeof instanceId !== "string" || !instanceId.trim()) {
      return res.status(400).json({ error: "instanceId requis" });
    }
    if (!apiKey || typeof apiKey !== "string" || !apiKey.trim()) {
      return res.status(400).json({ error: "apiKey requis" });
    }

    const user = await User.findById(uid);
    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }
    if (user.smartcrmInstanceId) {
      return res.status(409).json({ error: "Une instance est déjà associée à ce compte" });
    }
    if (!user.email) {
      return res.status(400).json({ error: "Aucun email pour ce compte" });
    }

    await User.updateSmartcrmInstance(uid, {
      instanceId: instanceId.trim(),
      apiKey: apiKey.trim(),
    });

    const monEspaceUrl = `${FRONTEND_URL}/mon-espace`;
    await sendAppReadyEmail({
      toEmail: user.email.trim(),
      clientName: user.name || null,
      monEspaceUrl,
    });

    return res.status(200).json({ received: true });
  } catch (err) {
    logger.error({ err: err.message }, "notifyAppReady");
    return res.status(500).json({ error: "Erreur serveur" });
  }
}

module.exports = {
  requireInternalSecret,
  notifyLocalNumberAssigned,
  notifyAppReady,
};
