import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
    const { user } = useAuth();
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        if (!user) {
            if (socket) {
                socket.disconnect();
                setSocket(null);
            }
            return;
        }

        const socketUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
        const socketInstance = io(socketUrl, {
            transports: ["websocket", "polling"]
        });

        socketInstance.on("connect", () => {
            console.log("Connected to Socket.IO backend:", socketInstance.id);
            // Join user room
            socketInstance.emit("joinUser", user.id || user._id);
        });

        socketInstance.on("disconnect", () => {
            console.log("Disconnected from Socket.IO backend");
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, [user]);

    const joinQueueRoom = (queueId) => {
        if (socket && queueId) {
            socket.emit("joinQueue", queueId);
            console.log(`Joined room: queue:${queueId}`);
        }
    };

    const leaveQueueRoom = (queueId) => {
        if (socket && queueId) {
            socket.emit("leaveQueue", queueId);
            console.log(`Left room: queue:${queueId}`);
        }
    };

    const value = {
        socket,
        joinQueueRoom,
        leaveQueueRoom
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error("useSocket must be used within a SocketProvider");
    }
    return context;
};
