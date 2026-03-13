const express = require("express");
const { createCheckoutSession } = require("../controllers/checkoutController");
const { body, validationResult } = require("express-validator");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

const createSessionValidation = [
  body("planId")
    .isInt({ min: 1, max: 5 })
    .withMessage("planId doit être un entier entre 1 et 5"),
];

router.post("/create-session", requireAuth, createSessionValidation, async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: errors.array()[0]?.msg || "Données invalides",
    });
  }
  try {
    await createCheckoutSession(req, res);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
