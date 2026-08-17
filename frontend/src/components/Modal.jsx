import React from "react";

const Modal = ({ 
    isOpen, 
    onClose, 
    title, 
    children 
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                onClick={onClose} 
                className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <div className="relative w-full max-w-lg bg-[#202126] border border-[#35363B] rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden transform scale-100 transition-transform">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#35363B]">
                    <h3 className="text-base font-semibold text-[#F5F5F5]">
                        {title}
                    </h3>
                    <button 
                        onClick={onClose} 
                        className="text-[#A8A8A8] hover:text-[#F5F5F5] transition-colors p-1"
                    >
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 p-6 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;
