import React from "react";

const Loader = ({ 
    message = "Loading...", 
    fullPage = false 
}) => {
    const containerStyle = fullPage 
        ? "min-h-screen bg-[#202126] flex flex-col items-center justify-center space-y-4 text-[#F5F5F5]"
        : "flex flex-col items-center justify-center p-8 space-y-3 text-[#A8A8A8] w-full";

    return (
        <div className={containerStyle}>
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#DC423E]"></div>
            <span className="text-xs font-medium tracking-wide uppercase">{message}</span>
        </div>
    );
};

export default Loader;
