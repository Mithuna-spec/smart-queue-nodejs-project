import React from "react";

const StatCard = ({ 
    title, 
    value, 
    description, 
    icon, 
    className = "" 
}) => {
    return (
        <div className={`bg-[#292A2F] border border-[#35363B] p-6 rounded-xl flex items-center justify-between ${className}`}>
            <div className="flex flex-col space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#A8A8A8] select-none">
                    {title}
                </span>
                <span className="text-3xl font-extrabold text-[#F5F5F5] tracking-tight">
                    {value}
                </span>
                {description && (
                    <span className="text-xs text-[#707176]">
                        {description}
                    </span>
                )}
            </div>
            {icon && (
                <div className="w-12 h-12 rounded-lg bg-[#202126] border border-[#35363B] flex items-center justify-center text-[#EFB477] text-xl">
                    {icon}
                </div>
            )}
        </div>
    );
};

export default StatCard;
