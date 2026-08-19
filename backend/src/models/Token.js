const mongoose = require("mongoose");

const tokenSchema = new mongoose.Schema(
    {
        queueId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Queue",
            required: true
        },

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        tokenNumber: {
            type: Number,
            required: true
        },

        status: {
            type: String,
            enum: [
                "WAITING",
                "CALLED",
                "IN_SERVICE",
                "COMPLETED",
                "SKIPPED",
                "CANCELLED"
            ],
            default: "WAITING"
        },

        priority: {
            type: String,
            enum: ["NORMAL", "PRIORITY", "URGENT"],
            default: "NORMAL"
        },

        joinedAt: {
            type: Date,
            default: Date.now
        },

        calledAt: {
            type: Date
        },

        completedAt: {
            type: Date
        },
        startedAt: {
            type: Date
        },

        waitingTime: {
            type: Number,
            default: 0
        },

        serviceTime: {
            type: Number,
            default: 0
        },

        counterId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Counter",
            default: null
        },

        appointmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Appointment",
            default: null
        }
    },
    {
        timestamps: true
    }
);

tokenSchema.index(
    {
        queueId: 1,
        userId: 1
    },
    {
        unique: true,
        partialFilterExpression: {
            status: {
                $in: [
                    "WAITING",
                    "CALLED",
                    "IN_SERVICE"
                ]
            }
        }
    }
);
const Token = mongoose.model("Token", tokenSchema);

module.exports = Token;