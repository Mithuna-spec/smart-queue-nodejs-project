const Organization = require("../models/Organization");

const createOrganization = async (req, res) => {
    try {
        const {
            name,
            description,
            category,
            address,
            location
        } = req.body;

        const organization = await Organization.create({
            name,
            description,
            category,
            address,
            location,
            owner: req.user.userId
        });

        res.status(201).json({
            message: "Organization created successfully",
            organization
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

const getOrganizations = async (req, res) => {
    try {
        const organizations = await Organization.find({
            status: "ACTIVE"
        });

        res.status(200).json({
            organizations
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

const getOrganizationById = async (req, res) => {
    try {
        const organization = await Organization.findById(req.params.id);

        if (!organization) {
            return res.status(404).json({
                message: "Organization not found"
            });
        }

        res.status(200).json({
            organization
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

const updateOrganization = async (req, res) => {
    try {
        const organization = await Organization.findById(req.params.id);

        if (!organization) {
            return res.status(404).json({
                message: "Organization not found"
            });
        }

        // Only the owner or admin can update
        if (
            organization.owner.toString() !== req.user.userId &&
            req.user.role !== "ADMIN"
        ) {
            return res.status(403).json({
                message: "You are not allowed to update this organization"
            });
        }

        const {
            name,
            description,
            category,
            address,
            location,
            status
        } = req.body;

        organization.name = name ?? organization.name;
        organization.description = description ?? organization.description;
        organization.category = category ?? organization.category;
        organization.address = address ?? organization.address;
        organization.location = location ?? organization.location;
        organization.status = status ?? organization.status;

        await organization.save();

        res.status(200).json({
            message: "Organization updated successfully",
            organization
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};
const deleteOrganization = async (req, res) => {
    try {
        const organization = await Organization.findById(req.params.id);

        if (!organization) {
            return res.status(404).json({
                message: "Organization not found"
            });
        }

        if (
            organization.owner.toString() !== req.user.userId &&
            req.user.role !== "ADMIN"
        ) {
            return res.status(403).json({
                message: "You are not allowed to delete this organization"
            });
        }

        await Organization.findByIdAndDelete(req.params.id);

        res.status(200).json({
            message: "Organization deleted successfully"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

module.exports = {
    createOrganization,
    getOrganizations,
    getOrganizationById,
    updateOrganization,
    deleteOrganization
};