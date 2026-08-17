import React from "react";
import { useAuth } from "../context/AuthContext";
import { FiMenu, FiLogOut, FiUser } from "react-icons/fi";

const Navbar = ({ toggleSidebar }) => {
    const { user, logoutUser } = useAuth();

    return (
        <header className="h-16 bg-[#202126] border-b border-[#35363B] fixed top-0 right-0 left-0 md:left-64 z-10 flex items-center justify-between px-6">
            {/* Hamburger Button for mobile */}
            <button 
                onClick={toggleSidebar} 
                className="md:hidden text-[#A8A8A8] hover:text-[#F5F5F5] p-2 rounded-lg hover:bg-[#292A2F] transition-all"
            >
                <FiMenu size={20} />
            </button>

            {/* Title / Filler */}
            <div className="hidden sm:block text-[#A8A8A8] text-sm">
                Smart Queue System Backend Integration Ready
            </div>

            {/* Profile & Logout Action */}
            {user && (
                <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-[#35363B] flex items-center justify-center text-[#EFB477]">
                            <FiUser size={16} />
                        </div>
                        <div className="flex flex-col text-right">
                            <span className="text-[#F5F5F5] text-sm font-semibold leading-none">{user.name}</span>
                            <span className="text-[#707176] text-xs mt-0.5">{user.email}</span>
                        </div>
                    </div>

                    <button 
                        onClick={logoutUser}
                        className="flex items-center space-x-2 text-[#A8A8A8] hover:text-[#BF1F1B] px-3 py-2 rounded-lg hover:bg-[#292A2F] transition-all text-sm font-medium"
                        title="Sign Out"
                    >
                        <FiLogOut size={16} />
                        <span className="hidden md:inline">Sign Out</span>
                    </button>
                </div>
            )}
        </header>
    );
};

export default Navbar;
