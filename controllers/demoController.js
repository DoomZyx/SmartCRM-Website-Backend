const Demo = require("../models/Demo");
const {
  sendDemoConfirmationEmail,
  sendDemoNotificationEmail,
} = require("../utils/emailService");
const { child: logChild } = require("../utils/logger");

const createDemo = async (req, res) => {
  try {
    const { name, email, company, teamSize, needs, preferredTime, duration } =
      req.body;

    const demo = await Demo.create({
      name,
      email,
      company,
      teamSize,
      needs,
      preferredTime,
      duration,
    });

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
      logChild(req?.id).error({ err: error.message }, "Erreur envoi emails démo");
    });

    res.status(201).json({
      success: true,
      message:
        "Demande de démo envoyée avec succès ! Axel vous contactera rapidement pour fixer un rendez-vous.",
      data: {
        id: demo.id,
        name: demo.name,
        email: demo.email,
        company: demo.company,
      },
    });
  } catch (error) {
    logChild(req?.id).error({ err: error.message }, "Erreur création démo");
    if (error.code === "23502" || error.code === "23514") {
      return res.status(400).json({
        success: false,
        message: "Données invalides",
        errors: [{ message: error.message }],
      });
    }
    res
      .status(500)
      .json({ success: false, message: "Erreur interne du serveur" });
  }
};

const getAllDemos = async (req, res) => {
  try {
    const demos = await Demo.findAll();
    res.json({ success: true, data: demos });
  } catch (error) {
    logChild(req?.id).error({ err: error.message }, "Erreur récupération démos");
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
    logChild(req?.id).error({ err: error.message }, "Erreur récupération démo");
    res
      .status(500)
      .json({ success: false, message: "Erreur interne du serveur" });
  }
};

module.exports = { createDemo, getAllDemos, getDemoById };
