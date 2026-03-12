const Contact = require("../models/Contact");
const {
  sendConfirmationEmail,
  sendNotificationEmail,
} = require("../utils/emailService");

const createContact = async (req, res) => {
  try {
    const { name, email, company, subject, message } = req.body;

    const contact = await Contact.create({
      name,
      email,
      company,
      subject,
      message,
    });

    Promise.all([
      sendConfirmationEmail({ name, email, subject, message }),
      sendNotificationEmail({
        name,
        email,
        company,
        subject,
        message,
      }),
    ]).catch((error) => {
      console.error("Erreur envoi emails:", error);
    });

    res.status(201).json({
      success: true,
      message:
        "Message envoyé avec succès ! Nous vous répondrons dans les plus brefs délais.",
      data: {
        id: contact.id,
        name: contact.name,
        email: contact.email,
        subject: contact.subject,
      },
    });
  } catch (error) {
    console.error("Erreur création contact:", error);
    if (error.code === "23502" || error.code === "23514") {
      return res.status(400).json({
        success: false,
        message: "Données invalides",
        errors: [{ message: error.message }],
      });
    }
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur",
    });
  }
};

const getAllContacts = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const limitNum = Math.min(parseInt(limit, 10) || 10, 100);
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const offset = (pageNum - 1) * limitNum;

    const [contacts, total] = await Promise.all([
      Contact.findWithFilter({ status, limit: limitNum, offset }),
      Contact.countFilter(status),
    ]);

    res.json({
      success: true,
      data: contacts,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalContacts: total,
        hasNextPage: pageNum * limitNum < total,
        hasPrevPage: pageNum > 1,
      },
    });
  } catch (error) {
    console.error("Erreur récupération contacts:", error);
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur",
    });
  }
};

const getContactById = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact non trouvé",
      });
    }

    res.json({
      success: true,
      data: contact,
    });
  } catch (error) {
    console.error("Erreur récupération contact:", error);
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur",
    });
  }
};

const updateContactStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const contact = await Contact.updateStatus(req.params.id, status);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact non trouvé",
      });
    }

    res.json({
      success: true,
      message: "Statut mis à jour avec succès",
      data: contact,
    });
  } catch (error) {
    console.error("Erreur mise à jour contact:", error);
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur",
    });
  }
};

module.exports = {
  createContact,
  getAllContacts,
  getContactById,
  updateContactStatus,
};
