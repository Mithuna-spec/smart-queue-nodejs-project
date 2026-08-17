import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

const DashboardLayout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    return (
        <div className="min-h-screen bg-[#202126] text-[#F5F5F5] flex">
            {/* Sidebar component */}
            <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

            {/* Backdrop for mobile */}
            {sidebarOpen && (
                <div 
                    onClick={toggleSidebar} 
                    className="fixed inset-0 z-10 bg-black/50 md:hidden"
                />
            )}

            {/* Main content frame */}
            <div className="flex-1 flex flex-col md:pl-64 min-w-0">
                {/* Navbar component */}
                <Navbar toggleSidebar={toggleSidebar} />

                {/* Sub-routing page mount */}
                <main className="flex-1 pt-24 pb-12 px-6 overflow-y-auto">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
