import React, { useState, useEffect } from "react";
import { useOrg } from "../../hooks/useOrg";
import { getQueuesByOrganization, getQueueAnalytics } from "../../api/queueApi";
import Loader from "../../components/Loader";
import ErrorMessage from "../../components/ErrorMessage";
import Card from "../../components/Card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const OrgAnalytics = () => {
    const { orgId } = useOrg();
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
        if (!orgId) return;

        const loadAnalytics = async () => {
            setLoading(true);
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

        loadAnalytics();
    }, [orgId]);

    if (loading) return <Loader message="Aggregating analytics data..." />;
    if (error) return <ErrorMessage message={error} />;

    const RADIAN = Math.PI / 185;
    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
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
            <div>
                <h1 className="text-2xl font-black text-[#F5F5F5] tracking-tight">Analytics</h1>
                <p className="text-sm text-[#A8A8A8] mt-1">Review average service pace and status distributions of your queues.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Status distribution Pie Chart */}
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

                {/* Queue Pace Bar Chart */}
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
        </div>
    );
};

export default OrgAnalytics;
