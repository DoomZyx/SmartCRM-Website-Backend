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

module.exports = {
  sendConfirmationEmail,
  sendNotificationEmail,
  sendDemoConfirmationEmail,
  sendDemoNotificationEmail,
};
