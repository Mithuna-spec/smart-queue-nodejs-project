const express = require("express");

const {
    getTokenStatus,
    completeToken,
    skipToken,
    cancelToken,
    startService,
    getMyActiveToken,
    getMyTokenHistory
} = require("../controllers/tokenController");

const authMiddleware =
    require("../middleware/authMiddleware");

const roleMiddleware =
    require("../middleware/roleMiddleware");

const organizationAccessMiddleware =
    require("../middleware/organizationAccessMiddleware");

const router = express.Router();


// USER → ACTIVE TOKEN

router.get(
    "/my-active",
    authMiddleware,
    roleMiddleware("USER"),
    getMyActiveToken
);


// USER → TOKEN HISTORY

router.get(
    "/my-history",
    authMiddleware,
    roleMiddleware("USER"),
    getMyTokenHistory
);


// TOKEN STATUS

router.get(
    "/:id/status",
    authMiddleware,
    getTokenStatus
);


// COMPLETE TOKEN

router.post(
    "/:id/complete",
    authMiddleware,
    roleMiddleware(
        "ADMIN",
        "ORGANIZATION",
        "STAFF"
    ),
    organizationAccessMiddleware,
    completeToken
);


// SKIP TOKEN

router.post(
    "/:id/skip",
    authMiddleware,
    roleMiddleware(
        "ADMIN",
        "ORGANIZATION",
        "STAFF"
    ),
    organizationAccessMiddleware,
    skipToken
);


// CANCEL TOKEN

router.post(
    "/:id/cancel",
    authMiddleware,
    roleMiddleware("USER"),
    cancelToken
);


// START SERVICE

router.post(
    "/:id/start",
    authMiddleware,
    roleMiddleware(
        "ADMIN",
        "ORGANIZATION",
        "STAFF"
    ),
    organizationAccessMiddleware,
    startService
);

// GET QUEUE TOKENS
router.get(
    "/queue/:queueId",
    authMiddleware,
    roleMiddleware("ADMIN", "ORGANIZATION", "STAFF"),
    organizationAccessMiddleware,
    require("../controllers/tokenController").getQueueTokens
);

module.exports = router;
