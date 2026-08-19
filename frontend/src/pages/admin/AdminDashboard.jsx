import React, { useState, useEffect } from "react";
import { getOrganizations, createOrganization } from "../../api/organizationApi";
import Button from "../../components/Button";
import Table from "../../components/Table";
import Modal from "../../components/Modal";
import Input from "../../components/Input";
import Select from "../../components/Select";
import Loader from "../../components/Loader";
import ErrorMessage from "../../components/ErrorMessage";
import StatCard from "../../components/StatCard";
import Pagination from "../../components/Pagination";
import StatusBadge from "../../components/StatusBadge";
import { FiPlus, FiBriefcase, FiGrid, FiUsers, FiCompass, FiMapPin, FiMail, FiPhone } from "react-icons/fi";

const AdminDashboard = () => {
    const [organizations, setOrganizations] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Modal state for organization creation
    const [modalOpen, setModalOpen] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [address, setAddress] = useState("");
    const [category, setCategory] = useState("BANK");
    const [latitude, setLatitude] = useState("");
    const [longitude, setLongitude] = useState("");

    // Owner Account fields
    const [ownerName, setOwnerName] = useState("");
    const [ownerEmail, setOwnerEmail] = useState("");
    const [ownerPhone, setOwnerPhone] = useState("");
    const [ownerPassword, setOwnerPassword] = useState("");

    const [submitLoading, setSubmitLoading] = useState(false);

    useEffect(() => {
        fetchOrgs(page);
    }, [page]);

    const fetchOrgs = async (targetPage) => {
        setLoading(true);
        setError("");
        try {
            const data = await getOrganizations(targetPage, 5);
            setOrganizations(data.organizations || []);
            setPage(data.pagination?.page || 1);
            setTotalPages(data.pagination?.totalPages || 1);
            setTotalRecords(data.pagination?.total || 0);
        } catch (err) {
            console.error(err);
            setError("Failed to fetch system-wide organizations.");
        } finally {
            setLoading(false);
        }
    };

    const handleUseCurrentLocation = () => {
        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your browser.");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLatitude(position.coords.latitude);
                setLongitude(position.coords.longitude);
                setSuccess("Fetched current coordinates successfully.");
                setTimeout(() => setSuccess(""), 3000);
            },
            (err) => {
                console.error("Geolocation error:", err);
                setError("Unable to retrieve coordinates automatically. Please input manually.");
            }
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!name || !address || !latitude || !longitude || !ownerName || !ownerEmail || !ownerPhone || !ownerPassword) {
            setError("All organization and owner account details are required.");
            return;
        }

        setSubmitLoading(true);
        try {
            await createOrganization({
                name,
                description,
                address,
                category,
                location: {
                    latitude: Number(latitude),
                    longitude: Number(longitude)
                },
                account: {
                    name: ownerName,
                    email: ownerEmail,
                    phone: ownerPhone,
                    password: ownerPassword
                }
            });
            setSuccess("Organization and Owner Account created successfully.");
            
            // Reset form
            setName("");
            setDescription("");
            setAddress("");
            setCategory("BANK");
            setLatitude("");
            setLongitude("");
            setOwnerName("");
            setOwnerEmail("");
            setOwnerPhone("");
            setOwnerPassword("");
            
            setModalOpen(false);
            await fetchOrgs(1);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to create organization.");
        } finally {
            setSubmitLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-[#F5F5F5] tracking-tight">Admin System Console</h1>
                    <p className="text-sm text-[#A8A8A8] mt-1">Oversight and management of all registered tenant organizations.</p>
                </div>
                <Button onClick={() => setModalOpen(true)}>
                    <FiPlus className="mr-2" /> Register Organization
                </Button>
            </div>

            {error && <ErrorMessage message={error} />}
            {success && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg text-xs font-semibold select-none text-center">
                    {success}
                </div>
            )}

            {/* General System Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                    title="Total Tenants" 
                    value={totalRecords} 
                    icon={<FiBriefcase />} 
                    description="Registered organizations" 
                />
                <StatCard 
                    title="System Status" 
                    value="ACTIVE" 
                    icon={<FiGrid className="text-emerald-400" />} 
                    description="Backend server is running" 
                />
                <StatCard 
                    title="Security Clearance" 
                    value="ROOT" 
                    icon={<FiUsers className="text-[#EFB477]" />} 
                    description="System Administrator permissions" 
                />
            </div>

            {/* Organizations Table */}
            <div className="space-y-4">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-[#A8A8A8] select-none">Registered Organizations</h2>
                
                <Table 
                    headers={["Organization", "Category", "Location / Coordinates", "Owner Account Info", "Status"]} 
                    loading={loading}
                    emptyMessage="No organizations registered in the system."
                >
                    {organizations.map((org) => {
                        const ownerObj = org.owner || {};
                        return (
                            <tr key={org._id} className="border-b border-[#35363B] text-sm text-[#F5F5F5] hover:bg-[#202126]/30">
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="font-bold">{org.name}</span>
                                        <span className="text-xs text-[#707176]">{org.description || "No description"}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 font-semibold text-[#EFB477]">{org.category}</td>
                                <td className="px-6 py-4 text-[#A8A8A8] text-xs">
                                    <div className="flex flex-col space-y-1">
                                        <span className="flex items-center"><FiMapPin className="mr-1" /> {org.address}</span>
                                        <span className="font-mono text-[10px] text-[#707176]">Lat: {org.location?.latitude?.toFixed(4)}, Lng: {org.location?.longitude?.toFixed(4)}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-[#A8A8A8] text-xs">
                                    <div className="flex flex-col space-y-1">
                                        <span className="font-bold text-[#F5F5F5]">{ownerObj.name || "N/A"}</span>
                                        <span className="flex items-center"><FiMail className="mr-1 text-[10px]" /> {ownerObj.email || "N/A"}</span>
                                        <span className="flex items-center"><FiPhone className="mr-1 text-[10px]" /> {ownerObj.phone || "N/A"}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <StatusBadge status={org.status} />
                                </td>
                            </tr>
                        );
                    })}
                </Table>

                <Pagination 
                    currentPage={page}
                    totalPages={totalPages}
                    totalRecords={totalRecords}
                    onPageChange={(p) => setPage(p)}
                    limit={5}
                />
            </div>

            {/* Create Org Modal */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Register Tenant Organization" size="lg">
                <form onSubmit={handleSubmit} className="space-y-6 max-h-[75vh] overflow-y-auto pr-2">
                    {/* Organization details */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-[#EFB477] uppercase tracking-wider">1. Organization Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Organization Name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Metro Bank Corporate"
                                required
                                disabled={submitLoading}
                            />
                            <Select
                                label="Category"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                placeholder={null}
                                options={[
                                    "HOSPITAL",
                                    "COLLEGE",
                                    "GOVERNMENT",
                                    "BANK",
                                    "SERVICE_CENTER",
                                    "OTHER"
                                ]}
                                required
                                disabled={submitLoading}
                            />
                        </div>

                        <Input
                            label="Description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Business consultation unit..."
                            disabled={submitLoading}
                        />

                        <Input
                            label="Physical Address"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="123 Financial Row, City"
                            required
                            disabled={submitLoading}
                        />

                        {/* Location Coordinates */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-[#A8A8A8] select-none block">
                                Location Coordinates
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Input
                                    label="Latitude"
                                    type="number"
                                    step="any"
                                    value={latitude}
                                    onChange={(e) => setLatitude(e.target.value)}
                                    placeholder="e.g. 40.7128"
                                    required
                                    disabled={submitLoading}
                                />
                                <Input
                                    label="Longitude"
                                    type="number"
                                    step="any"
                                    value={longitude}
                                    onChange={(e) => setLongitude(e.target.value)}
                                    placeholder="e.g. -74.0060"
                                    required
                                    disabled={submitLoading}
                                />
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleUseCurrentLocation}
                                disabled={submitLoading}
                                className="mt-1 text-xs font-semibold"
                            >
                                <FiCompass className="mr-1.5" /> Fetch Geolocation Automatically
                            </Button>
                        </div>
                    </div>

                    {/* Owner account details */}
                    <div className="space-y-4 border-t border-[#35363B] pt-4">
                        <h3 className="text-xs font-bold text-[#EFB477] uppercase tracking-wider">2. Owner Account Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Owner Full Name"
                                value={ownerName}
                                onChange={(e) => setOwnerName(e.target.value)}
                                placeholder="e.g. John Doe"
                                required
                                disabled={submitLoading}
                            />
                            <Input
                                label="Email (Username)"
                                type="email"
                                value={ownerEmail}
                                onChange={(e) => setOwnerEmail(e.target.value)}
                                placeholder="owner@organization.com"
                                required
                                disabled={submitLoading}
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Mobile Number"
                                type="tel"
                                value={ownerPhone}
                                onChange={(e) => setOwnerPhone(e.target.value)}
                                placeholder="e.g. +1234567890"
                                required
                                disabled={submitLoading}
                            />
                            <Input
                                label="Password"
                                type="password"
                                value={ownerPassword}
                                onChange={(e) => setOwnerPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                disabled={submitLoading}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[#35363B]">
                        <Button variant="outline" onClick={() => setModalOpen(false)} disabled={submitLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={submitLoading}>
                            {submitLoading ? "Registering..." : "Register Organization"}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default AdminDashboard;
