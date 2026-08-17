const Queue = require("../models/Queue");
const Organization = require("../models/Organization");
const Service = require("../models/Service");
const Token = require("../models/Token");
const Counter = require("../models/Counter");

const {
    emitTokenCalled,
    emitUserTokenCalled,
    emitQueueUpdated
} = require("../socket/queueEvents");

const {
    getTokenPosition,
    getEstimatedWaitTime
} = require("../services/queueService");


// ============================================================
// CREATE QUEUE
// ============================================================

const createQueue = async (req, res) => {
    try {
        const {
            organizationId,
            serviceId,
            name,
            queuePolicy,
            priorityOrder
        } = req.body;

        // Check organization
        const organization = await Organization.findById(
            organizationId
        );

        if (!organization) {
            return res.status(404).json({
                message: "Organization not found"
            });
        }

        // Check ownership
        if (
            organization.owner.toString() !== req.user.userId &&
            req.user.role !== "ADMIN"
        ) {
            return res.status(403).json({
                message:
                    "You are not allowed to create a queue for this organization"
            });
        }

        // Check service
        const service = await Service.findById(serviceId);

        if (!service) {
            return res.status(404).json({
                message: "Service not found"
            });
        }

        // Make sure service belongs to organization
        if (
            service.organizationId.toString() !== organizationId
        ) {
            return res.status(400).json({
                message:
                    "Service does not belong to this organization"
            });
        }

        // Create queue
        const queue = await Queue.create({
            organizationId,
            serviceId,
            name,
            queuePolicy,
            priorityOrder
        });

        res.status(201).json({
            message: "Queue created successfully",
            queue
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};


// ============================================================
// GET QUEUES BY ORGANIZATION
// ============================================================

const getQueuesByOrganization = async (req, res) => {
    try {
        const { organizationId } = req.params;

        const queues = await Queue.find({
            organizationId
        })
            .populate(
                "serviceId",
                "name averageServiceTime"
            )
            .populate(
                "organizationId",
                "name"
            );

        res.status(200).json({
            queues
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};


// ============================================================
// GET QUEUE BY ID
// ============================================================

const getQueueById = async (req, res) => {
    try {
        const queue = await Queue.findById(req.params.id)
            .populate(
                "serviceId",
                "name averageServiceTime"
            )
            .populate(
                "organizationId",
                "name"
            );

        if (!queue) {
            return res.status(404).json({
                message: "Queue not found"
            });
        }

        res.status(200).json({
            queue
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};


// ============================================================
// JOIN QUEUE
// ============================================================

const joinQueue = async (req, res) => {
    try {
        const { queueId } = req.params;

        const queue = await Queue.findById(queueId);

        if (!queue) {
            return res.status(404).json({
                message: "Queue not found"
            });
        }

        if (queue.status !== "OPEN") {
            return res.status(400).json({
                message: "Queue is currently closed"
            });
        }

        // Check whether user already has an active token
        const existingToken = await Token.findOne({
            queueId,
            userId: req.user.userId,
            status: {
                $in: [
                    "WAITING",
                    "CALLED",
                    "IN_SERVICE"
                ]
            }
        });

        if (existingToken) {
            return res.status(400).json({
                message:
                    "You already have an active token in this queue",
                token: existingToken
            });
        }

        // Generate token number
        const tokenNumber = queue.nextToken;

        // Create token
        const token = await Token.create({
            queueId,
            userId: req.user.userId,
            tokenNumber
        });

        // Increment next token
        queue.nextToken += 1;

        await queue.save();

        // Calculate position
        const positionData =
            await getTokenPosition(token);

        const position =
            positionData.position;

        // Get estimated wait time using unified service
        const waitData =
            await getEstimatedWaitTime(token);

        const estimatedWaitTime =
            waitData.estimatedWaitTime;

        res.status(201).json({
            message: "Successfully joined queue",

            token: {
                id: token._id,
                tokenNumber: token.tokenNumber,
                status: token.status,
                priority: token.priority
            },

            queue: {
                id: queue._id,
                name: queue.name
            },

            position,

            estimatedWaitTime
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};


// ============================================================
// CALL NEXT TOKEN
// ============================================================

const callNextToken = async (req, res) => {
    try {
        const { queueId } = req.params;
        const { counterId } = req.body;

        // ----------------------------------------------------
        // Get queue
        // ----------------------------------------------------

        const queue = await Queue.findById(queueId);

        if (!queue) {
            return res.status(404).json({
                message: "Queue not found"
            });
        }

        // ----------------------------------------------------
        // Counter ID required
        // ----------------------------------------------------

        if (!counterId) {
            return res.status(400).json({
                message: "counterId is required"
            });
        }

        // ----------------------------------------------------
        // Get counter
        // ----------------------------------------------------

        const counter = await Counter.findById(counterId);

        if (!counter) {
            return res.status(404).json({
                message: "Counter not found"
            });
        }

        // ----------------------------------------------------
        // Counter must belong to same organization
        // ----------------------------------------------------

        if (
            counter.organizationId.toString() !==
            queue.organizationId.toString()
        ) {
            return res.status(403).json({
                message:
                    "Counter does not belong to this organization"
            });
        }

        // ----------------------------------------------------
        // Counter must belong to same service
        // ----------------------------------------------------

        if (
            counter.serviceId.toString() !==
            queue.serviceId.toString()
        ) {
            return res.status(403).json({
                message:
                    "Counter does not belong to this queue's service"
            });
        }

        // ----------------------------------------------------
        // Staff can only use their assigned counter
        // ----------------------------------------------------

        if (req.user.role === "STAFF") {

            if (
                !counter.assignedStaffId ||
                counter.assignedStaffId.toString() !==
                    req.user.userId.toString()
            ) {
                return res.status(403).json({
                    message:
                        "This counter is not assigned to you"
                });
            }
        }

        // ----------------------------------------------------
        // Counter must be available
        // ----------------------------------------------------

        if (counter.status !== "AVAILABLE") {
            return res.status(400).json({
                message:
                    `Counter is currently ${counter.status}`
            });
        }

        // ----------------------------------------------------
        // Queue must be open
        // ----------------------------------------------------

        if (queue.status !== "OPEN") {
            return res.status(400).json({
                message: "Queue is not open"
            });
        }

        // ----------------------------------------------------
        // Check if another token is currently active on this counter
        // ----------------------------------------------------

        const activeToken = await Token.findOne({
            counterId: counter._id,
            status: {
                $in: [
                    "CALLED",
                    "IN_SERVICE"
                ]
            }
        });

        if (activeToken) {
            return res.status(400).json({
                message:
                    `Counter is currently serving Token Q${String(
                        activeToken.tokenNumber
                    ).padStart(3, "0")}`
            });
        }

        // ----------------------------------------------------
        // Find next waiting token
        // ----------------------------------------------------

        let nextToken;

        if (queue.queuePolicy === "PRIORITY") {

            const priorityOrder =
                queue.priorityOrder || [
                    "URGENT",
                    "PRIORITY",
                    "NORMAL"
                ];

            const waitingTokens =
                await Token.find({
                    queueId,
                    status: "WAITING"
                }).sort({
                    tokenNumber: 1
                });

            waitingTokens.sort((a, b) => {

                const priorityA =
                    priorityOrder.indexOf(
                        a.priority
                    );

                const priorityB =
                    priorityOrder.indexOf(
                        b.priority
                    );

                if (priorityA !== priorityB) {
                    return priorityA - priorityB;
                }

                // Same priority → FIFO
                return (
                    a.tokenNumber -
                    b.tokenNumber
                );
            });

            nextToken = waitingTokens[0];

        } else {

            // FIFO
            nextToken = await Token.findOne({
                queueId,
                status: "WAITING"
            }).sort({
                tokenNumber: 1
            });
        }

        // ----------------------------------------------------
        // No waiting tokens
        // ----------------------------------------------------

        if (!nextToken) {
            return res.status(404).json({
                message: "No waiting tokens"
            });
        }

        // ----------------------------------------------------
        // Call token
        // ----------------------------------------------------

        nextToken.status = "CALLED";
        nextToken.calledAt = new Date();

        // Attach counter to token
        nextToken.counterId = counter._id;

        await nextToken.save();

        // ----------------------------------------------------
        // Make counter busy
        // ----------------------------------------------------

        counter.status = "BUSY";

        await counter.save();

        // ----------------------------------------------------
        // Socket events
        // ----------------------------------------------------

        emitTokenCalled(
            queueId,
            nextToken
        );

        emitUserTokenCalled(
            nextToken.userId.toString(),
            nextToken
        );

        emitQueueUpdated(
            queueId,
            {
                event: "TOKEN_CALLED",
                tokenNumber:
                    nextToken.tokenNumber
            }
        );

        // ----------------------------------------------------
        // Update current queue token
        // ----------------------------------------------------

        queue.currentToken =
            nextToken.tokenNumber;

        await queue.save();

        // ----------------------------------------------------
        // Response
        // ----------------------------------------------------

        res.status(200).json({
            message: "Next token called",

            token: {
                id: nextToken._id,
                tokenNumber:
                    nextToken.tokenNumber,

                displayToken:
                    `Q${String(
                        nextToken.tokenNumber
                    ).padStart(3, "0")}`,

                status:
                    nextToken.status,

                calledAt:
                    nextToken.calledAt,

                counterId:
                    counter._id
            },

            counter: {
                id: counter._id,
                name: counter.name,
                counterNumber:
                    counter.counterNumber,
                status:
                    counter.status
            }
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};


// ============================================================
// UPDATE QUEUE POLICY
// ============================================================

const updateQueuePolicy = async (req, res) => {
    try {
        const { queueId } = req.params;

        const {
            queuePolicy,
            priorityOrder
        } = req.body;

        const queue = await Queue.findById(
            queueId
        );

        if (!queue) {
            return res.status(404).json({
                message: "Queue not found"
            });
        }

        const organization =
            await Organization.findById(
                queue.organizationId
            );

        if (!organization) {
            return res.status(404).json({
                message: "Organization not found"
            });
        }

        if (
            organization.owner.toString() !==
                req.user.userId &&
            req.user.role !== "ADMIN"
        ) {
            return res.status(403).json({
                message:
                    "You are not allowed to update this queue"
            });
        }

        if (
            !["FIFO", "PRIORITY"].includes(
                queuePolicy
            )
        ) {
            return res.status(400).json({
                message: "Invalid queue policy"
            });
        }

        queue.queuePolicy =
            queuePolicy;

        if (priorityOrder) {
            queue.priorityOrder =
                priorityOrder;
        }

        await queue.save();

        res.status(200).json({
            message:
                "Queue policy updated successfully",

            queue: {
                id: queue._id,
                name: queue.name,
                queuePolicy:
                    queue.queuePolicy,
                priorityOrder:
                    queue.priorityOrder
            }
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};


// ============================================================
// QUEUE ANALYTICS
// ============================================================

const getQueueAnalytics = async (req, res) => {
    try {
        const { queueId } = req.params;

        const queue = await Queue.findById(
            queueId
        );

        if (!queue) {
            return res.status(404).json({
                message: "Queue not found"
            });
        }

        const organization =
            await Organization.findById(
                queue.organizationId
            );

        if (!organization) {
            return res.status(404).json({
                message: "Organization not found"
            });
        }

        if (
            organization.owner.toString() !==
                req.user.userId &&
            req.user.role !== "ADMIN"
        ) {
            return res.status(403).json({
                message:
                    "You are not allowed to view analytics"
            });
        }

        // Start of today
        const startOfDay = new Date();

        startOfDay.setHours(
            0,
            0,
            0,
            0
        );

        // Start of tomorrow
        const endOfDay =
            new Date(startOfDay);

        endOfDay.setDate(
            endOfDay.getDate() + 1
        );

        const tokens = await Token.find({
            queueId,
            createdAt: {
                $gte: startOfDay,
                $lt: endOfDay
            }
        });

        const completedTokens =
            tokens.filter(
                token =>
                    token.status ===
                    "COMPLETED"
            );

        const totalWaitingTime =
            completedTokens.reduce(
                (sum, token) =>
                    sum + token.waitingTime,
                0
            );

        const totalServiceTime =
            completedTokens.reduce(
                (sum, token) =>
                    sum + token.serviceTime,
                0
            );

        const averageWaitingTime =
            completedTokens.length > 0
                ? Math.round(
                    totalWaitingTime /
                    completedTokens.length
                )
                : 0;

        const averageServiceTime =
            completedTokens.length > 0
                ? Math.round(
                    totalServiceTime /
                    completedTokens.length
                )
                : 0;

        const total =
            tokens.length;

        const waiting =
            tokens.filter(
                token =>
                    token.status ===
                    "WAITING"
            ).length;

        const called =
            tokens.filter(
                token =>
                    token.status ===
                    "CALLED"
            ).length;

        const inService =
            tokens.filter(
                token =>
                    token.status ===
                    "IN_SERVICE"
            ).length;

        const completed =
            tokens.filter(
                token =>
                    token.status ===
                    "COMPLETED"
            ).length;

        const cancelled =
            tokens.filter(
                token =>
                    token.status ===
                    "CANCELLED"
            ).length;

        const skipped =
            tokens.filter(
                token =>
                    token.status ===
                    "SKIPPED"
            ).length;

        res.status(200).json({

            queue: {
                id: queue._id,
                name: queue.name,
                policy:
                    queue.queuePolicy
            },

            date: startOfDay,

            statistics: {
                total,
                waiting,
                called,
                inService,
                completed,
                cancelled,
                skipped,
                averageWaitingTime,
                averageServiceTime
            }
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};


// ============================================================
// EXPORT
// ============================================================

module.exports = {
    createQueue,
    getQueuesByOrganization,
    getQueueById,
    joinQueue,
    callNextToken,
    updateQueuePolicy,
    getQueueAnalytics
};