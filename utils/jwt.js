const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_COOKIE_NAME = process.env.JWT_COOKIE_NAME || "smartcrm_token";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

/**
 * Génère un JWT signé pour l'utilisateur (usage interne uniquement, jamais renvoyé en brut au front).
 */
function signToken(payload) {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET manquant");
  }
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Vérifie et décode un JWT. Retourne le payload ou null.
 */
function verifyToken(token) {
  if (!JWT_SECRET || !token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

module.exports = {
  signToken,
  verifyToken,
  JWT_COOKIE_NAME,
  JWT_EXPIRES_IN,
};
