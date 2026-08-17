const express = require("express");

const {
    addStaff,
    getOrganizationStaff,
    removeStaff
} = require("../controllers/organizationStaffController");

const authMiddleware =
    require("../middleware/authMiddleware");

const roleMiddleware =
    require("../middleware/roleMiddleware");

const router = express.Router();

router.post(
    "/",
    authMiddleware,
    roleMiddleware("ADMIN", "ORGANIZATION"),
    addStaff
);

router.get(
    "/organization/:organizationId",
    authMiddleware,
    getOrganizationStaff
);

router.patch(
    "/:id/remove",
    authMiddleware,
    roleMiddleware("ADMIN", "ORGANIZATION"),
    removeStaff
);

module.exports = router;