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

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const router = express.Router();

router.post(
    "/",
    authMiddleware,
    createAppointment
);

router.get(
    "/my",
    authMiddleware,
    getMyAppointments
);

router.post(
    "/:id/cancel",
    authMiddleware,
    cancelAppointment
);

router.get(
    "/organization/:organizationId",
    authMiddleware,
    roleMiddleware("ADMIN", "ORGANIZATION", "STAFF"),
    getOrganizationAppointments
);

router.patch(
    "/:id/confirm",
    authMiddleware,
    roleMiddleware("ADMIN", "ORGANIZATION"),
    confirmAppointment
);

router.patch(
    "/:id/complete",
    authMiddleware,
    roleMiddleware("ADMIN", "ORGANIZATION"),
    completeAppointment
);

router.post(
    "/:id/check-in",
    authMiddleware,
    checkInAppointment
);

module.exports = router;