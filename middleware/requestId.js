/**
 * Middleware : pose req.id (UUID) et ajoute X-Request-Id dans la réponse pour corrélation des logs.
 */
const { randomUUID } = require("crypto");

function requestIdMiddleware(req, res, next) {
  const id = req.headers["x-request-id"] || randomUUID();
  req.id = id;
  res.setHeader("X-Request-Id", id);
  next();
}

module.exports = { requestIdMiddleware };
