const express = require("express");

const {
    addStaff,
    getOrganizationStaff,
    getMyOrganization,
    removeStaff
} = require("../controllers/organizationStaffController");

const authMiddleware =
    require("../middleware/authMiddleware");

const roleMiddleware =
    require("../middleware/roleMiddleware");

const router = express.Router();


// ============================================================
// STAFF CREATION
// ORGANIZATION ONLY
// ============================================================

router.post(
    "/organization/:organizationId",
    authMiddleware,
    roleMiddleware("ORGANIZATION"),
    addStaff
);


// ============================================================
// STAFF'S OWN ORGANIZATION
// STAFF ONLY
// ============================================================

router.get(
    "/me/organization",
    authMiddleware,
    roleMiddleware("STAFF"),
    getMyOrganization
);


// ============================================================
// GET ORGANIZATION STAFF
// ADMIN → ANY ORGANIZATION
// ORGANIZATION → OWN ORGANIZATION
// ============================================================

router.get(
    "/organization/:organizationId",
    authMiddleware,
    roleMiddleware("ORGANIZATION", "ADMIN"),
    getOrganizationStaff
);


// ============================================================
// REMOVE / DEACTIVATE STAFF
// ADMIN / ORGANIZATION
// ============================================================

router.patch(
    "/:id/remove",
    authMiddleware,
    roleMiddleware("ADMIN", "ORGANIZATION"),
    removeStaff
);


module.exports = router;