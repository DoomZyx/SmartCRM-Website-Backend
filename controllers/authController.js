const User = require("../models/User");
const { signToken, JWT_COOKIE_NAME } = require("../utils/jwt");

const FRONTEND_URL = process.env.FRONTEND_URL || "https://www.mysmartcrm.fr";
const isProduction = process.env.NODE_ENV === "production";

/**
 * Callback après authentification Google.
 * Le token Google n'est jamais exposé : on émet uniquement un JWT signé par nous,
 * déposé en cookie HTTP-only (inaccessible au JavaScript frontend).
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
    res.redirect(FRONTEND_URL);
  })(req, res, next);
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
      createdAt: user.createdAt,
    });
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
  getMe,
  logout,
};
