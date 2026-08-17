import React from "react";
import { FiAlertOctagon } from "react-icons/fi";

const ErrorMessage = ({ 
    message = "An unexpected error occurred. Please try again.", 
    className = "" 
}) => {
    return (
        <div className={`bg-[#BF1F1B]/10 border border-[#BF1F1B]/30 text-[#F5F5F5] p-4 rounded-lg flex items-start space-x-3 max-w-lg mx-auto my-4 ${className}`}>
            <FiAlertOctagon className="text-[#BF1F1B] text-xl shrink-0 mt-0.5" />
            <div className="flex flex-col space-y-1">
                <span className="text-sm font-semibold">Error occurred</span>
                <span className="text-xs text-[#A8A8A8]">{message}</span>
            </div>
        </div>
    );
};

export default ErrorMessage;
