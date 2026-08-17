const express = require("express");
const {
    register,
    login,
    getMe
} = require("../controllers/authController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

router.get("/me", authMiddleware, getMe);
router.get(
    "/admin-test",
    authMiddleware,
    roleMiddleware("ADMIN"),
    (req, res) => {
        res.json({
            message: "Welcome Admin"
        });
    }
);

router.get(
    "/staff-test",
    authMiddleware,
    roleMiddleware("STAFF", "ADMIN"),
    (req, res) => {
        res.json({
            message: "Welcome Staff"
        });
    }
);

module.exports = router;