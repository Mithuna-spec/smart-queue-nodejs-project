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
            organizationId,
            serviceId,
            name,
            counterNumber
        } = req.body;

        if (
            !organizationId ||
            !serviceId ||
            !name ||
            counterNumber === undefined
        ) {
            return res.status(400).json({
                message:
                    "organizationId, serviceId, name and counterNumber are required"
            });
        }

        const organization =
            await Organization.findById(
                organizationId
            );

        if (!organization) {
            return res.status(404).json({
                message: "Organization not found"
            });
        }

        // ADMIN can manage any organization
        // ORGANIZATION can manage only its own organization
        if (req.user.role !== "ADMIN") {
            if (
                organization.owner.toString() !==
                req.user.userId.toString()
            ) {
                return res.status(403).json({
                    message:
                        "You are not authorized for this organization"
                });
            }
        }

        const service =
            await Service.findById(serviceId);

        if (!service) {
            return res.status(404).json({
                message: "Service not found"
            });
        }

        if (
            service.organizationId.toString() !==
            organizationId.toString()
        ) {
            return res.status(400).json({
                message:
                    "Service does not belong to this organization"
            });
        }

        const existingCounter =
            await Counter.findOne({
                organizationId,
                counterNumber
            });

        if (existingCounter) {
            return res.status(409).json({
                message:
                    "Counter number already exists in this organization"
            });
        }

        const counter =
            await Counter.create({
                organizationId,
                serviceId,
                name,
                counterNumber
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

        return res.status(500).json({
            message: "Server error"
        });
    }
};


// ============================================================
// GET COUNTERS BY ORGANIZATION
// ============================================================

const getCountersByOrganization = async (
    req,
    res
) => {
    try {
        const {
            organizationId
        } = req.params;

        const counters =
            await Counter.find({
                organizationId
            })
                .populate(
                    "serviceId",
                    "name"
                )
                .populate(
                    "assignedStaffId",
                    "name email"
                )
                .sort({
                    counterNumber: 1
                });

        return res.status(200).json({
            counters
        });

    } catch (error) {
        console.error(
            "Get counters error:",
            error
        );

        return res.status(500).json({
            message: "Server error"
        });
    }
};


// ============================================================
// ASSIGN STAFF TO COUNTER
// ============================================================

const assignStaffToCounter = async (
    req,
    res
) => {
    try {
        const {
            staffId
        } = req.body;

        const {
            counterId
        } = req.params;

        if (!staffId) {
            return res.status(400).json({
                message:
                    "staffId is required"
            });
        }

        const counter =
            await Counter.findById(
                counterId
            );

        if (!counter) {
            return res.status(404).json({
                message:
                    "Counter not found"
            });
        }

        const organization =
            await Organization.findById(
                counter.organizationId
            );

        if (!organization) {
            return res.status(404).json({
                message:
                    "Organization not found"
            });
        }

        if (req.user.role !== "ADMIN") {
            if (
                organization.owner.toString() !==
                req.user.userId.toString()
            ) {
                return res.status(403).json({
                    message:
                        "You are not authorized for this organization"
                });
            }
        }

        // Verify staff exists
        const staff = await User.findById(staffId);
        if (!staff) {
            return res.status(404).json({
                message: "Staff user not found"
            });
        }

        // Verify staff belongs to this organization
        const membership =
            await OrganizationStaff.findOne({
                organizationId:
                    counter.organizationId,
                userId: staffId,
                role: "STAFF",
                status: "ACTIVE"
            });

        if (!membership) {
            return res.status(400).json({
                message:
                    "This user is not an active staff member of the organization"
            });
        }

        counter.assignedStaffId =
            staffId;

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

const updateCounterStatus = async (
    req,
    res
) => {
    try {
        const {
            status
        } = req.body;

        const {
            counterId
        } = req.params;

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

        const counter =
            await Counter.findById(
                counterId
            );

        if (!counter) {
            return res.status(404).json({
                message:
                    "Counter not found"
            });
        }

        const organization =
            await Organization.findById(
                counter.organizationId
            );

        if (!organization) {
            return res.status(404).json({
                message:
                    "Organization not found"
            });
        }

        if (req.user.role !== "ADMIN") {
            if (req.user.role === "STAFF") {
                // Already authorized via organizationAccessMiddleware
            } else if (
                organization.owner.toString() !==
                req.user.userId.toString()
            ) {
                return res.status(403).json({
                    message:
                        "You are not authorized for this organization"
                });
            }
        }

        counter.status =
            status;

        await counter.save();

        return res.status(200).json({
            message:
                "Counter status updated successfully",
            counter
        });

    } catch (error) {
        console.error(
            "Update counter status error:",
            error
        );

        return res.status(500).json({
            message: "Server error"
        });
    }
};


module.exports = {
    createCounter,
    getCountersByOrganization,
    assignStaffToCounter,
    updateCounterStatus
};