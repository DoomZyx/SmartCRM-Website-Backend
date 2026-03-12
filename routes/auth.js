const express = require("express");
const passport = require("../config/passport");
const { requireAuth } = require("../middleware/auth");
const {
  googleCallback,
  getMe,
  logout,
} = require("../controllers/authController");
const { getProfile, updateProfile } = require("../controllers/profileController");

const router = express.Router();

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

// Utilisateur courant (JWT lu depuis cookie ou Authorization, jamais renvoyé dans le body)
router.get("/me", requireAuth, getMe);

// Profil restaurateur (données établissement)
router.get("/profile", requireAuth, getProfile);
router.put("/profile", requireAuth, updateProfile);

// Déconnexion : suppression du cookie
router.post("/logout", logout);

module.exports = router;
