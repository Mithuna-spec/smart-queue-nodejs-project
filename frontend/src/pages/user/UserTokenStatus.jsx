import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { getTokenStatus, cancelToken } from "../../api/tokenApi";
import TokenCard from "../../components/TokenCard";
import Loader from "../../components/Loader";
import ErrorMessage from "../../components/ErrorMessage";
import EmptyState from "../../components/EmptyState";

const UserTokenStatus = () => {
    const { socket, joinQueueRoom, leaveQueueRoom } = useSocket();
    const [activeToken, setActiveToken] = useState(null);
    const [tokenPosition, setTokenPosition] = useState(null);
    const [peopleAhead, setPeopleAhead] = useState(0);
    const [estWaitTime, setEstWaitTime] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchTokenDetails = async (tokenId) => {
        try {
            const data = await getTokenStatus(tokenId);
            setActiveToken(data.token);
            setTokenPosition(data.position);
            setPeopleAhead(data.peopleAhead);
            setEstWaitTime(data.estimatedWaitTime);
            
            if (["COMPLETED", "CANCELLED", "SKIPPED"].includes(data.token.status)) {
                localStorage.removeItem("activeTokenId");
                setActiveToken(null);
            }
        } catch (err) {
            console.error("Token details fetch error:", err);
            localStorage.removeItem("activeTokenId");
            setActiveToken(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const storedTokenId = localStorage.getItem("activeTokenId");
        if (storedTokenId) {
            fetchTokenDetails(storedTokenId);
        } else {
            setLoading(false);
        }
    }, []);

    // Listen to real-time events
    useEffect(() => {
        if (!socket || !activeToken) return;

        joinQueueRoom(activeToken.queueId);

        const handleQueueUpdated = (payload) => {
            if (activeToken && payload.queueId === activeToken.queueId) {
                fetchTokenDetails(activeToken._id || activeToken.id);
            }
        };

        const handleTokenCalled = (payload) => {
            if (activeToken && (payload.tokenId === activeToken._id || payload.tokenId === activeToken.id)) {
                fetchTokenDetails(activeToken._id || activeToken.id);
            }
        };

        socket.on("QUEUE_UPDATED", handleQueueUpdated);
        socket.on("TOKEN_CALLED", handleTokenCalled);

        return () => {
            leaveQueueRoom(activeToken.queueId);
            socket.off("QUEUE_UPDATED", handleQueueUpdated);
            socket.off("TOKEN_CALLED", handleTokenCalled);
        };
    }, [socket, activeToken]);

    const handleCancel = async () => {
        if (!activeToken) return;
        const id = activeToken._id || activeToken.id;
        try {
            await cancelToken(id);
            localStorage.removeItem("activeTokenId");
            setActiveToken(null);
        } catch (err) {
            console.error(err);
            setError("Failed to cancel token.");
        }
    };

    if (loading) return <Loader message="Fetching ticket details..." />;
    if (error) return <ErrorMessage message={error} />;

    return (
        <div className="space-y-8 flex flex-col items-center">
            <div className="text-center">
                <h1 className="text-2xl font-black text-[#F5F5F5] tracking-tight">Active Ticket</h1>
                <p className="text-sm text-[#A8A8A8] mt-1">Monitor your position and wait time in real-time.</p>
            </div>

            {activeToken ? (
                <TokenCard
                    tokenData={activeToken}
                    position={tokenPosition}
                    peopleAhead={peopleAhead}
                    estimatedWaitTime={estWaitTime}
                    onCancel={handleCancel}
                />
            ) : (
                <EmptyState
                    title="No Active Ticket"
                    description="You are not currently in any service queues."
                    icon="🎫"
                />
            )}
        </div>
    );
};

export default UserTokenStatus;
