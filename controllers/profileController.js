const RestaurateurProfile = require("../models/RestaurateurProfile");

/**
 * GET /api/auth/profile - Retourne le profil restaurateur de l'utilisateur connecté.
 */
async function getProfile(req, res) {
  try {
    const userId = req.user.userId;
    const profile = await RestaurateurProfile.findByUserId(userId);
    res.json(profile || {});
  } catch (err) {
    console.error("GET /api/auth/profile:", err.message || err);
    res.status(500).json({ message: "Erreur serveur" });
  }
}

const PAYS_AUTORISES = ["France", "Luxembourg", "Belgique"];

/**
 * PUT /api/auth/profile - Met à jour (ou crée) le profil restaurateur.
 * Body: nomEtablissement, adresse, codePostal, ville, pays, telephone, email, nombreCouverts?, typeCuisine?
 */
async function updateProfile(req, res) {
  try {
    const userId = req.user.userId;
    const body = req.body || {};

    const nomEtablissement = sanitizeString(body.nomEtablissement, 200);
    const adresse = sanitizeString(body.adresse, 300);
    const codePostal = sanitizeString(body.codePostal, 10);
    const ville = sanitizeString(body.ville, 100);
    const pays = sanitizeString(body.pays, 100);
    const telephone = sanitizeString(body.telephone, 30);
    const email = sanitizeString(body.email, 255);
    const typeCuisine = sanitizeString(body.typeCuisine, 100);

    if (!nomEtablissement || !adresse || !codePostal || !ville || !pays || !telephone || !email) {
      return res.status(400).json({
        message: "Champs obligatoires manquants : nomEtablissement, adresse, codePostal, ville, pays, telephone, email",
      });
    }

    if (!PAYS_AUTORISES.includes(pays)) {
      return res.status(400).json({
        message: "Pays invalide. Valeurs acceptées : France, Luxembourg, Belgique",
      });
    }

    const nombreCouverts = body.nombreCouverts != null && body.nombreCouverts !== ""
      ? parseInt(String(body.nombreCouverts), 10)
      : null;
    if (nombreCouverts != null && (isNaN(nombreCouverts) || nombreCouverts < 1 || nombreCouverts > 999)) {
      return res.status(400).json({ message: "nombreCouverts doit être entre 1 et 999" });
    }

    const profile = await RestaurateurProfile.upsert(userId, {
      nomEtablissement,
      adresse,
      codePostal,
      ville,
      pays,
      telephone,
      email,
      nombreCouverts,
      typeCuisine,
    });
    res.json(profile);
  } catch (err) {
    console.error("PUT /api/auth/profile:", err.message || err);
    res.status(500).json({ message: "Erreur serveur" });
  }
}

function sanitizeString(value, maxLen) {
  if (value == null) return null;
  const s = String(value).trim();
  return s.length > maxLen ? s.slice(0, maxLen) : s || null;
}

module.exports = {
  getProfile,
  updateProfile,
};
