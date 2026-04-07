const express = require("express");
const passport = require("../config/passport");
const { requireAuth } = require("../middleware/auth");
const {
  googleCallback,
  login,
  register,
  setPassword,
  getMe,
  getTenantApiKey,
  logout,
} = require("../controllers/authController");
const { getProfile, updateProfile, submitOnboardingDossier } = require("../controllers/profileController");
const { uploadRegulatoryDocs } = require("../middleware/uploadRegulatoryDocs");

const router = express.Router();

// Vérification que le routeur auth est bien monté (GET /api/auth)
router.get("/", (req, res) => {
  res.json({ message: "Auth router OK", endpoints: ["/google", "/google/callback", "/login", "/set-password", "/me", "/profile", "/logout"] });
});

// Redirection vers la page de consentement Google (pas de token exposé)
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  }),
);

// Callback Google : échange code côté serveur, création JWT, cookie HTTP-only, redirect frontend
router.get("/google/callback", googleCallback);

// Connexion email / mot de passe (body: email, password)
router.post("/login", login);

// Inscription (body: email, password)
router.post("/register", register);

// Définir ou mettre à jour le mot de passe (utilisateur connecté, body: password)
router.post("/set-password", requireAuth, setPassword);

// Utilisateur courant (JWT lu depuis cookie ou Authorization, jamais renvoyé dans le body)
router.get("/me", requireAuth, getMe);

// Clé API tenant SmartCRM (une seule fois après création d'instance, puis supprimée côté serveur)
router.get("/tenant-key", requireAuth, getTenantApiKey);

// Profil restaurateur (données établissement)
router.get("/profile", requireAuth, getProfile);
router.put("/profile", requireAuth, updateProfile);
// Dossier Twilio + coordonnées (multipart : kbisDocument, idDocumentRecto, idDocumentVerso, addressDocument + champs texte). Pas de création d'instance auto.
router.post("/profile/submit-onboarding", requireAuth, uploadRegulatoryDocs, submitOnboardingDossier);

// Déconnexion : suppression du cookie
router.post("/logout", logout);

module.exports = router;
