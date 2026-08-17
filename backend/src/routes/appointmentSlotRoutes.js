const express = require("express");

const {
    createSlot,
    getAvailableSlots
} = require("../controllers/appointmentSlotController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const router = express.Router();

router.post(
    "/",
    authMiddleware,
    roleMiddleware("ADMIN", "ORGANIZATION"),
    createSlot
);

router.get(
    "/available",
    authMiddleware,
    getAvailableSlots
);

module.exports = router;