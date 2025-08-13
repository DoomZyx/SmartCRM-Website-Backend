const express = require("express");
const cors = require("cors");
require("dotenv").config();

// Import de la connexion MongoDB
const connectDB = require("./utils/database");

const app = express();
const PORT = process.env.PORT || 3001;

// Import des routes
const apiRoutes = require("./routes");

// Connexion à MongoDB
connectDB();

// Middleware CORS - Permet toutes les origines pour le développement
app.use(
  cors({
    origin: "https://www.mysmartcrm.fr/contact",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes de base
app.get("/", (req, res) => {
  res.json({ message: "API SmartCRM Backend - Serveur opérationnel" });
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

app.listen(PORT, () => {
  console.log(`Serveur SmartCRM démarré sur le port ${PORT}`);
  console.log(`API disponible sur https://smartcrm-website.onrender.com:${PORT}`);
});
