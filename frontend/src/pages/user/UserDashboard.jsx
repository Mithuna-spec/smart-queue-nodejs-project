import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { getAvailableOrganizations } from "../../api/organizationApi";
import { getAvailableServices } from "../../api/serviceApi";
import { getAvailableQueues, joinQueue } from "../../api/queueApi";
import { getTokenStatus, cancelToken } from "../../api/tokenApi";
import TokenCard from "../../components/TokenCard";
import Button from "../../components/Button";
import Card from "../../components/Card";
import Select from "../../components/Select";
import Loader from "../../components/Loader";
import ErrorMessage from "../../components/ErrorMessage";
import EmptyState from "../../components/EmptyState";
import { FiBriefcase, FiLayers } from "react-icons/fi";

const UserDashboard = () => {
    const { user } = useAuth();
    const { socket, joinQueueRoom, leaveQueueRoom } = useSocket();

    const [organizations, setOrganizations] = useState([]);
    const [selectedOrg, setSelectedOrg] = useState("");
    const [services, setServices] = useState([]);
    const [selectedService, setSelectedService] = useState("");
    const [queues, setQueues] = useState([]);
    
    // Active token state
    const [activeToken, setActiveToken] = useState(null);
    const [tokenPosition, setTokenPosition] = useState(null);
    const [peopleAhead, setPeopleAhead] = useState(0);
    const [estWaitTime, setEstWaitTime] = useState(0);
    const [activeQueue, setActiveQueue] = useState(null);

    const [loading, setLoading] = useState(false);
    const [tokenLoading, setTokenLoading] = useState(false);
    const [error, setError] = useState("");

    // Load initial organizations and restore active token from localStorage
    useEffect(() => {
        const fetchOrgs = async () => {
            setLoading(true);
            try {
                const data = await getAvailableOrganizations();
                setOrganizations(data.organizations || []);
            } catch (err) {
                console.error(err);
                setError("Failed to fetch active tenant organizations.");
            } finally {
                setLoading(false);
            }
        };

        fetchOrgs();

        const storedTokenId = localStorage.getItem("activeTokenId");
        if (storedTokenId) {
            fetchTokenDetails(storedTokenId);
        }
    }, []);

    // Listen to real-time events for the active token or queue updates
    useEffect(() => {
        if (!socket || !activeToken) return;

        joinQueueRoom(activeToken.queueId);

        const handleQueueUpdated = (payload) => {
            console.log("Socket: Queue updated:", payload);
            if (activeToken && payload.queueId === activeToken.queueId) {
                fetchTokenDetails(activeToken._id || activeToken.id);
            }
        };

        const handleTokenCalled = (payload) => {
            console.log("Socket: Token called:", payload);
            if (activeToken && (payload.tokenId === activeToken._id || payload.tokenId === activeToken.id)) {
                fetchTokenDetails(activeToken._id || activeToken.id);
            }
        };

        const handleTokenStarted = (payload) => {
            console.log("Socket: Token started:", payload);
            if (activeToken && (payload.tokenId === activeToken._id || payload.tokenId === activeToken.id)) {
                fetchTokenDetails(activeToken._id || activeToken.id);
            }
        };

        const handleTokenCompleted = (payload) => {
            console.log("Socket: Token completed:", payload);
            if (activeToken && (payload.tokenId === activeToken._id || payload.tokenId === activeToken.id)) {
                localStorage.removeItem("activeTokenId");
                setActiveToken(null);
                leaveQueueRoom(activeToken.queueId);
            }
        };

        socket.on("QUEUE_UPDATED", handleQueueUpdated);
        socket.on("TOKEN_CALLED", handleTokenCalled);
        socket.on("TOKEN_STARTED", handleTokenStarted);
        socket.on("TOKEN_COMPLETED", handleTokenCompleted);

        return () => {
            leaveQueueRoom(activeToken.queueId);
            socket.off("QUEUE_UPDATED", handleQueueUpdated);
            socket.off("TOKEN_CALLED", handleTokenCalled);
            socket.off("TOKEN_STARTED", handleTokenStarted);
            socket.off("TOKEN_COMPLETED", handleTokenCompleted);
        };
    }, [socket, activeToken]);

    const fetchTokenDetails = async (tokenId) => {
        setTokenLoading(true);
        try {
            const data = await getTokenStatus(tokenId);
            setActiveToken(data.token);
            setTokenPosition(data.position);
            setPeopleAhead(data.peopleAhead);
            setEstWaitTime(data.estimatedWaitTime);
            
            // Auto clean if terminal state
            if (["COMPLETED", "CANCELLED", "SKIPPED"].includes(data.token.status)) {
                localStorage.removeItem("activeTokenId");
                setActiveToken(null);
            }
        } catch (err) {
            console.error("Token details fetch error:", err);
            localStorage.removeItem("activeTokenId");
            setActiveToken(null);
        } finally {
            setTokenLoading(false);
        }
    };

    // Load services when organization changes
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
                setQueues([]);
            } catch (err) {
                console.error(err);
                setError("Failed to fetch services.");
            }
        };

        fetchServices();
    }, [selectedOrg]);

    // Load queues when service changes
    useEffect(() => {
        if (!selectedService) {
            setQueues([]);
            return;
        }

        const fetchQueues = async () => {
            try {
                const data = await getAvailableQueues(selectedOrg);
                // Filter queues that match selected service
                const filtered = (data.queues || []).filter(q => q.serviceId === selectedService || q.serviceId?._id === selectedService);
                setQueues(filtered);
            } catch (err) {
                console.error(err);
                setError("Failed to fetch queues.");
            }
        };

        fetchQueues();
    }, [selectedService, selectedOrg]);

    const handleJoinQueue = async (queueId) => {
        setError("");
        setTokenLoading(true);
        try {
            const data = await joinQueue(queueId);
            const tokenObj = data.token;
            const id = tokenObj.id || tokenObj._id;
            localStorage.setItem("activeTokenId", id);
            await fetchTokenDetails(id);
        } catch (err) {
            console.error(err);
            if (err.response && err.response.data && err.response.data.token) {
                // User already in queue
                const id = err.response.data.token._id || err.response.data.token.id;
                localStorage.setItem("activeTokenId", id);
                await fetchTokenDetails(id);
            } else {
                setError(err.response?.data?.message || "Failed to join queue.");
            }
        } finally {
            setTokenLoading(false);
        }
    };

    const handleCancelToken = async () => {
        if (!activeToken) return;
        const id = activeToken._id || activeToken.id;
        try {
            await cancelToken(id);
            localStorage.removeItem("activeTokenId");
            setActiveToken(null);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to cancel token.");
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-black text-[#F5F5F5] tracking-tight">User Dashboard</h1>
                <p className="text-sm text-[#A8A8A8] mt-1">Welcome back, {user?.name}. Manage your queue status here.</p>
            </div>

            {error && <ErrorMessage message={error} />}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Active Token Status Column */}
                <div className="lg:col-span-1 flex flex-col space-y-4">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-[#A8A8A8] select-none">
                        Active Ticket Status
                    </h2>
                    
                    {tokenLoading && !activeToken ? (
                        <div className="bg-[#292A2F] border border-[#35363B] rounded-xl p-8 flex items-center justify-center">
                            <Loader message="Syncing token..." />
                        </div>
                    ) : activeToken ? (
                        <TokenCard 
                            tokenData={activeToken} 
                            position={tokenPosition} 
                            peopleAhead={peopleAhead} 
                            estimatedWaitTime={estWaitTime} 
                            onCancel={handleCancelToken}
                            queueName={activeToken.queueId?.name}
                            serviceName={activeToken.serviceId?.name}
                        />
                    ) : (
                        <div className="bg-[#292A2F] border border-[#35363B] rounded-xl p-8 text-center flex flex-col items-center justify-center space-y-3">
                            <span className="text-3xl">🎫</span>
                            <h3 className="text-sm font-bold text-[#F5F5F5]">No Active Ticket</h3>
                            <p className="text-xs text-[#A8A8A8] max-w-[200px]">Select an organization and service on the right to join a queue.</p>
                        </div>
                    )}
                </div>

                {/* Queue Joining Column */}
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-[#A8A8A8] select-none">
                        Join a Queue
                    </h2>

                    <div className="bg-[#292A2F] border border-[#35363B] p-6 rounded-xl space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Select
                                label="Select Organization"
                                value={selectedOrg}
                                onChange={(e) => setSelectedOrg(e.target.value)}
                                placeholder="Choose an organization..."
                                options={organizations.map(o => ({ value: o._id, label: o.name }))}
                                disabled={loading || !!activeToken}
                            />

                            <Select
                                label="Select Service"
                                value={selectedService}
                                onChange={(e) => setSelectedService(e.target.value)}
                                placeholder="Choose a service..."
                                options={services.map(s => ({ value: s._id, label: s.name }))}
                                disabled={loading || !selectedOrg || !!activeToken}
                            />
                        </div>

                        {selectedService && queues.length === 0 && (
                            <p className="text-xs text-[#ED9663] pt-2">No active queues found for this service.</p>
                        )}

                        {queues.length > 0 && (
                            <div className="pt-4 border-t border-[#35363B] space-y-4">
                                <h3 className="text-xs font-bold text-[#F5F5F5] uppercase tracking-wider">Available Queues</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {queues.map((q) => (
                                        <div 
                                            key={q._id} 
                                            className="bg-[#202126] border border-[#35363B] p-4 rounded-lg flex items-center justify-between"
                                        >
                                            <div className="flex flex-col">
                                                <span className="text-[#F5F5F5] font-bold text-sm">{q.name}</span>
                                                <span className="text-[10px] text-[#A8A8A8] mt-0.5">Policy: {q.queuePolicy}</span>
                                            </div>
                                            <Button 
                                                variant="secondary" 
                                                size="sm"
                                                onClick={() => handleJoinQueue(q._id)}
                                                disabled={tokenLoading || !!activeToken}
                                            >
                                                Join
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserDashboard;
