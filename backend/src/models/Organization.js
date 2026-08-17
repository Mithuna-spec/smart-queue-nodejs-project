const mongoose = require("mongoose");

const organizationSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            trim: true
        },

        category: {
            type: String,
            required: true,
            enum: [
                "HOSPITAL",
                "COLLEGE",
                "GOVERNMENT",
                "BANK",
                "SERVICE_CENTER",
                "OTHER"
            ]
        },

        address: {
            type: String,
            required: true,
            trim: true
        },

        location: {
            latitude: {
                type: Number
            },
            longitude: {
                type: Number
            }
        },

        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        status: {
            type: String,
            enum: ["ACTIVE", "INACTIVE"],
            default: "ACTIVE"
        }
    },
    {
        timestamps: true
    }
);

const Organization = mongoose.model(
    "Organization",
    organizationSchema
);

module.exports = Organization;