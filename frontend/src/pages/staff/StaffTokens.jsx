import React, { useState, useEffect } from "react";
import { getAssignedCounter } from "../../api/counterApi";
import { getQueueTokens, startService, completeToken, skipToken } from "../../api/tokenApi";
import Button from "../../components/Button";
import Table from "../../components/Table";
import Pagination from "../../components/Pagination";
import StatusBadge from "../../components/StatusBadge";
import Loader from "../../components/Loader";
import ErrorMessage from "../../components/ErrorMessage";
import Select from "../../components/Select";
import { FiRefreshCw, FiPlay, FiCheck, FiFastForward } from "react-icons/fi";

const StaffTokens = () => {
    const [counter, setCounter] = useState(null);
    const [queue, setQueue] = useState(null);
    const [tokens, setTokens] = useState([]);
    const [statusFilter, setStatusFilter] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    const [loading, setLoading] = useState(true);
    const [tokensLoading, setTokensLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        resolveCounterAndQueue();
    }, []);

    const resolveCounterAndQueue = async () => {
        setLoading(true);
        setError("");
        try {
            const data = await getAssignedCounter();
            setCounter(data.counter);
            setQueue(data.queue);
            if (data.queue) {
                await fetchTokens(data.queue._id, 1, statusFilter);
            }
        } catch (err) {
            console.error(err);
            if (err.response?.status === 404) {
                setCounter(null);
                setQueue(null);
            } else {
                setError(err.response?.data?.message || "Failed to resolve your assigned counter.");
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchTokens = async (qId, targetPage, status) => {
        setTokensLoading(true);
        setError("");
        try {
            const data = await getQueueTokens(qId, targetPage, 10, status);
            setTokens(data.tokens || []);
            setPage(data.pagination?.page || 1);
            setTotalPages(data.pagination?.totalPages || 1);
            setTotalRecords(data.pagination?.total || 0);
        } catch (err) {
            console.error(err);
            setError("Failed to fetch tickets in your queue.");
        } finally {
            setTokensLoading(false);
        }
    };

    useEffect(() => {
        if (queue) {
            fetchTokens(queue._id, 1, statusFilter);
        }
    }, [statusFilter]);

    const handlePageChange = (newPage) => {
        if (queue) {
            fetchTokens(queue._id, newPage, statusFilter);
        }
    };

    const handleAction = async (tokenId, actionFn, message) => {
        setError("");
        setSuccess("");
        setActionLoading(true);
        try {
            await actionFn(tokenId);
            setSuccess(message);
            if (queue) {
                await fetchTokens(queue._id, page, statusFilter);
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to complete operation.");
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <Loader message="Resolving service desk..." fullPage />;
    if (error && !counter) return <ErrorMessage message={error} />;

    if (!counter || !queue) {
        return (
            <div className="bg-[#292A2F] border border-[#35363B] rounded-xl p-8 text-center max-w-md mx-auto my-12">
                <span className="text-4xl">⚠️</span>
                <h3 className="text-[#F5F5F5] font-bold text-lg mt-3">Tokens Panel Unavailable</h3>
                <p className="text-xs text-[#A8A8A8] mt-2 leading-relaxed">
                    You must be assigned to an active desk counter with an open queue to serve waiting tokens.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-[#F5F5F5] tracking-tight">{queue.name} Tickets Registry</h1>
                    <p className="text-sm text-[#A8A8A8] mt-1">Review active waitlines, list ticket numbers, and trigger actions.</p>
                </div>
                <div className="flex items-center space-x-3">
                    <Select
                        label={null}
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        placeholder="All Statuses"
                        options={[
                            { value: "WAITING", label: "Waiting" },
                            { value: "CALLED", label: "Called" },
                            { value: "IN_SERVICE", label: "In Service" },
                            { value: "COMPLETED", label: "Completed" },
                            { value: "SKIPPED", label: "Skipped" },
                            { value: "CANCELLED", label: "Cancelled" }
                        ]}
                        disabled={tokensLoading}
                        className="w-40"
                    />
                    <Button 
                        variant="outline" 
                        onClick={() => fetchTokens(queue._id, page, statusFilter)}
                        disabled={tokensLoading}
                    >
                        <FiRefreshCw className={`mr-1.5 ${tokensLoading ? "animate-spin" : ""}`} /> Refresh
                    </Button>
                </div>
            </div>

            {error && <ErrorMessage message={error} />}
            {success && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg text-xs font-semibold select-none text-center">
                    {success}
                </div>
            )}

            <div className="space-y-4">
                <Table
                    headers={["Ticket", "Customer Name", "Priority", "Status", "Joined Time", "Actions"]}
                    loading={tokensLoading}
                    emptyMessage="No tickets found matching details."
                >
                    {tokens.map((token) => {
                        const u = token.userId || {};
                        const displayNum = `Q${String(token.tokenNumber).padStart(3, "0")}`;
                        const timeStr = token.joinedAt ? new Date(token.joinedAt).toLocaleTimeString() : "-";
                        
                        return (
                            <tr key={token._id} className="border-b border-[#35363B] text-sm text-[#F5F5F5] hover:bg-[#202126]/30">
                                <td className="px-6 py-4 font-black text-[#DC423E]">{displayNum}</td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="font-bold">{u.name || "Walk-in Guest"}</span>
                                        <span className="text-xs text-[#707176]">{u.phone || "-"}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 font-bold text-[#EFB477] text-xs uppercase">{token.priority}</td>
                                <td className="px-6 py-4">
                                    <StatusBadge status={token.status} />
                                </td>
                                <td className="px-6 py-4 text-[#A8A8A8] text-xs">{timeStr}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center space-x-2">
                                        {token.status === "CALLED" && (
                                            <>
                                                <Button 
                                                    variant="secondary" 
                                                    size="sm"
                                                    onClick={() => handleAction(token._id, startService, `Service started for ${displayNum}.`)}
                                                    disabled={actionLoading}
                                                >
                                                    <FiPlay className="mr-1" /> Start
                                                </Button>
                                                <Button 
                                                    variant="outline" 
                                                    size="sm"
                                                    onClick={() => handleAction(token._id, skipToken, `Skipped ticket ${displayNum}.`)}
                                                    disabled={actionLoading}
                                                    className="border-red-500/10 hover:bg-[#BF1F1B]/10 hover:text-[#BF1F1B]"
                                                >
                                                    <FiFastForward />
                                                </Button>
                                            </>
                                        )}
                                        {token.status === "IN_SERVICE" && (
                                            <Button 
                                                variant="outline" 
                                                size="sm"
                                                onClick={() => handleAction(token._id, completeToken, `Completed service for ${displayNum}.`)}
                                                disabled={actionLoading}
                                                className="border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10"
                                            >
                                                <FiCheck className="mr-1" /> Complete
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
                    onPageChange={handlePageChange}
                    limit={10}
                />
            </div>
        </div>
    );
};

export default StaffTokens;
