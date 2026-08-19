const mongoose = require("mongoose");

const counterSchema = new mongoose.Schema(
    {
        organizationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
            index: true
        },

        serviceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Service",
            required: true,
            index: true
        },

        name: {
            type: String,
            required: true,
            trim: true
        },

        counterNumber: {
            type: Number,
            required: true
        },

        assignedStaffId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        status: {
            type: String,
            enum: [
                "AVAILABLE",
                "BUSY",
                "OFFLINE"
            ],
            default: "AVAILABLE"
        }
    },
    {
        timestamps: true
    }
);

counterSchema.index(
    {
        organizationId: 1,
        counterNumber: 1
    },
    {
        unique: true
    }
);
counterSchema.index({
    organizationId: 1,
    assignedStaffId: 1
});

const Counter = mongoose.model(
    "Counter",
    counterSchema
);

module.exports = Counter;