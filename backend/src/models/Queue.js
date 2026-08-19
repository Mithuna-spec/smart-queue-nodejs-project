const mongoose = require("mongoose");

const queueSchema = new mongoose.Schema(
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

        currentToken: {
            type: Number,
            default: 0
        },

        nextToken: {
            type: Number,
            default: 1
        },

        status: {
            type: String,
            enum: ["OPEN", "PAUSED", "CLOSED"],
            default: "OPEN"
        },

        date: {
            type: Date,
            default: Date.now
        },

        queuePolicy: {
            type: String,
            enum: ["FIFO", "PRIORITY"],
            default: "FIFO"
        },

        priorityOrder: {
            type: [String],
            enum: ["URGENT", "PRIORITY", "NORMAL"],
            default: ["URGENT", "PRIORITY", "NORMAL"]
        }


    },
    {
        timestamps: true
    }
);

queueSchema.index(
    {
        organizationId: 1,
        serviceId: 1,
        name: 1
    },
    {
        unique: true
    }
);

const Queue = mongoose.model("Queue", queueSchema);

module.exports = Queue;