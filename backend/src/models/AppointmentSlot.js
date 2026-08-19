const mongoose = require("mongoose");

const appointmentSlotSchema = new mongoose.Schema(
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

        date: {
            type: Date,
            required: true,
            index: true
        },

        startTime: {
            type: String,
            required: true,
            trim: true
        },

        endTime: {
            type: String,
            required: true,
            trim: true
        },

        capacity: {
            type: Number,
            required: true,
            min: 1,
            default: 1
        },

        bookedCount: {
            type: Number,
            min: 0,
            default: 0
        },

        status: {
            type: String,
            enum: [
                "AVAILABLE",
                "FULL",
                "CLOSED"
            ],
            default: "AVAILABLE",
            index: true
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

const AppointmentSlot =
    mongoose.model(
        "AppointmentSlot",
        appointmentSlotSchema
    );

module.exports = AppointmentSlot;