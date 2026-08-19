const express = require("express");

const {
    createQueue,
    getQueuesByOrganization,
    getAvailableQueues,
    getQueueById,
    joinQueue,
    callNextToken,
    updateQueuePolicy,
    getQueueAnalytics,
    getAssignedQueue
} = require("../controllers/queueController");

const authMiddleware =
    require("../middleware/authMiddleware");

const roleMiddleware =
    require("../middleware/roleMiddleware");

const organizationAccessMiddleware =
    require("../middleware/organizationAccessMiddleware");

const router = express.Router();


// ============================================================
// CREATE QUEUE
// ORGANIZATION ONLY
// ============================================================

router.post(
    "/",
    authMiddleware,
    roleMiddleware("ORGANIZATION"),
    createQueue
);


// ============================================================
// GET QUEUES BY ORGANIZATION
// ORGANIZATION ONLY
// Pagination handled by controller
// ============================================================

router.get(
    "/organization/:organizationId",
    authMiddleware,
    roleMiddleware("ORGANIZATION"),
    getQueuesByOrganization
);

// ============================================================
// USER → GET AVAILABLE QUEUES
// ============================================================

router.get(
    "/available/:organizationId",
    authMiddleware,
    roleMiddleware("USER"),
    getAvailableQueues
);
// ============================================================
// GET ASSIGNED QUEUE FOR STAFF
// ============================================================
router.get(
    "/assigned",
    authMiddleware,
    roleMiddleware("STAFF"),
    getAssignedQueue
);

// ============================================================
// GET QUEUE BY ID
// AUTHENTICATED USERS
// ============================================================

router.get(
    "/:id",
    authMiddleware,
    getQueueById
);


// ============================================================
// JOIN QUEUE
// USER ONLY
// ============================================================

router.post(
    "/:queueId/join",
    authMiddleware,
    roleMiddleware("USER"),
    joinQueue
);


// ============================================================
// CALL NEXT TOKEN
// ADMIN / ORGANIZATION / STAFF
// ============================================================

router.post(
    "/:queueId/next",
    authMiddleware,
    roleMiddleware(
        "ADMIN",
        "ORGANIZATION",
        "STAFF"
    ),
    organizationAccessMiddleware,
    callNextToken
);


// ============================================================
// UPDATE QUEUE
// ORGANIZATION ONLY
// ============================================================

router.patch(
    "/:queueId/policy",
    authMiddleware,
    roleMiddleware("ORGANIZATION"),
    organizationAccessMiddleware,
    updateQueuePolicy
);


// ============================================================
// QUEUE ANALYTICS
// ORGANIZATION ONLY
// ============================================================

router.get(
    "/:queueId/analytics",
    authMiddleware,
    roleMiddleware("ORGANIZATION", "STAFF"),
    organizationAccessMiddleware,
    getQueueAnalytics
);


module.exports = router;