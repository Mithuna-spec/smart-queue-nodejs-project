import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
    FiHome, 
    FiClock, 
    FiLayers, 
    FiUsers, 
    FiMonitor, 
    FiActivity,
    FiSettings,
    FiBriefcase
} from "react-icons/fi";

const Sidebar = ({ isOpen, toggleSidebar }) => {
    const { user } = useAuth();
    if (!user) return null;

    const navItems = {
        USER: [
            { path: "/dashboard", label: "Dashboard", icon: <FiHome /> },
            { path: "/appointments", label: "Appointments", icon: <FiClock /> }
        ],
        ORGANIZATION: [
            { path: "/organization/dashboard", label: "Dashboard", icon: <FiHome /> },
            { path: "/organization/services", label: "Services", icon: <FiBriefcase /> },
            { path: "/organization/staff", label: "Staff Management", icon: <FiUsers /> },
            { path: "/organization/counters", label: "Counters", icon: <FiMonitor /> },
            { path: "/organization/queues", label: "Queues", icon: <FiLayers /> },
            { path: "/organization/appointments", label: "Appointments", icon: <FiClock /> },
            { path: "/organization/analytics", label: "Analytics", icon: <FiActivity /> }
        ],
        STAFF: [
            { path: "/staff/dashboard", label: "Dashboard", icon: <FiHome /> },
            { path: "/staff/my-counter", label: "My Counter", icon: <FiMonitor /> },
            { path: "/staff/queue", label: "Queue Line", icon: <FiLayers /> }
        ],
        ADMIN: [
            { path: "/admin/dashboard", label: "Dashboard", icon: <FiHome /> },
            { path: "/admin/organizations", label: "Organizations", icon: <FiBriefcase /> },
            { path: "/admin/services", label: "Services", icon: <FiLayers /> },
            { path: "/admin/queues", label: "Queues", icon: <FiLayers /> },
            { path: "/admin/counters", label: "Counters", icon: <FiMonitor /> },
            { path: "/admin/staff", label: "Staff", icon: <FiUsers /> },
            { path: "/admin/analytics", label: "Analytics", icon: <FiActivity /> }
        ]
    };

    const items = navItems[user.role] || [];

    const activeStyle = "flex items-center px-4 py-3 bg-[#DC423E] text-[#F5F5F5] rounded-lg transition-colors font-medium";
    const inactiveStyle = "flex items-center px-4 py-3 text-[#A8A8A8] hover:bg-[#292A2F] hover:text-[#F5F5F5] rounded-lg transition-all";

    return (
        <aside 
            className={`fixed inset-y-0 left-0 z-20 w-64 bg-[#202126] border-r border-[#35363B] flex flex-col transform transition-transform duration-300 md:translate-x-0 ${
                isOpen ? "translate-x-0" : "-translate-x-full"
            }`}
        >
            {/* Logo Section */}
            <div className="h-16 flex items-center justify-between px-6 border-b border-[#35363B]">
                <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg bg-[#DC423E] flex items-center justify-center text-[#F5F5F5] font-bold text-lg">
                        Q
                    </div>
                    <span className="text-[#F5F5F5] font-bold text-lg tracking-wide">
                        SmartQueue
                    </span>
                </div>
                <button 
                    onClick={toggleSidebar} 
                    className="md:hidden text-[#A8A8A8] hover:text-[#F5F5F5]"
                >
                    ✕
                </button>
            </div>

            {/* Navigation List */}
            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                {items.map((item, index) => (
                    <NavLink 
                        key={index} 
                        to={item.path}
                        className={({ isActive }) => isActive ? activeStyle : inactiveStyle}
                        onClick={() => {
                            if (window.innerWidth < 768) {
                                toggleSidebar();
                            }
                        }}
                    >
                        <span className="text-xl mr-3">{item.icon}</span>
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Sidebar Footer */}
            <div className="p-4 border-t border-[#35363B] text-center text-xs text-[#707176]">
                Role: <span className="text-[#EFB477] font-semibold">{user.role}</span>
            </div>
        </aside>
    );
};

export default Sidebar;
