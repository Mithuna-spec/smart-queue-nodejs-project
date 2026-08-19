const AppointmentSlot =
    require("../models/AppointmentSlot");

const Organization =
    require("../models/Organization");

const Service =
    require("../models/Service");


// ============================================================
// CREATE APPOINTMENT SLOT
// ============================================================

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

        if (
            !organizationId ||
            !serviceId ||
            !date ||
            !startTime ||
            !endTime
        ) {
            return res.status(400).json({
                message:
                    "organizationId, serviceId, date, startTime and endTime are required"
            });
        }

        const parsedCapacity =
            Number(capacity);

        if (
            !Number.isInteger(
                parsedCapacity
            ) ||
            parsedCapacity < 1
        ) {
            return res.status(400).json({
                message:
                    "Capacity must be a positive integer"
            });
        }

        const organization =
            await Organization.findById(
                organizationId
            );

        if (!organization) {
            return res.status(404).json({
                message:
                    "Organization not found"
            });
        }

        if (
            req.user.role !== "ADMIN" &&
            organization.owner.toString() !==
                req.user.userId.toString()
        ) {
            return res.status(403).json({
                message:
                    "You are not allowed to create slots"
            });
        }

        const service =
            await Service.findById(
                serviceId
            );

        if (!service) {
            return res.status(404).json({
                message:
                    "Service not found"
            });
        }

        if (
            service.organizationId.toString() !==
            organizationId.toString()
        ) {
            return res.status(400).json({
                message:
                    "Service does not belong to this organization"
            });
        }

        if (!service.appointmentEnabled) {
            return res.status(400).json({
                message:
                    "Appointments are not available for this service"
            });
        }

        const slotDate =
            new Date(date);

        if (
            Number.isNaN(
                slotDate.getTime()
            )
        ) {
            return res.status(400).json({
                message:
                    "Invalid appointment date"
            });
        }

        const today =
            new Date();

        today.setHours(
            0,
            0,
            0,
            0
        );

        slotDate.setHours(
            0,
            0,
            0,
            0
        );

        if (slotDate < today) {
            return res.status(400).json({
                message:
                    "Appointment date cannot be in the past"
            });
        }

        if (
            !/^\d{2}:\d{2}$/.test(
                startTime
            ) ||
            !/^\d{2}:\d{2}$/.test(
                endTime
            )
        ) {
            return res.status(400).json({
                message:
                    "Time must be in HH:MM format"
            });
        }

        if (
            startTime >= endTime
        ) {
            return res.status(400).json({
                message:
                    "End time must be after start time"
            });
        }

        const slot =
            await AppointmentSlot.create({
                organizationId,
                serviceId,
                date: slotDate,
                startTime,
                endTime,
                capacity: parsedCapacity
            });

        return res.status(201).json({
            message:
                "Appointment slot created successfully",
            slot
        });

    } catch (error) {

        console.error(
            "Create appointment slot error:",
            error
        );

        if (
            error.code === 11000
        ) {
            return res.status(409).json({
                message:
                    "This appointment slot already exists"
            });
        }

        return res.status(500).json({
            message:
                "Server error"
        });
    }
};


// ============================================================
// GET AVAILABLE SLOTS
// ============================================================

const getAvailableSlots = async (
    req,
    res
) => {
    try {
        const {
            serviceId,
            date
        } = req.query;

        if (
            !serviceId ||
            !date
        ) {
            return res.status(400).json({
                message:
                    "serviceId and date are required"
            });
        }

        const service =
            await Service.findById(
                serviceId
            );

        if (!service) {
            return res.status(404).json({
                message:
                    "Service not found"
            });
        }

        if (!service.appointmentEnabled) {
            return res.status(400).json({
                message:
                    "Appointments are not available for this service"
            });
        }

        const requestedDate =
            new Date(date);

        if (
            Number.isNaN(
                requestedDate.getTime()
            )
        ) {
            return res.status(400).json({
                message:
                    "Invalid date"
            });
        }

        requestedDate.setHours(
            0,
            0,
            0,
            0
        );

        const nextDate =
            new Date(
                requestedDate
            );

        nextDate.setDate(
            nextDate.getDate() + 1
        );

        const slots =
            await AppointmentSlot.find({
                serviceId,
                date: {
                    $gte: requestedDate,
                    $lt: nextDate
                },
                status: "AVAILABLE",
                $expr: {
                    $lt: [
                        "$bookedCount",
                        "$capacity"
                    ]
                }
            })
                .sort({
                    startTime: 1
                });

        return res.status(200).json({
            slots
        });

    } catch (error) {

        console.error(
            "Get available slots error:",
            error
        );

        return res.status(500).json({
            message:
                "Server error"
        });
    }
};


module.exports = {
    createSlot,
    getAvailableSlots
};