import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useOrg } from "../../hooks/useOrg";
import { getCountersByOrganization } from "../../api/counterApi";
import { getQueuesByOrganization, getQueueAnalytics } from "../../api/queueApi";
import { getOrganizationAppointments } from "../../api/appointmentApi";
import Loader from "../../components/Loader";
import ErrorMessage from "../../components/ErrorMessage";
import Table from "../../components/Table";
import StatusBadge from "../../components/StatusBadge";
import StatCard from "../../components/StatCard";
import { FiUsers, FiClock, FiActivity } from "react-icons/fi";

const StaffQueue = () => {
    const { user } = useAuth();
    const { orgId, orgLoading, orgError } = useOrg();
    
    const [counter, setCounter] = useState(null);
    const [queue, setQueue] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [appointments, setAppointments] = useState([]);
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (orgId) {
            loadQueueLines();
        }
    }, [orgId]);

    const loadQueueLines = async () => {
        setLoading(true);
        setError("");
        try {
            const [countersRes, queuesRes, apptsRes] = await Promise.all([
                getCountersByOrganization(orgId),
                getQueuesByOrganization(orgId),
                getOrganizationAppointments(orgId)
            ]);

            const counters = countersRes.counters || [];
            const matchedCounter = counters.find(
                c => c.assignedStaff === user._id || c.assignedStaff?._id === user._id || c.assignedStaff === user.id || c.assignedStaff?._id === user.id
            );
            
            if (matchedCounter) {
                setCounter(matchedCounter);
                
                const queues = queuesRes.queues || [];
                const matchedQueue = queues.find(
                    q => q.serviceId === matchedCounter.serviceId || q.serviceId?._id === matchedCounter.serviceId
                );
                
                if (matchedQueue) {
                    setQueue(matchedQueue);
                    // Fetch queue stats
                    const analRes = await getQueueAnalytics(matchedQueue._id);
                    setAnalytics(analRes.analytics);
                }

                // Filter appointments of this organization that belong to this counter's service
                // and are in CHECKED_IN or CONFIRMED state (active wait line)
                const activeAppts = (apptsRes.appointments || []).filter(
                    appt => (appt.serviceId?._id === matchedCounter.serviceId || appt.serviceId === matchedCounter.serviceId) &&
                            ["CONFIRMED", "CHECKED_IN"].includes(appt.status)
                );
                setAppointments(activeAppts);
            }
        } catch (err) {
            console.error(err);
            setError("Failed to fetch queue wait lines.");
        } finally {
            setLoading(false);
        }
    };

    if (orgLoading || loading) return <Loader message="Fetching queue wait lines..." />;
    if (orgError || error) return <ErrorMessage message={orgError || error} />;

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
                        value={analytics.waiting}
                        description="Customers with WAITING status"
                        icon={<FiUsers className="text-[#ED9663]" />}
                    />
                    <StatCard
                        title="Called Desk"
                        value={analytics.called}
                        description="Active called tokens"
                        icon={<FiActivity className="text-[#DC423E]" />}
                    />
                    <StatCard
                        title="Avg Wait Time"
                        value={`${analytics.averageWaitingTime} min`}
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
