import React from "react";

const Button = ({ 
    children, 
    type = "button", 
    variant = "primary", 
    size = "md", 
    className = "", 
    disabled = false, 
    onClick, 
    ...props 
}) => {
    const baseStyle = "inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#DC423E] focus:ring-offset-[#202126] disabled:opacity-50 disabled:cursor-not-allowed select-none";
    
    const variants = {
        primary: "bg-[#DC423E] hover:bg-[#c9322e] text-[#F5F5F5]",
        secondary: "bg-[#ED9663] hover:bg-[#db7e46] text-[#202126] font-semibold",
        danger: "bg-[#BF1F1B] hover:bg-[#a61512] text-[#F5F5F5]",
        outline: "border border-[#35363B] text-[#A8A8A8] hover:bg-[#292A2F] hover:text-[#F5F5F5]",
        text: "text-[#A8A8A8] hover:text-[#F5F5F5] hover:bg-[#292A2F]"
    };

    const sizes = {
        sm: "px-3 py-1.5 text-xs",
        md: "px-4 py-2 text-sm",
        lg: "px-6 py-3 text-base"
    };

    return (
        <button
            type={type}
            className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
            disabled={disabled}
            onClick={onClick}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;
