import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getAssignedCounter } from "../../api/counterApi";
import { getQueueAnalytics } from "../../api/queueApi";
import StatCard from "../../components/StatCard";
import Button from "../../components/Button";
import Loader from "../../components/Loader";
import ErrorMessage from "../../components/ErrorMessage";
import { FiMonitor, FiLayers, FiUsers, FiArrowRight } from "react-icons/fi";

const StaffDashboard = () => {
    const { user } = useAuth();
    const [myCounter, setMyCounter] = useState(null);
    const [queueLength, setQueueLength] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        loadStaffStats();
    }, []);

    const loadStaffStats = async () => {
        setLoading(true);
        setError("");
        try {
            const data = await getAssignedCounter();
            setMyCounter(data.counter);
            
            if (data.queue) {
                try {
                    const analRes = await getQueueAnalytics(data.queue._id);
                    setQueueLength(analRes.statistics?.waiting || 0);
                } catch (analErr) {
                    console.error("Failed to load queue analytics:", analErr);
                    // Fallback to basic math
                    setQueueLength(Math.max(0, data.queue.nextToken - data.queue.currentToken - 1));
                }
            } else {
                setQueueLength(0);
            }
        } catch (err) {
            console.error(err);
            if (err.response?.status === 404) {
                // Not assigned is a valid empty state
                setMyCounter(null);
                setQueueLength(0);
            } else {
                setError(err.response?.data?.message || "Failed to fetch staff dashboard data.");
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Loader message="Resolving staff counter details..." />;
    if (error) return <ErrorMessage message={error} />;

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
