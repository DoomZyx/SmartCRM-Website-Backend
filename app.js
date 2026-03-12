const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();

// Import de la connexion PostgreSQL
const { connectDB } = require("./utils/database");
const passport = require("./config/passport");

const app = express();
const PORT = process.env.PORT || 3001;

// Import des routes
const apiRoutes = require("./routes");

// Middleware CORS - credentials: true pour envoi des cookies (JWT HTTP-only)
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());

// Routes de base
app.get("/", (req, res) => {
  res.json({ message: "API SmartCRM Backend - Serveur opérationnel" });
});

// Route ping simple pour les bots et health checks
app.get("/ping", (req, res) => {
  res.json({ 
    status: "alive", 
    timestamp: new Date().toISOString(),
    message: "Pong! API SmartCRM opérationnelle"
  });
});

// Routes API
app.use("/api", apiRoutes);

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Erreur interne du serveur",
    error: process.env.NODE_ENV === "development" ? err.message : {},
  });
});

// Route 404
app.use("*", (req, res) => {
  res.status(404).json({ message: "Route non trouvée" });
});

(async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Serveur SmartCRM démarré sur le port ${PORT}`);
    console.log(`API disponible sur https://smartcrm-website.onrender.com:${PORT}`);
  });
})();
