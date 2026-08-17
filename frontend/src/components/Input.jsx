import React from "react";

const Input = React.forwardRef(({ 
    label, 
    error, 
    type = "text", 
    className = "", 
    ...props 
}, ref) => {
    return (
        <div className="w-full flex flex-col space-y-1.5">
            {label && (
                <label className="text-xs font-semibold uppercase tracking-wider text-[#A8A8A8] select-none">
                    {label}
                </label>
            )}
            <input
                ref={ref}
                type={type}
                className={`w-full px-4 py-2 bg-[#292A2F] border ${
                    error ? "border-[#BF1F1B]" : "border-[#35363B]"
                } rounded-lg text-[#F5F5F5] placeholder-[#707176] text-sm focus:outline-none focus:border-[#DC423E] transition-colors ${className}`}
                {...props}
            />
            {error && (
                <span className="text-xs text-[#BF1F1B] font-medium">
                    {error}
                </span>
            )}
        </div>
    );
});

Input.displayName = "Input";

export default Input;
