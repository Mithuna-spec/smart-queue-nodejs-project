const Service = require("../models/Service");
const Organization = require("../models/Organization");


// ============================================================
// CREATE SERVICE
// ORGANIZATION ONLY
// ============================================================

const createService = async (req, res) => {
    try {
        const {
            name,
            description,
            averageServiceTime,
            appointmentEnabled,
            queueEnabled,
            priorityEnabled
        } = req.body;

        // ----------------------------------------------------
        // Validate service name
        // ----------------------------------------------------

        if (!name || !name.trim()) {
            return res.status(400).json({
                message: "Service name is required"
            });
        }

        // ----------------------------------------------------
        // Validate average service time
        // ----------------------------------------------------

        if (
            typeof averageServiceTime !== "number" ||
            averageServiceTime < 1
        ) {
            return res.status(400).json({
                message:
                    "Average service time must be at least 1 minute"
            });
        }

        // ----------------------------------------------------
        // Find organization from logged-in account
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
        // Check duplicate service name
        // ----------------------------------------------------

        const existingService =
            await Service.findOne({
                organizationId:
                    organization._id,
                name: name.trim()
            });

        if (existingService) {
            return res.status(409).json({
                message:
                    "Service already exists in this organization"
            });
        }

        // ----------------------------------------------------
        // Create service
        // ----------------------------------------------------

        const service =
            await Service.create({
                name: name.trim(),

                description:
                    description || "",

                organizationId:
                    organization._id,

                averageServiceTime,

                appointmentEnabled:
                    appointmentEnabled ?? true,

                queueEnabled:
                    queueEnabled ?? true,

                priorityEnabled:
                    priorityEnabled ?? false,

                status: "ACTIVE"
            });

        return res.status(201).json({
            message:
                "Service created successfully",

            service
        });

    } catch (error) {

        console.error(
            "Create service error:",
            error
        );

        // Handle unique organization + service name index
        if (error.code === 11000) {
            return res.status(409).json({
                message:
                    "Service already exists in this organization"
            });
        }

        return res.status(500).json({
            message: "Server error"
        });
    }
};


// ============================================================
// GET SERVICES BY ORGANIZATION
// TEMPORARY VERSION
// Pagination will be added in Step 26.
// ============================================================

const getServicesByOrganization = async (req, res) => {
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
                    "You are not allowed to view services of this organization"
            });
        }

        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.min(
            Math.max(parseInt(req.query.limit, 10) || 10, 1),
            100
        );
        const skip = (page - 1) * limit;

        const filter = {
            organizationId: organization._id,
            status: "ACTIVE"
        };

        const [services, total] = await Promise.all([
            Service.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Service.countDocuments(filter)
        ]);

        return res.status(200).json({
            organization: organization.name,
            services,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Get services error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};
;


// ============================================================
// GET SERVICE BY ID
// ============================================================

const getServiceById = async (req, res) => {

    try {

        const service =
            await Service.findById(
                req.params.id
            );

        if (!service) {
            return res.status(404).json({
                message:
                    "Service not found"
            });
        }

        return res.status(200).json({
            service
        });

    } catch (error) {

        console.error(
            "Get service error:",
            error
        );

        return res.status(500).json({
            message: "Server error"
        });
    }
};


// ============================================================
// UPDATE SERVICE
// ORGANIZATION → OWN ORGANIZATION ONLY
// ============================================================

const updateService = async (req, res) => {

    try {

        const service =
            await Service.findById(
                req.params.id
            );

        if (!service) {
            return res.status(404).json({
                message:
                    "Service not found"
            });
        }

        // ----------------------------------------------------
        // Find organization owned by logged-in account
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
        // Organization isolation
        // ----------------------------------------------------

        if (
            service.organizationId.toString() !==
            organization._id.toString()
        ) {
            return res.status(403).json({
                message:
                    "You are not allowed to update this service"
            });
        }

        const {
            name,
            description,
            averageServiceTime,
            appointmentEnabled,
            queueEnabled,
            priorityEnabled,
            status
        } = req.body;

        // ----------------------------------------------------
        // Validate name
        // ----------------------------------------------------

        if (
            name !== undefined &&
            !name.trim()
        ) {
            return res.status(400).json({
                message:
                    "Service name cannot be empty"
            });
        }

        // ----------------------------------------------------
        // Validate average service time
        // ----------------------------------------------------

        if (
            averageServiceTime !== undefined &&
            (
                typeof averageServiceTime !== "number" ||
                averageServiceTime < 1
            )
        ) {
            return res.status(400).json({
                message:
                    "Average service time must be at least 1 minute"
            });
        }

        // ----------------------------------------------------
        // Check duplicate name
        // ----------------------------------------------------

        if (name !== undefined) {

            const existingService =
                await Service.findOne({
                    organizationId:
                        organization._id,

                    name: name.trim(),

                    _id: {
                        $ne: service._id
                    }
                });

            if (existingService) {
                return res.status(409).json({
                    message:
                        "Another service with this name already exists"
                });
            }
        }

        // ----------------------------------------------------
        // Update allowed fields
        // ----------------------------------------------------

        if (name !== undefined) {
            service.name =
                name.trim();
        }

        if (description !== undefined) {
            service.description =
                description;
        }

        if (
            averageServiceTime !== undefined
        ) {
            service.averageServiceTime =
                averageServiceTime;
        }

        if (
            appointmentEnabled !== undefined
        ) {
            service.appointmentEnabled =
                appointmentEnabled;
        }

        if (
            queueEnabled !== undefined
        ) {
            service.queueEnabled =
                queueEnabled;
        }

        if (
            priorityEnabled !== undefined
        ) {
            service.priorityEnabled =
                priorityEnabled;
        }

        if (status !== undefined) {

            if (
                ![
                    "ACTIVE",
                    "INACTIVE"
                ].includes(status)
            ) {
                return res.status(400).json({
                    message:
                        "Invalid service status"
                });
            }

            service.status = status;
        }

        await service.save();

        return res.status(200).json({
            message:
                "Service updated successfully",

            service
        });

    } catch (error) {

        console.error(
            "Update service error:",
            error
        );

        if (error.code === 11000) {
            return res.status(409).json({
                message:
                    "Another service with this name already exists"
            });
        }

        return res.status(500).json({
            message: "Server error"
        });
    }
};


// ============================================================
// DELETE SERVICE
// ORGANIZATION → OWN ORGANIZATION ONLY
//
// NOTE:
// We keep the function because your existing frontend may
// already use this endpoint.
// It performs a soft delete by setting INACTIVE.
// ============================================================

const deleteService = async (req, res) => {

    try {

        const service =
            await Service.findById(
                req.params.id
            );

        if (!service) {
            return res.status(404).json({
                message:
                    "Service not found"
            });
        }

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
            service.organizationId.toString() !==
            organization._id.toString()
        ) {
            return res.status(403).json({
                message:
                    "You are not allowed to delete this service"
            });
        }

        service.status = "INACTIVE";

        await service.save();

        return res.status(200).json({
            message:
                "Service deactivated successfully",

            service
        });

    } catch (error) {

        console.error(
            "Delete service error:",
            error
        );

        return res.status(500).json({
            message: "Server error"
        });
    }
};

// ============================================================
// GET AVAILABLE SERVICES FOR USERS
// ============================================================

const getAvailableServices = async (req, res) => {
    try {
        const { organizationId } = req.params;

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

        const services =
            await Service.find({
                organizationId,
                status: "ACTIVE"
            })
                .select(
                    "name description averageServiceTime appointmentEnabled queueEnabled priorityEnabled"
                )
                .sort({
                    name: 1
                });

        return res.status(200).json({
            organization: {
                id: organization._id,
                name: organization.name
            },
            services
        });

    } catch (error) {
        console.error(
            "Get available services error:",
            error
        );

        return res.status(500).json({
            message: "Server error"
        });
    }
};
module.exports = {
    createService,
    getServicesByOrganization,
    getAvailableServices,
    getServiceById,
    updateService,
    deleteService
};