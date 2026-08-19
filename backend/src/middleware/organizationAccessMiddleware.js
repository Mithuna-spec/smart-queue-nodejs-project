const mongoose = require("mongoose");

const OrganizationStaff =
    require("../models/OrganizationStaff");

const Organization =
    require("../models/Organization");

const Queue =
    require("../models/Queue");

const Token =
    require("../models/Token");

const Counter =
    require("../models/Counter");


const organizationAccessMiddleware =
    async (req, res, next) => {

        try {

            let organizationId = null;

            // ==================================================
            // ORGANIZATION ID FROM URL
            // ==================================================

            if (
                req.params.organizationId
            ) {
                organizationId =
                    req.params.organizationId;
            }


            // ==================================================
            // ORGANIZATION ID FROM BODY
            // ==================================================

            if (
                !organizationId &&
                req.body &&
                req.body.organizationId
            ) {
                organizationId =
                    req.body.organizationId;
            }


            // ==================================================
            // QUEUE-BASED ROUTES
            // ==================================================

            if (
                !organizationId &&
                req.params.queueId
            ) {

                if (
                    !mongoose.Types.ObjectId.isValid(
                        req.params.queueId
                    )
                ) {
                    return res.status(400).json({
                        message:
                            "Invalid Queue ID format"
                    });
                }

                const queue =
                    await Queue.findById(
                        req.params.queueId
                    );

                if (!queue) {
                    return res.status(404).json({
                        message:
                            "Queue not found"
                    });
                }

                organizationId =
                    queue.organizationId.toString();
            }


            // ==================================================
            // TOKEN-BASED ROUTES
            // ==================================================

            if (
                !organizationId &&
                req.params.id
            ) {

                if (
                    !mongoose.Types.ObjectId.isValid(
                        req.params.id
                    )
                ) {
                    return res.status(400).json({
                        message:
                            "Invalid Token ID format"
                    });
                }

                const token =
                    await Token.findById(
                        req.params.id
                    );

                if (!token) {
                    return res.status(404).json({
                        message:
                            "Token not found"
                    });
                }

                const queue =
                    await Queue.findById(
                        token.queueId
                    );

                if (!queue) {
                    return res.status(404).json({
                        message:
                            "Queue not found"
                    });
                }

                organizationId =
                    queue.organizationId.toString();
            }


            // ==================================================
            // COUNTER-BASED ROUTES
            // ==================================================

            if (
                !organizationId &&
                req.params.counterId
            ) {

                if (
                    !mongoose.Types.ObjectId.isValid(
                        req.params.counterId
                    )
                ) {
                    return res.status(400).json({
                        message:
                            "Invalid Counter ID format"
                    });
                }

                const counter =
                    await Counter.findById(
                        req.params.counterId
                    );

                if (!counter) {
                    return res.status(404).json({
                        message:
                            "Counter not found"
                    });
                }

                organizationId =
                    counter.organizationId.toString();
            }


            // ==================================================
            // ORGANIZATION ID REQUIRED
            // ==================================================

            if (!organizationId) {
                return res.status(400).json({
                    message:
                        "Organization ID could not be determined"
                });
            }


            // ==================================================
            // VALIDATE ORGANIZATION ID
            // ==================================================

            if (
                !mongoose.Types.ObjectId.isValid(
                    organizationId
                )
            ) {
                return res.status(400).json({
                    message:
                        "Invalid Organization ID format"
                });
            }


            // ==================================================
            // FIND ORGANIZATION
            // ==================================================

            const organization =
                await Organization.findById(
                    organizationId
                );

            if (!organization) {
                return res.status(404).json({
                    message:
                        "Organization not found"
                });
            }


            // ==================================================
            // ADMIN
            // ==================================================

            if (
                req.user.role === "ADMIN"
            ) {

                req.organizationId =
                    organizationId;

                return next();
            }


            // ==================================================
            // ORGANIZATION OWNER
            // ==================================================

            if (
                req.user.role ===
                "ORGANIZATION"
            ) {

                if (
                    organization.owner.toString() !==
                    req.user.userId.toString()
                ) {
                    return res.status(403).json({
                        message:
                            "You are not authorized for this organization"
                    });
                }

                req.organizationId =
                    organizationId;

                return next();
            }


            // ==================================================
            // STAFF
            // ==================================================

            if (
                req.user.role === "STAFF"
            ) {

                const membership =
                    await OrganizationStaff.findOne({
                        organizationId,
                        userId:
                            req.user.userId,
                        role: "STAFF",
                        status: "ACTIVE"
                    });

                if (!membership) {
                    return res.status(403).json({
                        message:
                            "You are not authorized for this organization"
                    });
                }

                req.organizationId =
                    organizationId;

                return next();
            }


            // ==================================================
            // USER
            // ==================================================

            if (
                req.user.role === "USER"
            ) {
                return res.status(403).json({
                    message:
                        "Users cannot access organization management resources"
                });
            }


            return res.status(403).json({
                message:
                    "Access denied"
            });

        } catch (error) {

            console.error(
                "Organization access error:",
                error
            );

            return res.status(500).json({
                message:
                    "Server error"
            });
        }
    };


module.exports =
    organizationAccessMiddleware;