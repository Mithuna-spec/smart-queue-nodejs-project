const express = require("express");

const {
    createService,
    getServicesByOrganization,
    getServiceById,
    updateService,
    deleteService
} = require("../controllers/serviceController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const router = express.Router();

router.post(
    "/",
    authMiddleware,
    roleMiddleware("ADMIN", "ORGANIZATION"),
    createService
);

router.get(
    "/organization/:organizationId",
    getServicesByOrganization
);

router.get(
    "/:id",
    getServiceById
);

router.patch(
    "/:id",
    authMiddleware,
    roleMiddleware("ADMIN", "ORGANIZATION"),
    updateService
);

router.delete(
    "/:id",
    authMiddleware,
    roleMiddleware("ADMIN", "ORGANIZATION"),
    deleteService
);
module.exports = router;