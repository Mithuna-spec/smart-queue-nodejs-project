import React, { useState, useEffect } from "react";
import { getOrganizations } from "../../api/organizationApi";
import { getQueuesByOrganization, getQueueAnalytics } from "../../api/queueApi";
import Button from "../../components/Button";
import Loader from "../../components/Loader";
import ErrorMessage from "../../components/ErrorMessage";
import Select from "../../components/Select";
import StatCard from "../../components/StatCard";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { FiUsers, FiClock, FiActivity, FiRefreshCw } from "react-icons/fi";

const AdminAnalytics = () => {
    const [organizations, setOrganizations] = useState([]);
    const [selectedOrg, setSelectedOrg] = useState("");
    const [loadingOrgs, setLoadingOrgs] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    
    const [aggregated, setAggregated] = useState({
        total: 0,
        waiting: 0,
        called: 0,
        inService: 0,
        completed: 0,
        cancelled: 0,
        skipped: 0
    });

    const [chartData, setChartData] = useState([]);
    const [performanceData, setPerformanceData] = useState([]);

    useEffect(() => {
        fetchOrgs();
    }, []);

    const fetchOrgs = async () => {
        setLoadingOrgs(true);
        setError("");
        try {
            const data = await getOrganizations();
            setOrganizations(data.organizations || []);
        } catch (err) {
            console.error(err);
            setError("Failed to fetch organizations.");
        } finally {
            setLoadingOrgs(false);
        }
    };

    const fetchAnalytics = async (orgId) => {
        if (!orgId) {
            setAggregated({ total: 0, waiting: 0, called: 0, inService: 0, completed: 0, cancelled: 0, skipped: 0 });
            setChartData([]);
            setPerformanceData([]);
            return;
        }

        setLoading(true);
        setError("");
        try {
            const queuesRes = await getQueuesByOrganization(orgId);
            const queuesList = queuesRes.queues || [];

            let total = 0, waiting = 0, called = 0, inService = 0, completed = 0, cancelled = 0, skipped = 0;
            const perf = [];

            for (const queue of queuesList) {
                try {
                    const res = await getQueueAnalytics(queue._id);
                    if (res.analytics) {
                        const a = res.analytics;
                        total += a.total || 0;
                        waiting += a.waiting || 0;
                        called += a.called || 0;
                        inService += a.inService || 0;
                        completed += a.completed || 0;
                        cancelled += a.cancelled || 0;
                        skipped += a.skipped || 0;

                        perf.push({
                            name: queue.name,
                            "Avg Wait Time (m)": a.averageWaitingTime || 0,
                            "Avg Service Time (m)": a.averageServiceTime || 0
                        });
                    }
                } catch (err) {
                    console.error(err);
                }
            }

            setAggregated({ total, waiting, called, inService, completed, cancelled, skipped });
            setPerformanceData(perf);

            // Pie chart status distribution
            setChartData([
                { name: "Waiting", value: waiting, color: "#ED9663" },
                { name: "Called", value: called, color: "#DC423E" },
                { name: "In Service", value: inService, color: "#EFB477" },
                { name: "Completed", value: completed, color: "#10B981" }, // Restrained success green
                { name: "Cancelled", value: cancelled, color: "#BF1F1B" },
                { name: "Skipped", value: skipped, color: "#707176" }
            ].filter(d => d.value > 0)); // Only show statuses with values

        } catch (err) {
            console.error(err);
            setError("Failed to fetch organization queue analytics.");
        } finally {
            setLoading(false);
        }
    };

    const handleOrgChange = (e) => {
        const orgId = e.target.value;
        setSelectedOrg(orgId);
        fetchAnalytics(orgId);
    };

    const RADIAN = Math.PI / 185;
    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        return (
            <text x={x} y={y} fill="#F5F5F5" textAnchor={x > cx ? "start" : "end"} dominantBaseline="central" className="text-xs font-bold">
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                <div>
                    <h1 className="text-2xl font-black text-[#F5F5F5] tracking-tight">System Analytics</h1>
                    <p className="text-sm text-[#A8A8A8] mt-1">Audit customer traffic, average wait times, and ticket completions.</p>
                </div>
                {selectedOrg && (
                    <Button variant="outline" onClick={() => fetchAnalytics(selectedOrg)} disabled={loading}>
                        <FiRefreshCw className={`mr-2 ${loading ? "animate-spin" : ""}`} /> Refresh
                    </Button>
                )}
            </div>

            {error && (
                <div className="flex flex-col items-center justify-center space-y-4">
                    <ErrorMessage message={error} />
                    <Button onClick={() => (selectedOrg ? fetchAnalytics(selectedOrg) : fetchOrgs())}>Retry</Button>
                </div>
            )}

            {/* Filter Section */}
            <div className="bg-[#292A2F] border border-[#35363B] p-6 rounded-xl">
                <Select
                    label="Choose Organization to Audit"
                    value={selectedOrg}
                    onChange={handleOrgChange}
                    placeholder="Choose organization..."
                    options={organizations.map(o => ({ value: o._id, label: o.name }))}
                    disabled={loadingOrgs}
                />
            </div>

            {selectedOrg ? (
                loading ? (
                    <Loader message="Aggregating metrics..." />
                ) : (
                    <>
                        {/* Summary Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <StatCard
                                title="Waiting Line"
                                value={aggregated.waiting}
                                description="Current active waiting line"
                                icon={<FiUsers className="text-[#ED9663]" />}
                            />
                            <StatCard
                                title="Called Today"
                                value={aggregated.called}
                                description="Tokens called to counters"
                                icon={<FiActivity className="text-[#DC423E]" />}
                            />
                            <StatCard
                                title="Served Today"
                                value={aggregated.completed}
                                description="Total completed visits"
                                icon={<FiClock className="text-emerald-400" />}
                            />
                        </div>

                        {/* Recharts Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-[#292A2F] border border-[#35363B] p-6 rounded-xl space-y-4">
                                <h3 className="text-sm font-bold text-[#F5F5F5] uppercase tracking-wider">Ticket Status Distribution</h3>
                                {chartData.length === 0 ? (
                                    <div className="h-64 flex items-center justify-center text-xs text-[#707176]">No active tickets logged today.</div>
                                ) : (
                                    <div className="h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={chartData}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    label={renderCustomizedLabel}
                                                    outerRadius={80}
                                                    fill="#8884d8"
                                                    dataKey="value"
                                                >
                                                    {chartData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip contentStyle={{ backgroundColor: "#202126", borderColor: "#35363B", borderRadius: "8px", color: "#F5F5F5" }} />
                                                <Legend formatter={(value) => <span className="text-[#A8A8A8] text-xs font-semibold">{value}</span>} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                            </div>

                            <div className="bg-[#292A2F] border border-[#35363B] p-6 rounded-xl space-y-4">
                                <h3 className="text-sm font-bold text-[#F5F5F5] uppercase tracking-wider">Queue Performance Pace (mins)</h3>
                                {performanceData.length === 0 ? (
                                    <div className="h-64 flex items-center justify-center text-xs text-[#707176]">No queue data found.</div>
                                ) : (
                                    <div className="h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={performanceData}>
                                                <XAxis dataKey="name" stroke="#A8A8A8" tick={{ fontSize: 10 }} />
                                                <YAxis stroke="#A8A8A8" tick={{ fontSize: 10 }} />
                                                <Tooltip contentStyle={{ backgroundColor: "#202126", borderColor: "#35363B", borderRadius: "8px", color: "#F5F5F5" }} />
                                                <Bar dataKey="Avg Wait Time (m)" fill="#ED9663" radius={[4, 4, 0, 0]} />
                                                <Bar dataKey="Avg Service Time (m)" fill="#EFB477" radius={[4, 4, 0, 0]} />
                                                <Legend formatter={(value) => <span className="text-[#A8A8A8] text-xs font-semibold">{value}</span>} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )
            ) : (
                <div className="bg-[#292A2F] border border-[#35363B] rounded-xl p-8 text-center flex flex-col items-center justify-center space-y-2">
                    <span className="text-3xl">🏢</span>
                    <h3 className="text-sm font-bold text-[#F5F5F5]">Filter Required</h3>
                    <p className="text-xs text-[#A8A8A8]">Please select an organization in the dropdown above to audit queue analytics.</p>
                </div>
            )}
        </div>
    );
};

export default AdminAnalytics;
