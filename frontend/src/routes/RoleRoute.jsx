import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const RoleRoute = ({ children, allowedRoles }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-[#202126] flex items-center justify-center text-[#F5F5F5]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#DC423E]"></div>
            </div>
        );
    }

    if (!user || !allowedRoles.includes(user.role)) {
        return <Navigate to="/unauthorized" replace />;
    }

    return children;
};

export default RoleRoute;
