const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema(
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

        organizationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true
        },

        averageServiceTime: {
            type: Number,
            required: true,
            min: 1
        },

        appointmentEnabled: {
            type: Boolean,
            default: true
        },

        queueEnabled: {
            type: Boolean,
            default: true
        },

        priorityEnabled: {
            type: Boolean,
            default: false
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

const Service = mongoose.model("Service", serviceSchema);

module.exports = Service;