const express = require("express");

const {
    getTokenStatus,
    completeToken,
    skipToken,
    cancelToken,
    startService
} = require("../controllers/tokenController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const organizationAccessMiddleware =
    require("../middleware/organizationAccessMiddleware");

const router = express.Router();

router.get(
    "/:id/status",
    authMiddleware,
    getTokenStatus
);
router.post(
    "/:id/complete",
    authMiddleware,
    roleMiddleware("ADMIN", "ORGANIZATION", "STAFF"),
    organizationAccessMiddleware,
    completeToken
);
router.post(
    "/:id/skip",
    authMiddleware,
    roleMiddleware("ADMIN", "ORGANIZATION", "STAFF"),
    organizationAccessMiddleware,
    skipToken
);

router.post(
    "/:id/cancel",
    authMiddleware,
    cancelToken
);
router.post(
    "/:id/start",
    authMiddleware,
    roleMiddleware("ADMIN", "ORGANIZATION", "STAFF"),
    organizationAccessMiddleware,
    startService
);
module.exports = router;