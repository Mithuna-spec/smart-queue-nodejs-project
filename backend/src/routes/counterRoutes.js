const express = require("express");

const {
    createCounter,
    getCountersByOrganization,
    assignStaffToCounter,
    updateCounterStatus
} = require("../controllers/counterController");

const authMiddleware =
    require("../middleware/authMiddleware");

const roleMiddleware =
    require("../middleware/roleMiddleware");

const organizationAccessMiddleware =
    require("../middleware/organizationAccessMiddleware");

const router = express.Router();


// Create counter
router.post(
    "/",
    authMiddleware,
    roleMiddleware("ADMIN", "ORGANIZATION"),
    organizationAccessMiddleware,
    createCounter
);


// Get counters
router.get(
    "/organization/:organizationId",
    authMiddleware,
    organizationAccessMiddleware,
    getCountersByOrganization
);


// Assign staff
router.patch(
    "/:counterId/staff",
    authMiddleware,
    roleMiddleware("ADMIN", "ORGANIZATION"),
    organizationAccessMiddleware,
    assignStaffToCounter
);


// Update counter status
router.patch(
    "/:counterId/status",
    authMiddleware,
    roleMiddleware(
        "ADMIN",
        "ORGANIZATION",
        "STAFF"
    ),
    organizationAccessMiddleware,
    updateCounterStatus
);

module.exports = router;