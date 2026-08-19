const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader =
            req.headers.authorization;

        if (
            !authHeader ||
            !authHeader.startsWith("Bearer ")
        ) {
            return res.status(401).json({
                message:
                    "Authentication token required"
            });
        }

        const parts =
            authHeader.split(" ");

        if (
            parts.length !== 2 ||
            !parts[1]
        ) {
            return res.status(401).json({
                message:
                    "Invalid authentication token"
            });
        }

        const token = parts[1];

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        if (
            !decoded ||
            !decoded.userId
        ) {
            return res.status(401).json({
                message:
                    "Invalid authentication token"
            });
        }

        const user =
            await User.findById(
                decoded.userId
            ).select(
                "_id name email phone role status"
            );

        if (!user) {
            return res.status(401).json({
                message:
                    "User account not found"
            });
        }

        if (user.status !== "ACTIVE") {
            return res.status(403).json({
                message:
                    "User account is inactive"
            });
        }

        const validRoles = [
            "ADMIN",
            "ORGANIZATION",
            "STAFF",
            "USER"
        ];

        if (
            !validRoles.includes(
                user.role
            )
        ) {
            return res.status(403).json({
                message:
                    "Invalid user role"
            });
        }

        req.user = {
            userId:
                user._id.toString(),
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            status: user.status
        };

        return next();

    } catch (error) {

        if (
            error.name ===
            "TokenExpiredError"
        ) {
            return res.status(401).json({
                message:
                    "Authentication token expired"
            });
        }

        if (
            error.name ===
            "JsonWebTokenError"
        ) {
            return res.status(401).json({
                message:
                    "Invalid authentication token"
            });
        }

        if (
            error.name ===
            "NotBeforeError"
        ) {
            return res.status(401).json({
                message:
                    "Authentication token is not active"
            });
        }

        console.error(
            "Authentication middleware error:",
            error
        );

        return res.status(500).json({
            message:
                "Server error"
        });
    }
};

module.exports =
    authMiddleware;