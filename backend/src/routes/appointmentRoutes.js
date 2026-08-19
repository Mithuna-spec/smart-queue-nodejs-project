const express = require("express");

const {
    createAppointment,
    getMyAppointments,
    cancelAppointment,
    getOrganizationAppointments,
    confirmAppointment,
    completeAppointment,
    checkInAppointment
} = require("../controllers/appointmentController");

const authMiddleware =
    require("../middleware/authMiddleware");

const roleMiddleware =
    require("../middleware/roleMiddleware");

const router =
    express.Router();


// ============================================================
// USER → BOOK APPOINTMENT
// ============================================================

router.post(
    "/",
    authMiddleware,
    roleMiddleware("USER"),
    createAppointment
);


// ============================================================
// USER → GET OWN APPOINTMENTS
// ============================================================

router.get(
    "/my",
    authMiddleware,
    roleMiddleware("USER"),
    getMyAppointments
);


// ============================================================
// USER → CANCEL OWN APPOINTMENT
// ============================================================

router.post(
    "/:id/cancel",
    authMiddleware,
    roleMiddleware("USER"),
    cancelAppointment
);


// ============================================================
// ADMIN / ORGANIZATION / STAFF → VIEW ORGANIZATION APPOINTMENTS
// ============================================================

router.get(
    "/organization/:organizationId",
    authMiddleware,
    roleMiddleware(
        "ADMIN",
        "ORGANIZATION",
        "STAFF"
    ),
    getOrganizationAppointments
);


// ============================================================
// ADMIN / ORGANIZATION → CONFIRM
// ============================================================

router.patch(
    "/:id/confirm",
    authMiddleware,
    roleMiddleware(
        "ADMIN",
        "ORGANIZATION"
    ),
    confirmAppointment
);


// ============================================================
// ADMIN / ORGANIZATION → COMPLETE
// ============================================================

router.patch(
    "/:id/complete",
    authMiddleware,
    roleMiddleware(
        "ADMIN",
        "ORGANIZATION"
    ),
    completeAppointment
);


// ============================================================
// USER → CHECK IN
// ============================================================

router.post(
    "/:id/check-in",
    authMiddleware,
    roleMiddleware("USER"),
    checkInAppointment
);


module.exports = router;