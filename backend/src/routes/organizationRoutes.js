const express = require("express");

const {
    createOrganization,
    getOrganizations,
    getAvailableOrganizations,
    getOrganizationById,
    updateOrganization,
    deleteOrganization,
    getMyOrganization
} = require("../controllers/organizationController");

const authMiddleware =
    require("../middleware/authMiddleware");

const roleMiddleware =
    require("../middleware/roleMiddleware");

const router = express.Router();


// ============================================================
// ADMIN → CREATE ORGANIZATION
// ============================================================

router.post(
    "/",
    authMiddleware,
    roleMiddleware("ADMIN"),
    createOrganization
);


// ============================================================
// ADMIN → GET ALL ORGANIZATIONS
// ============================================================

router.get(
    "/",
    authMiddleware,
    roleMiddleware("ADMIN"),
    getOrganizations
);


// ============================================================
// USER → GET AVAILABLE ORGANIZATIONS
// ============================================================

router.get(
    "/available",
    authMiddleware,
    roleMiddleware("USER"),
    getAvailableOrganizations
);


// ============================================================
// ORGANIZATION → GET OWN PROFILE
// ============================================================

router.get(
    "/me",
    authMiddleware,
    roleMiddleware("ORGANIZATION"),
    getMyOrganization
);


// ============================================================
// ADMIN / ORGANIZATION → GET ORGANIZATION BY ID
// ============================================================

router.get(
    "/:id",
    authMiddleware,
    roleMiddleware(
        "ADMIN",
        "ORGANIZATION"
    ),
    getOrganizationById
);


// ============================================================
// ORGANIZATION → UPDATE OWN ORGANIZATION
// ============================================================

router.patch(
    "/:id",
    authMiddleware,
    roleMiddleware("ORGANIZATION"),
    updateOrganization
);


// ============================================================
// ADMIN → DELETE ORGANIZATION
// ============================================================

router.delete(
    "/:id",
    authMiddleware,
    roleMiddleware("ADMIN"),
    deleteOrganization
);


module.exports = router;