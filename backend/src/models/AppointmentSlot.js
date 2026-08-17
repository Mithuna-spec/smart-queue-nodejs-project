const mongoose = require("mongoose");

const appointmentSlotSchema = new mongoose.Schema(
    {
        organizationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true
        },

        serviceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Service",
            required: true
        },

        date: {
            type: Date,
            required: true
        },

        startTime: {
            type: String,
            required: true
        },

        endTime: {
            type: String,
            required: true
        },

        capacity: {
            type: Number,
            default: 1,
            min: 1
        },

        bookedCount: {
            type: Number,
            default: 0
        },

        status: {
            type: String,
            enum: ["AVAILABLE", "FULL", "CLOSED"],
            default: "AVAILABLE"
        }
    },
    {
        timestamps: true
    }
);

appointmentSlotSchema.index(
    {
        serviceId: 1,
        date: 1,
        startTime: 1
    },
    {
        unique: true
    }
);

const AppointmentSlot = mongoose.model(
    "AppointmentSlot",
    appointmentSlotSchema
);

module.exports = AppointmentSlot;