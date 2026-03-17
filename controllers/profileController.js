const RestaurateurProfile = require("../models/RestaurateurProfile");
const User = require("../models/User");
const smartcrmApi = require("../services/smartcrmApi");
const { child: logChild } = require("../utils/logger");

/**
 * GET /api/auth/profile - Retourne le profil restaurateur de l'utilisateur connecté.
 */
async function getProfile(req, res) {
  try {
    const userId = req.user.userId;
    const profile = await RestaurateurProfile.findByUserId(userId);
    res.json(profile || {});
  } catch (err) {
    logChild(req?.id).error({ err: err.message }, "GET /api/auth/profile");
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

    const tenantApiKey = await User.getTenantApiKey(userId);
    if (tenantApiKey) {
      const adresseFull = [adresse, codePostal, ville, pays].filter(Boolean).join(", ");
      smartcrmApi
        .syncRestaurantInfoToInstance(tenantApiKey, {
          nom: nomEtablissement,
          adresse: adresseFull,
          telephone: telephone || "",
          email: email || "",
          nombreCouverts: nombreCouverts != null ? nombreCouverts : 0,
        })
        .catch(() => {});
    }

    res.json(profile);
  } catch (err) {
    logChild(req?.id).error({ err: err.message }, "PUT /api/auth/profile");
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
