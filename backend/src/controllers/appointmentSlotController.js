const AppointmentSlot = require("../models/AppointmentSlot");
const Organization = require("../models/Organization");

const createSlot = async (req, res) => {
    try {
        const {
            organizationId,
            serviceId,
            date,
            startTime,
            endTime,
            capacity
        } = req.body;

        const organization = await Organization.findById(
            organizationId
        );

        if (!organization) {
            return res.status(404).json({
                message: "Organization not found"
            });
        }

        if (
            organization.owner.toString() !== req.user.userId &&
            req.user.role !== "ADMIN"
        ) {
            return res.status(403).json({
                message: "You are not allowed to create slots"
            });
        }

        const slot = await AppointmentSlot.create({
            organizationId,
            serviceId,
            date,
            startTime,
            endTime,
            capacity
        });

        res.status(201).json({
            message: "Appointment slot created successfully",
            slot
        });

    } catch (error) {
        console.error(error);

        if (error.code === 11000) {
            return res.status(409).json({
                message: "This slot already exists"
            });
        }

        res.status(500).json({
            message: "Server error"
        });
    }
};

const getAvailableSlots = async (req, res) => {
    try {
        const {
            serviceId,
            date
        } = req.query;

        const slots = await AppointmentSlot.find({
            serviceId,
            date: new Date(date),
            status: "AVAILABLE",
            $expr: {
                $lt: ["$bookedCount", "$capacity"]
            }
        }).sort({
            startTime: 1
        });

        res.status(200).json({
            slots
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

module.exports = {
    createSlot,
    getAvailableSlots
};