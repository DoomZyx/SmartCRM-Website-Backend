const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const { logger } = require("./logger");

dotenv.config();

// Configuration du transporteur email
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // true pour 465, false pour les autres ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Email de confirmation pour le client
const sendConfirmationEmail = async (contactData) => {
  const mailOptions = {
    from: `"SmartCRM" <${process.env.EMAIL_FROM}>`,
    to: contactData.email,
    subject: "Merci pour votre message  - SmartCRM",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: rgb(29, 29, 29); padding: 20px; border-radius: 8px; color: rgb(120,120,120);">
        <h2 style="color: #2563eb;">Merci pour votre message ! 📨</h2>
        <p>Bonjour ${contactData.name} 🫡</p>
        <p>Nous avons bien reçu votre message et nous vous répondrons dans les plus brefs délais.</p>
        <p>Bonne journée ! 🎉</p>
        <p>Très Cordialement,</p>
        <div style="text-align: right; margin: 20px 0;">
          <span style="font-weight: bold; margin-right: 10px;">L'équipe SmartCRM</span>
          <div style="width: 20px; height: 20px; background: linear-gradient(135deg, #00d4ff 0%, #8b5cf6 100%); border-radius: 6px; display: inline-block; text-align: center; line-height: 20px; font-weight: bold; font-size: 10px; color: white; vertical-align: middle;">
          S
        </div>
        </div>
        
        <div style="background-color: rgb(29, 29, 29); padding: 20px; border-radius: 8px; color: rgb(120,120,120);">
          <p>Récapitulatif de votre message :</p>
          <p><strong>Sujet :</strong> ${contactData.subject}</p>
          <p><strong>Message :</strong></p>
          <p style="background-color: rgb(29,29,29); padding: 15px; border-radius: 4px; color: rgb(120,120,120);">${contactData.message}</p>
        </div>
        
        <p>En attendant notre réponse, n'hésitez pas à consulter notre site pour en savoir plus sur nos solutions CRM et IA Voice.</p>
        
        <p>Cordialement,<br>L'équipe SmartCRM</p>
        <div style="text-align: right; margin: 20px 0;">
          <span style="font-weight: bold; margin-right: 10px;">L'équipe SmartCRM</span>
          <div style="width: 20px; height: 20px; background: linear-gradient(135deg, #00d4ff 0%, #8b5cf6 100%); border-radius: 6px; display: inline-block; text-align: center; line-height: 20px; font-weight: bold; font-size: 10px; color: white; vertical-align: middle;">
          S
        </div>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info({ to: contactData.email }, "Email de confirmation envoyé");
    return true;
  } catch (error) {
    logger.error({ err: error.message }, "Erreur envoi email confirmation");
    return false;
  }
};

// Email de notification pour l'équipe
const sendNotificationEmail = async (contactData) => {
  const mailOptions = {
    from: `"SmartCRM Contact" <${process.env.EMAIL_FROM}>`,
    to: process.env.EMAIL_FROM, // Notification à l'équipe
    subject: `Nouveau message de ${contactData.name} - ${contactData.subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color:rgb(2, 2, 2);">Nouveau message reçu !</h2>
        <div style="background-color:rgb(29, 29, 29); padding: 20px; border-radius: 8px; margin: 20px 0; color: rgb(120,120,120);">
          <h3>Détails du contact :</h3>
          <p><strong>Nom :</strong> ${contactData.name}</p>
          <p style="color: rgb(120,120,120);"><strong>Email :</strong> <a href="mailto:${
            contactData.email
          }" style="color: rgb(120,120,120); text-decoration: none;">${
      contactData.email
    }</a></p>
          <p><strong>Entreprise :</strong> ${
            contactData.company || "Non renseigné"
          }</p>
          <p><strong>Sujet :</strong> ${contactData.subject}</p>
          <p><strong>Message :</strong></p>
          <p style="background-color: rgb(29,29,29); padding: 15px; border-radius: 4px; color: rgb(120,120,120);">${
            contactData.message
          }</p>
          <div style="text-align: right; margin: 20px 0;">
            <div style="width: 20px; height: 20px; background: linear-gradient(135deg, #00d4ff 0%, #8b5cf6 100%); border-radius: 6px; display: inline-block; text-align: center; line-height: 20px; font-weight: bold; font-size: 10px; color: white; vertical-align: middle;">
            S
          </div>
          </div>
        </div>
        
        <p><strong>Date :</strong> ${new Date().toLocaleString("fr-FR")}</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info("Email de notification envoyé à l'équipe");
    return true;
  } catch (error) {
    logger.error({ err: error.message }, "Erreur envoi email notification");
    return false;
  }
};

// Email de confirmation pour le client (démo)
const sendDemoConfirmationEmail = async (demoData) => {
  const mailOptions = {
    from: `"SmartCRM" <${process.env.EMAIL_FROM}>`,
    to: demoData.email,
    subject: "Demande de démo reçue - SmartCRM",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: rgb(29, 29, 29); padding: 20px; border-radius: 8px; color: rgb(120,120,120);">
        <h2 style="color: #2563eb;">Demande de démo reçue ! 🎯</h2>
        <p>Bonjour ${demoData.name} 🫡</p>
        <p>Nous avons bien reçu votre demande de démo et Axel vous contactera rapidement pour planifier un rendez-vous personnalisé.</p>
        <p>En attendant, voici un récapitulatif de votre demande :</p>
        
        <div style="background-color: rgb(29, 29, 29); padding: 20px; border-radius: 8px; color: rgb(120,120,120); margin: 20px 0;">
          <p><strong>Entreprise :</strong> ${demoData.company}</p>
          <p><strong>Taille de l'équipe :</strong> ${demoData.teamSize}</p>
          <p><strong>Horaire préféré :</strong> ${demoData.preferredTime}</p>
          <p><strong>Durée souhaitée :</strong> ${demoData.duration}</p>
          <p><strong>Vos besoins :</strong></p>
          <p style="background-color: rgb(29,29,29); padding: 15px; border-radius: 4px; color: rgb(120,120,120);">${demoData.needs}</p>
        </div>
        
        <p>Axel vous recontactera dans les plus brefs délais pour fixer un créneau qui vous convient.</p>
        <p>À très bientôt ! 🚀</p>
        
        <p>Très Cordialement,</p>
        <div style="text-align: right; margin: 20px 0;">
          <span style="font-weight: bold; margin-right: 10px;">L'équipe SmartCRM</span>
          <div style="width: 20px; height: 20px; background: linear-gradient(135deg, #00d4ff 0%, #8b5cf6 100%); border-radius: 6px; display: inline-block; text-align: center; line-height: 20px; font-weight: bold; font-size: 10px; color: white; vertical-align: middle;">
            S
          </div>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info({ to: demoData.email }, "Email de confirmation démo envoyé");
    return true;
  } catch (error) {
    logger.error({ err: error.message }, "Erreur envoi email confirmation démo");
    return false;
  }
};

// Email de notification pour l'équipe (démo)
const sendDemoNotificationEmail = async (demoData) => {
  const mailOptions = {
    from: `"SmartCRM Démo" <${process.env.EMAIL_FROM}>`,
    to: process.env.EMAIL_FROM, // Notification à l'équipe
    subject: `Nouvelle demande de démo de ${demoData.name} - ${demoData.company}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color:rgb(2, 2, 2);">Nouvelle demande de démo ! 🎯</h2>
        <div style="background-color:rgb(29, 29, 29); padding: 20px; border-radius: 8px; margin: 20px 0; color: rgb(120,120,120);">
          <h3>Détails de la demande :</h3>
          <p><strong>Nom :</strong> ${demoData.name}</p>
          <p style="color: rgb(120,120,120);"><strong>Email :</strong> <a href="mailto:${
            demoData.email
          }" style="color: rgb(120,120,120); text-decoration: none;">${
      demoData.email
    }</a></p>
          <p><strong>Entreprise :</strong> ${demoData.company}</p>
          <p><strong>Taille de l'équipe :</strong> ${demoData.teamSize}</p>
          <p><strong>Horaire préféré :</strong> ${demoData.preferredTime}</p>
          <p><strong>Durée souhaitée :</strong> ${demoData.duration}</p>
          <p><strong>Besoins :</strong></p>
          <p style="background-color: rgb(29,29,29); padding: 15px; border-radius: 4px; color: rgb(120,120,120);">${
            demoData.needs
          }</p>
          
          <div style="text-align: right; margin: 20px 0;">
            <span style="font-weight: bold; margin-right: 10px;">L'équipe SmartCRM</span>
            <div style="width: 20px; height: 20px; background: linear-gradient(135deg, #00d4ff 0%, #8b5cf6 100%); border-radius: 6px; display: inline-block; text-align: center; line-height: 20px; font-weight: bold; font-size: 10px; color: white; vertical-align: middle;">
              S
            </div>
          </div>
        </div>
        
        <p><strong>Date :</strong> ${new Date().toLocaleString("fr-FR")}</p>
        <p><strong>Action requise :</strong> Contacter le prospect pour planifier la démo</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info("Email de notification démo envoyé à l'équipe");
    return true;
  } catch (error) {
    logger.error({ err: error.message }, "Erreur envoi email notification démo");
    return false;
  }
};

// Email à l'équipe : un client a acheté un abonnement (instance créée)
const sendSubscriptionPurchasedNotificationEmail = async (data) => {
  const to = process.env.EMAIL_TEAM || process.env.EMAIL_FROM;
  if (!to) {
    logger.warn("EMAIL_TEAM / EMAIL_FROM manquant, notification abonnement non envoyée");
    return false;
  }
  const {
    nomEtablissement,
    email: clientEmail,
    instanceId,
    slug,
    plan,
    twilioTemporaryNumber,
    regulatoryBundlePending,
  } = data;

  const mailOptions = {
    from: `"SmartCRM" <${process.env.EMAIL_FROM}>`,
    to,
    subject: `Nouvel abonnement : ${nomEtablissement || "Client"}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: rgb(2, 2, 2);">Un client a souscrit un abonnement</h2>
        <div style="background-color: rgb(29, 29, 29); padding: 20px; border-radius: 8px; margin: 20px 0; color: rgb(120,120,120);">
          <p><strong>Établissement :</strong> ${nomEtablissement || "Non renseigné"}</p>
          <p><strong>Email client :</strong> <a href="mailto:${clientEmail || ""}" style="color: rgb(120,120,120);">${clientEmail || "Non renseigné"}</a></p>
          <p><strong>Instance :</strong> ${instanceId || "—"}</p>
          <p><strong>Slug (webhook) :</strong> <code>${slug || "—"}</code></p>
          <p><strong>Plan :</strong> ${plan || "—"}</p>
          <p><strong>Numéro provisoire :</strong> ${twilioTemporaryNumber || "Aucun"}</p>
          <p><strong>En attente numéro local (bundle) :</strong> ${regulatoryBundlePending ? "Oui (24–72 h)" : "Non"}</p>
          ${regulatoryBundlePending && !twilioTemporaryNumber ? `<p style="margin-top: 12px; padding: 8px; background: rgb(60,60,60); border-radius: 4px;"><strong>SAV :</strong> Aucun numéro provisoire attribué (FR/BE/LU). Contacter le client par email pour lui communiquer un numéro manuellement.</p>` : ""}
        </div>
        <p><strong>Date :</strong> ${new Date().toLocaleString("fr-FR")}</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info({ to }, "Email notification abonnement envoyé à l'équipe");
    return true;
  } catch (error) {
    logger.error({ err: error.message }, "Erreur envoi email notification abonnement");
    return false;
  }
};

// Email au client : bundle en attente, avec numéro provisoire si fourni (sinon message 24-72h uniquement)
const sendProvisionalNumberEmail = async (toEmail, twilioTemporaryNumber, webhookSlug, webhookBaseUrl) => {
  const webhookUrl = webhookBaseUrl && webhookSlug
    ? `${webhookBaseUrl.replace(/\/$/, "")}/twilio/${webhookSlug}/incoming-call`
    : null;
  const hasProvisional = twilioTemporaryNumber && String(twilioTemporaryNumber).trim();
  const provisionalBlock = hasProvisional
    ? `<p>Votre numéro provisoire est actif : <strong>${twilioTemporaryNumber}</strong></p>`
    : `<p>Aucun numéro provisoire n'a pu être attribué automatiquement (pour la France, la Belgique et le Luxembourg, seuls des numéros locaux sont proposés à l'issue de la vérification).</p>
        <p><strong>Notre équipe SAV vous contactera par email pour vous attribuer un numéro manuellement.</strong> Vous recevrez également un email automatique dès que votre numéro définitif sera activé (sous 24 à 72 h après validation réglementaire).</p>`;
  const mailOptions = {
    from: `"SmartCRM" <${process.env.EMAIL_FROM}>`,
    to: toEmail,
    subject: hasProvisional ? "Votre numéro provisoire SmartCRM" : "Votre numéro SmartCRM - notre équipe va vous contacter",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: rgb(29, 29, 29); padding: 20px; border-radius: 8px; color: rgb(120,120,120);">
        <h2 style="color: #2563eb;">${hasProvisional ? "Numéro provisoire attribué" : "Numéro en cours d'activation"}</h2>
        ${provisionalBlock}
        ${hasProvisional ? "<p>Votre numéro définitif (local) sera activé sous 24 à 72 h après vérification réglementaire. Vous recevrez un email dès qu'il sera attribué.</p>" : ""}
        ${webhookSlug ? `
        <p><strong>Slug pour le webhook Twilio :</strong> <code style="background: rgb(40,40,40); padding: 2px 6px; border-radius: 4px;">${webhookSlug}</code></p>
        ${webhookUrl ? `<p>URL webhook à configurer sur votre numéro : <code style="font-size: 0.85em; word-break: break-all;">${webhookUrl}</code></p>` : ""}
        ` : ""}
        <p>Cordialement,</p>
        <p>L'équipe SmartCRM</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info({ to: toEmail }, "Email numéro provisoire envoyé");
    return true;
  } catch (error) {
    logger.error({ err: error.message }, "Erreur envoi email numéro provisoire");
    return false;
  }
};

// Email au client : numéro local définitif attribué (après validation du bundle réglementaire)
const sendLocalNumberAssignedEmail = async (toEmail, twilioNumber, establishmentName) => {
  const name = establishmentName || "Client";
  const mailOptions = {
    from: `"SmartCRM" <${process.env.EMAIL_FROM}>`,
    to: toEmail,
    subject: "Votre numéro SmartCRM est activé",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: rgb(29, 29, 29); padding: 20px; border-radius: 8px; color: rgb(120,120,120);">
        <h2 style="color: #2563eb;">Votre numéro définitif est activé</h2>
        <p>Bonjour ${name},</p>
        <p>La vérification réglementaire est terminée. Votre numéro local SmartCRM est désormais actif.</p>
        <p><strong>Numéro attribué : ${twilioNumber}</strong></p>
        <p>Vous pouvez utiliser ce numéro pour recevoir les appels et SMS de vos clients. Le numéro provisoire éventuellement utilisé jusqu'à présent peut être retiré de la configuration.</p>
        <p>Cordialement,</p>
        <p>L'équipe SmartCRM</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info({ to: toEmail }, "Email numéro local attribué envoyé");
    return true;
  } catch (error) {
    logger.error({ err: error.message }, "Erreur envoi email numéro local attribué");
    return false;
  }
};

module.exports = {
  sendConfirmationEmail,
  sendNotificationEmail,
  sendDemoConfirmationEmail,
  sendDemoNotificationEmail,
  sendSubscriptionPurchasedNotificationEmail,
  sendProvisionalNumberEmail,
  sendLocalNumberAssignedEmail,
};
