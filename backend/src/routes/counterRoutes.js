const express = require("express");

const {
    createCounter,
    getCountersByOrganization,
    assignStaffToCounter,
    updateCounterStatus,
    getAssignedCounter
} = require("../controllers/counterController");

const authMiddleware =
    require("../middleware/authMiddleware");

const roleMiddleware =
    require("../middleware/roleMiddleware");

const organizationAccessMiddleware =
    require("../middleware/organizationAccessMiddleware");

const router = express.Router();


// ============================================================
// CREATE COUNTER
// ORGANIZATION ONLY
// ============================================================

router.post(
    "/",
    authMiddleware,
    roleMiddleware("ORGANIZATION"),
    createCounter
);


// ============================================================
// STAFF → GET ASSIGNED COUNTER
// ============================================================

router.get(
    "/assigned",
    authMiddleware,
    roleMiddleware("STAFF"),
    getAssignedCounter
);


// ============================================================
// GET COUNTERS BY ORGANIZATION
// ORGANIZATION & STAFF ONLY
// Pagination handled by controller
// ============================================================

router.get(
    "/organization/:organizationId",
    authMiddleware,
    roleMiddleware("ORGANIZATION"),
    getCountersByOrganization
);


// ============================================================
// ASSIGN STAFF TO COUNTER
// ORGANIZATION ONLY
// ============================================================

router.patch(
    "/:counterId/staff",
    authMiddleware,
    roleMiddleware("ORGANIZATION"),
    assignStaffToCounter
);


// ============================================================
// UPDATE COUNTER
//
// ORGANIZATION → can edit own counter
// STAFF        → can update status of assigned counter
// ============================================================

router.patch(
    "/:counterId/status",
    authMiddleware,
    roleMiddleware(
        "ORGANIZATION",
        "STAFF"
    ),
    organizationAccessMiddleware,
    updateCounterStatus
);


module.exports = router;