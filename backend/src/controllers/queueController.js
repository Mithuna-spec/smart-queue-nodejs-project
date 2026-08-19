const Queue = require("../models/Queue");
const Organization = require("../models/Organization");
const Service = require("../models/Service");
const Token = require("../models/Token");
const Counter = require("../models/Counter");
const mongoose = require("mongoose");

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
            serviceId,
            name,
            queuePolicy,
            priorityOrder
        } = req.body;

        // ----------------------------------------------------
        // Validate required fields
        // ----------------------------------------------------

        if (!serviceId) {
            return res.status(400).json({
                message: "serviceId is required"
            });
        }

        if (!name || !name.trim()) {
            return res.status(400).json({
                message: "Queue name is required"
            });
        }

        // ----------------------------------------------------
        // Find organization from logged-in Organization user
        // ----------------------------------------------------

        const organization =
            await Organization.findOne({
                owner: req.user.userId,
                status: "ACTIVE"
            });

        if (!organization) {
            return res.status(404).json({
                message: "Organization not found"
            });
        }

        // ----------------------------------------------------
        // Verify service belongs to this organization
        // ----------------------------------------------------

        const service =
            await Service.findOne({
                _id: serviceId,
                organizationId: organization._id,
                status: "ACTIVE"
            });

        if (!service) {
            return res.status(404).json({
                message:
                    "Service not found in this organization"
            });
        }

        // ----------------------------------------------------
        // Check duplicate queue name for this service
        // ----------------------------------------------------

        const existingQueue =
            await Queue.findOne({
                organizationId:
                    organization._id,

                serviceId:
                    service._id,

                name:
                    name.trim()
            });

        if (existingQueue) {
            return res.status(409).json({
                message:
                    "Queue already exists for this service"
            });
        }

        // ----------------------------------------------------
        // Validate queue policy
        // ----------------------------------------------------

        const finalQueuePolicy =
            queuePolicy || "FIFO";

        if (
            !["FIFO", "PRIORITY"].includes(
                finalQueuePolicy
            )
        ) {
            return res.status(400).json({
                message:
                    "Invalid queue policy"
            });
        }

        // ----------------------------------------------------
        // Validate priority order
        // ----------------------------------------------------

        const finalPriorityOrder =
            priorityOrder ||
            ["URGENT", "PRIORITY", "NORMAL"];

        if (
            !Array.isArray(
                finalPriorityOrder
            ) ||
            finalPriorityOrder.some(
                priority =>
                    ![
                        "URGENT",
                        "PRIORITY",
                        "NORMAL"
                    ].includes(priority)
            )
        ) {
            return res.status(400).json({
                message:
                    "Invalid priority order"
            });
        }

        // ----------------------------------------------------
        // Create queue
        // ----------------------------------------------------

        const queue =
            await Queue.create({
                organizationId:
                    organization._id,

                serviceId:
                    service._id,

                name:
                    name.trim(),

                queuePolicy:
                    finalQueuePolicy,

                priorityOrder:
                    finalPriorityOrder
            });

        return res.status(201).json({
            message:
                "Queue created successfully",

            queue
        });

    } catch (error) {

        console.error(
            "Create queue error:",
            error
        );

        // ----------------------------------------------------
        // Handle duplicate organization + service + name
        // ----------------------------------------------------

        if (error.code === 11000) {
            return res.status(409).json({
                message:
                    "Queue already exists for this service"
            });
        }

        return res.status(500).json({
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

        const organization = await Organization.findOne({
            owner: req.user.userId,
            status: "ACTIVE"
        });

        if (!organization) {
            return res.status(404).json({
                message: "Organization not found"
            });
        }

        if (organization._id.toString() !== organizationId.toString()) {
            return res.status(403).json({
                message:
                    "You are not allowed to view queues of this organization"
            });
        }

        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.min(
            Math.max(parseInt(req.query.limit, 10) || 10, 1),
            100
        );
        const skip = (page - 1) * limit;

        const filter = { organizationId: organization._id };

        if (req.query.serviceId) {
            filter.serviceId = req.query.serviceId;
        }

        const [queues, total] = await Promise.all([
            Queue.find(filter)
                .populate("serviceId", "name averageServiceTime")
                .populate("organizationId", "name")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Queue.countDocuments(filter)
        ]);

        return res.status(200).json({
            queues,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Get queues error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};
;


// ============================================================
// GET QUEUE BY ID
// ============================================================

const getQueueById = async (req, res) => {
    try {
        const { id } = req.params;

        const queue =
            await Queue.findById(id)
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

        // ----------------------------------------------------
        // Organization users can only access their own queues
        // ----------------------------------------------------

        if (req.user.role === "ORGANIZATION") {

            const organization =
                await Organization.findOne({
                    owner: req.user.userId,
                    status: "ACTIVE"
                });

            if (!organization) {
                return res.status(404).json({
                    message:
                        "Organization not found"
                });
            }

            if (
                queue.organizationId._id.toString() !==
                organization._id.toString()
            ) {
                return res.status(403).json({
                    message:
                        "You are not allowed to access this queue"
                });
            }
        }

        return res.status(200).json({
            queue
        });

    } catch (error) {

        console.error(
            "Get queue error:",
            error
        );

        return res.status(500).json({
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

        // ----------------------------------------------------
        // Validate Queue ID
        // ----------------------------------------------------

        if (!mongoose.Types.ObjectId.isValid(queueId)) {
            return res.status(400).json({
                message: "Invalid Queue ID format"
            });
        }

        // ----------------------------------------------------
        // Find queue
        // ----------------------------------------------------

        const queue = await Queue.findById(queueId);

        if (!queue) {
            return res.status(404).json({
                message: "Queue not found"
            });
        }

        // ----------------------------------------------------
        // Verify organization is active
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
        // Verify service is active
        // ----------------------------------------------------

        const service =
            await Service.findOne({
                _id: queue.serviceId,
                organizationId:
                    queue.organizationId,
                status: "ACTIVE"
            });

        if (!service) {
            return res.status(400).json({
                message:
                    "Service is not active"
            });
        }

        // ----------------------------------------------------
        // Queue must be open
        // ----------------------------------------------------

        // ----------------------------------------------------
        // Queue availability
        // ----------------------------------------------------

        if (queue.status !== "OPEN") {
            return res.status(400).json({
                message:
                    "Queue is currently closed"
            });
        }

        // ----------------------------------------------------
        // Service queue availability
        // ----------------------------------------------------

        if (!service.queueEnabled) {
            return res.status(400).json({
                message:
                    "Queue participation is disabled for this service"
            });
        }

        // ----------------------------------------------------
        // Check duplicate active token
        // ----------------------------------------------------

        const existingToken =
            await Token.findOne({
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
            return res.status(409).json({
                message:
                    "You already have an active token in this queue",
                token: existingToken
            });
        }

        // ----------------------------------------------------
        // Generate token number
        // ----------------------------------------------------

        const tokenNumber =
            queue.nextToken;

        // ----------------------------------------------------
        // Create token
        // ----------------------------------------------------

        const requestedPriority =
            (req.body && req.body.priority) || "NORMAL";

        if (
            ![
                "NORMAL",
                "PRIORITY",
                "URGENT"
            ].includes(requestedPriority)
        ) {
            return res.status(400).json({
                message: "Invalid priority"
            });
        }

        if (
            requestedPriority !== "NORMAL" &&
            !service.priorityEnabled
        ) {
            return res.status(400).json({
                message:
                    "Priority queue is not enabled for this service"
            });
        }

        const token =
            await Token.create({
                queueId,
                userId: req.user.userId,
                tokenNumber,
                priority: requestedPriority
            });

        // ----------------------------------------------------
        // Increment next token
        // ----------------------------------------------------

        queue.nextToken += 1;

        await queue.save();

        // ----------------------------------------------------
        // Calculate position
        // ----------------------------------------------------

        const positionData =
            await getTokenPosition(token);

        const position =
            positionData.position;

        // ----------------------------------------------------
        // Calculate estimated wait time
        // ----------------------------------------------------

        const waitData =
            await getEstimatedWaitTime(token);

        const estimatedWaitTime =
            waitData.estimatedWaitTime;

        // ----------------------------------------------------
        // Response
        // ----------------------------------------------------

        return res.status(201).json({
            message:
                "Successfully joined queue",

            token: {
                id: token._id,
                tokenNumber:
                    token.tokenNumber,
                status:
                    token.status,
                priority:
                    token.priority
            },

            queue: {
                id: queue._id,
                name: queue.name
            },

            service: {
                id: service._id,
                name: service.name
            },

            position,

            estimatedWaitTime
        });

    } catch (error) {

        console.error(
            "Join queue error:",
            error
        );

        // ----------------------------------------------------
        // Duplicate active token
        // ----------------------------------------------------

        if (error.code === 11000) {
            const Token = require("../models/Token");
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
            return res.status(409).json({
                message:
                    "You already have an active token in this queue",
                token: existingToken || null
            });
        }

        return res.status(500).json({
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
            name,
            queuePolicy,
            priorityOrder,
            status
        } = req.body;

        // ----------------------------------------------------
        // Find queue
        // ----------------------------------------------------

        const queue =
            await Queue.findById(queueId);

        if (!queue) {
            return res.status(404).json({
                message: "Queue not found"
            });
        }

        // ----------------------------------------------------
        // Find logged-in Organization
        // ----------------------------------------------------

        const organization =
            await Organization.findOne({
                owner: req.user.userId,
                status: "ACTIVE"
            });

        if (!organization) {
            return res.status(404).json({
                message: "Organization not found"
            });
        }

        // ----------------------------------------------------
        // Organization isolation
        // ----------------------------------------------------

        if (
            queue.organizationId.toString() !==
            organization._id.toString()
        ) {
            return res.status(403).json({
                message:
                    "You are not allowed to update this queue"
            });
        }

        // ----------------------------------------------------
        // Validate queue name
        // ----------------------------------------------------

        if (
            name !== undefined &&
            !name.trim()
        ) {
            return res.status(400).json({
                message:
                    "Queue name cannot be empty"
            });
        }

        // ----------------------------------------------------
        // Check duplicate queue name
        // ----------------------------------------------------

        if (name !== undefined) {

            const existingQueue =
                await Queue.findOne({
                    organizationId:
                        organization._id,

                    serviceId:
                        queue.serviceId,

                    name:
                        name.trim(),

                    _id: {
                        $ne: queue._id
                    }
                });

            if (existingQueue) {
                return res.status(409).json({
                    message:
                        "Queue already exists for this service"
                });
            }
        }

        // ----------------------------------------------------
        // Validate queue policy
        // ----------------------------------------------------

        if (
            queuePolicy !== undefined &&
            ![
                "FIFO",
                "PRIORITY"
            ].includes(queuePolicy)
        ) {
            return res.status(400).json({
                message:
                    "Invalid queue policy"
            });
        }

        // ----------------------------------------------------
        // Validate priority order
        // ----------------------------------------------------

        if (priorityOrder !== undefined) {

            if (
                !Array.isArray(priorityOrder) ||
                priorityOrder.some(
                    priority =>
                        ![
                            "URGENT",
                            "PRIORITY",
                            "NORMAL"
                        ].includes(priority)
                )
            ) {
                return res.status(400).json({
                    message:
                        "Invalid priority order"
                });
            }

            queue.priorityOrder =
                priorityOrder;
        }

        // ----------------------------------------------------
        // Validate status
        // ----------------------------------------------------

        if (status !== undefined) {

            if (
                ![
                    "OPEN",
                    "PAUSED",
                    "CLOSED"
                ].includes(status)
            ) {
                return res.status(400).json({
                    message:
                        "Invalid queue status"
                });
            }

            queue.status = status;
        }

        // ----------------------------------------------------
        // Update fields
        // ----------------------------------------------------

        if (name !== undefined) {
            queue.name =
                name.trim();
        }

        if (queuePolicy !== undefined) {
            queue.queuePolicy =
                queuePolicy;
        }

        await queue.save();

        return res.status(200).json({
            message:
                "Queue updated successfully",

            queue
        });

    } catch (error) {

        console.error(
            "Update queue error:",
            error
        );

        if (error.code === 11000) {
            return res.status(409).json({
                message:
                    "Queue already exists for this service"
            });
        }

        return res.status(500).json({
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

        if (!mongoose.Types.ObjectId.isValid(queueId)) {
            return res.status(400).json({
                message: "Invalid queue ID"
            });
        }

        const queue = await Queue.findById(queueId);

        if (!queue) {
            return res.status(404).json({
                message: "Queue not found"
            });
        }

        const organization =
            await Organization.findById(queue.organizationId);

        if (!organization) {
            return res.status(404).json({
                message: "Organization not found"
            });
        }

        if (
            req.user.role !== "ADMIN" &&
            organization.owner.toString() !== req.user.userId.toString()
        ) {
            return res.status(403).json({
                message: "You are not allowed to view analytics"
            });
        }

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(startOfDay);
        endOfDay.setDate(endOfDay.getDate() + 1);

        const [result] = await Token.aggregate([
            {
                $match: {
                    queueId: new mongoose.Types.ObjectId(queueId),
                    createdAt: {
                        $gte: startOfDay,
                        $lt: endOfDay
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    waiting: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "WAITING"] }, 1, 0]
                        }
                    },
                    called: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "CALLED"] }, 1, 0]
                        }
                    },
                    inService: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "IN_SERVICE"] }, 1, 0]
                        }
                    },
                    completed: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "COMPLETED"] }, 1, 0]
                        }
                    },
                    cancelled: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "CANCELLED"] }, 1, 0]
                        }
                    },
                    skipped: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "SKIPPED"] }, 1, 0]
                        }
                    },
                    completedWaitingTime: {
                        $sum: {
                            $cond: [
                                { $eq: ["$status", "COMPLETED"] },
                                { $ifNull: ["$waitingTime", 0] },
                                0
                            ]
                        }
                    },
                    completedServiceTime: {
                        $sum: {
                            $cond: [
                                { $eq: ["$status", "COMPLETED"] },
                                { $ifNull: ["$serviceTime", 0] },
                                0
                            ]
                        }
                    }
                }
            }
        ]);

        const statistics = result || {
            total: 0,
            waiting: 0,
            called: 0,
            inService: 0,
            completed: 0,
            cancelled: 0,
            skipped: 0,
            completedWaitingTime: 0,
            completedServiceTime: 0
        };

        const completedCount = statistics.completed || 0;

        return res.status(200).json({
            queue: {
                id: queue._id,
                name: queue.name,
                policy: queue.queuePolicy
            },
            date: startOfDay,
            statistics: {
                total: statistics.total || 0,
                waiting: statistics.waiting || 0,
                called: statistics.called || 0,
                inService: statistics.inService || 0,
                completed: completedCount,
                cancelled: statistics.cancelled || 0,
                skipped: statistics.skipped || 0,
                averageWaitingTime:
                    completedCount > 0
                        ? Math.round(
                            (statistics.completedWaitingTime || 0) /
                            completedCount
                        )
                        : 0,
                averageServiceTime:
                    completedCount > 0
                        ? Math.round(
                            (statistics.completedServiceTime || 0) /
                            completedCount
                        )
                        : 0
            }
        });
    } catch (error) {
        console.error("Queue analytics error:", error);

        return res.status(500).json({
            message: "Server error"
        });
    }
};
;


// ============================================================
// GET AVAILABLE QUEUES FOR USERS
// ============================================================

const getAvailableQueues = async (req, res) => {
    try {
        const { organizationId } = req.params;

        // ----------------------------------------------------
        // Verify active organization
        // ----------------------------------------------------

        const organization =
            await Organization.findOne({
                _id: organizationId,
                status: "ACTIVE"
            });

        if (!organization) {
            return res.status(404).json({
                message: "Organization not found"
            });
        }

        // ----------------------------------------------------
        // Get active queues
        // ----------------------------------------------------

        const queues =
            await Queue.find({
                organizationId,
                status: "OPEN"
            })
                .populate(
                    "serviceId",
                    "name description queueEnabled"
                )
                .sort({
                    name: 1
                });

        // ----------------------------------------------------
        // Only queues whose service allows queue participation
        // ----------------------------------------------------

        const availableQueues =
            queues.filter(
                queue =>
                    queue.serviceId &&
                    queue.serviceId.queueEnabled === true
            );

        return res.status(200).json({
            organization: {
                id: organization._id,
                name: organization.name
            },

            queues: availableQueues
        });

    } catch (error) {

        console.error(
            "Get available queues error:",
            error
        );

        return res.status(500).json({
            message: "Server error"
        });
    }
};

// ============================================================
// GET ASSIGNED QUEUE FOR STAFF
// ============================================================

const getAssignedQueue = async (req, res) => {
    try {
        // 1. Find the staff's ACTIVE OrganizationStaff membership
        const OrganizationStaff = require("../models/OrganizationStaff");
        const membership = await OrganizationStaff.findOne({
            userId: req.user.userId,
            role: "STAFF",
            status: "ACTIVE"
        });

        if (!membership) {
            return res.status(403).json({
                message: "You are not an active staff member of any organization"
            });
        }

        // 2. Find the staff's assigned counter
        const Counter = require("../models/Counter");
        const counter = await Counter.findOne({
            assignedStaffId: req.user.userId,
            organizationId: membership.organizationId
        });

        if (!counter) {
            return res.status(404).json({
                message: "No counter assigned to this staff member"
            });
        }

        // 3. Determine the counter's service/queue
        const Queue = require("../models/Queue");
        const queue = await Queue.findOne({
            serviceId: counter.serviceId,
            organizationId: membership.organizationId,
            status: "OPEN"
        });

        if (!queue) {
            return res.status(404).json({
                message: "Active queue not found for this counter's service"
            });
        }

        // 4. Calculate basic metrics for this queue
        const Token = require("../models/Token");
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(startOfDay);
        endOfDay.setDate(endOfDay.getDate() + 1);

        const [metricsResult] = await Token.aggregate([
            {
                $match: {
                    queueId: queue._id,
                    createdAt: {
                        $gte: startOfDay,
                        $lt: endOfDay
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    waiting: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "WAITING"] }, 1, 0]
                        }
                    },
                    called: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "CALLED"] }, 1, 0]
                        }
                    },
                    served: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "COMPLETED"] }, 1, 0]
                        }
                    },
                    skipped: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "SKIPPED"] }, 1, 0]
                        }
                    },
                    totalWaitingTime: {
                        $sum: {
                            $cond: [
                                { $and: ["$calledAt", "$createdAt"] },
                                { $subtract: ["$calledAt", "$createdAt"] },
                                0
                            ]
                        }
                    },
                    servedCount: {
                        $sum: {
                            $cond: [{ $and: ["$calledAt", "$createdAt"] }, 1, 0]
                        }
                    }
                }
            }
        ]);

        const statistics = {
            total: metricsResult?.total || 0,
            waiting: metricsResult?.waiting || 0,
            called: metricsResult?.called || 0,
            served: metricsResult?.served || 0,
            skipped: metricsResult?.skipped || 0,
            averageWaitingTime: 0
        };

        if (metricsResult && metricsResult.servedCount > 0) {
            // Convert to minutes
            statistics.averageWaitingTime = Math.round(
                metricsResult.totalWaitingTime / metricsResult.servedCount / 60000
            );
        }

        return res.status(200).json({
            queue,
            statistics
        });

    } catch (error) {
        console.error("Get assigned queue error:", error);
        return res.status(500).json({
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
    getAvailableQueues,
    getQueueById,
    joinQueue,
    callNextToken,
    updateQueuePolicy,
    getQueueAnalytics,
    getAssignedQueue
};