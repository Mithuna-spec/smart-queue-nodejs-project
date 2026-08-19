const express = require("express");

const {
    createSlot,
    getAvailableSlots
} = require("../controllers/appointmentSlotController");

const authMiddleware =
    require("../middleware/authMiddleware");

const roleMiddleware =
    require("../middleware/roleMiddleware");

const router =
    express.Router();


// ============================================================
// ADMIN / ORGANIZATION → CREATE SLOT
// ============================================================

router.post(
    "/",
    authMiddleware,
    roleMiddleware(
        "ADMIN",
        "ORGANIZATION"
    ),
    createSlot
);


// ============================================================
// USER → GET AVAILABLE SLOTS
// ============================================================

router.get(
    "/available",
    authMiddleware,
    roleMiddleware("USER"),
    getAvailableSlots
);


module.exports = router;