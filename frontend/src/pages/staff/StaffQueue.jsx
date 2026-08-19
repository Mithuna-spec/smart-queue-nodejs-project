import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { getAssignedCounter } from "../../api/counterApi";
import { getAssignedQueue } from "../../api/queueApi";
import { getOrganizationAppointments } from "../../api/appointmentApi";
import Loader from "../../components/Loader";
import ErrorMessage from "../../components/ErrorMessage";
import Table from "../../components/Table";
import StatusBadge from "../../components/StatusBadge";
import StatCard from "../../components/StatCard";
import { FiUsers, FiClock, FiActivity } from "react-icons/fi";

const StaffQueue = () => {
    const { user } = useAuth();
    
    const [counter, setCounter] = useState(null);
    const [queue, setQueue] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [appointments, setAppointments] = useState([]);
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        loadQueueLines();
    }, []);

    const loadQueueLines = async () => {
        setLoading(true);
        setError("");
        try {
            const data = await getAssignedCounter();
            if (data.counter) {
                setCounter(data.counter);
                setQueue(data.queue);
                
                const orgId = data.counter.organizationId?._id || data.counter.organizationId;
                
                // Concurrent fetch for assigned queue metrics & appointments
                const fetches = [];
                if (data.queue) {
                    fetches.push(getAssignedQueue());
                } else {
                    fetches.push(Promise.resolve(null));
                }
                fetches.push(getOrganizationAppointments(orgId, 1, 100));

                const [analRes, apptsRes] = await Promise.all(fetches);

                if (analRes) {
                    setAnalytics(analRes.statistics);
                }

                if (apptsRes) {
                    // Filter appointments of this organization that belong to this counter's service
                    // and are in CHECKED_IN or CONFIRMED state (active wait line)
                    const activeAppts = (apptsRes.appointments || []).filter(
                        appt => (appt.serviceId?._id === data.counter.serviceId?._id || appt.serviceId === data.counter.serviceId?._id) &&
                                ["CONFIRMED", "CHECKED_IN"].includes(appt.status)
                    );
                    setAppointments(activeAppts);
                }
            }
        } catch (err) {
            console.error(err);
            if (err.response?.status === 404) {
                setCounter(null);
                setQueue(null);
            } else {
                setError(err.response?.data?.message || "Failed to fetch queue wait lines.");
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Loader message="Fetching queue wait lines..." />;
    if (error) return <ErrorMessage message={error} />;

    if (!counter || !queue) {
        return (
            <div className="bg-[#292A2F] border border-[#35363B] rounded-xl p-8 text-center max-w-md mx-auto my-12">
                <span className="text-4xl">⚠️</span>
                <h3 className="text-[#F5F5F5] font-bold text-lg mt-3">Queue Details Unavailable</h3>
                <p className="text-xs text-[#A8A8A8] mt-2 leading-relaxed">
                    You must be assigned to a counter with an active service queue to monitor customer lines.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-black text-[#F5F5F5] tracking-tight">{queue.name} waitline</h1>
                <p className="text-sm text-[#A8A8A8] mt-1">Real-time status of customers waiting for service.</p>
            </div>

            {/* Quick Metrics */}
            {analytics && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard
                        title="Waiting in Line"
                        value={analytics.waiting || 0}
                        description="Customers with WAITING status"
                        icon={<FiUsers className="text-[#ED9663]" />}
                    />
                    <StatCard
                        title="Called Desk"
                        value={analytics.called || 0}
                        description="Active called tokens"
                        icon={<FiActivity className="text-[#DC423E]" />}
                    />
                    <StatCard
                        title="Avg Wait Time"
                        value={`${analytics.averageWaitingTime || 0} min`}
                        description="Average wait pace"
                        icon={<FiClock className="text-[#EFB477]" />}
                    />
                </div>
            )}

            {/* Appointments Wait Line */}
            <div className="space-y-4">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-[#A8A8A8] select-none">
                    Checked-In Customers (Wait Line)
                </h2>

                <Table 
                    headers={["Customer", "Appt Time", "Status"]}
                    loading={loading}
                    emptyMessage="No checked-in customers in this service queue."
                >
                    {appointments.map((appt) => {
                        const u = appt.userId || {};
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
                                    {timeStr}
                                </td>
                                <td className="px-6 py-4">
                                    <StatusBadge status={appt.status} />
                                </td>
                            </tr>
                        );
                    })}
                </Table>
            </div>
        </div>
    );
};

export default StaffQueue;
