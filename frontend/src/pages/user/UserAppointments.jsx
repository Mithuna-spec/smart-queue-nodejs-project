import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAvailableOrganizations } from "../../api/organizationApi";
import { getAvailableServices } from "../../api/serviceApi";
import { getAvailableSlots } from "../../api/appointmentSlotApi";
import { createAppointment, getMyAppointments, cancelAppointment, checkInAppointment } from "../../api/appointmentApi";
import Button from "../../components/Button";
import Card from "../../components/Card";
import Select from "../../components/Select";
import Input from "../../components/Input";
import Loader from "../../components/Loader";
import ErrorMessage from "../../components/ErrorMessage";
import EmptyState from "../../components/EmptyState";
import StatusBadge from "../../components/StatusBadge";
import Table from "../../components/Table";
import Pagination from "../../components/Pagination";
import { FiClock, FiCalendar, FiPlus } from "react-icons/fi";

const UserAppointments = () => {
    const navigate = useNavigate();
    const [organizations, setOrganizations] = useState([]);
    const [selectedOrg, setSelectedOrg] = useState("");
    const [services, setServices] = useState([]);
    const [selectedService, setSelectedService] = useState("");
    const [selectedDate, setSelectedDate] = useState("");
    
    // Slots and Booking
    const [slots, setSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState("");
    const [notes, setNotes] = useState("");
    
    // Lists and Pagination
    const [appointments, setAppointments] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    
    const [loading, setLoading] = useState(false);
    const [listLoading, setListLoading] = useState(false);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Load orgs & user appointments
    useEffect(() => {
        const init = async () => {
            setListLoading(true);
            try {
                const orgData = await getAvailableOrganizations();
                setOrganizations(orgData.organizations || []);
                await fetchMyAppointments(page);
            } catch (err) {
                console.error(err);
                setError("Failed to fetch active organization configurations.");
            } finally {
                setListLoading(false);
            }
        };
        init();
    }, [page]);

    const fetchMyAppointments = async (targetPage) => {
        try {
            const data = await getMyAppointments(targetPage, 5);
            setAppointments(data.appointments || []);
            setPage(data.pagination?.page || 1);
            setTotalPages(data.pagination?.totalPages || 1);
            setTotalRecords(data.pagination?.total || 0);
        } catch (err) {
            console.error("Failed to load appointments:", err);
        }
    };

    // Load services when org changes
    useEffect(() => {
        if (!selectedOrg) {
            setServices([]);
            setSelectedService("");
            return;
        }
        const fetchServices = async () => {
            try {
                const data = await getAvailableServices(selectedOrg);
                setServices(data.services || []);
                setSelectedService("");
                setSlots([]);
            } catch (err) {
                console.error(err);
            }
        };
        fetchServices();
    }, [selectedOrg]);

    // Load slots when service/date change
    useEffect(() => {
        if (!selectedService || !selectedDate) {
            setSlots([]);
            setSelectedSlot("");
            return;
        }
        const fetchSlots = async () => {
            try {
                const data = await getAvailableSlots(selectedService, selectedDate);
                setSlots(data.slots || []);
                setSelectedSlot("");
            } catch (err) {
                console.error(err);
                setError("Failed to fetch available slots.");
            }
        };
        fetchSlots();
    }, [selectedService, selectedDate]);

    const handleBook = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        if (!selectedSlot) return;

        setBookingLoading(true);
        try {
            await createAppointment({
                organizationId: selectedOrg,
                serviceId: selectedService,
                appointmentSlotId: selectedSlot,
                notes
            });
            setSuccess("Appointment booked successfully! Waiting for organization confirmation.");
            setNotes("");
            setSelectedSlot("");
            // Refresh slots and appointments list
            const slotRes = await getAvailableSlots(selectedService, selectedDate);
            setSlots(slotRes.slots || []);
            await fetchMyAppointments(1);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to book appointment.");
        } finally {
            setBookingLoading(false);
        }
    };

    const handleCancel = async (id) => {
        if (!window.confirm("Are you sure you want to cancel this appointment?")) return;
        setError("");
        try {
            await cancelAppointment(id);
            setSuccess("Appointment cancelled successfully.");
            await fetchMyAppointments(page);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to cancel appointment.");
        }
    };

    const handleCheckIn = async (id) => {
        setError("");
        try {
            const data = await checkInAppointment(id);
            setSuccess(`Checked in! Ticket Q${String(data.token.tokenNumber).padStart(3, "0")} created.`);
            localStorage.setItem("activeTokenId", data.token.id || data.token._id);
            // Redirect to User Dashboard to view live token card
            setTimeout(() => {
                navigate("/user/my-queue");
            }, 1500);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Check-in failed. Ensure your appointment is confirmed and today is the slot date.");
        }
    };

    const getMinDate = () => {
        return new Date().toISOString().split("T")[0];
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-black text-[#F5F5F5] tracking-tight">Appointments</h1>
                <p className="text-sm text-[#A8A8A8] mt-1">Book slots and check in on confirmation to join the queue.</p>
            </div>

            {error && <ErrorMessage message={error} />}
            {success && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-lg text-xs font-semibold select-none text-center">
                    {success}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Book Slot Column */}
                <div className="lg:col-span-1 space-y-6">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-[#A8A8A8] select-none">
                        Book Appointment
                    </h2>

                    <form onSubmit={handleBook} className="bg-[#292A2F] border border-[#35363B] p-6 rounded-xl space-y-4">
                        <Select
                            label="Organization"
                            value={selectedOrg}
                            onChange={(e) => setSelectedOrg(e.target.value)}
                            placeholder="Select organization..."
                            options={organizations.map(o => ({ value: o._id, label: o.name }))}
                            disabled={bookingLoading}
                            required
                        />

                        <Select
                            label="Service"
                            value={selectedService}
                            onChange={(e) => setSelectedService(e.target.value)}
                            placeholder="Select service..."
                            options={services.map(s => ({ value: s._id, label: s.name }))}
                            disabled={bookingLoading || !selectedOrg}
                            required
                        />

                        <Input
                            label="Date"
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            min={getMinDate()}
                            disabled={bookingLoading || !selectedService}
                            required
                        />

                        {selectedDate && slots.length === 0 && (
                            <p className="text-xs text-[#ED9663]">No available slots for selected date.</p>
                        )}

                        {slots.length > 0 && (
                            <Select
                                label="Time Slot"
                                value={selectedSlot}
                                onChange={(e) => setSelectedSlot(e.target.value)}
                                placeholder="Choose a time slot..."
                                options={slots.map(s => ({ 
                                    value: s._id, 
                                    label: `${s.startTime} - ${s.endTime} (${s.capacity - s.bookedCount} left)` 
                                }))}
                                disabled={bookingLoading}
                                required
                            />
                        )}

                        <Input
                            label="Notes (Optional)"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Reason for visit..."
                            disabled={bookingLoading}
                        />

                        <Button 
                            type="submit" 
                            className="w-full font-bold mt-2" 
                            disabled={bookingLoading || !selectedSlot}
                        >
                            {bookingLoading ? "Booking..." : "Book Appointment"}
                        </Button>
                    </form>
                </div>

                {/* My Bookings List */}
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-[#A8A8A8] select-none">
                        My Bookings
                    </h2>

                    <div className="space-y-4">
                        <Table 
                            headers={["Service", "Date / Time", "Status", "Actions"]} 
                            loading={listLoading}
                            emptyMessage="You have no appointments booked."
                        >
                            {appointments.map((appt) => {
                                const dateStr = appt.appointmentSlotId?.date 
                                    ? new Date(appt.appointmentSlotId.date).toLocaleDateString()
                                    : "-";
                                const timeStr = appt.appointmentSlotId 
                                    ? `${appt.appointmentSlotId.startTime} - ${appt.appointmentSlotId.endTime}`
                                    : "-";

                                return (
                                    <tr key={appt._id} className="border-b border-[#35363B] text-sm text-[#F5F5F5] hover:bg-[#202126]/30">
                                        <td className="px-6 py-4 font-semibold">{appt.serviceId?.name || "Service"}</td>
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
                                                {appt.status === "CONFIRMED" && (
                                                    <Button 
                                                        variant="secondary" 
                                                        size="sm" 
                                                        onClick={() => handleCheckIn(appt._id)}
                                                    >
                                                        Check In
                                                    </Button>
                                                )}
                                                {["BOOKED", "CONFIRMED"].includes(appt.status) && (
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm" 
                                                        onClick={() => handleCancel(appt._id)}
                                                        className="border-red-500/10 hover:bg-[#BF1F1B]/10 hover:text-[#BF1F1B]"
                                                    >
                                                        Cancel
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </Table>

                        <Pagination 
                            currentPage={page}
                            totalPages={totalPages}
                            totalRecords={totalRecords}
                            onPageChange={(p) => setPage(p)}
                            limit={5}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserAppointments;
