const bcrypt = require("bcryptjs");

const SALT_ROUNDS = 12;

/**
 * Hash un mot de passe avant stockage. À utiliser pour tout enregistrement ou mise à jour.
 */
async function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

/**
 * Vérifie un mot de passe en clair contre un hash stocké.
 */
async function comparePassword(plainPassword, hash) {
  if (!hash) return false;
  return bcrypt.compare(plainPassword, hash);
}

module.exports = { hashPassword, comparePassword };
