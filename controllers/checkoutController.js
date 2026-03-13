const Stripe = require("stripe");
const User = require("../models/User");
const smartcrmApi = require("../services/smartcrmApi");

const VALID_PLAN_IDS = [1, 2, 3, 4, 5];

/**
 * Crée une session Stripe Checkout en mode abonnement mensuel.
 * Body attendu : { planId } (1 à 5).
 * Retourne { url } pour redirection vers Stripe Checkout.
 */
async function createCheckoutSession(req, res) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return res.status(503).json({
        message: "Paiement non configuré. Contacter l'administrateur.",
      });
    }

    const { planId } = req.body;
    const planIdNum = planId != null ? Number(planId) : NaN;

    if (!Number.isInteger(planIdNum) || !VALID_PLAN_IDS.includes(planIdNum)) {
      return res.status(400).json({
        message: "Plan invalide. Choisissez un plan entre 1 et 5.",
      });
    }

    const stripeId = process.env[`STRIPE_PRICE_PLAN_${planIdNum}`];
    if (!stripeId || typeof stripeId !== "string" || !stripeId.trim()) {
      return res.status(503).json({
        message: `Configuration Stripe manquante pour le plan ${planIdNum}. Contacter l'administrateur.`,
      });
    }

    const stripe = new Stripe(stripeSecretKey);
    let priceId;

    if (stripeId.startsWith("price_")) {
      priceId = stripeId;
    } else if (stripeId.startsWith("prod_")) {
      const prices = await stripe.prices.list({
        product: stripeId,
        active: true,
        type: "recurring",
      });
      const monthlyPrice = prices.data.find((p) => p.recurring?.interval === "month");
      if (!monthlyPrice) {
        return res.status(503).json({
          message: `Aucun prix mensuel actif pour le plan ${planIdNum}. Vérifier le produit dans Stripe.`,
        });
      }
      priceId = monthlyPrice.id;
    } else {
      return res.status(503).json({
        message: `Configuration Stripe invalide pour le plan ${planIdNum}. Utiliser un ID price_xxx ou prod_xxx.`,
      });
    }

    const userId = req.user?.userId;
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const countryCode = req.body?.countryCode?.trim();
    const metadata = {
      userId: userId || "",
      planId: String(planIdNum),
    };
    if (countryCode && ["FR", "BE", "LU"].includes(countryCode)) {
      metadata.countryCode = countryCode;
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${frontendUrl}/mon-espace?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/tarifs?checkout=cancelled`,
      locale: "fr",
      allow_promotion_codes: true,
      client_reference_id: userId || undefined,
      metadata,
    });

    if (!session.url) {
      return res.status(500).json({
        message: "Impossible de créer la session de paiement.",
      });
    }

    res.status(200).json({ url: session.url });
  } catch (err) {
    if (err.type && err.type.startsWith("Stripe")) {
      return res.status(502).json({
        message: "Erreur lors de la création du paiement. Réessayez ou contactez-nous.",
      });
    }
    throw err;
  }
}

/**
 * Webhook Stripe : reçoit les événements (body brut).
 * Vérifie la signature avec STRIPE_WEBHOOK_SECRET puis met à jour l'utilisateur sur checkout.session.completed.
 */
async function handleWebhook(req, res, next) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripeSecretKey || !webhookSecret) {
    return res.status(503).send("Webhook non configuré");
  }

  const sig = req.headers["stripe-signature"];
  if (!sig) {
    return res.status(400).send("En-tête stripe-signature manquant");
  }

  let event;
  try {
    const stripe = new Stripe(stripeSecretKey);
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    return res.status(400).send(`Signature webhook invalide: ${err.message}`);
  }

  if (event.type !== "checkout.session.completed") {
    return res.status(200).send("OK");
  }

  const session = event.data.object;
  const userId = session.client_reference_id || session.metadata?.userId;
  const planId = session.metadata?.planId ? parseInt(session.metadata.planId, 10) : null;
  const subscriptionId = session.subscription || null;

  if (!userId || !VALID_PLAN_IDS.includes(planId)) {
    return res.status(200).send("OK");
  }

  const userIdNum = Number(userId);

  try {
    await User.updateSubscription(userIdNum, {
      planId,
      stripeSubscriptionId: subscriptionId,
    });

    const user = await User.findById(userIdNum);
    const planSlug = smartcrmApi.getPlanSlug(planId);
    const name = (user?.name || user?.email || "Client").trim() || "Client";
    const countryCode = session.metadata?.countryCode?.trim() || "FR";
    const body = {
      plan: planSlug,
      name,
      countryCode: ["FR", "BE", "LU"].includes(countryCode) ? countryCode : "FR",
      clientId: String(userIdNum),
    };

    try {
      const result = await smartcrmApi.createInstance(body);
      if (result.instanceId) {
        await User.updateSmartcrmInstance(userIdNum, {
          instanceId: result.instanceId,
          apiKey: result.apiKey,
        });
      }
    } catch (apiErr) {
      const status = apiErr.statusCode || 500;
      if (status >= 500) {
        console.error(`SmartCRM createInstance error status=${status} userId=${userIdNum}`);
      }
    }

    res.status(200).send("OK");
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createCheckoutSession,
  handleWebhook,
};
