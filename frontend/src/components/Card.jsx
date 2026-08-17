import React from "react";

const Card = ({ 
    children, 
    className = "", 
    title, 
    subtitle,
    headerAction
}) => {
    return (
        <div className={`bg-[#292A2F] border border-[#35363B] rounded-xl shadow-lg overflow-hidden ${className}`}>
            {(title || subtitle || headerAction) && (
                <div className="px-6 py-4 border-b border-[#35363B] flex items-center justify-between">
                    <div>
                        {title && <h3 className="text-base font-bold text-[#F5F5F5]">{title}</h3>}
                        {subtitle && <p className="text-xs text-[#A8A8A8] mt-0.5">{subtitle}</p>}
                    </div>
                    {headerAction && <div>{headerAction}</div>}
                </div>
            )}
            <div className="p-6">
                {children}
            </div>
        </div>
    );
};

export default Card;
