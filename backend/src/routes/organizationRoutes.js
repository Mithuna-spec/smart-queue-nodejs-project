const express = require("express");

const {
    createOrganization,
    getOrganizations,
    getOrganizationById,
    updateOrganization,
    deleteOrganization
} = require("../controllers/organizationController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const router = express.Router();

router.post(
    "/",
    authMiddleware,
    roleMiddleware("ADMIN", "ORGANIZATION"),
    createOrganization
);

router.get(
    "/",
    getOrganizations
);
router.get(
    "/:id",
    getOrganizationById
);

router.patch(
    "/:id",
    authMiddleware,
    roleMiddleware("ADMIN", "ORGANIZATION"),
    updateOrganization
);
router.delete(
    "/:id",
    authMiddleware,
    roleMiddleware("ADMIN", "ORGANIZATION"),
    deleteOrganization
);

module.exports = router;