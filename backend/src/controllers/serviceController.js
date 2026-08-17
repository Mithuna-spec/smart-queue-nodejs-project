const Service = require("../models/Service");
const Organization = require("../models/Organization");

const createService = async (req, res) => {
    try {
        const {
            name,
            description,
            organizationId,
            averageServiceTime,
            appointmentEnabled,
            queueEnabled,
            priorityEnabled
        } = req.body;

        // Check organization exists
        const organization = await Organization.findById(organizationId);

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
                message: "You are not allowed to add services to this organization"
            });
        }

        // Create service
        const service = await Service.create({
            name,
            description,
            organizationId,
            averageServiceTime,
            appointmentEnabled,
            queueEnabled,
            priorityEnabled
        });

        res.status(201).json({
            message: "Service created successfully",
            service
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

const getServicesByOrganization = async (req, res) => {
    try {
        const { organizationId } = req.params;

        const organization = await Organization.findById(organizationId);

        if (!organization) {
            return res.status(404).json({
                message: "Organization not found"
            });
        }

        const services = await Service.find({
            organizationId,
            status: "ACTIVE"
        });

        res.status(200).json({
            organization: organization.name,
            services
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};
const getServiceById = async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);

        if (!service) {
            return res.status(404).json({
                message: "Service not found"
            });
        }

        res.status(200).json({
            service
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};
const updateService = async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);

        if (!service) {
            return res.status(404).json({
                message: "Service not found"
            });
        }

        const organization = await Organization.findById(
            service.organizationId
        );

        if (!organization) {
            return res.status(404).json({
                message: "Organization not found"
            });
        }

        // Only ADMIN or organization owner can update
        if (
            organization.owner.toString() !== req.user.userId &&
            req.user.role !== "ADMIN"
        ) {
            return res.status(403).json({
                message: "You are not allowed to update this service"
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

        service.name = name ?? service.name;
        service.description = description ?? service.description;
        service.averageServiceTime =
            averageServiceTime ?? service.averageServiceTime;
        service.appointmentEnabled =
            appointmentEnabled ?? service.appointmentEnabled;
        service.queueEnabled =
            queueEnabled ?? service.queueEnabled;
        service.priorityEnabled =
            priorityEnabled ?? service.priorityEnabled;
        service.status = status ?? service.status;

        await service.save();

        res.status(200).json({
            message: "Service updated successfully",
            service
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};
const deleteService = async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);

        if (!service) {
            return res.status(404).json({
                message: "Service not found"
            });
        }

        const organization = await Organization.findById(
            service.organizationId
        );

        if (!organization) {
            return res.status(404).json({
                message: "Organization not found"
            });
        }

        // Only ADMIN or organization owner can delete
        if (
            organization.owner.toString() !== req.user.userId &&
            req.user.role !== "ADMIN"
        ) {
            return res.status(403).json({
                message: "You are not allowed to delete this service"
            });
        }

        await Service.findByIdAndDelete(req.params.id);

        res.status(200).json({
            message: "Service deleted successfully"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

module.exports = {
    createService,
    getServicesByOrganization,
    getServiceById,
    updateService,
    deleteService
};