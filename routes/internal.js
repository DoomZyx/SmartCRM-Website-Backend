const express = require("express");
const { requireInternalSecret, notifyLocalNumberAssigned } = require("../controllers/internalController");

const router = express.Router();

router.post("/notify-local-number-assigned", requireInternalSecret, notifyLocalNumberAssigned);

module.exports = router;
