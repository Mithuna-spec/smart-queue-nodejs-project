import React from "react";

const StatusBadge = ({ status }) => {
    if (!status) return null;

    const styles = {
        // Token Statuses
        WAITING: "bg-amber-500/10 text-[#ED9663] border border-amber-500/20",
        CALLED: "bg-rose-500/10 text-[#DC423E] border border-rose-500/20",
        IN_SERVICE: "bg-orange-400/10 text-[#EFB477] border border-orange-400/20",
        COMPLETED: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
        CANCELLED: "bg-red-500/10 text-[#BF1F1B] border border-red-500/20",
        SKIPPED: "bg-red-950/20 text-rose-300 border border-red-900/30",

        // Counter Statuses
        AVAILABLE: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
        BUSY: "bg-red-500/10 text-[#BF1F1B] border border-red-500/20",
        OFFLINE: "bg-slate-800 text-[#707176] border border-slate-700",

        // Appointment Statuses
        BOOKED: "bg-amber-500/10 text-[#ED9663] border border-amber-500/20",
        CONFIRMED: "bg-orange-400/10 text-[#EFB477] border border-orange-400/20",
        CHECKED_IN: "bg-rose-500/10 text-[#DC423E] border border-rose-500/20",
        MISSED: "bg-slate-800 text-[#707176] border border-slate-700",

        // Staff Statuses
        ACTIVE: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
        INACTIVE: "bg-slate-800 text-[#707176] border border-slate-700",
    };

    const norm = status.toUpperCase();
    const style = styles[norm] || "bg-slate-800 text-[#F5F5F5] border border-slate-700";

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold select-none ${style}`}>
            {norm.replace("_", " ")}
        </span>
    );
};

export default StatusBadge;
