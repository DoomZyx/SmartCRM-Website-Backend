const express = require("express");
const { requireInternalSecret, notifyLocalNumberAssigned, notifyAppReady } = require("../controllers/internalController");

const router = express.Router();

router.post("/notify-local-number-assigned", requireInternalSecret, notifyLocalNumberAssigned);
router.post("/notify-app-ready", requireInternalSecret, notifyAppReady);

module.exports = router;
