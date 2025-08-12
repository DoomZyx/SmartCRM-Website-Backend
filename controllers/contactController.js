const Contact = require("../models/Contact");
const {
  sendConfirmationEmail,
  sendNotificationEmail,
} = require("../utils/emailService");

// Créer un nouveau contact
const createContact = async (req, res) => {
  try {
    const { name, email, company, subject, message } = req.body;

    // Créer le contact en base
    const contact = new Contact({
      name,
      email,
      company,
      subject,
      message,
    });

    await contact.save();

    // Envoyer les emails (en arrière-plan pour ne pas bloquer la réponse)
    Promise.all([
      sendConfirmationEmail({ name, email, subject, message }),
      sendNotificationEmail({
        name,
        email,
        company,
        subject,
        message
      }),
    ]).catch((error) => {
      console.error("❌ Erreur envoi emails:", error);
    });

    res.status(201).json({
      success: true,
      message:
        "Message envoyé avec succès ! Nous vous répondrons dans les plus brefs délais.",
      data: {
        id: contact._id,
        name: contact.name,
        email: contact.email,
        subject: contact.subject,
      },
    });
  } catch (error) {
    console.error("❌ Erreur création contact:", error);

    // Gestion des erreurs MongoDB
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Données invalides",
        errors: Object.values(error.errors).map((err) => ({
          field: err.path,
          message: err.message,
        })),
      });
    }

    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur",
    });
  }
};

// Récupérer tous les contacts (pour admin)
const getAllContacts = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const filter = {};
    if (status) {
      filter.status = status;
    }

    const contacts = await Contact.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select("-__v");

    const total = await Contact.countDocuments(filter);

    res.json({
      success: true,
      data: contacts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalContacts: total,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("❌ Erreur récupération contacts:", error);
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur",
    });
  }
};

// Récupérer un contact par ID
const getContactById = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id).select("-__v");

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
    console.error("❌ Erreur récupération contact:", error);
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur",
    });
  }
};

// Mettre à jour le statut d'un contact
const updateContactStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).select("-__v");

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
    console.error("❌ Erreur mise à jour contact:", error);
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
