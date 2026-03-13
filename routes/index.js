const express = require("express");
const router = express.Router();

// Import des routes
const contactRoutes = require("./contact");
const demoRoutes = require("./demo");
const authRoutes = require("./auth");
const checkoutRoutes = require("./checkout");

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

// Route de santé du serveur
router.get("/health", (req, res) => {
  res.json({
    message: "Serveur en bonne santé",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Routes API
router.use("/contact", contactRoutes);
router.use("/demo", demoRoutes);
router.use("/auth", authRoutes);
router.use("/checkout", checkoutRoutes);

module.exports = router;
