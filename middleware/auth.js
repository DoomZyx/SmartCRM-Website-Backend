const { verifyToken, JWT_COOKIE_NAME } = require("../utils/jwt");

/**
 * Middleware d'authentification : lit le JWT depuis le cookie HTTP-only ou le header Authorization.
 * Le frontend ne doit jamais recevoir le token en brut ; le cookie est envoyé automatiquement par le navigateur.
 */
function requireAuth(req, res, next) {
  const token =
    req.cookies?.[JWT_COOKIE_NAME] ||
    (req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.slice(7)
      : null);
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ message: "Non authentifié" });
  }
  req.user = payload;
  next();
}

module.exports = { requireAuth };
