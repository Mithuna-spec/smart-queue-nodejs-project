import React from "react";

const Select = React.forwardRef(({ 
    label, 
    error, 
    options = [], 
    className = "", 
    placeholder = "Select option",
    ...props 
}, ref) => {
    return (
        <div className="w-full flex flex-col space-y-1.5">
            {label && (
                <label className="text-xs font-semibold uppercase tracking-wider text-[#A8A8A8] select-none">
                    {label}
                </label>
            )}
            <select
                ref={ref}
                className={`w-full px-4 py-2 bg-[#292A2F] border ${
                    error ? "border-[#BF1F1B]" : "border-[#35363B]"
                } rounded-lg text-[#F5F5F5] text-sm focus:outline-none focus:border-[#DC423E] transition-colors appearance-none cursor-pointer ${className}`}
                {...props}
            >
                {placeholder && <option value="">{placeholder}</option>}
                {options.map((opt, index) => {
                    const val = typeof opt === "object" ? opt.value : opt;
                    const name = typeof opt === "object" ? opt.label : opt;
                    return (
                        <option key={index} value={val}>
                            {name}
                        </option>
                    );
                })}
            </select>
            {error && (
                <span className="text-xs text-[#BF1F1B] font-medium">
                    {error}
                </span>
            )}
        </div>
    );
});

Select.displayName = "Select";

export default Select;
