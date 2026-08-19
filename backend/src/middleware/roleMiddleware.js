const roleMiddleware = (...allowedRoles) => {

    return (req, res, next) => {

        if (!req.user) {
            return res.status(401).json({
                message:
                    "Authentication required"
            });
        }

        if (!req.user.userId) {
            return res.status(401).json({
                message:
                    "Authenticated user not found"
            });
        }

        if (!req.user.role) {
            return res.status(403).json({
                message:
                    "User role not found"
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
                req.user.role
            )
        ) {
            return res.status(403).json({
                message:
                    "Invalid user role"
            });
        }

        if (
            !allowedRoles.includes(
                req.user.role
            )
        ) {
            return res.status(403).json({
                message:
                    "Access denied"
            });
        }

        return next();
    };
};

module.exports =
    roleMiddleware;