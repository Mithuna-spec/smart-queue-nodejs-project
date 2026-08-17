const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

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

        appointmentDate: {
            type: Date,
            required: true
        },

        appointmentTime: {
            type: String,
            required: true
        },

        status: {
            type: String,
            enum: [
                "BOOKED",
                "CONFIRMED",
                "CHECKED_IN",
                "COMPLETED",
                "CANCELLED",
                "MISSED"
            ],
            default: "BOOKED"
        },

        notes: {
            type: String,
            trim: true
        },
        appointmentSlotId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AppointmentSlot",
            required: true
        }
    },
    {
        timestamps: true
    }
);
appointmentSchema.index(
    {
        userId: 1,
        appointmentSlotId: 1
    },
    {
        unique: true,
        partialFilterExpression: {
            status: {
                $in: ["BOOKED", "CONFIRMED", "CHECKED_IN"]
            }
        }
    }
);

const Appointment = mongoose.model(
    "Appointment",
    appointmentSchema
);

module.exports = Appointment;