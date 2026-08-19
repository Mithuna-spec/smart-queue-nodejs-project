import React from "react";
import { useAuth } from "../../context/AuthContext";
import Card from "../../components/Card";
import { FiUser, FiMail, FiPhone, FiInfo } from "react-icons/fi";

const UserProfile = () => {
    const { user } = useAuth();

    return (
        <div className="space-y-8 max-w-2xl mx-auto">
            <div>
                <h1 className="text-2xl font-black text-[#F5F5F5] tracking-tight">Account Profile</h1>
                <p className="text-sm text-[#A8A8A8] mt-1">Details of your user account details and mobile settings.</p>
            </div>

            <Card className="p-8 space-y-6">
                <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-full bg-[#35363B] flex items-center justify-center text-[#EFB477] text-3xl font-bold">
                        {user?.name?.charAt(0) || "U"}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-[#F5F5F5]">{user?.name}</h2>
                        <span className="text-xs font-semibold px-2 py-0.5 bg-[#EFB477]/10 border border-[#EFB477]/20 text-[#EFB477] rounded-md uppercase tracking-wider mt-1 inline-block">
                            {user?.role}
                        </span>
                    </div>
                </div>

                <div className="border-t border-[#35363B] pt-6 space-y-4">
                    <div className="flex items-center space-x-3 text-sm">
                        <FiMail className="text-[#A8A8A8]" />
                        <span className="text-[#A8A8A8]">Email:</span>
                        <span className="text-[#F5F5F5] font-semibold">{user?.email}</span>
                    </div>

                    <div className="flex items-center space-x-3 text-sm">
                        <FiPhone className="text-[#A8A8A8]" />
                        <span className="text-[#A8A8A8]">Mobile Phone:</span>
                        <span className="text-[#F5F5F5] font-semibold">{user?.phone || "N/A"}</span>
                    </div>

                    <div className="flex items-center space-x-3 text-sm">
                        <FiInfo className="text-[#A8A8A8]" />
                        <span className="text-[#A8A8A8]">Account Status:</span>
                        <span className="text-emerald-400 font-semibold uppercase">{user?.status || "ACTIVE"}</span>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default UserProfile;
