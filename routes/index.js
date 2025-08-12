const express = require("express");
const router = express.Router();

// Import des routes
const contactRoutes = require("./contact");
const demoRoutes = require("./demo");

// Route de test
router.get("/test", (req, res) => {
  res.json({
    message: "Route de test API",
    timestamp: new Date().toISOString(),
    status: "OK",
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

module.exports = router;
