const bcrypt = require("bcryptjs");

const OrganizationStaff =
    require("../models/OrganizationStaff");

const Organization =
    require("../models/Organization");

const User =
    require("../models/User");

const addStaff = async (req, res) => {
    try {
        const { organizationId } = req.params;

        const {
            name,
            email,
            phone,
            password
        } = req.body;

        if (!name || !email || !phone || !password) {
            return res.status(400).json({
                message:
                    "Name, email, phone and password are required"
            });
        }

        // ----------------------------------------------------
        // 1. Find organization
        // ----------------------------------------------------

        const organization =
            await Organization.findById(organizationId);

        if (!organization) {
            return res.status(404).json({
                message: "Organization not found"
            });
        }

        // ----------------------------------------------------
        // 2. Only the organization owner can create staff
        // ----------------------------------------------------

        if (
            organization.owner.toString() !==
            req.user.userId.toString()
        ) {
            return res.status(403).json({
                message:
                    "You are not allowed to create staff for this organization"
            });
        }

        // ----------------------------------------------------
        // 3. Normalize credentials
        // ----------------------------------------------------

        const normalizedEmail =
            email.trim().toLowerCase();

        const normalizedPhone =
            phone.trim();

        // ----------------------------------------------------
        // 4. Check email uniqueness
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
        // 5. Check phone uniqueness
        // ----------------------------------------------------



// ============================================================
// ADD STAFF TO ORGANIZATION
// ============================================================


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
        // 6. Hash password
        // ----------------------------------------------------

        const hashedPassword =
            await bcrypt.hash(password, 10);

        // ----------------------------------------------------
        // 7. Create Staff USER account
        // ----------------------------------------------------

        const staffUser =
            await User.create({
                name: name.trim(),
                email: normalizedEmail,
                password: hashedPassword,
                phone: normalizedPhone,
                role: "STAFF",
                status: "ACTIVE",
                createdBy: req.user.userId
            });

        try {
            // ------------------------------------------------
            // 8. Create organization-staff membership
            // ------------------------------------------------

            const staff =
                await OrganizationStaff.create({
                    organizationId,
                    userId: staffUser._id,
                    role: "STAFF",
                    status: "ACTIVE"
                });

            return res.status(201).json({
                message:
                    "Staff account created successfully",

                staff: {
                    id: staff._id,
                    userId: staffUser._id,
                    organizationId,
                    name: staffUser.name,
                    email: staffUser.email,
                    phone: staffUser.phone,
                    role: staffUser.role,
                    status: staffUser.status
                }
            });

        } catch (membershipError) {

            // If membership creation fails,
            // remove the newly created user.
            await User.findByIdAndDelete(
                staffUser._id
            );

            throw membershipError;
        }

    } catch (error) {
        console.error(
            "Create staff error:",
            error
        );

        if (error.code === 11000) {
            const duplicateField =
                Object.keys(
                    error.keyPattern || {}
                )[0];

            return res.status(409).json({
                message:
                    duplicateField === "phone"
                        ? "Mobile number is already registered"
                        : "Email is already registered"
            });
        }

        return res.status(500).json({
            message: "Server error"
        });
    }
};


// ============================================================
// GET ORGANIZATION STAFF
// ============================================================

const getOrganizationStaff = async (req, res) => {
    try {
        const { organizationId } = req.params;

        const organization = await Organization.findById(organizationId);

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
                message:
                    "You are not allowed to view this organization's staff"
            });
        }

        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.min(
            Math.max(parseInt(req.query.limit, 10) || 10, 1),
            100
        );
        const skip = (page - 1) * limit;

        const filter = {
            organizationId,
            status: "ACTIVE"
        };

        const [staff, total] = await Promise.all([
            OrganizationStaff.find(filter)
                .populate("userId", "name email phone role status")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            OrganizationStaff.countDocuments(filter)
        ]);

        return res.status(200).json({
            staff,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Get staff error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};
;


// ============================================================
// REMOVE STAFF
// ============================================================

const removeStaff = async (req, res) => {
    try {
        const {
            id
        } = req.params;

        const staff =
            await OrganizationStaff.findById(id);

        if (!staff) {
            return res.status(404).json({
                message: "Staff membership not found"
            });
        }

        if (req.user.role === "ORGANIZATION") {

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
                req.user.userId.toString()
            ) {
                return res.status(403).json({
                    message:
                        "You are not allowed to remove this staff member"
                });
            }
        }

        staff.status = "INACTIVE";

        await staff.save();

        // Also deactivate the Staff login account.
        await User.findByIdAndUpdate(
            staff.userId,
            {
                status: "INACTIVE"
            }
        );

        return res.status(200).json({
            message:
                "Staff account deactivated successfully"
        });

    } catch (error) {
        console.error(
            "Remove staff error:",
            error
        );

        return res.status(500).json({
            message: "Server error"
        });
    }
};

const getMyOrganization = async (req, res) => {
    try {
        const staff =
            await OrganizationStaff.findOne({
                userId: req.user.userId,
                status: "ACTIVE"
            }).populate(
                "organizationId"
            );

        if (!staff) {
            return res.status(404).json({
                message:
                    "Staff organization membership not found"
            });
        }

        return res.status(200).json({
            organization: staff.organizationId,
            membership: {
                id: staff._id,
                role: staff.role,
                status: staff.status,
                joinedAt: staff.joinedAt
            }
        });

    } catch (error) {
        console.error(
            "Get staff organization error:",
            error
        );

        return res.status(500).json({
            message: "Server error"
        });
    }
};


module.exports = {
    addStaff,
    getOrganizationStaff,
    getMyOrganization,
    removeStaff
};