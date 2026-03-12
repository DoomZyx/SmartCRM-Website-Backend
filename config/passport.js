const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");

/**
 * Stratégie Google OAuth2.
 * L'échange code <-> tokens se fait côté serveur uniquement.
 * Les tokens Google ne sont jamais exposés au client.
 */
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      scope: ["profile", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error("Email non fourni par Google"), null);
        }
        let user = await User.findByEmailOrGoogleId(email, profile.id);
        if (!user) {
          user = await User.create({
            email,
            name: profile.displayName || profile.name?.givenName || email,
            googleId: profile.id,
            avatar: profile.photos?.[0]?.value || null,
          });
        } else if (!user.googleId) {
          user = await User.updateGoogleLink(user.id, {
            googleId: profile.id,
            avatar: profile.photos?.[0]?.value || user.avatar,
            name: user.name || profile.displayName || profile.name?.givenName,
          });
        }
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

module.exports = passport;
