const fs = require("fs").promises;
const path = require("path");
const RestaurateurProfile = require("../models/RestaurateurProfile");
const User = require("../models/User");
const smartcrmApi = require("../services/smartcrmApi");
const { sendTwilioDossierSubmittedNotificationEmail } = require("../utils/emailService");
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
 * Body: nomEtablissement, adresse, codePostal, ville, pays, telephone, email, nombreCouverts?, typeCuisine?, twilioNumberUsage?
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

    const existingProfile = await RestaurateurProfile.findByUserId(userId);
    const twilioNumberUsage = Object.prototype.hasOwnProperty.call(body, "twilioNumberUsage")
      ? sanitizeUsageText(body.twilioNumberUsage, 2000)
      : (existingProfile?.twilioNumberUsage ?? null);

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
      twilioNumberUsage,
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

function sanitizeUsageText(value, maxLen) {
  if (value == null) return null;
  const s = String(value).trim().replace(/\r\n/g, "\n");
  if (!s) return null;
  return s.length > maxLen ? s.slice(0, maxLen) : s;
}

function extFromMime(mime) {
  if (mime === "application/pdf") return ".pdf";
  if (mime === "image/jpeg" || mime === "image/jpg") return ".jpg";
  if (mime === "image/png") return ".png";
  return ".bin";
}

/**
 * POST /api/auth/profile/submit-onboarding (multipart)
 * Enregistre coordonnées restaurant + pièces Twilio sur le serveur.
 * Pas de création d'instance automatique : traitement manuel côté équipe.
 */
async function submitOnboardingDossier(req, res) {
  try {
    const userId = Number(req.user.userId);
    if (!userId) {
      return res.status(401).json({ message: "Non authentifié." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }
    if (!user.planId) {
      return res.status(400).json({
        message: "Aucun abonnement actif. Complétez d'abord votre paiement.",
      });
    }
    if (user.smartcrmInstanceId) {
      return res.status(409).json({
        message: "Votre espace application est déjà activé. Modifiez vos informations ci-dessous si besoin.",
      });
    }
    if (user.twilioDocsSubmittedAt) {
      return res.status(409).json({
        message: "Votre dossier a déjà été transmis. Notre équipe vous contactera si des compléments sont nécessaires.",
      });
    }

    const kbisFile = req.files?.kbisDocument?.[0];
    const idRectoFile = req.files?.idDocumentRecto?.[0];
    const idVersoFile = req.files?.idDocumentVerso?.[0];
    const addrFile = req.files?.addressDocument?.[0];
    if (!kbisFile || !idRectoFile || !idVersoFile || !addrFile) {
      return res.status(400).json({
        message:
          "Documents requis : KBIS (ou équivalent), pièce d'identité du dirigeant recto et verso, justificatif d'adresse de l'établissement.",
      });
    }

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

    const twilioNumberUsage = sanitizeUsageText(body.twilioNumberUsage, 2000);
    if (!twilioNumberUsage || twilioNumberUsage.length < 15) {
      return res.status(400).json({
        message:
          "Décrivez en au moins quelques phrases l'usage prévu du numéro professionnel (ex. réservations, renseignements clients).",
      });
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
      twilioNumberUsage,
    });

    const uploadRoot = path.join(__dirname, "..", "uploads", "onboarding", String(userId));
    await fs.mkdir(uploadRoot, { recursive: true });
    const ts = Date.now();
    const kbisPath = path.join(uploadRoot, `kbis_${ts}${extFromMime(kbisFile.mimetype)}`);
    const idRectoPath = path.join(uploadRoot, `piece_identite_recto_${ts}${extFromMime(idRectoFile.mimetype)}`);
    const idVersoPath = path.join(uploadRoot, `piece_identite_verso_${ts}${extFromMime(idVersoFile.mimetype)}`);
    const addrPath = path.join(uploadRoot, `justificatif_domicile_${ts}${extFromMime(addrFile.mimetype)}`);
    await fs.writeFile(kbisPath, kbisFile.buffer);
    await fs.writeFile(idRectoPath, idRectoFile.buffer);
    await fs.writeFile(idVersoPath, idVersoFile.buffer);
    await fs.writeFile(addrPath, addrFile.buffer);

    await User.markTwilioDocsSubmitted(userId);

    sendTwilioDossierSubmittedNotificationEmail({
      nomEtablissement,
      clientEmail: user.email,
      userId,
      twilioNumberUsage,
      attachmentPaths: [kbisPath, idRectoPath, idVersoPath, addrPath],
    }).catch((err) => logChild(req?.id).warn({ err: err.message }, "Email équipe dossier Twilio"));

    res.status(201).json({
      profile,
      message: "Dossier reçu. Notre équipe traite votre demande sous 14 jours ouvrés maximum.",
    });
  } catch (err) {
    logChild(req?.id).error({ err: err.message }, "POST /api/auth/profile/submit-onboarding");
    res.status(500).json({ message: "Erreur serveur." });
  }
}

module.exports = {
  getProfile,
  updateProfile,
  submitOnboardingDossier,
};
