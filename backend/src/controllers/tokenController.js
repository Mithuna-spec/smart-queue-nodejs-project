const Token = require("../models/Token");
const Counter = require("../models/Counter");
const Queue = require("../models/Queue");
const Organization = require("../models/Organization");
const OrganizationStaff = require("../models/OrganizationStaff");

const {
    getTokenPosition,
    getEstimatedWaitTime
} = require("../services/queueService");

const {
    emitTokenStarted,
    emitTokenCompleted,
    emitQueueUpdated
} = require("../socket/queueEvents");


// ============================================================
// GET TOKEN STATUS
// ============================================================

const getTokenStatus = async (req, res) => {
    try {
        const token = await Token.findById(req.params.id);

        if (!token) {
            return res.status(404).json({
                message: "Token not found"
            });
        }

        // Only token owner or staff/admin/organization
        // can view the token, with proper organization-level checking.
        if (token.userId.toString() !== req.user.userId) {
            if (req.user.role === "ADMIN") {
                // ADMIN can access all
            } else if (req.user.role === "ORGANIZATION") {
                const queue = await Queue.findById(token.queueId);
                const org = await Organization.findById(queue?.organizationId);
                if (!org || org.owner.toString() !== req.user.userId.toString()) {
                    return res.status(403).json({
                        message: "You are not allowed to view this token"
                    });
                }
            } else if (req.user.role === "STAFF") {
                const queue = await Queue.findById(token.queueId);
                if (!queue) {
                    return res.status(404).json({
                        message: "Queue not found"
                    });
                }
                const membership = await OrganizationStaff.findOne({
                    organizationId: queue.organizationId,
                    userId: req.user.userId,
                    status: "ACTIVE"
                });
                if (!membership) {
                    return res.status(403).json({
                        message: "You are not allowed to view this token"
                    });
                }
            } else {
                return res.status(403).json({
                    message: "You are not allowed to view this token"
                });
            }
        }

        // --------------------------------------------------------
        // Position
        // --------------------------------------------------------

        let peopleAhead = 0;
        let position = null;

        if (token.status === "WAITING") {
            const positionData =
                await getTokenPosition(token);

            peopleAhead =
                positionData.peopleAhead;

            position =
                positionData.position;
        }

        // --------------------------------------------------------
        // Estimated waiting time
        // --------------------------------------------------------

        let averageServiceTime = 0;
        let estimatedWaitTime = 0;

        if (token.status === "WAITING") {
            const waitData =
                await getEstimatedWaitTime(token);

            averageServiceTime =
                waitData.averageServiceTime;

            estimatedWaitTime =
                waitData.estimatedWaitTime;
        }

        // --------------------------------------------------------
        // Response
        // --------------------------------------------------------

        return res.status(200).json({
            token: {
                id: token._id,
                tokenNumber:
                    token.tokenNumber,

                displayToken:
                    `Q${String(
                        token.tokenNumber
                    ).padStart(3, "0")}`,

                status:
                    token.status
            },

            queue: {
                id: token.queueId
            },

            peopleAhead,
            position,
            averageServiceTime,
            estimatedWaitTime
        });

    } catch (error) {
        console.error(
            "Get token status error:",
            error
        );

        return res.status(500).json({
            message: "Server error"
        });
    }
};


// ============================================================
// COMPLETE TOKEN
// ============================================================

const completeToken = async (req, res) => {
    try {
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

        if (
            token.status !== "IN_SERVICE"
        ) {
            return res.status(400).json({
                message:
                    "Token can only be completed from IN_SERVICE state"
            });
        }

        token.status =
            "COMPLETED";

        token.completedAt =
            new Date();

        // Calculate service time
        if (token.startedAt) {
            const serviceTime =
                (
                    token.completedAt -
                    token.startedAt
                ) / (1000 * 60);

            token.serviceTime =
                Math.round(serviceTime);
        }

        await token.save();

        if (token.counterId) {
            const counter = await Counter.findById(token.counterId);
            if (counter) {
                counter.status = "AVAILABLE";
                await counter.save();
            }
        }

        // Socket events
        emitTokenCompleted(
            token.queueId.toString(),
            token
        );

        emitQueueUpdated(
            token.queueId.toString(),
            {
                event:
                    "TOKEN_COMPLETED",

                tokenNumber:
                    token.tokenNumber
            }
        );

        return res.status(200).json({
            message:
                "Token completed successfully",

            token: {
                id: token._id,

                tokenNumber:
                    token.tokenNumber,

                status:
                    token.status,

                completedAt:
                    token.completedAt
            }
        });

    } catch (error) {
        console.error(
            "Complete token error:",
            error
        );

        return res.status(500).json({
            message: "Server error"
        });
    }
};


// ============================================================
// SKIP TOKEN
// ============================================================

const skipToken = async (req, res) => {
    try {
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

        if (
            ![
                "WAITING",
                "CALLED"
            ].includes(token.status)
        ) {
            return res.status(400).json({
                message:
                    "Token cannot be skipped in its current state"
            });
        }

        const wasCalled = token.status === "CALLED";
        token.status =
            "SKIPPED";

        await token.save();

        if (wasCalled && token.counterId) {
            const counter = await Counter.findById(token.counterId);
            if (counter) {
                counter.status = "AVAILABLE";
                await counter.save();
            }
        }

        // Notify queue clients
        emitQueueUpdated(
            token.queueId.toString(),
            {
                event:
                    "TOKEN_SKIPPED",

                tokenNumber:
                    token.tokenNumber
            }
        );

        return res.status(200).json({
            message:
                "Token skipped successfully",

            token: {
                id: token._id,

                tokenNumber:
                    token.tokenNumber,

                status:
                    token.status
            }
        });

    } catch (error) {
        console.error(
            "Skip token error:",
            error
        );

        return res.status(500).json({
            message: "Server error"
        });
    }
};


// ============================================================
// CANCEL TOKEN
// ============================================================

const cancelToken = async (req, res) => {
    try {
        const token =
            await Token.findById(
                req.params.id
            );

        if (!token) {
            return res.status(404).json({
                message: "Token not found"
            });
        }

        // ----------------------------------------------------
        // User can cancel only their own token
        // ----------------------------------------------------

        if (
            token.userId.toString() !==
            req.user.userId.toString()
        ) {
            return res.status(403).json({
                message:
                    "You can only cancel your own token"
            });
        }

        // ----------------------------------------------------
        // Token must be WAITING
        // ----------------------------------------------------

        if (token.status !== "WAITING") {
            return res.status(400).json({
                message:
                    "Only waiting tokens can be cancelled"
            });
        }

        // ----------------------------------------------------
        // Verify queue
        // ----------------------------------------------------

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

        // ----------------------------------------------------
        // Verify organization
        // ----------------------------------------------------

        const organization =
            await Organization.findOne({
                _id: queue.organizationId,
                status: "ACTIVE"
            });

        if (!organization) {
            return res.status(400).json({
                message:
                    "Organization is not active"
            });
        }

        // ----------------------------------------------------
        // Cancel token
        // ----------------------------------------------------

        token.status =
            "CANCELLED";

        await token.save();

        // ----------------------------------------------------
        // Notify queue clients
        // ----------------------------------------------------

        emitQueueUpdated(
            token.queueId.toString(),
            {
                event:
                    "TOKEN_CANCELLED",

                tokenNumber:
                    token.tokenNumber
            }
        );

        return res.status(200).json({
            message:
                "Token cancelled successfully",

            token: {
                id: token._id,

                tokenNumber:
                    token.tokenNumber,

                status:
                    token.status
            }
        });

    } catch (error) {

        console.error(
            "Cancel token error:",
            error
        );

        return res.status(500).json({
            message:
                "Server error"
        });
    }
};


// ============================================================
// START SERVICE
// ============================================================

const startService = async (req, res) => {
    try {
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

        if (
            token.status !==
            "CALLED"
        ) {
            return res.status(400).json({
                message:
                    "Only called tokens can start service"
            });
        }

        token.status =
            "IN_SERVICE";

        token.startedAt =
            new Date();

        // Calculate waiting time
        const waitingTime =
            (
                token.startedAt -
                token.joinedAt
            ) / (1000 * 60);

        token.waitingTime =
            Math.round(waitingTime);

        await token.save();

        // Socket event
        emitTokenStarted(
            token.queueId.toString(),
            token
        );

        emitQueueUpdated(
            token.queueId.toString(),
            {
                event:
                    "TOKEN_STARTED",

                tokenNumber:
                    token.tokenNumber
            }
        );

        return res.status(200).json({
            message:
                "Service started",

            token: {
                id: token._id,

                tokenNumber:
                    token.tokenNumber,

                status:
                    token.status
            }
        });

    } catch (error) {
        console.error(
            "Start service error:",
            error
        );

        return res.status(500).json({
            message: "Server error"
        });
    }
};
// ============================================================
// GET MY ACTIVE TOKEN
// ============================================================

const getMyActiveToken = async (req, res) => {
    try {
        const activeStatuses = [
            "WAITING",
            "CALLED",
            "IN_SERVICE"
        ];

        // ----------------------------------------------------
        // Find user's active token
        // ----------------------------------------------------

        const token = await Token.findOne({
            userId: req.user.userId,
            status: {
                $in: activeStatuses
            }
        })
            .populate(
                "queueId",
                "name status serviceId"
            )
            .sort({
                joinedAt: -1
            });

        // ----------------------------------------------------
        // No active token
        // ----------------------------------------------------

        if (!token) {
            return res.status(200).json({
                hasActiveToken: false,
                token: null
            });
        }

        // ----------------------------------------------------
        // Calculate position
        // ----------------------------------------------------

        let peopleAhead = 0;
        let position = null;

        if (token.status === "WAITING") {
            const positionData =
                await getTokenPosition(token);

            peopleAhead =
                positionData.peopleAhead;

            position =
                positionData.position;
        }

        // ----------------------------------------------------
        // Calculate estimated wait time
        // ----------------------------------------------------

        let averageServiceTime = 0;
        let estimatedWaitTime = 0;

        if (token.status === "WAITING") {
            const waitData =
                await getEstimatedWaitTime(token);

            averageServiceTime =
                waitData.averageServiceTime;

            estimatedWaitTime =
                waitData.estimatedWaitTime;
        }

        // ----------------------------------------------------
        // Response
        // ----------------------------------------------------

        return res.status(200).json({
            hasActiveToken: true,

            token: {
                id: token._id,

                tokenNumber:
                    token.tokenNumber,

                displayToken:
                    `Q${String(
                        token.tokenNumber
                    ).padStart(3, "0")}`,

                status:
                    token.status,

                priority:
                    token.priority,

                joinedAt:
                    token.joinedAt,

                calledAt:
                    token.calledAt,

                startedAt:
                    token.startedAt
            },

            queue: token.queueId,

            peopleAhead,

            position,

            averageServiceTime,

            estimatedWaitTime
        });

    } catch (error) {

        console.error(
            "Get my active token error:",
            error
        );

        return res.status(500).json({
            message: "Server error"
        });
    }
};


// ============================================================
// GET MY TOKEN HISTORY
// ============================================================

const getMyTokenHistory = async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.min(
            Math.max(parseInt(req.query.limit, 10) || 10, 1),
            100
        );
        const skip = (page - 1) * limit;

        const filter = {
            userId: req.user.userId
        };

        const [tokens, total] = await Promise.all([
            Token.find(filter)
                .populate("queueId", "name status serviceId")
                .sort({ joinedAt: -1 })
                .skip(skip)
                .limit(limit),
            Token.countDocuments(filter)
        ]);

        return res.status(200).json({
            tokens,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Get token history error:", error);
        return res.status(500).json({
            message: "Server error"
        });
    }
};

const getQueueTokens = async (req, res) => {
    try {
        const { queueId } = req.params;
        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
        const skip = (page - 1) * limit;

        const filter = { queueId };

        if (req.query.status) {
            filter.status = req.query.status;
        }

        const Token = require("../models/Token");
        const [tokens, total] = await Promise.all([
            Token.find(filter)
                .populate("userId", "name email phone")
                .sort({ tokenNumber: 1 })
                .skip(skip)
                .limit(limit),
            Token.countDocuments(filter)
        ]);

        return res.status(200).json({
            tokens,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Get queue tokens error:", error);
        return res.status(500).json({
            message: "Server error"
        });
    }
};

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
    getTokenStatus,
    completeToken,
    skipToken,
    cancelToken,
    startService,
    getMyActiveToken,
    getMyTokenHistory,
    getQueueTokens
};