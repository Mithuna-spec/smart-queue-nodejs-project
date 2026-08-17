import React, { useState, useEffect } from "react";
import { useOrg } from "../../hooks/useOrg";
import { getOrganizationAppointments, confirmAppointment, completeAppointment } from "../../api/appointmentApi";
import { createSlot } from "../../api/appointmentSlotApi";
import { getServicesByOrganization } from "../../api/serviceApi";
import Button from "../../components/Button";
import Table from "../../components/Table";
import Modal from "../../components/Modal";
import Input from "../../components/Input";
import Select from "../../components/Select";
import StatusBadge from "../../components/StatusBadge";
import Loader from "../../components/Loader";
import ErrorMessage from "../../components/ErrorMessage";
import { FiPlus, FiCalendar, FiCheck } from "react-icons/fi";

const OrgAppointments = () => {
    const { orgId } = useOrg();
    const [appointments, setAppointments] = useState([]);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Create Slot modal state
    const [slotOpen, setSlotOpen] = useState(false);
    const [serviceId, setServiceId] = useState("");
    const [date, setDate] = useState("");
    const [startTime, setStartTime] = useState("09:00");
    const [endTime, setEndTime] = useState("09:30");
    const [capacity, setCapacity] = useState(5);
    const [slotLoading, setSlotLoading] = useState(false);

    useEffect(() => {
        if (orgId) {
            fetchAppointmentsAndServices();
        }
    }, [orgId]);

    const fetchAppointmentsAndServices = async () => {
        setLoading(true);
        try {
            const [apptRes, servicesRes] = await Promise.all([
                getOrganizationAppointments(orgId),
                getServicesByOrganization(orgId)
            ]);
            setAppointments(apptRes.appointments || []);
            setServices(servicesRes.services || []);
        } catch (err) {
            console.error(err);
            setError("Failed to fetch appointments list.");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSlot = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        if (!serviceId || !date || !startTime || !endTime) return;

        setSlotLoading(true);
        try {
            await createSlot({
                organizationId: orgId,
                serviceId,
                date,
                startTime,
                endTime,
                capacity: Number(capacity)
            });
            setSuccess("Appointment slots created successfully.");
            setSlotOpen(false);
            setServiceId("");
            setDate("");
            setStartTime("09:00");
            setEndTime("09:30");
            setCapacity(5);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to create slots.");
        } finally {
            setSlotLoading(false);
        }
    };

    const handleConfirm = async (apptId) => {
        setError("");
        try {
            await confirmAppointment(apptId);
            setSuccess("Appointment confirmed successfully.");
            await fetchAppointmentsAndServices();
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to confirm appointment.");
        }
    };

    const handleComplete = async (apptId) => {
        setError("");
        try {
            await completeAppointment(apptId);
            setSuccess("Appointment marked completed.");
            await fetchAppointmentsAndServices();
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to complete appointment.");
        }
    };

    const getMinDate = () => {
        return new Date().toISOString().split("T")[0];
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-[#F5F5F5] tracking-tight">Appointments</h1>
                    <p className="text-sm text-[#A8A8A8] mt-1">Review bookings, confirm appointments, and generate time slots.</p>
                </div>
                <Button onClick={() => setSlotOpen(true)}>
                    <FiPlus className="mr-2" /> Create Time Slots
                </Button>
            </div>

            {error && <ErrorMessage message={error} />}
            {success && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg text-xs font-semibold select-none">
                    {success}
                </div>
            )}

            <Table 
                headers={["Customer", "Service", "Date / Time", "Status", "Actions"]} 
                loading={loading}
                emptyMessage="No appointments booked yet."
            >
                {appointments.map((appt) => {
                    const u = appt.userId || {};
                    const dateStr = appt.appointmentSlotId?.date 
                        ? new Date(appt.appointmentSlotId.date).toLocaleDateString()
                        : "-";
                    const timeStr = appt.appointmentSlotId 
                        ? `${appt.appointmentSlotId.startTime} - ${appt.appointmentSlotId.endTime}`
                        : "-";

                    return (
                        <tr key={appt._id} className="border-b border-[#35363B] text-sm text-[#F5F5F5] hover:bg-[#202126]/30">
                            <td className="px-6 py-4">
                                <div className="flex flex-col">
                                    <span className="font-bold">{u.name || "N/A"}</span>
                                    <span className="text-xs text-[#707176]">{u.email || "-"}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4 font-semibold text-[#A8A8A8]">
                                {appt.serviceId?.name || "Service"}
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex flex-col">
                                    <span className="font-medium">{dateStr}</span>
                                    <span className="text-xs text-[#707176]">{timeStr}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <StatusBadge status={appt.status} />
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center space-x-3">
                                    {appt.status === "BOOKED" && (
                                        <Button 
                                            variant="secondary" 
                                            size="sm" 
                                            onClick={() => handleConfirm(appt._id)}
                                        >
                                            <FiCheck className="mr-1" /> Confirm
                                        </Button>
                                    )}
                                    {appt.status === "CHECKED_IN" && (
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            onClick={() => handleComplete(appt._id)}
                                            className="border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10"
                                        >
                                            Complete
                                        </Button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    );
                })}
            </Table>

            {/* Create Slots Modal */}
            <Modal isOpen={slotOpen} onClose={() => setSlotOpen(false)} title="Create New Time Slots">
                <form onSubmit={handleCreateSlot} className="space-y-4">
                    <Select
                        label="Service"
                        value={serviceId}
                        onChange={(e) => setServiceId(e.target.value)}
                        placeholder="Select service..."
                        options={services.map(s => ({ value: s._id, label: s.name }))}
                        required
                        disabled={slotLoading}
                    />

                    <Input
                        label="Date"
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        min={getMinDate()}
                        required
                        disabled={slotLoading}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Start Time"
                            type="time"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            required
                            disabled={slotLoading}
                        />

                        <Input
                            label="End Time"
                            type="time"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            required
                            disabled={slotLoading}
                        />
                    </div>

                    <Input
                        label="Capacity (Max Books)"
                        type="number"
                        value={capacity}
                        onChange={(e) => setCapacity(e.target.value)}
                        required
                        disabled={slotLoading}
                    />

                    <div className="flex items-center justify-end space-x-3 pt-2">
                        <Button variant="outline" onClick={() => setSlotOpen(false)} disabled={slotLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={slotLoading}>
                            {slotLoading ? "Creating..." : "Create Slots"}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default OrgAppointments;
