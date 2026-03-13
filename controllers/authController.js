const User = require("../models/User");
const { signToken, JWT_COOKIE_NAME } = require("../utils/jwt");

const FRONTEND_URL = process.env.FRONTEND_URL || "https://www.mysmartcrm.fr";
const isProduction = process.env.NODE_ENV === "production";

/**
 * Callback après authentification Google.
 * JWT en cookie HTTP-only, redirection vers le frontend pour récupérer l'utilisateur et rediriger vers onboarding ou mon-espace.
 */
function googleCallback(req, res, next) {
  const passport = require("../config/passport");
  passport.authenticate("google", { session: false }, (err, user, info) => {
    if (err) {
      const redirectUrl = new URL("/login", FRONTEND_URL);
      redirectUrl.searchParams.set("error", "auth_failed");
      return res.redirect(redirectUrl.toString());
    }
    if (!user) {
      const redirectUrl = new URL("/login", FRONTEND_URL);
      redirectUrl.searchParams.set("error", "no_user");
      return res.redirect(redirectUrl.toString());
    }
    const token = signToken({ userId: String(user.id), email: user.email });
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "strict" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    };
    res.cookie(JWT_COOKIE_NAME, token, cookieOptions);
    res.redirect(`${FRONTEND_URL}/api/auth/callback`);
  })(req, res, next);
}

/**
 * Connexion email / mot de passe. Body: { email, password }.
 * Retourne l'utilisateur et définit le cookie JWT.
 */
async function login(req, res) {
  try {
    const email = req.body?.email != null ? String(req.body.email).trim() : "";
    const password = req.body?.password;
    if (!email || !password || typeof password !== "string") {
      return res.status(400).json({ message: "Email et mot de passe requis." });
    }
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: "Identifiants incorrects." });
    }
    const valid = await User.verifyPassword(user.id, password);
    if (!valid) {
      return res.status(401).json({ message: "Identifiants incorrects." });
    }
    const token = signToken({ userId: String(user.id), email: user.email });
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "strict" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    };
    res.cookie(JWT_COOKIE_NAME, token, cookieOptions);
    res.json({
      user: {
        id: String(user.id),
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        planId: user.planId ?? null,
        smartcrmInstanceId: user.smartcrmInstanceId ?? null,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur." });
  }
}

/**
 * Inscription : crée un utilisateur avec email et mot de passe. Body: { email, password }.
 * Si l'email existe déjà, retourne 409. Sinon crée l'utilisateur, pose le cookie JWT et retourne l'utilisateur.
 */
async function register(req, res) {
  try {
    const email = req.body?.email != null ? String(req.body.email).trim().toLowerCase() : "";
    const password = req.body?.password;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "Adresse e-mail invalide." });
    }
    if (!password || typeof password !== "string" || password.trim().length < 8) {
      return res.status(400).json({
        message: "Le mot de passe doit contenir au moins 8 caractères.",
      });
    }
    const existing = await User.findByEmail(email);
    if (existing) {
      return res.status(409).json({ message: "Un compte existe déjà avec cette adresse e-mail." });
    }
    const created = await User.create({
      email,
      name: null,
      googleId: null,
      avatar: null,
    });
    await User.setPassword(created.id, password.trim());
    const user = await User.findById(created.id);
    const token = signToken({ userId: String(user.id), email: user.email });
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "strict" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    };
    res.cookie(JWT_COOKIE_NAME, token, cookieOptions);
    res.status(201).json({
      user: {
        id: String(user.id),
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        planId: user.planId ?? null,
        smartcrmInstanceId: user.smartcrmInstanceId ?? null,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur." });
  }
}

/**
 * Définit ou met à jour le mot de passe de l'utilisateur connecté. Body: { password }. Minimum 8 caractères.
 */
async function setPassword(req, res) {
  try {
    const password = req.body?.password;
    if (!password || typeof password !== "string") {
      return res.status(400).json({ message: "Mot de passe requis." });
    }
    const trimmed = password.trim();
    if (trimmed.length < 8) {
      return res.status(400).json({
        message: "Le mot de passe doit contenir au moins 8 caractères.",
      });
    }
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Non authentifié." });
    }
    const ok = await User.setPassword(Number(userId), trimmed);
    if (!ok) {
      return res.status(400).json({ message: "Mot de passe invalide." });
    }
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur." });
  }
}

/**
 * Retourne l'utilisateur courant à partir du JWT (cookie ou Authorization).
 * Le token n'est jamais renvoyé dans le body.
 */
async function getMe(req, res) {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }
    res.json({
      id: String(user.id),
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      planId: user.planId ?? null,
      smartcrmInstanceId: user.smartcrmInstanceId ?? null,
      createdAt: user.createdAt,
    });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
}

/**
 * Retourne la clé API tenant une seule fois (page de confirmation, etc.). Après lecture elle est supprimée côté serveur.
 */
async function getTenantApiKey(req, res) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Non authentifié" });
    }
    const apiKey = await User.getTenantApiKeyOnce(Number(userId));
    if (!apiKey) {
      return res.status(404).json({ message: "Aucune clé API à récupérer" });
    }
    res.json({ apiKey });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
}

/**
 * Déconnexion : suppression du cookie (pas de token à invalider côté client).
 */
function logout(req, res) {
  res.clearCookie(JWT_COOKIE_NAME, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax",
    path: "/",
  });
  res.status(204).send();
}

module.exports = {
  googleCallback,
  login,
  register,
  setPassword,
  getMe,
  getTenantApiKey,
  logout,
};
