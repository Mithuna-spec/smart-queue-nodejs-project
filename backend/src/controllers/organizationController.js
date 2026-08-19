const bcrypt = require("bcryptjs");
const Organization = require("../models/Organization");
const User = require("../models/User");

// ============================================================
// CREATE ORGANIZATION
// ADMIN ONLY
// Creates:
// 1. Organization User account
// 2. Organization profile
// ============================================================

const createOrganization = async (req, res) => {
    let organizationUser = null;

    try {
        const {
            name,
            description,
            category,
            address,
            location,
            account
        } = req.body;

        // ----------------------------------------------------
        // Validate organization details
        // ----------------------------------------------------

        if (
            !name ||
            !category ||
            !address ||
            !location ||
            !account
        ) {
            return res.status(400).json({
                message:
                    "Organization details and account details are required"
            });
        }

        // ----------------------------------------------------
        // Validate organization account
        // ----------------------------------------------------

        const {
            name: accountName,
            email,
            phone,
            password
        } = account;

        if (
            !accountName ||
            !email ||
            !phone ||
            !password
        ) {
            return res.status(400).json({
                message:
                    "Organization account details are required"
            });
        }

        // ----------------------------------------------------
        // Validate location
        // ----------------------------------------------------

        if (
            typeof location.latitude !== "number" ||
            typeof location.longitude !== "number"
        ) {
            return res.status(400).json({
                message:
                    "Valid latitude and longitude are required"
            });
        }

        if (
            location.latitude < -90 ||
            location.latitude > 90 ||
            location.longitude < -180 ||
            location.longitude > 180
        ) {
            return res.status(400).json({
                message:
                    "Invalid location coordinates"
            });
        }

        // ----------------------------------------------------
        // Normalize credentials
        // ----------------------------------------------------

        const normalizedEmail =
            email.trim().toLowerCase();

        const normalizedPhone =
            phone.trim();

        // ----------------------------------------------------
        // Check email uniqueness
        // ----------------------------------------------------

        const existingEmail =
            await User.findOne({
                email: normalizedEmail
            });

        if (existingEmail) {
            return res.status(409).json({
                message:
                    "Email is already registered"
            });
        }

        // ----------------------------------------------------
        // Check phone uniqueness
        // ----------------------------------------------------

        const existingPhone =
            await User.findOne({
                phone: normalizedPhone
            });

        if (existingPhone) {
            return res.status(409).json({
                message:
                    "Mobile number is already registered"
            });
        }

        // ----------------------------------------------------
        // Hash password
        // ----------------------------------------------------

        const hashedPassword =
            await bcrypt.hash(password, 10);

        // ----------------------------------------------------
        // Create ORGANIZATION user
        // ----------------------------------------------------

        organizationUser =
            await User.create({
                name: accountName.trim(),
                email: normalizedEmail,
                password: hashedPassword,
                phone: normalizedPhone,
                role: "ORGANIZATION",
                status: "ACTIVE",
                createdBy: req.user.userId
            });

        // ----------------------------------------------------
        // Create ORGANIZATION profile
        // ----------------------------------------------------

        const organization =
            await Organization.create({
                name: name.trim(),
                description: description || "",
                category,
                address: address.trim(),
                location,
                owner: organizationUser._id,
                status: "ACTIVE"
            });

        // ----------------------------------------------------
        // Success
        // ----------------------------------------------------

        return res.status(201).json({
            message:
                "Organization registered successfully",

            organization,

            account: {
                id: organizationUser._id,
                name: organizationUser.name,
                email: organizationUser.email,
                phone: organizationUser.phone,
                role: organizationUser.role
            }
        });

    } catch (error) {

        console.error(
            "Create organization error:",
            error
        );

        // ----------------------------------------------------
        // Roll back organization USER if organization
        // creation failed after the user was created.
        // ----------------------------------------------------

        if (organizationUser) {
            try {
                await User.findByIdAndDelete(
                    organizationUser._id
                );
            } catch (cleanupError) {
                console.error(
                    "Failed to clean up organization user:",
                    cleanupError
                );
            }
        }

        // ----------------------------------------------------
        // Duplicate key
        // ----------------------------------------------------

        if (error.code === 11000) {
            const duplicateField =
                Object.keys(
                    error.keyPattern || {}
                )[0];

            return res.status(409).json({
                message:
                    duplicateField === "phone"
                        ? "Mobile number is already registered"
                        : duplicateField === "email"
                        ? "Email is already registered"
                        : "Organization already exists"
            });
        }

        return res.status(500).json({
            message: "Server error"
        });
    }
};


// ============================================================
// GET ALL ORGANIZATIONS
// ADMIN ONLY
// ============================================================

const getOrganizations = async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.min(
            Math.max(parseInt(req.query.limit, 10) || 10, 1),
            100
        );
        const skip = (page - 1) * limit;

        const filter = { status: "ACTIVE" };

        const [organizations, total] = await Promise.all([
            Organization.find(filter)
                .populate("owner", "name email phone role")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Organization.countDocuments(filter)
        ]);

        return res.status(200).json({
            organizations,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Get organizations error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};
;


// ============================================================
// GET ORGANIZATION BY ID
// ADMIN → ANY ORGANIZATION
// ORGANIZATION → OWN ORGANIZATION ONLY
// ============================================================

const getOrganizationById =
    async (req, res) => {

        try {

            const organization =
                await Organization.findById(
                    req.params.id
                ).populate(
                    "owner",
                    "name email phone role"
                );

            if (!organization) {
                return res.status(404).json({
                    message:
                        "Organization not found"
                });
            }

            // ------------------------------------------------
            // ADMIN can view any organization
            // ------------------------------------------------

            if (req.user.role === "ADMIN") {

                return res.status(200).json({
                    organization
                });
            }

            // ------------------------------------------------
            // ORGANIZATION can view only itself
            // ------------------------------------------------

            if (
                req.user.role === "ORGANIZATION" &&
                organization.owner._id.toString() !==
                    req.user.userId.toString()
            ) {

                return res.status(403).json({
                    message:
                        "You are not allowed to view this organization"
                });
            }

            return res.status(200).json({
                organization
            });

        } catch (error) {

            console.error(
                "Get organization error:",
                error
            );

            return res.status(500).json({
                message: "Server error"
            });
        }
    };


// ============================================================
// GET MY ORGANIZATION
// ORGANIZATION ONLY
// ============================================================

const getMyOrganization = async (req, res) => {

    try {

        const organization =
            await Organization.findOne({
                owner: req.user.userId,
                status: "ACTIVE"
            }).populate(
                "owner",
                "name email phone role"
            );

        if (!organization) {
            return res.status(404).json({
                message:
                    "Organization profile not found"
            });
        }

        return res.status(200).json({
            organization
        });

    } catch (error) {

        console.error(
            "Get my organization error:",
            error
        );

        return res.status(500).json({
            message: "Server error"
        });
    }
};


// ============================================================
// UPDATE ORGANIZATION
// ORGANIZATION → OWN ORGANIZATION ONLY
// ============================================================

const updateOrganization = async (req, res) => {

    try {

        const organization =
            await Organization.findById(
                req.params.id
            );

        if (!organization) {
            return res.status(404).json({
                message:
                    "Organization not found"
            });
        }

        // ------------------------------------------------
        // Organization can update only its own profile
        // ------------------------------------------------

        if (
            req.user.role !== "ORGANIZATION" ||
            organization.owner.toString() !==
                req.user.userId.toString()
        ) {

            return res.status(403).json({
                message:
                    "You are not allowed to update this organization"
            });
        }

        const {
            name,
            description,
            category,
            address,
            location
        } = req.body;

        // ------------------------------------------------
        // Update allowed fields
        // ------------------------------------------------

        if (name !== undefined) {
            organization.name =
                name.trim();
        }

        if (description !== undefined) {
            organization.description =
                description;
        }

        if (category !== undefined) {
            organization.category =
                category;
        }

        if (address !== undefined) {
            organization.address =
                address.trim();
        }

        // ------------------------------------------------
        // Validate and update location
        // ------------------------------------------------

        if (location !== undefined) {

            if (
                typeof location.latitude !== "number" ||
                typeof location.longitude !== "number"
            ) {

                return res.status(400).json({
                    message:
                        "Invalid location coordinates"
                });
            }

            if (
                location.latitude < -90 ||
                location.latitude > 90 ||
                location.longitude < -180 ||
                location.longitude > 180
            ) {

                return res.status(400).json({
                    message:
                        "Invalid location coordinates"
                });
            }

            organization.location =
                location;
        }

        // ------------------------------------------------
        // owner/status are intentionally NOT editable here
        // ------------------------------------------------

        await organization.save();

        return res.status(200).json({
            message:
                "Organization updated successfully",

            organization
        });

    } catch (error) {

        console.error(
            "Update organization error:",
            error
        );

        return res.status(500).json({
            message: "Server error"
        });
    }
};


// ============================================================
// DELETE ORGANIZATION
// ADMIN ONLY AT ROUTE LEVEL
// ============================================================

const deleteOrganization = async (req, res) => {

    try {

        const organization =
            await Organization.findById(
                req.params.id
            );

        if (!organization) {
            return res.status(404).json({
                message:
                    "Organization not found"
            });
        }

        // ------------------------------------------------
        // Only ADMIN should reach this controller
        // ------------------------------------------------

        if (req.user.role !== "ADMIN") {

            return res.status(403).json({
                message:
                    "You are not allowed to delete this organization"
            });
        }

        await Organization.findByIdAndDelete(
            req.params.id
        );

        return res.status(200).json({
            message:
                "Organization deleted successfully"
        });

    } catch (error) {

        console.error(
            "Delete organization error:",
            error
        );

        return res.status(500).json({
            message: "Server error"
        });
    }
};

// ============================================================
// GET ACTIVE ORGANIZATIONS FOR USERS
// PUBLIC / USER
// ============================================================

const getAvailableOrganizations = async (req, res) => {
    try {
        const organizations =
            await Organization.find({
                status: "ACTIVE"
            })
                .select(
                    "name description category address location"
                )
                .sort({
                    name: 1
                });

        return res.status(200).json({
            organizations
        });

    } catch (error) {

        console.error(
            "Get available organizations error:",
            error
        );

        return res.status(500).json({
            message: "Server error"
        });
    }
};
// ============================================================
// EXPORTS
// ============================================================

module.exports = {
    createOrganization,
    getOrganizations,
    getAvailableOrganizations,
    getOrganizationById,
    getMyOrganization,
    updateOrganization,
    deleteOrganization
};