const bcrypt = require("bcryptjs");
const User = require("../models/User");
const jwt = require("jsonwebtoken");

const register = async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            phone
        } = req.body;

        if (!name || !email || !password || !phone) {
            return res.status(400).json({
                message: "Name, email, password and phone are required"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const normalizedPhone = phone.trim();

        const existingEmail = await User.findOne({
            email: normalizedEmail
        });

        if (existingEmail) {
            return res.status(409).json({
                message: "Email is already registered"
            });
        }

        const existingPhone = await User.findOne({
            phone: normalizedPhone
        });

        if (existingPhone) {
            return res.status(409).json({
                message: "Mobile number is already registered"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            phone: normalizedPhone,

            // IMPORTANT:
            // Public registration can ONLY create USER.
            role: "USER",

            status: "ACTIVE",
            createdBy: null
        });

        return res.status(201).json({
            message: "User registered successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                status: user.status
            }
        });

    } catch (error) {
        console.error("User registration error:", error);

        // MongoDB duplicate-key protection
        if (error.code === 11000) {
            const duplicateField = Object.keys(
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


const login = async (req, res) => {
    try {
        const {
            email,
            password,
            role
        } = req.body;

        if (!email || !password || !role) {
            return res.status(400).json({
                message: "Email, password and role are required"
            });
        }

        const allowedRoles = [
            "ADMIN",
            "ORGANIZATION",
            "STAFF",
            "USER"
        ];

        if (!allowedRoles.includes(role)) {
            return res.status(400).json({
                message: "Invalid role"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const user = await User.findOne({
            email: normalizedEmail
        });

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        if (user.status !== "ACTIVE") {
            return res.status(403).json({
                message: "Account is inactive"
            });
        }

        const isPasswordCorrect = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordCorrect) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        // The selected login role MUST match the actual database role.
        if (user.role !== role) {
            return res.status(403).json({
                message: "Selected role does not match this account"
            });
        }

        const token = jwt.sign(
            {
                userId: user._id.toString(),
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        return res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                status: user.status
            }
        });

    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            message: "Server error"
        });
    }
};
const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId)
            .select("_id name email phone role status createdAt updatedAt");

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        return res.status(200).json({
            user
        });

    } catch (error) {
        console.error("Get current user error:", error);

        return res.status(500).json({
            message: "Server error"
        });
    }
};

module.exports = {
    register,
    login,
    getMe
};