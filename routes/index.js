const express = require("express");
const router = express.Router();

// Import des routes
const contactRoutes = require("./contact");
const demoRoutes = require("./demo");
const authRoutes = require("./auth");
const checkoutRoutes = require("./checkout");
const appProxyRoutes = require("./appProxy");

// Route de test
router.get("/test", (req, res) => {
  res.json({
    message: "Route de test API",
    timestamp: new Date().toISOString(),
    status: "OK",
  });
});

// Route ping pour les health checks
router.get("/ping", (req, res) => {
  res.json({
    status: "alive",
    message: "Serveur réactivé avec succès",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Route de santé du serveur (vérifie PostgreSQL ; 503 si DB indisponible)
router.get("/health", async (req, res) => {
  const { getPool } = require("../utils/database");
  const { logger } = require("../utils/logger");
  let dbStatus = "error";
  try {
    const pool = getPool();
    await pool.query("SELECT 1");
    dbStatus = "ok";
  } catch (err) {
    logger.error({ err: err.message }, "Health check: PostgreSQL indisponible");
  }
  const ok = dbStatus === "ok";
  if (!ok) {
    return res.status(503).json({
      status: "degraded",
      message: "Serveur en dégradation",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      db: dbStatus,
    });
  }
  res.json({
    status: "ok",
    message: "Serveur en bonne santé",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    db: dbStatus,
  });
});

// Routes API
router.use("/contact", contactRoutes);
router.use("/demo", demoRoutes);
router.use("/auth", authRoutes);
router.use("/checkout", checkoutRoutes);
router.use("/app-proxy", appProxyRoutes);

module.exports = router;
