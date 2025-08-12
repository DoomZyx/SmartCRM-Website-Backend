const express = require("express");
const router = express.Router();
const { validateDemo, handleValidationErrors } = require("../middleware/demoValidation");
const { createDemo, getAllDemos, getDemoById } = require("../controllers/demoController");

router.post("/", validateDemo, handleValidationErrors, createDemo);
router.get("/", getAllDemos);
router.get("/:id", getDemoById);

module.exports = router; 