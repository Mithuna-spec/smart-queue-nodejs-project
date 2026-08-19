import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { getAssignedCounter, updateCounterStatus } from "../../api/counterApi";
import { callNextToken } from "../../api/queueApi";
import { getTokenStatus, startService, completeToken, skipToken } from "../../api/tokenApi";
import Button from "../../components/Button";
import Card from "../../components/Card";
import StatusBadge from "../../components/StatusBadge";
import Loader from "../../components/Loader";
import ErrorMessage from "../../components/ErrorMessage";
import { FiPlay, FiCheck, FiFastForward, FiPlusCircle, FiPower } from "react-icons/fi";

const StaffCounter = () => {
    const { user } = useAuth();

    const [counter, setCounter] = useState(null);
    const [queue, setQueue] = useState(null);
    
    // Active token operations
    const [activeToken, setActiveToken] = useState(null);
    
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Initial load: resolve counter and queue
    useEffect(() => {
        loadCounterAndQueue();
    }, []);

    const loadCounterAndQueue = async () => {
        setLoading(true);
        setError("");
        try {
            const data = await getAssignedCounter();
            if (data.counter) {
                setCounter(data.counter);
                setQueue(data.queue);

                // Restore active token if exists in localStorage
                const storedTokenId = localStorage.getItem("activeStaffTokenId");
                if (storedTokenId) {
                    try {
                        const tokenRes = await getTokenStatus(storedTokenId);
                        if (["CALLED", "IN_SERVICE"].includes(tokenRes.token.status)) {
                            setActiveToken(tokenRes.token);
                        } else {
                            localStorage.removeItem("activeStaffTokenId");
                        }
                    } catch (err) {
                        localStorage.removeItem("activeStaffTokenId");
                    }
                }
            }
        } catch (err) {
            console.error(err);
            if (err.response?.status === 404) {
                setCounter(null);
            } else {
                setError(err.response?.data?.message || "Failed to load counter dashboard details.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleToggleOnline = async () => {
        if (!counter) return;
        setError("");
        setSuccess("");
        setActionLoading(true);
        const nextStatus = counter.status === "OFFLINE" ? "AVAILABLE" : "OFFLINE";
        try {
            const data = await updateCounterStatus(counter._id, nextStatus);
            setCounter(data.counter);
            setSuccess(`Counter is now ${nextStatus}.`);
            if (nextStatus === "OFFLINE") {
                setActiveToken(null);
                localStorage.removeItem("activeStaffTokenId");
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to update online status.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleCallNext = async () => {
        if (!queue || !counter) return;
        setError("");
        setSuccess("");
        setActionLoading(true);
        try {
            const data = await callNextToken(queue._id, counter._id);
            const tokenObj = data.token;
            setActiveToken(tokenObj);
            localStorage.setItem("activeStaffTokenId", tokenObj._id || tokenObj.id);
            setCounter(prev => ({ ...prev, status: "BUSY" }));
            setSuccess(`Called next token: Q${String(tokenObj.tokenNumber).padStart(3, "0")}`);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "No waiting tokens in queue or counter is busy.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleStartService = async () => {
        if (!activeToken) return;
        setError("");
        setSuccess("");
        setActionLoading(true);
        const tokenId = activeToken._id || activeToken.id;
        try {
            const data = await startService(tokenId);
            setActiveToken(data.token);
            setSuccess("Service started successfully.");
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to start service.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleCompleteService = async () => {
        if (!activeToken) return;
        setError("");
        setSuccess("");
        setActionLoading(true);
        const tokenId = activeToken._id || activeToken.id;
        try {
            const data = await completeToken(tokenId);
            setActiveToken(null);
            localStorage.removeItem("activeStaffTokenId");
            setCounter(prev => ({ ...prev, status: "AVAILABLE" }));
            setSuccess("Service completed successfully.");
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to complete service.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleSkipToken = async () => {
        if (!activeToken) return;
        setError("");
        setSuccess("");
        setActionLoading(true);
        const tokenId = activeToken._id || activeToken.id;
        try {
            const data = await skipToken(tokenId);
            setActiveToken(null);
            localStorage.removeItem("activeStaffTokenId");
            setCounter(prev => ({ ...prev, status: "AVAILABLE" }));
            setSuccess("Token skipped successfully.");
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to skip token.");
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <Loader message="Setting up desk counter..." />;

    if (!counter) {
        return (
            <div className="bg-[#292A2F] border border-[#35363B] rounded-xl p-8 text-center max-w-md mx-auto my-12">
                <span className="text-4xl">⚠️</span>
                <h3 className="text-[#F5F5F5] font-bold text-lg mt-3">Counter Assignment Required</h3>
                <p className="text-xs text-[#A8A8A8] mt-2 leading-relaxed">
                    You are not assigned to any desk counter. Contact your organization administrator.
                </p>
            </div>
        );
    }

    const displayTokenNumber = activeToken 
        ? `Q${String(activeToken.tokenNumber).padStart(3, "0")}`
        : null;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                <div>
                    <h1 className="text-2xl font-black text-[#F5F5F5] tracking-tight">{counter.name}</h1>
                    <p className="text-sm text-[#A8A8A8] mt-1">Desk panel controls for your counter operations.</p>
                </div>
                <Button 
                    variant={counter.status === "OFFLINE" ? "secondary" : "outline"} 
                    onClick={handleToggleOnline}
                    disabled={actionLoading}
                    className="md:w-auto w-full"
                >
                    <FiPower className="mr-2" />
                    {counter.status === "OFFLINE" ? "Go Online" : "Go Offline"}
                </Button>
            </div>

            {error && <ErrorMessage message={error} />}
            {success && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg text-xs font-semibold select-none text-center">
                    {success}
                </div>
            )}

            {/* Dashboard Operational Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Counter status overview card */}
                <div className="lg:col-span-1 bg-[#292A2F] border border-[#35363B] p-6 rounded-xl flex flex-col justify-between space-y-6">
                    <div className="space-y-4">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#A8A8A8] select-none">Counter Status</h3>
                        <div className="flex items-center justify-between">
                            <span className="text-[#F5F5F5] text-sm font-semibold">Desk Status</span>
                            <StatusBadge status={counter.status} />
                        </div>
                        {queue && (
                            <div className="flex items-center justify-between">
                                <span className="text-[#F5F5F5] text-sm font-semibold">Assigned Queue</span>
                                <span className="text-xs font-bold text-[#EFB477]">{queue.name}</span>
                            </div>
                        )}
                    </div>

                    {counter.status === "OFFLINE" && (
                        <div className="p-4 bg-[#BF1F1B]/10 rounded-lg text-center">
                            <p className="text-xs text-[#F5F5F5] font-bold">Counter is Offline</p>
                            <p className="text-[10px] text-[#A8A8A8] mt-0.5">Please click "Go Online" to serve waiting users.</p>
                        </div>
                    )}
                </div>

                {/* Counter operational control panel */}
                {counter.status !== "OFFLINE" && (
                    <div className="lg:col-span-2 bg-[#292A2F] border border-[#35363B] p-6 rounded-xl space-y-6">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#A8A8A8] select-none">Operational Controls</h3>

                        {!activeToken ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                                <div className="text-4xl">🟢</div>
                                <h4 className="text-sm font-bold text-[#F5F5F5]">Ready for Next Client</h4>
                                <p className="text-xs text-[#A8A8A8] max-w-xs">Click Call Next to fetch the first waiting customer from the queue.</p>
                                <Button 
                                    variant="primary" 
                                    className="font-bold py-2.5 px-6"
                                    onClick={handleCallNext}
                                    disabled={actionLoading}
                                >
                                    <FiPlusCircle className="mr-2 text-base" />
                                    Call Next Token
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Called Token Ticket Area */}
                                <div className="bg-[#202126] border border-[#35363B] p-6 rounded-xl flex flex-col items-center text-center space-y-4">
                                    <span className="text-xs text-[#A8A8A8] font-semibold uppercase tracking-wider">Active Token Serving</span>
                                    <span className="text-5xl font-black text-[#DC423E] tracking-widest bg-[#292A2F] px-6 py-2.5 rounded-lg border border-[#35363B]">
                                        {displayTokenNumber}
                                    </span>
                                    <StatusBadge status={activeToken.status} />
                                </div>

                                {/* Active Buttons */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-[#35363B]">
                                    {activeToken.status === "CALLED" && (
                                        <>
                                            <Button 
                                                variant="secondary"
                                                className="font-bold py-2.5"
                                                onClick={handleStartService}
                                                disabled={actionLoading}
                                            >
                                                <FiPlay className="mr-2" />
                                                Start Service
                                            </Button>

                                            <Button 
                                                variant="outline"
                                                className="font-bold py-2.5 text-xs border-red-500/10 hover:bg-[#BF1F1B]/10 hover:text-[#BF1F1B]"
                                                onClick={handleSkipToken}
                                                disabled={actionLoading}
                                            >
                                                <FiFastForward className="mr-2" />
                                                Skip Token
                                            </Button>
                                        </>
                                    )}

                                    {activeToken.status === "IN_SERVICE" && (
                                        <Button 
                                            variant="primary"
                                            className="font-bold py-2.5 col-span-3 bg-emerald-600 hover:bg-emerald-700 text-white"
                                            onClick={handleCompleteService}
                                            disabled={actionLoading}
                                        >
                                            <FiCheck className="mr-2" />
                                            Complete Service
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StaffCounter;
