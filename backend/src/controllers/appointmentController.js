const Appointment = require("../models/Appointment");
const Organization = require("../models/Organization");
const Service = require("../models/Service");
const AppointmentSlot = require("../models/AppointmentSlot");
const Queue = require("../models/Queue");
const Token = require("../models/Token");


// ============================================================
// CREATE APPOINTMENT
// ============================================================

const createAppointment = async (req, res) => {
    try {
        const {
            organizationId,
            serviceId,
            appointmentSlotId,
            notes
        } = req.body;

        // --------------------------------------------------------
        // Validate required fields
        // --------------------------------------------------------

        if (
            !organizationId ||
            !serviceId ||
            !appointmentSlotId
        ) {
            return res.status(400).json({
                message:
                    "organizationId, serviceId and appointmentSlotId are required"
            });
        }

        // --------------------------------------------------------
        // Check organization
        // --------------------------------------------------------

        const organization = await Organization.findById(
            organizationId
        );

        if (!organization) {
            return res.status(404).json({
                message: "Organization not found"
            });
        }

        // --------------------------------------------------------
        // Check service
        // --------------------------------------------------------

        const service = await Service.findById(serviceId);

        if (!service) {
            return res.status(404).json({
                message: "Service not found"
            });
        }

        // Make sure service belongs to organization
        if (
            service.organizationId.toString() !==
            organizationId.toString()
        ) {
            return res.status(400).json({
                message:
                    "Service does not belong to this organization"
            });
        }

        // Check whether appointments are enabled
        if (!service.appointmentEnabled) {
            return res.status(400).json({
                message:
                    "Appointments are not available for this service"
            });
        }

        // --------------------------------------------------------
        // Find appointment slot
        // --------------------------------------------------------

        const slot = await AppointmentSlot.findById(
            appointmentSlotId
        );

        if (!slot) {
            return res.status(404).json({
                message: "Appointment slot not found"
            });
        }

        // Make sure slot belongs to the same organization/service
        if (
            slot.organizationId.toString() !==
                organizationId.toString() ||
            slot.serviceId.toString() !==
                serviceId.toString()
        ) {
            return res.status(400).json({
                message: "Invalid appointment slot"
            });
        }

        // --------------------------------------------------------
        // Check user's existing appointment
        // --------------------------------------------------------

        const existingAppointment =
            await Appointment.findOne({
                userId: req.user.userId,
                appointmentSlotId,
                status: {
                    $in: [
                        "BOOKED",
                        "CONFIRMED",
                        "CHECKED_IN"
                    ]
                }
            });

        if (existingAppointment) {
            return res.status(409).json({
                message:
                    "You already booked this slot"
            });
        }

        // --------------------------------------------------------
        // Atomically reserve one slot
        // --------------------------------------------------------

        const reservedSlot =
    await AppointmentSlot.findOneAndUpdate(
        {
            _id: appointmentSlotId,
            status: "AVAILABLE",
            $expr: {
                $lt: [
                    "$bookedCount",
                    "$capacity"
                ]
            }
        },
        {
            $inc: {
                bookedCount: 1
            }
        },
        {
            new: true
        }
    );

        if (!reservedSlot) {
    return res.status(409).json({
        message:
            "This appointment slot is full or unavailable"
    });
}

if (
    reservedSlot.bookedCount >=
    reservedSlot.capacity
) {
    reservedSlot.status = "FULL";

    await reservedSlot.save();
}

        // --------------------------------------------------------
        // Create appointment
        // --------------------------------------------------------

        let appointment;

        try {
            appointment =
                await Appointment.create({
                    userId: req.user.userId,
                    organizationId,
                    serviceId,
                    appointmentSlotId,

                    appointmentDate:
                        reservedSlot.date,

                    appointmentTime:
                        reservedSlot.startTime,

                    notes
                });
        } catch (error) {

            // Roll back slot reservation
            await AppointmentSlot.findOneAndUpdate(
                {
                    _id: appointmentSlotId,
                    bookedCount: {
                        $gt: 0
                    }
                },
                {
                    $inc: {
                        bookedCount: -1
                    },
                    $set: {
                        status: "AVAILABLE"
                    }
                }
            );

            // Duplicate booking
            if (error.code === 11000) {
                return res.status(409).json({
                    message:
                        "You already booked this slot"
                });
            }

            throw error;
        }

        // --------------------------------------------------------
        // Success response
        // --------------------------------------------------------

        return res.status(201).json({
            message:
                "Appointment booked successfully",

            appointment,

            slot: {
                id: reservedSlot._id,
                date: reservedSlot.date,
                startTime:
                    reservedSlot.startTime,
                endTime:
                    reservedSlot.endTime,
                capacity:
                    reservedSlot.capacity,
                bookedCount:
                    reservedSlot.bookedCount,
                status:
                    reservedSlot.status
            }
        });

    } catch (error) {
        console.error(
            "Create appointment error:",
            error
        );

        return res.status(500).json({
            message: "Server error"
        });
    }
};


// ============================================================
// GET MY APPOINTMENTS
// ============================================================

const getMyAppointments = async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.min(
            Math.max(parseInt(req.query.limit, 10) || 10, 1),
            100
        );
        const skip = (page - 1) * limit;

        const filter = {
            userId: req.user.userId
        };

        const [appointments, total] = await Promise.all([
            Appointment.find(filter)
                .populate("organizationId", "name category")
                .populate("serviceId", "name averageServiceTime")
                .populate(
                    "appointmentSlotId",
                    "date startTime endTime capacity bookedCount status"
                )
                .sort({
                    appointmentDate: 1,
                    appointmentTime: 1
                })
                .skip(skip)
                .limit(limit),
            Appointment.countDocuments(filter)
        ]);

        return res.status(200).json({
            appointments,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Get appointments error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};
;


// ============================================================
// CANCEL APPOINTMENT
// ============================================================

const cancelAppointment = async (req, res) => {
    try {
        const appointment =
            await Appointment.findById(
                req.params.id
            );

        if (!appointment) {
            return res.status(404).json({
                message: "Appointment not found"
            });
        }

        // Only appointment owner can cancel
        if (
            appointment.userId.toString() !==
            req.user.userId.toString()
        ) {
            return res.status(403).json({
                message:
                    "You can only cancel your own appointment"
            });
        }

        // Only active appointments can be cancelled
        if (
            ![
                "BOOKED",
                "CONFIRMED"
            ].includes(appointment.status)
        ) {
            return res.status(400).json({
                message:
                    "Appointment cannot be cancelled in its current state"
            });
        }

        // --------------------------------------------------------
        // Update appointment
        // --------------------------------------------------------

        appointment.status = "CANCELLED";

        await appointment.save();

        // --------------------------------------------------------
        // Restore slot capacity
        // --------------------------------------------------------

        const slot =
            await AppointmentSlot.findById(
                appointment.appointmentSlotId
            );

        if (slot) {

            if (slot.bookedCount > 0) {
                slot.bookedCount -= 1;
            }

            if (
                slot.bookedCount <
                slot.capacity
            ) {
                slot.status = "AVAILABLE";
            }

            await slot.save();
        }

        return res.status(200).json({
            message:
                "Appointment cancelled successfully",

            appointment,

            slot: slot
                ? {
                    id: slot._id,
                    capacity:
                        slot.capacity,
                    bookedCount:
                        slot.bookedCount,
                    status:
                        slot.status
                }
                : null
        });

    } catch (error) {
        console.error(
            "Cancel appointment error:",
            error
        );

        return res.status(500).json({
            message: "Server error"
        });
    }
};


// ============================================================
// GET ORGANIZATION APPOINTMENTS
// ============================================================

const getOrganizationAppointments = async (req, res) => {
    try {
        const { organizationId } = req.params;

        const mongoose = require("mongoose");
        if (!mongoose.Types.ObjectId.isValid(organizationId)) {
            return res.status(400).json({
                message: "Invalid Organization ID format"
            });
        }

        const organization = await Organization.findById(organizationId);

        if (!organization) {
            return res.status(404).json({
                message: "Organization not found"
            });
        }

        if (req.user.role === "ORGANIZATION") {
            if (organization.owner.toString() !== req.user.userId.toString()) {
                return res.status(403).json({
                    message: "You are not authorized for this organization"
                });
            }
        } else if (req.user.role === "STAFF") {
            const OrganizationStaff = require("../models/OrganizationStaff");
            const membership = await OrganizationStaff.findOne({
                organizationId,
                userId: req.user.userId,
                status: "ACTIVE"
            });
            if (!membership) {
                return res.status(403).json({
                    message: "You are not authorized for this organization"
                });
            }
        } else if (req.user.role !== "ADMIN") {
            return res.status(403).json({
                message: "You are not allowed to view these appointments"
            });
        }

        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.min(
            Math.max(parseInt(req.query.limit, 10) || 10, 1),
            100
        );
        const skip = (page - 1) * limit;

        const filter = { organizationId };

        const [appointments, total] = await Promise.all([
            Appointment.find(filter)
                .populate("userId", "name email phone")
                .populate("serviceId", "name averageServiceTime")
                .populate(
                    "appointmentSlotId",
                    "date startTime endTime capacity bookedCount status"
                )
                .sort({
                    appointmentDate: 1,
                    appointmentTime: 1
                })
                .skip(skip)
                .limit(limit),
            Appointment.countDocuments(filter)
        ]);

        return res.status(200).json({
            appointments,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error(
            "Get organization appointments error:",
            error
        );
        return res.status(500).json({
            message: "Server error"
        });
    }
};
;


// ============================================================
// CONFIRM APPOINTMENT
// ============================================================

const confirmAppointment = async (
    req,
    res
) => {
    try {
        const appointment =
            await Appointment.findById(
                req.params.id
            );

        if (!appointment) {
            return res.status(404).json({
                message:
                    "Appointment not found"
            });
        }

        const organization =
            await Organization.findById(
                appointment.organizationId
            );

        if (!organization) {
            return res.status(404).json({
                message:
                    "Organization not found"
            });
        }

        // ADMIN or organization owner
        if (
            organization.owner.toString() !==
                req.user.userId.toString() &&
            req.user.role !== "ADMIN"
        ) {
            return res.status(403).json({
                message:
                    "You are not allowed to confirm this appointment"
            });
        }

        if (
            appointment.status !== "BOOKED"
        ) {
            return res.status(400).json({
                message:
                    "Only booked appointments can be confirmed"
            });
        }

        appointment.status =
            "CONFIRMED";

        await appointment.save();

        return res.status(200).json({
            message:
                "Appointment confirmed successfully",
            appointment
        });

    } catch (error) {
        console.error(
            "Confirm appointment error:",
            error
        );

        return res.status(500).json({
            message: "Server error"
        });
    }
};


// ============================================================
// COMPLETE APPOINTMENT
// ============================================================

const completeAppointment = async (
    req,
    res
) => {
    try {
        const appointment =
            await Appointment.findById(
                req.params.id
            );

        if (!appointment) {
            return res.status(404).json({
                message:
                    "Appointment not found"
            });
        }

        const organization =
            await Organization.findById(
                appointment.organizationId
            );

        if (!organization) {
            return res.status(404).json({
                message:
                    "Organization not found"
            });
        }

        if (
            organization.owner.toString() !==
                req.user.userId.toString() &&
            req.user.role !== "ADMIN"
        ) {
            return res.status(403).json({
                message:
                    "You are not allowed to complete this appointment"
            });
        }

        if (
            ![
                "CONFIRMED",
                "CHECKED_IN"
            ].includes(appointment.status)
        ) {
            return res.status(400).json({
                message:
                    "Only confirmed or checked-in appointments can be completed"
            });
        }

        appointment.status =
            "COMPLETED";

        await appointment.save();

        return res.status(200).json({
            message:
                "Appointment completed successfully",
            appointment
        });

    } catch (error) {
        console.error(
            "Complete appointment error:",
            error
        );

        return res.status(500).json({
            message: "Server error"
        });
    }
};


// ============================================================
// CHECK-IN APPOINTMENT
// ============================================================

const checkInAppointment = async (
    req,
    res
) => {
    try {
        const appointment =
            await Appointment.findById(
                req.params.id
            );

        if (!appointment) {
            return res.status(404).json({
                message:
                    "Appointment not found"
            });
        }

        // Only appointment owner can check in
        if (
            appointment.userId.toString() !==
            req.user.userId.toString()
        ) {
            return res.status(403).json({
                message:
                    "You can only check in your own appointment"
            });
        }

        if (appointment.status === "CHECKED_IN") {
            return res.status(409).json({
                message: "Appointment is already checked in"
            });
        }

        if (
            appointment.status !==
            "CONFIRMED"
        ) {
            return res.status(400).json({
                message:
                    "Only confirmed appointments can be checked in"
            });
        }

        // --------------------------------------------------------
        // Find active queue
        // --------------------------------------------------------

        const queue =
            await Queue.findOne({
                organizationId:
                    appointment.organizationId,
                serviceId:
                    appointment.serviceId,
                status: "OPEN"
            });

        if (!queue) {
            return res.status(404).json({
                message:
                    "No active queue available for this service"
            });
        }

        // --------------------------------------------------------
        // Prevent duplicate queue entry for the same appointment
        // --------------------------------------------------------

        const existingTokenForAppointment = await Token.findOne({
            appointmentId: appointment._id,
            status: {
                $in: [
                    "WAITING",
                    "CALLED",
                    "IN_SERVICE"
                ]
            }
        });

        if (existingTokenForAppointment) {
            return res.status(409).json({
                message: "A token has already been created for this appointment",
                token: existingTokenForAppointment
            });
        }

        // Prevent duplicate queue entry for the user in general
        const existingToken =
            await Token.findOne({
                userId: req.user.userId,
                queueId: queue._id,
                status: {
                    $in: [
                        "WAITING",
                        "CALLED",
                        "IN_SERVICE"
                    ]
                }
            });

        if (existingToken) {
            return res.status(400).json({
                message:
                    "You are already in this queue",
                token: existingToken
            });
        }

        // --------------------------------------------------------
        // Generate token
        // --------------------------------------------------------

        const tokenNumber =
            queue.nextToken;

        const token =
            await Token.create({
                queueId: queue._id,
                userId: req.user.userId,
                tokenNumber,
                priority: appointment.priority || "NORMAL",
                appointmentId: appointment._id
            });

        queue.nextToken += 1;

        await queue.save();

        // --------------------------------------------------------
        // Update appointment
        // --------------------------------------------------------

        appointment.status =
            "CHECKED_IN";

        await appointment.save();

        return res.status(201).json({
            message:
                "Appointment checked in successfully",

            appointment: {
                id: appointment._id,
                status:
                    appointment.status
            },

            token: {
                id: token._id,
                tokenNumber:
                    token.tokenNumber,
                displayToken:
                    `Q${String(
                        token.tokenNumber
                    ).padStart(3, "0")}`,
                status:
                    token.status,
                priority:
                    token.priority,
                appointmentId:
                    token.appointmentId
            },

            queue: {
                id: queue._id,
                name: queue.name
            }
        });

    } catch (error) {
        console.error(
            "Check-in appointment error:",
            error
        );

        return res.status(500).json({
            message: "Server error"
        });
    }
};


// ============================================================
// EXPORTS
// ============================================================

module.exports = {
    createAppointment,
    getMyAppointments,
    cancelAppointment,
    getOrganizationAppointments,
    confirmAppointment,
    completeAppointment,
    checkInAppointment
};