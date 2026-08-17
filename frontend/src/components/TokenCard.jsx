import React from "react";
import StatusBadge from "./StatusBadge";
import Button from "./Button";
import { FiClock, FiUsers, FiXCircle } from "react-icons/fi";

const TokenCard = ({ 
    tokenData, 
    position, 
    peopleAhead, 
    estimatedWaitTime, 
    onCancel, 
    queueName,
    serviceName
}) => {
    if (!tokenData) return null;

    const displayToken = `Q${String(tokenData.tokenNumber).padStart(3, "0")}`;
    const showCancel = tokenData.status === "WAITING" && onCancel;

    return (
        <div className="bg-[#292A2F] border border-[#35363B] rounded-xl overflow-hidden shadow-lg w-full max-w-sm mx-auto">
            {/* Ticket Header */}
            <div className="bg-[#202126] border-b border-[#35363B] p-5 flex items-center justify-between">
                <div className="flex flex-col">
                    <span className="text-[#A8A8A8] text-xs font-semibold uppercase tracking-wider">
                        {serviceName || "Service"}
                    </span>
                    <span className="text-[#F5F5F5] font-bold text-sm">
                        {queueName || "Queue"}
                    </span>
                </div>
                <StatusBadge status={tokenData.status} />
            </div>

            {/* Ticket Body */}
            <div className="p-6 flex flex-col items-center text-center space-y-6">
                <div className="flex flex-col items-center">
                    <span className="text-[#707176] text-xs font-semibold uppercase tracking-wider mb-1">
                        Your Token Number
                    </span>
                    <span className="text-5xl font-black text-[#DC423E] tracking-widest bg-[#202126] px-6 py-3 rounded-xl border border-[#35363B] shadow-inner">
                        {displayToken}
                    </span>
                </div>

                {/* Queue Stats Grid */}
                {tokenData.status === "WAITING" ? (
                    <div className="grid grid-cols-2 gap-4 w-full border-t border-b border-[#35363B] py-4">
                        <div className="flex flex-col items-center border-r border-[#35363B]">
                            <FiUsers className="text-[#EFB477] text-lg mb-1" />
                            <span className="text-xs text-[#A8A8A8]">Queue Position</span>
                            <span className="text-lg font-bold text-[#F5F5F5]">{position || "-"}</span>
                            <span className="text-[10px] text-[#707176] mt-0.5">{peopleAhead || 0} ahead</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <FiClock className="text-[#ED9663] text-lg mb-1" />
                            <span className="text-xs text-[#A8A8A8]">Est. Wait Time</span>
                            <span className="text-lg font-bold text-[#F5F5F5]">
                                {estimatedWaitTime !== undefined ? `${estimatedWaitTime} min` : "-"}
                            </span>
                            <span className="text-[10px] text-[#707176] mt-0.5">average pace</span>
                        </div>
                    </div>
                ) : (
                    <div className="w-full border-t border-[#35363B] pt-4 text-sm text-[#A8A8A8]">
                        {tokenData.status === "CALLED" && (
                            <p className="text-[#EFB477] font-semibold animate-pulse">
                                Please proceed to your counter immediately!
                            </p>
                        )}
                        {tokenData.status === "IN_SERVICE" && (
                            <p className="text-emerald-400">
                                You are currently being served.
                            </p>
                        )}
                        {tokenData.status === "COMPLETED" && (
                            <p className="text-[#707176]">
                                Service completed. Thank you!
                            </p>
                        )}
                        {tokenData.status === "CANCELLED" && (
                            <p className="text-[#BF1F1B]">
                                Ticket has been cancelled.
                            </p>
                        )}
                        {tokenData.status === "SKIPPED" && (
                            <p className="text-[#707176]">
                                Ticket was skipped.
                            </p>
                        )}
                    </div>
                )}

                {/* Actions */}
                {showCancel && (
                    <Button 
                        variant="outline" 
                        className="w-full text-xs font-semibold hover:bg-[#BF1F1B]/10 hover:text-[#BF1F1B] border-red-500/20"
                        onClick={onCancel}
                    >
                        <FiXCircle className="mr-2 text-sm" />
                        Cancel Token
                    </Button>
                )}
            </div>
        </div>
    );
};

export default TokenCard;
