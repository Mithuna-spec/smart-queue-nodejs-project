import React, { useState, useEffect } from "react";
import { useOrg } from "../../hooks/useOrg";
import { getServicesByOrganization } from "../../api/serviceApi";
import { getOrganizationStaff } from "../../api/organizationStaffApi";
import { getCountersByOrganization } from "../../api/counterApi";
import { getQueuesByOrganization, getQueueAnalytics } from "../../api/queueApi";
import { getOrganizationAppointments } from "../../api/appointmentApi";
import StatCard from "../../components/StatCard";
import Loader from "../../components/Loader";
import ErrorMessage from "../../components/ErrorMessage";
import { 
    FiBriefcase, 
    FiUsers, 
    FiMonitor, 
    FiLayers, 
    FiClock, 
    FiCheckSquare,
    FiActivity
} from "react-icons/fi";

const OrgDashboard = () => {
    const { orgId, orgName, loading: orgLoading, error: orgError } = useOrg();
    
    // Counts
    const [stats, setStats] = useState({
        servicesCount: 0,
        staffCount: 0,
        countersCount: 0,
        activeQueues: 0,
        waitingUsers: 0,
        appointmentsCount: 0,
        completedTokens: 0
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!orgId) return;

        const loadStats = async () => {
            setLoading(true);
            try {
                const [
                    servicesRes,
                    staffRes,
                    countersRes,
                    queuesRes,
                    apptRes
                ] = await Promise.all([
                    getServicesByOrganization(orgId),
                    getOrganizationStaff(orgId),
                    getCountersByOrganization(orgId),
                    getQueuesByOrganization(orgId),
                    getOrganizationAppointments(orgId)
                ]);

                const activeQueuesList = queuesRes.queues || [];
                
                // Fetch analytics for each queue to aggregate waiting and completed counts
                let waiting = 0;
                let completed = 0;
                
                for (const queue of activeQueuesList) {
                    try {
                        const analRes = await getQueueAnalytics(queue._id);
                        if (analRes.analytics) {
                            waiting += analRes.analytics.waiting || 0;
                            completed += analRes.analytics.completed || 0;
                        }
                    } catch (err) {
                        console.error(`Could not load analytics for queue ${queue._id}`, err);
                    }
                }

                setStats({
                    servicesCount: (servicesRes.services || []).length,
                    staffCount: (staffRes.staff || []).length,
                    countersCount: (countersRes.counters || []).length,
                    activeQueues: activeQueuesList.length,
                    waitingUsers: waiting,
                    appointmentsCount: (apptRes.appointments || []).length,
                    completedTokens: completed
                });
            } catch (err) {
                console.error(err);
                setError("Failed to fetch dashboard statistics.");
            } finally {
                setLoading(false);
            }
        };

        loadStats();
    }, [orgId]);

    if (orgLoading) {
        return <Loader message="Resolving organization identity..." fullPage />;
    }

    if (orgError) {
        return <ErrorMessage message={orgError} />;
    }

    if (!orgId) {
        return (
            <div className="bg-[#292A2F] border border-[#35363B] rounded-xl p-8 text-center max-w-md mx-auto my-12">
                <span className="text-4xl">🏢</span>
                <h3 className="text-[#F5F5F5] font-bold text-lg mt-3">No Organization Found</h3>
                <p className="text-xs text-[#A8A8A8] mt-2">
                    Please contact an administrator to register your user account under an organization profile.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-black text-[#F5F5F5] tracking-tight">{orgName} Dashboard</h1>
                <p className="text-sm text-[#A8A8A8] mt-1">Overview of your queue metrics and system operations.</p>
            </div>

            {error && <ErrorMessage message={error} />}

            {loading ? (
                <Loader message="Aggregating metrics..." />
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard 
                        title="Services" 
                        value={stats.servicesCount} 
                        icon={<FiBriefcase />} 
                        description="Created business services" 
                    />
                    <StatCard 
                        title="Staff Members" 
                        value={stats.staffCount} 
                        icon={<FiUsers />} 
                        description="Active staff registry" 
                    />
                    <StatCard 
                        title="Counters" 
                        value={stats.countersCount} 
                        icon={<FiMonitor />} 
                        description="Configured counters" 
                    />
                    <StatCard 
                        title="Active Queues" 
                        value={stats.activeQueues} 
                        icon={<FiLayers />} 
                        description="Running waitlines" 
                    />
                    <StatCard 
                        title="Waiting Users" 
                        value={stats.waitingUsers} 
                        icon={<FiClock className="text-[#ED9663]" />} 
                        description="Customers in waiting line" 
                    />
                    <StatCard 
                        title="Today's Appointments" 
                        value={stats.appointmentsCount} 
                        icon={<FiCalendar className="text-[#EFB477]" />} 
                        description="Total booked slots" 
                    />
                    <StatCard 
                        title="Completed Tickets" 
                        value={stats.completedTokens} 
                        icon={<FiCheckSquare className="text-emerald-400" />} 
                        description="Total clients served today" 
                    />
                </div>
            )}
        </div>
    );
};

// Simple stub to resolve linting
const FiCalendar = (props) => (
    <span {...props} style={{ display: "inline-flex" }}>📅</span>
);

export default OrgDashboard;
