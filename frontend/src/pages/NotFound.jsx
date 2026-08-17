import React from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import { FiHelpCircle } from "react-icons/fi";

const NotFound = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#202126] text-[#F5F5F5] flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-[#35363B] border border-[#35363B] flex items-center justify-center text-[#EFB477] text-3xl mb-4">
                <FiHelpCircle />
            </div>
            <h1 className="text-2xl font-black tracking-tight mb-2">404 Not Found</h1>
            <p className="text-sm text-[#A8A8A8] max-w-sm mb-6 leading-relaxed">
                The requested URL path was not found on this system.
            </p>
            <Button onClick={() => navigate("/")}>
                Return Home
            </Button>
        </div>
    );
};

export default NotFound;
