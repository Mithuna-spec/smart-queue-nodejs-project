import React from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import { FiSlash } from "react-icons/fi";

const Unauthorized = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#202126] text-[#F5F5F5] flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-[#BF1F1B]/10 border border-[#BF1F1B]/30 flex items-center justify-center text-[#BF1F1B] text-3xl mb-4">
                <FiSlash />
            </div>
            <h1 className="text-2xl font-black tracking-tight mb-2">Access Denied</h1>
            <p className="text-sm text-[#A8A8A8] max-w-sm mb-6 leading-relaxed">
                You do not have the required permissions to view this dashboard. Please verify your credentials or sign in under a different role.
            </p>
            <Button onClick={() => navigate("/login")}>
                Return to Login
            </Button>
        </div>
    );
};

export default Unauthorized;
