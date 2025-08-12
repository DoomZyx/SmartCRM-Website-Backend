const express = require("express");
const router = express.Router();
const {
  validateContact,
  handleValidationErrors,
} = require("../middleware/validation");
const {
  createContact,
  getAllContacts,
  getContactById,
  updateContactStatus,
} = require("../controllers/contactController");

// Route publique pour créer un contact
router.post("/", validateContact, handleValidationErrors, createContact);

// Routes admin (à protéger plus tard avec authentification)
router.get("/", getAllContacts);
router.get("/:id", getContactById);
router.patch("/:id/status", updateContactStatus);

module.exports = router;
