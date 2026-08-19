const express = require("express");

const {
    createService,
    getServicesByOrganization,
    getAvailableServices,
    getServiceById,
    updateService,
    deleteService
} = require("../controllers/serviceController");

const authMiddleware =
    require("../middleware/authMiddleware");

const roleMiddleware =
    require("../middleware/roleMiddleware");

const router = express.Router();


// ============================================================
// CREATE SERVICE
// ORGANIZATION ONLY
// ============================================================

router.post(
    "/",
    authMiddleware,
    roleMiddleware("ORGANIZATION"),
    createService
);


// ============================================================
// GET SERVICES BY ORGANIZATION
// ORGANIZATION ONLY
// ============================================================

router.get(
    "/organization/:organizationId",
    authMiddleware,
    roleMiddleware("ORGANIZATION"),
    getServicesByOrganization
);


// ============================================================
// USER → GET AVAILABLE SERVICES
// ============================================================

router.get(
    "/available/:organizationId",
    authMiddleware,
    roleMiddleware("USER"),
    getAvailableServices
);


// ============================================================
// GET SERVICE BY ID
// ORGANIZATION ONLY
// ============================================================

router.get(
    "/:id",
    authMiddleware,
    roleMiddleware("ORGANIZATION"),
    getServiceById
);


// ============================================================
// UPDATE SERVICE
// ORGANIZATION ONLY
// ============================================================

router.patch(
    "/:id",
    authMiddleware,
    roleMiddleware("ORGANIZATION"),
    updateService
);


// ============================================================
// DELETE SERVICE
// ORGANIZATION ONLY
// ============================================================

router.delete(
    "/:id",
    authMiddleware,
    roleMiddleware("ORGANIZATION"),
    deleteService
);


module.exports = router;