const Demo = require("../models/Demo");
const {
  sendDemoConfirmationEmail,
  sendDemoNotificationEmail,
} = require("../utils/emailService");

const createDemo = async (req, res) => {
  try {
    const { name, email, company, teamSize, needs, preferredTime, duration } =
      req.body;

    const demo = new Demo({
      name,
      email,
      company,
      teamSize,
      needs,
      preferredTime,
      duration,
    });
    await demo.save();

    // Envoi des emails en parallèle
    Promise.all([
      sendDemoConfirmationEmail({
        name,
        email,
        company,
        teamSize,
        needs,
        preferredTime,
        duration,
      }),
      sendDemoNotificationEmail({
        name,
        email,
        company,
        teamSize,
        needs,
        preferredTime,
        duration,
      }),
    ]).catch((error) => {
      console.error("❌ Erreur envoi emails démo:", error);
    });

    res.status(201).json({
      success: true,
      message:
        "Demande de démo envoyée avec succès ! Axel vous contactera rapidement pour fixer un rendez-vous.",
      data: {
        id: demo._id,
        name: demo.name,
        email: demo.email,
        company: demo.company,
      },
    });
  } catch (error) {
    console.error("❌ Erreur création démo:", error);
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
    res
      .status(500)
      .json({ success: false, message: "Erreur interne du serveur" });
  }
};

const getAllDemos = async (req, res) => {
  try {
    const demos = await Demo.find().sort({ createdAt: -1 });
    res.json({ success: true, data: demos });
  } catch (error) {
    console.error("❌ Erreur récupération démos:", error);
    res
      .status(500)
      .json({ success: false, message: "Erreur interne du serveur" });
  }
};

const getDemoById = async (req, res) => {
  try {
    const demo = await Demo.findById(req.params.id);
    if (!demo) {
      return res
        .status(404)
        .json({ success: false, message: "Démo non trouvée" });
    }
    res.json({ success: true, data: demo });
  } catch (error) {
    console.error("❌ Erreur récupération démo:", error);
    res
      .status(500)
      .json({ success: false, message: "Erreur interne du serveur" });
  }
};

module.exports = { createDemo, getAllDemos, getDemoById };
