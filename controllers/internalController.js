/**
 * Routes internes (appelées par l'app SmartCRM, pas par le front).
 * Sécurisées par X-Internal-Secret (env SMARTCRM_INTERNAL_SECRET ou WEBSITE_INTERNAL_SECRET).
 */
const User = require("../models/User");
const { sendLocalNumberAssignedEmail } = require("../utils/emailService");
const { logger } = require("../utils/logger");

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

module.exports = {
  requireInternalSecret,
  notifyLocalNumberAssigned,
};
