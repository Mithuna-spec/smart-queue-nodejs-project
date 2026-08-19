const jwt = require("jsonwebtoken");
const User = require("../models/User");

const socketAuth = async (socket, next) => {
    try {
        const token =
            socket.handshake.auth?.token ||
            socket.handshake.headers?.authorization?.replace(
                "Bearer ",
                ""
            );

        if (!token) {
            return next(
                new Error("Authentication token required")
            );
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        const user = await User.findById(
            decoded.userId
        ).select(
            "_id name email phone role status"
        );

        if (!user) {
            return next(
                new Error("User account not found")
            );
        }

        if (user.status !== "ACTIVE") {
            return next(
                new Error("User account is inactive")
            );
        }

        socket.user = {
            userId: user._id.toString(),
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            status: user.status
        };

        next();

    } catch (error) {

        if (error.name === "TokenExpiredError") {
            return next(
                new Error(
                    "Authentication token expired"
                )
            );
        }

        if (error.name === "JsonWebTokenError") {
            return next(
                new Error(
                    "Invalid authentication token"
                )
            );
        }

        console.error(
            "Socket authentication error:",
            error
        );

        return next(
            new Error("Socket authentication failed")
        );
    }
};

module.exports = socketAuth;