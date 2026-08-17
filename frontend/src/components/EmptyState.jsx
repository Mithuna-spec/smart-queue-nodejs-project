import React from "react";

const EmptyState = ({ 
    title = "No data available", 
    description = "There are no records to display at this time.", 
    icon, 
    action 
}) => {
    return (
        <div className="flex flex-col items-center justify-center text-center p-8 bg-[#292A2F] border border-[#35363B] rounded-xl space-y-4 max-w-md mx-auto my-6">
            <div className="w-16 h-16 rounded-full bg-[#202126] border border-[#35363B] flex items-center justify-center text-[#EFB477] text-3xl">
                {icon || "📁"}
            </div>
            <div className="flex flex-col space-y-1">
                <h4 className="text-[#F5F5F5] font-bold text-sm">
                    {title}
                </h4>
                <p className="text-xs text-[#A8A8A8] leading-relaxed">
                    {description}
                </p>
            </div>
            {action && (
                <div className="pt-2">
                    {action}
                </div>
            )}
        </div>
    );
};

export default EmptyState;
