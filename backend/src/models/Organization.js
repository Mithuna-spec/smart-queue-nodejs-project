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
            trim: true,
            default: ""
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
                type: Number,
                required: true,
                min: -90,
                max: 90
            },

            longitude: {
                type: Number,
                required: true,
                min: -180,
                max: 180
            }
        },

        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true
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


const Organization =
    mongoose.model(
        "Organization",
        organizationSchema
    );

module.exports = Organization;