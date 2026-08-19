import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAvailableOrganizations } from "../../api/organizationApi";
import { getAvailableServices } from "../../api/serviceApi";
import { getAvailableQueues, joinQueue } from "../../api/queueApi";
import { getTokenStatus } from "../../api/tokenApi";
import Button from "../../components/Button";
import Card from "../../components/Card";
import Loader from "../../components/Loader";
import ErrorMessage from "../../components/ErrorMessage";
import { FiBriefcase, FiLayers, FiMapPin, FiCompass } from "react-icons/fi";

const UserOrganizations = () => {
    const navigate = useNavigate();
    const [organizations, setOrganizations] = useState([]);
    const [selectedOrg, setSelectedOrg] = useState(null);
    const [services, setServices] = useState([]);
    const [selectedService, setSelectedService] = useState(null);
    const [queues, setQueues] = useState([]);

    const [loading, setLoading] = useState(false);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [tokenLoading, setTokenLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        fetchOrgs();
    }, []);

    const fetchOrgs = async () => {
        setLoading(true);
        setError("");
        try {
            const data = await getAvailableOrganizations();
            setOrganizations(data.organizations || []);
        } catch (err) {
            console.error(err);
            setError("Failed to fetch available tenant organizations.");
        } finally {
            setLoading(false);
        }
    };

    const handleSelectOrg = async (org) => {
        setSelectedOrg(org);
        setSelectedService(null);
        setQueues([]);
        setDetailsLoading(true);
        setError("");
        try {
            const data = await getAvailableServices(org._id);
            setServices(data.services || []);
        } catch (err) {
            console.error(err);
            setError("Failed to fetch services for this organization.");
        } finally {
            setDetailsLoading(false);
        }
    };

    const handleSelectService = async (service) => {
        setSelectedService(service);
        setDetailsLoading(true);
        setError("");
        try {
            const data = await getAvailableQueues(selectedOrg._id);
            const filtered = (data.queues || []).filter(
                (q) => q.serviceId === service._id || q.serviceId?._id === service._id
            );
            setQueues(filtered);
        } catch (err) {
            console.error(err);
            setError("Failed to fetch queues for this service.");
        } finally {
            setDetailsLoading(false);
        }
    };

    const handleJoinQueue = async (queueId) => {
        setError("");
        setSuccess("");
        setTokenLoading(true);
        try {
            const data = await joinQueue(queueId);
            const tokenObj = data.token;
            const id = tokenObj.id || tokenObj._id;
            localStorage.setItem("activeTokenId", id);
            setSuccess("Successfully joined queue! Redirecting to ticket monitor...");
            setTimeout(() => {
                navigate("/my-token");
            }, 1500);
        } catch (err) {
            console.error(err);
            if (err.response && err.response.data && err.response.data.token) {
                const id = err.response.data.token._id || err.response.data.token.id;
                localStorage.setItem("activeTokenId", id);
                setSuccess("You already have an active ticket in this queue! Redirecting...");
                setTimeout(() => {
                    navigate("/my-token");
                }, 1500);
            } else {
                if (err.response?.status === 500) {
                    setError("Unable to join queue. Please try again.");
                } else {
                    setError(err.response?.data?.message || "Failed to join queue.");
                }
            }
        } finally {
            setTokenLoading(false);
        }
    };

    if (loading) return <Loader message="Loading active organizations..." fullPage />;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-black text-[#F5F5F5] tracking-tight">Organizations Registry</h1>
                <p className="text-sm text-[#A8A8A8] mt-1">Browse, view services, and join active wait lines.</p>
            </div>

            {error && <ErrorMessage message={error} />}
            {success && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-lg text-xs font-semibold text-center select-none">
                    {success}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Organizations Listing */}
                <div className="lg:col-span-1 space-y-4">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-[#A8A8A8] select-none">
                        Active Organizations
                    </h2>

                    <div className="space-y-4 overflow-y-auto max-h-[70vh] pr-2">
                        {organizations.length === 0 ? (
                            <div className="bg-[#292A2F] border border-[#35363B] p-6 rounded-xl text-center text-xs text-[#707176]">
                                No active organizations registered in the system.
                            </div>
                        ) : (
                            organizations.map((org) => (
                                <div
                                    key={org._id}
                                    onClick={() => handleSelectOrg(org)}
                                    className={`p-5 rounded-xl border transition-all cursor-pointer flex flex-col space-y-2.5 ${
                                        selectedOrg?._id === org._id
                                            ? "bg-[#292A2F] border-[#DC423E] shadow-lg"
                                            : "bg-[#292A2F] border-[#35363B] hover:border-[#707176]"
                                    }`}
                                >
                                    <div className="flex justify-between items-start">
                                        <h3 className="text-sm font-bold text-[#F5F5F5]">{org.name}</h3>
                                        <span className="text-[9px] font-bold text-[#EFB477] uppercase tracking-wide bg-[#EFB477]/10 px-2 py-0.5 rounded-md">
                                            {org.category}
                                        </span>
                                    </div>
                                    <p className="text-xs text-[#A8A8A8] line-clamp-2 leading-relaxed">
                                        {org.description || "No description provided."}
                                    </p>
                                    <div className="flex items-center text-[10px] text-[#707176] font-semibold space-x-1">
                                        <FiMapPin className="text-[#A8A8A8]" />
                                        <span>{org.address}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Services & Queues Panel */}
                <div className="lg:col-span-2 space-y-6">
                    {selectedOrg ? (
                        <div className="space-y-6">
                            {/* Org Header Details */}
                            <div className="bg-[#292A2F] border border-[#35363B] p-6 rounded-xl">
                                <h2 className="text-lg font-bold text-[#F5F5F5]">{selectedOrg.name}</h2>
                                <p className="text-xs text-[#A8A8A8] mt-1.5 leading-relaxed">{selectedOrg.description}</p>
                                <div className="flex items-center text-[10px] text-[#A8A8A8] space-x-4 mt-3 pt-3 border-t border-[#35363B]">
                                    <span className="flex items-center"><FiMapPin className="mr-1.5" /> {selectedOrg.address}</span>
                                    <span className="flex items-center font-mono">
                                        <FiCompass className="mr-1.5" /> Lat: {selectedOrg.location?.latitude?.toFixed(4)}, Lng: {selectedOrg.location?.longitude?.toFixed(4)}
                                    </span>
                                </div>
                            </div>

                            {detailsLoading ? (
                                <Loader message="Fetching organization details..." />
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Services list */}
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#A8A8A8]">
                                            Available Services
                                        </h3>
                                        <div className="space-y-3">
                                            {services.length === 0 ? (
                                                <p className="text-xs text-[#707176]">No services available.</p>
                                            ) : (
                                                services.map((serv) => (
                                                    <div
                                                        key={serv._id}
                                                        onClick={() => handleSelectService(serv)}
                                                        className={`p-4 rounded-lg border cursor-pointer transition-all ${
                                                            selectedService?._id === serv._id
                                                                ? "bg-[#202126] border-[#EFB477]"
                                                                : "bg-[#202126] border-[#35363B] hover:border-[#707176]"
                                                        }`}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs font-bold text-[#F5F5F5]">{serv.name}</span>
                                                            <span className="text-[10px] text-[#707176]">{serv.averageServiceTime} mins</span>
                                                        </div>
                                                        <p className="text-[11px] text-[#A8A8A8] mt-1 leading-normal">
                                                            {serv.description || "Consultation unit."}
                                                        </p>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    {/* Queues list */}
                                    {selectedService && (
                                        <div className="space-y-4">
                                            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#A8A8A8]">
                                                Join wait queue
                                            </h3>
                                            <div className="space-y-3">
                                                {queues.length === 0 ? (
                                                    <p className="text-xs text-[#ED9663]">No active queues currently open for this service.</p>
                                                ) : (
                                                    queues.map((q) => (
                                                        <div
                                                            key={q._id}
                                                            className="bg-[#202126] border border-[#35363B] p-4 rounded-lg flex items-center justify-between"
                                                        >
                                                            <div className="flex flex-col space-y-1">
                                                                <span className="text-xs font-bold text-[#F5F5F5]">{q.name}</span>
                                                                <span className="text-[9px] font-bold text-[#A8A8A8] uppercase">
                                                                    Policy: {q.queuePolicy}
                                                                </span>
                                                            </div>
                                                            <Button
                                                                variant="secondary"
                                                                size="sm"
                                                                onClick={() => handleJoinQueue(q._id)}
                                                                disabled={tokenLoading}
                                                            >
                                                                {tokenLoading ? "Joining..." : "Join"}
                                                            </Button>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-[#292A2F] border border-[#35363B] rounded-xl p-12 text-center flex flex-col items-center justify-center space-y-3">
                            <span className="text-4xl">🏢</span>
                            <h3 className="text-sm font-bold text-[#F5F5F5]">Select an Organization</h3>
                            <p className="text-xs text-[#A8A8A8] max-w-xs">
                                Choose an active tenant from the list on the left to see their consultation services and operational queues.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserOrganizations;
