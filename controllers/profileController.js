const RestaurateurProfile = require("../models/RestaurateurProfile");
const User = require("../models/User");
const smartcrmApi = require("../services/smartcrmApi");
const { sendProvisionalNumberEmail, sendSubscriptionPurchasedNotificationEmail } = require("../utils/emailService");
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

const PAYS_TO_COUNTRY_CODE = {
  France: "FR",
  Belgique: "BE",
  Luxembourg: "LU",
};

/**
 * POST /api/auth/profile/provision-instance
 * Enregistre le profil restaurateur puis crée l'instance SmartCRM (après paiement).
 * Body: username (nom connexion app), nomEtablissement, adresse, codePostal, ville, pays, telephone, email, nombreCouverts?, typeCuisine?.
 */
async function completeProfileAndProvision(req, res) {
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
        message: "Votre instance est déjà créée. Vous pouvez modifier vos informations dans le formulaire ci-dessous.",
      });
    }
    if (!user.email || typeof user.email !== "string" || !user.email.trim()) {
      return res.status(400).json({
        message: "Votre compte n'a pas d'email associé. Impossible de créer l'instance. Contactez le support.",
      });
    }

    const body = req.body || {};
    const usernameRaw = sanitizeString(body.username, 30);
    if (!usernameRaw || usernameRaw.length < 3) {
      return res.status(400).json({
        message: "Le nom d'utilisateur est requis (3 à 30 caractères, lettres, chiffres et tirets bas).",
      });
    }
    if (!/^[a-zA-Z0-9_]+$/.test(usernameRaw)) {
      return res.status(400).json({
        message: "Le nom d'utilisateur ne doit contenir que des lettres, chiffres et tirets bas.",
      });
    }
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

    const countryCode = PAYS_TO_COUNTRY_CODE[pays] || "FR";
    const planSlug = smartcrmApi.getPlanSlug(user.planId);
    const name = (nomEtablissement || user.name || user.email || "Client").trim() || "Client";

    // Adresse Twilio requise pour l'achat de numéros (FR/BE/LU).
    const twilioAddress = {
      customerName: nomEtablissement.slice(0, 160),
      street: adresse.slice(0, 500),
      city: ville.slice(0, 100),
      region: ville.slice(0, 100) || "N/A",
      postalCode: codePostal.slice(0, 20),
      isoCountry: countryCode,
    };

    const instanceBody = {
      plan: planSlug,
      name,
      countryCode,
      clientId: String(userId),
      provisionOpenAi: true,
      provisionTwilio: true,
      buyOnMainAccount: false,
      provisionTwilioSubaccount: true,
      twilioAddress,
      email: user.email.trim().toLowerCase(),
      username: usernameRaw,
      useBundleFlowForLocal: true,
      buyTemporaryNumber: true,
      bundleEmail: user.email.trim().toLowerCase(),
    };

    const result = await smartcrmApi.createInstance(instanceBody);
    if (!result.instanceId || !result.apiKey) {
      logChild(req?.id).error(
        { instanceId: result.instanceId, hasApiKey: !!result.apiKey },
        "completeProfileAndProvision: createInstance réponse incomplète"
      );
      return res.status(502).json({
        message: "La création de votre instance a échoué. Réessayez ou contactez le support.",
      });
    }

    await User.updateSmartcrmInstance(userId, {
      instanceId: result.instanceId,
      apiKey: result.apiKey,
    });

    if (result.bundleSid && (req.files?.idDocument?.[0] || req.files?.addressDocument?.[0])) {
      smartcrmApi
        .uploadRegulatoryDocuments(
          result.instanceId,
          req.files.idDocument?.[0] ?? null,
          req.files.addressDocument?.[0] ?? null
        )
        .catch((err) => logChild(req?.id).warn({ err: err?.message }, "Upload documents réglementaires vers app"));
    }

    const adresseFull = [adresse, codePostal, ville, pays].filter(Boolean).join(", ");
    smartcrmApi
      .syncRestaurantInfoToInstance(result.apiKey, {
        nom: nomEtablissement,
        adresse: adresseFull,
        telephone: telephone || "",
        email: email || "",
        nombreCouverts: nombreCouverts != null ? nombreCouverts : 0,
      })
      .catch(() => {});

    if (result.regulatoryBundlePending && result.slug && user.email) {
      const webhookBaseUrl = process.env.SMARTCRM_GATEWAY_PUBLIC_URL || process.env.VOICE_GATEWAY_PUBLIC_URL;
      sendProvisionalNumberEmail(
        user.email.trim(),
        result.twilioTemporaryNumber ?? null,
        result.slug,
        webhookBaseUrl
      ).catch((err) => logChild(req?.id).warn({ err: err.message }, "Envoi email bundle en attente"));
    }

    sendSubscriptionPurchasedNotificationEmail({
      nomEtablissement,
      email: user.email,
      instanceId: result.instanceId,
      slug: result.slug,
      plan: planSlug,
      twilioTemporaryNumber: result.twilioTemporaryNumber ?? null,
      regulatoryBundlePending: result.regulatoryBundlePending ?? false,
    }).catch((err) => logChild(req?.id).warn({ err: err.message }, "Envoi email notification abonnement équipe"));

    res.status(201).json({
      profile,
      instance: {
        instanceId: result.instanceId,
        slug: result.slug ?? null,
        twilioNumber: result.twilioNumber ?? null,
        twilioTemporaryNumber: result.twilioTemporaryNumber ?? null,
        regulatoryBundlePending: result.regulatoryBundlePending ?? false,
        twilioNotes: result.notes ?? null,
      },
    });
  } catch (err) {
    logChild(req?.id).error({ err: err.message }, "POST /api/auth/profile/provision-instance");
    if (err.statusCode && err.statusCode >= 400 && err.statusCode < 500) {
      return res.status(err.statusCode).json({ message: err.message || "Erreur de requête" });
    }
    res.status(500).json({ message: "Erreur serveur." });
  }
}

module.exports = {
  getProfile,
  updateProfile,
  completeProfileAndProvision,
};
