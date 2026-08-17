const OrganizationStaff = require("../models/OrganizationStaff");
const Organization = require("../models/Organization");
const User = require("../models/User");


// ============================================================
// ADD STAFF TO ORGANIZATION
// ============================================================

const addStaff = async (req, res) => {
    try {
        const {
            organizationId,
            userId,
            role
        } = req.body;

        if (!organizationId || !userId) {
            return res.status(400).json({
                message:
                    "organizationId and userId are required"
            });
        }

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
        console.log("Organization owner:", organization.owner);
        console.log("JWT user ID:", req.user.userId);
        console.log("JWT role:", req.user.role);
        // Only organization owner or ADMIN
        if (
            organization.owner.toString() !==
                req.user.userId.toString() &&
            req.user.role !== "ADMIN"
        ) {
            return res.status(403).json({
                message:
                    "You are not allowed to add staff"
            });
        }

        const user =
            await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                message:
                    "User not found"
            });
        }

        if (user.role !== "STAFF") {
            return res.status(400).json({
                message:
                    "Only STAFF users can be added"
            });
        }

        const existing =
            await OrganizationStaff.findOne({
                organizationId,
                userId
            });

        if (existing) {
            return res.status(409).json({
                message:
                    "Staff member already belongs to this organization"
            });
        }

        const staff =
            await OrganizationStaff.create({
                organizationId,
                userId,
                role: role || "STAFF"
            });

        return res.status(201).json({
            message:
                "Staff added successfully",
            staff
        });

    } catch (error) {
        console.error(
            "Add staff error:",
            error
        );

        res.status(500).json({
            message: "Server error"
        });
    }
};


// ============================================================
// GET ORGANIZATION STAFF
// ============================================================

const getOrganizationStaff =
    async (req, res) => {
        try {
            const {
                organizationId
            } = req.params;

            const staff =
                await OrganizationStaff.find({
                    organizationId,
                    status: "ACTIVE"
                }).populate(
                    "userId",
                    "name email phone role"
                );

            return res.status(200).json({
                staff
            });

        } catch (error) {
            console.error(
                "Get staff error:",
                error
            );

            res.status(500).json({
                message: "Server error"
            });
        }
    };


// ============================================================
// REMOVE STAFF
// ============================================================

const removeStaff = async (req, res) => {
    try {
        const staff =
            await OrganizationStaff.findById(
                req.params.id
            );

        if (!staff) {
            return res.status(404).json({
                message:
                    "Staff membership not found"
            });
        }

        const organization =
            await Organization.findById(
                staff.organizationId
            );

        if (!organization) {
            return res.status(404).json({
                message:
                    "Organization not found"
            });
        }

        if (
            organization.owner.toString() !==
                req.user.userId.toString() &&
            req.user.role !== "ADMIN"
        ) {
            return res.status(403).json({
                message:
                    "You are not allowed to remove staff"
            });
        }

        staff.status = "INACTIVE";

        await staff.save();

        return res.status(200).json({
            message:
                "Staff removed successfully"
        });

    } catch (error) {
        console.error(
            "Remove staff error:",
            error
        );

        res.status(500).json({
            message: "Server error"
        });
    }
};


module.exports = {
    addStaff,
    getOrganizationStaff,
    removeStaff
};