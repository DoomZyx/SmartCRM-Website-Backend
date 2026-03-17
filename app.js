const path = require("path");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
// Charger .env depuis le dossier backend (même si on lance depuis la racine du projet)
require("dotenv").config({ path: path.join(__dirname, ".env") });

// Import de la connexion PostgreSQL
const { connectDB } = require("./utils/database");
const passport = require("./config/passport");
const { logger, child: loggerChild } = require("./utils/logger");
const { requestIdMiddleware } = require("./middleware/requestId");

const app = express();
const PORT = process.env.PORT || 3001;

// audit-fix: headers de sécurité (X-Frame-Options, X-Content-Type-Options, HSTS en prod)
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  next();
});

// Corrélation requête (requestId) et début de requête pour calcul de la durée
app.use(requestIdMiddleware);
app.use((req, res, next) => {
  req._startTime = Date.now();
  next();
});

// Import des routes
const apiRoutes = require("./routes");
const { handleWebhook } = require("./controllers/checkoutController");

// Middleware CORS - credentials: true pour envoi des cookies (JWT HTTP-only)
app.use(
  cors({
    origin: [
      "https://mysmartfood.fr",
      "https://www.mysmartfood.fr",
      "http://localhost:5173",
      "http://localhost:5174",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Webhook Stripe : body brut pour vérification de la signature (avant express.json())
app.post(
  "/api/checkout/webhook",
  express.raw({ type: "application/json" }),
  (req, res, next) => handleWebhook(req, res, next)
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

// Gestion des erreurs (log structuré avec requestId, method, url, statusCode, duration)
app.use((err, req, res, next) => {
  const requestId = req.id;
  const duration = req._startTime != null ? Date.now() - req._startTime : undefined;
  const log = loggerChild(requestId);
  log.error(
    {
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: 500,
      duration,
      err: err.message,
      stack: err.stack,
    },
    "Erreur interne du serveur"
  );
  res.status(500).json({
    message: "Erreur interne du serveur",
    error: process.env.NODE_ENV === "development" ? err.message : {},
  });
});

// Route 404 (méthode et URL pour débogage)
app.use("*", (req, res) => {
  res.status(404).json({
    message: `Route ${req.method}:${req.originalUrl} not found`,
    error: "Not Found",
    statusCode: 404,
  });
});

(async () => {
  // audit-fix: preflight des variables critiques avant démarrage
  const { runPreflight } = require("./scripts/preflight");
  runPreflight();

  await connectDB();
  app.listen(PORT, () => {
    logger.info({ port: PORT }, "Serveur SmartCRM démarré");
  });
})();
