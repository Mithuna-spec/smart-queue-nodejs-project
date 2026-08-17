const mongoose = require("mongoose");

const organizationStaffSchema = new mongoose.Schema(
    {
        organizationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true
        },

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        role: {
            type: String,
            enum: ["STAFF", "MANAGER"],
            default: "STAFF"
        },

        status: {
            type: String,
            enum: ["ACTIVE", "INACTIVE"],
            default: "ACTIVE"
        },

        joinedAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

organizationStaffSchema.index(
    {
        organizationId: 1,
        userId: 1
    },
    {
        unique: true
    }
);

const OrganizationStaff =
    mongoose.model(
        "OrganizationStaff",
        organizationStaffSchema
    );

module.exports = OrganizationStaff;