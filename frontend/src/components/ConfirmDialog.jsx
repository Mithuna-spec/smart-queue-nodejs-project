import React from "react";
import Button from "./Button";

const ConfirmDialog = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title = "Confirm Action", 
    message = "Are you sure you want to proceed?", 
    confirmText = "Confirm", 
    cancelText = "Cancel",
    isDestructive = false
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                onClick={onClose} 
                className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Dialog Body */}
            <div className="relative w-full max-w-md bg-[#202126] border border-[#35363B] rounded-xl shadow-2xl p-6 flex flex-col space-y-4">
                <h3 className="text-base font-bold text-[#F5F5F5]">{title}</h3>
                <p className="text-sm text-[#A8A8A8]">{message}</p>
                <div className="flex items-center justify-end space-x-3 pt-2">
                    <Button variant="outline" onClick={onClose}>
                        {cancelText}
                    </Button>
                    <Button 
                        variant={isDestructive ? "danger" : "primary"} 
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                    >
                        {confirmText}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;
