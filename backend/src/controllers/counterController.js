const Counter = require("../models/Counter");
const Organization = require("../models/Organization");
const Service = require("../models/Service");
const OrganizationStaff = require("../models/OrganizationStaff");
const User = require("../models/User");


// ============================================================
// CREATE COUNTER
// ============================================================

const createCounter = async (req, res) => {
    try {
        const {
            serviceId,
            name,
            counterNumber
        } = req.body;

        // ----------------------------------------------------
        // Validate required fields
        // ----------------------------------------------------

        if (
            !serviceId ||
            !name ||
            counterNumber === undefined
        ) {
            return res.status(400).json({
                message:
                    "serviceId, name and counterNumber are required"
            });
        }

        if (!name.trim()) {
            return res.status(400).json({
                message:
                    "Counter name is required"
            });
        }

        if (
            typeof counterNumber !== "number" ||
            !Number.isInteger(counterNumber) ||
            counterNumber < 1
        ) {
            return res.status(400).json({
                message:
                    "counterNumber must be a positive integer"
            });
        }

        // ----------------------------------------------------
        // Find organization from logged-in Organization account
        // ----------------------------------------------------

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

        // ----------------------------------------------------
        // Verify service belongs to this organization
        // ----------------------------------------------------

        const service =
            await Service.findOne({
                _id: serviceId,
                organizationId:
                    organization._id,
                status: "ACTIVE"
            });

        if (!service) {
            return res.status(404).json({
                message:
                    "Service not found in this organization"
            });
        }

        // ----------------------------------------------------
        // Check duplicate counter number
        // ----------------------------------------------------

        const existingCounter =
            await Counter.findOne({
                organizationId:
                    organization._id,

                counterNumber
            });

        if (existingCounter) {
            return res.status(409).json({
                message:
                    "Counter number already exists in this organization"
            });
        }

        // ----------------------------------------------------
        // Create counter
        // ----------------------------------------------------

        const counter =
            await Counter.create({
                organizationId:
                    organization._id,

                serviceId:
                    service._id,

                name:
                    name.trim(),

                counterNumber,

                assignedStaffId:
                    null,

                status:
                    "AVAILABLE"
            });

        return res.status(201).json({
            message:
                "Counter created successfully",

            counter
        });

    } catch (error) {

        console.error(
            "Create counter error:",
            error
        );

        // ----------------------------------------------------
        // Handle unique counter number
        // ----------------------------------------------------

        if (error.code === 11000) {
            return res.status(409).json({
                message:
                    "Counter number already exists in this organization"
            });
        }

        return res.status(500).json({
            message: "Server error"
        });
    }
};


// ============================================================
// GET COUNTERS BY ORGANIZATION
// ============================================================

const getCountersByOrganization = async (req, res) => {
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
                    "You are not allowed to view counters of this organization"
            });
        }

        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.min(
            Math.max(parseInt(req.query.limit, 10) || 10, 1),
            100
        );
        const skip = (page - 1) * limit;

        const filter = {
            organizationId: organization._id
        };

        if (req.query.serviceId) {
            filter.serviceId = req.query.serviceId;
        }

        const [counters, total] = await Promise.all([
            Counter.find(filter)
                .populate("serviceId", "name")
                .populate("assignedStaffId", "name email")
                .sort({ counterNumber: 1 })
                .skip(skip)
                .limit(limit),
            Counter.countDocuments(filter)
        ]);

        return res.status(200).json({
            counters,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Get counters error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};
;


// ============================================================
// ASSIGN STAFF TO COUNTER
// ============================================================

const assignStaffToCounter = async (req, res) => {
    try {
        const { staffId } = req.body;
        const { counterId } = req.params;

        // ----------------------------------------------------
        // Validate staff ID
        // ----------------------------------------------------

        if (!staffId) {
            return res.status(400).json({
                message: "staffId is required"
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
        // Find counter belonging to this organization
        // ----------------------------------------------------

        const counter =
            await Counter.findOne({
                _id: counterId,
                organizationId: organization._id
            });

        if (!counter) {
            return res.status(404).json({
                message: "Counter not found"
            });
        }

        // ----------------------------------------------------
        // Verify staff user
        // ----------------------------------------------------

        const staff =
            await User.findOne({
                _id: staffId,
                role: "STAFF",
                status: "ACTIVE"
            });

        if (!staff) {
            return res.status(404).json({
                message:
                    "Active staff user not found"
            });
        }

        // ----------------------------------------------------
        // Verify staff belongs to this organization
        // ----------------------------------------------------

        const membership =
            await OrganizationStaff.findOne({
                organizationId:
                    organization._id,

                userId:
                    staff._id,

                role: "STAFF",

                status: "ACTIVE"
            });

        if (!membership) {
            return res.status(400).json({
                message:
                    "This staff member does not belong to this organization"
            });
        }

        // ----------------------------------------------------
        // Assign staff
        // ----------------------------------------------------

        counter.assignedStaffId =
            staff._id;

        counter.status =
            "AVAILABLE";

        await counter.save();

        return res.status(200).json({
            message:
                "Staff assigned to counter successfully",

            counter
        });

    } catch (error) {

        console.error(
            "Assign staff error:",
            error
        );

        return res.status(500).json({
            message: "Server error"
        });
    }
};

// ============================================================
// UPDATE COUNTER STATUS
// ============================================================

const updateCounterStatus = async (req, res) => {
    try {
        const { counterId } = req.params;

        const {
            name,
            counterNumber,
            serviceId,
            status
        } = req.body;

        // ----------------------------------------------------
        // Find counter
        // ----------------------------------------------------

        const counter =
            await Counter.findById(counterId);

        if (!counter) {
            return res.status(404).json({
                message: "Counter not found"
            });
        }

        // ----------------------------------------------------
        // Find and validate authorization based on role
        // ----------------------------------------------------

        if (req.user.role === "ORGANIZATION") {
            const organization = await Organization.findOne({
                owner: req.user.userId,
                status: "ACTIVE"
            });

            if (!organization) {
                return res.status(404).json({
                    message: "Organization not found"
                });
            }

            if (
                counter.organizationId.toString() !==
                organization._id.toString()
            ) {
                return res.status(403).json({
                    message: "You are not allowed to update this counter"
                });
            }
        } else if (req.user.role === "STAFF") {
            // Staff can only update the status of their assigned counter
            if (!counter.assignedStaffId || counter.assignedStaffId.toString() !== req.user.userId.toString()) {
                return res.status(403).json({
                    message: "You can only update your assigned counter"
                });
            }
            if (name !== undefined || counterNumber !== undefined || serviceId !== undefined) {
                return res.status(403).json({
                    message: "Staff is only allowed to update counter status"
                });
            }
        } else if (req.user.role === "ADMIN") {
            // Admin is allowed
        } else {
            return res.status(403).json({
                message: "Access denied"
            });
        }

        // ----------------------------------------------------
        // Validate name
        // ----------------------------------------------------

        if (
            name !== undefined &&
            !name.trim()
        ) {
            return res.status(400).json({
                message:
                    "Counter name cannot be empty"
            });
        }

        // ----------------------------------------------------
        // Validate counter number
        // ----------------------------------------------------

        if (counterNumber !== undefined) {

            if (
                typeof counterNumber !== "number" ||
                !Number.isInteger(counterNumber) ||
                counterNumber < 1
            ) {
                return res.status(400).json({
                    message:
                        "counterNumber must be a positive integer"
                });
            }

            const existingCounter =
                await Counter.findOne({
                    organizationId:
                        organization._id,

                    counterNumber,

                    _id: {
                        $ne: counter._id
                    }
                });

            if (existingCounter) {
                return res.status(409).json({
                    message:
                        "Counter number already exists in this organization"
                });
            }
        }

        // ----------------------------------------------------
        // Validate service
        // ----------------------------------------------------

        if (serviceId !== undefined) {

            const service =
                await Service.findOne({
                    _id: serviceId,
                    organizationId:
                        organization._id,
                    status: "ACTIVE"
                });

            if (!service) {
                return res.status(404).json({
                    message:
                        "Service not found in this organization"
                });
            }

            counter.serviceId =
                service._id;
        }

        // ----------------------------------------------------
        // Validate status
        // ----------------------------------------------------

        if (status !== undefined) {

            if (
                ![
                    "AVAILABLE",
                    "BUSY",
                    "OFFLINE"
                ].includes(status)
            ) {
                return res.status(400).json({
                    message:
                        "Invalid counter status"
                });
            }

            counter.status = status;
        }

        // ----------------------------------------------------
        // Update fields
        // ----------------------------------------------------

        if (name !== undefined) {
            counter.name =
                name.trim();
        }

        if (counterNumber !== undefined) {
            counter.counterNumber =
                counterNumber;
        }

        await counter.save();

        return res.status(200).json({
            message:
                "Counter updated successfully",

            counter
        });

    } catch (error) {

        console.error(
            "Update counter error:",
            error
        );

        if (error.code === 11000) {
            return res.status(409).json({
                message:
                    "Counter number already exists in this organization"
            });
        }

        return res.status(500).json({
            message: "Server error"
        });
    }
};

const getAssignedCounter = async (req, res) => {
    try {
        const counter = await Counter.findOne({ assignedStaffId: req.user.userId })
            .populate("serviceId", "name averageServiceTime")
            .populate("organizationId", "name");
        if (!counter) {
            return res.status(404).json({
                message: "No counter assigned to this staff member"
            });
        }

        // Verify staff belongs to the counter's organization
        const OrganizationStaff = require("../models/OrganizationStaff");
        const membership = await OrganizationStaff.findOne({
            organizationId: counter.organizationId._id || counter.organizationId,
            userId: req.user.userId,
            role: "STAFF",
            status: "ACTIVE"
        });

        if (!membership) {
            return res.status(403).json({
                message: "You are not an active staff member of this organization"
            });
        }

        // Also fetch active Queue for this counter's service
        const Queue = require("../models/Queue");
        const queue = await Queue.findOne({
            serviceId: counter.serviceId._id,
            status: "OPEN"
        });

        return res.status(200).json({
            counter,
            queue: queue || null
        });
    } catch (error) {
        console.error("Get assigned counter error:", error);
        return res.status(500).json({
            message: "Server error"
        });
    }
};

module.exports = {
    createCounter,
    getCountersByOrganization,
    assignStaffToCounter,
    updateCounterStatus,
    getAssignedCounter
};