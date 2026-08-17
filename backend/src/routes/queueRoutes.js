const express = require("express");

const {
    createQueue,
    getQueuesByOrganization,
    getQueueById,
    joinQueue,
    callNextToken,
    updateQueuePolicy,
    getQueueAnalytics
} = require("../controllers/queueController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const organizationAccessMiddleware =
    require("../middleware/organizationAccessMiddleware");


const router = express.Router();

router.post(
    "/",
    authMiddleware,
    roleMiddleware("ADMIN", "ORGANIZATION"),
    createQueue
);

router.get(
    "/organization/:organizationId",
    getQueuesByOrganization
);

router.get(
    "/:id",
    getQueueById
);
router.post(
    "/:queueId/join",
    authMiddleware,
    joinQueue
);

router.post(
    "/:queueId/next",
    authMiddleware,
    roleMiddleware("ADMIN", "ORGANIZATION", "STAFF"),
    organizationAccessMiddleware,
    callNextToken
);
router.patch(
    "/:queueId/policy",
    authMiddleware,
    roleMiddleware("ADMIN", "ORGANIZATION"),
    organizationAccessMiddleware,
    updateQueuePolicy
);
router.get(
    "/:queueId/analytics",
    authMiddleware,
    roleMiddleware("ADMIN", "ORGANIZATION"),
    organizationAccessMiddleware,
    getQueueAnalytics
);
module.exports = router;