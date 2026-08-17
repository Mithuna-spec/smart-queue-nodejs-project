import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useOrg } from "../../hooks/useOrg";
import { getCountersByOrganization } from "../../api/counterApi";
import { getQueuesByOrganization } from "../../api/queueApi";
import StatCard from "../../components/StatCard";
import Button from "../../components/Button";
import Loader from "../../components/Loader";
import ErrorMessage from "../../components/ErrorMessage";
import { FiMonitor, FiLayers, FiUsers, FiArrowRight } from "react-icons/fi";

const StaffDashboard = () => {
    const { user } = useAuth();
    const { orgId, orgLoading, orgError } = useOrg();
    const [myCounter, setMyCounter] = useState(null);
    const [queueLength, setQueueLength] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!orgId) return;

        const loadStaffStats = async () => {
            setLoading(true);
            try {
                const [countersRes, queuesRes] = await Promise.all([
                    getCountersByOrganization(orgId),
                    getQueuesByOrganization(orgId)
                ]);

                const counters = countersRes.counters || [];
                const matched = counters.find(
                    c => c.assignedStaff === user._id || c.assignedStaff?._id === user._id || c.assignedStaff === user.id || c.assignedStaff?._id === user.id
                );
                setMyCounter(matched);

                if (matched) {
                    // Find queue for this counter's service
                    const queues = queuesRes.queues || [];
                    const q = queues.find(
                        queue => queue.serviceId === matched.serviceId || queue.serviceId?._id === matched.serviceId
                    );
                    
                    if (q) {
                        // Using MongoDB find/waiting list from local calculations
                        // or default length
                        setQueueLength(q.nextToken - 1);
                    }
                }
            } catch (err) {
                console.error(err);
                setError("Failed to fetch staff dashboard data.");
            } finally {
                setLoading(false);
            }
        };

        loadStaffStats();
    }, [orgId, user]);

    if (orgLoading || loading) return <Loader message="Resolving staff counter details..." />;
    if (orgError || error) return <ErrorMessage message={orgError || error} />;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-black text-[#F5F5F5] tracking-tight">Staff Portal</h1>
                <p className="text-sm text-[#A8A8A8] mt-1">Welcome back, {user?.name}. Operational stats for your counter.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Assigned Counter"
                    value={myCounter ? myCounter.name : "Unassigned"}
                    description={myCounter ? `Counter #${myCounter.counterNumber}` : "Contact organization owner"}
                    icon={<FiMonitor />}
                />

                <StatCard
                    title="Counter Status"
                    value={myCounter ? myCounter.status : "OFFLINE"}
                    description="Current status of your desk"
                    icon={<FiLayers className={myCounter?.status === "AVAILABLE" ? "text-emerald-400" : "text-[#BF1F1B]"} />}
                />

                <StatCard
                    title="Tokens Pending"
                    value={queueLength}
                    description="Users waiting in service queue"
                    icon={<FiUsers />}
                />
            </div>

            {myCounter ? (
                <div className="bg-[#292A2F] border border-[#35363B] p-6 rounded-xl flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                    <div>
                        <h3 className="text-[#F5F5F5] font-bold text-base">Service Desk Operational Panel</h3>
                        <p className="text-xs text-[#A8A8A8] mt-1">
                            Access queue calling features, start client service, complete consults, or skip tickets.
                        </p>
                    </div>
                    <Link to="/staff/my-counter">
                        <Button className="font-bold text-xs uppercase tracking-wider">
                            Go to desk panel <FiArrowRight className="ml-2" />
                        </Button>
                    </Link>
                </div>
            ) : (
                <div className="bg-[#BF1F1B]/10 border border-[#BF1F1B]/30 p-6 rounded-xl text-center max-w-md mx-auto">
                    <span className="text-3xl">⚠️</span>
                    <h3 className="text-[#F5F5F5] font-bold text-sm mt-3">Counter Assignment Required</h3>
                    <p className="text-xs text-[#A8A8A8] mt-1.5 leading-relaxed">
                        You have not been assigned to any counter yet. Please ask your Organization Administrator to allocate you a Service Counter.
                    </p>
                </div>
            )}
        </div>
    );
};

export default StaffDashboard;
