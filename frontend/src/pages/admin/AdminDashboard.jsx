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
import { FiPlus, FiBriefcase, FiGrid, FiUsers } from "react-icons/fi";

const AdminDashboard = () => {
    const [organizations, setOrganizations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Modal state for organization creation
    const [modalOpen, setModalOpen] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [address, setAddress] = useState("");
    const [category, setCategory] = useState("BANK");
    const [ownerId, setOwnerId] = useState(""); // paste owner userId
    const [submitLoading, setSubmitLoading] = useState(false);

    useEffect(() => {
        fetchOrgs();
    }, []);

    const fetchOrgs = async () => {
        setLoading(true);
        setError("");
        try {
            const data = await getOrganizations();
            setOrganizations(data.organizations || []);
        } catch (err) {
            console.error(err);
            setError("Failed to fetch system-wide organizations.");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        if (!name || !address || !ownerId) return;

        setSubmitLoading(true);
        try {
            await createOrganization({
                name,
                description,
                address,
                category,
                owner: ownerId
            });
            setSuccess("Organization created successfully.");
            setName("");
            setDescription("");
            setAddress("");
            setCategory("BANK");
            setOwnerId("");
            setModalOpen(false);
            await fetchOrgs();
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to create organization. Ensure Owner ID is valid.");
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
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg text-xs font-semibold select-none">
                    {success}
                </div>
            )}

            {/* General System Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                    title="Total Tenants" 
                    value={organizations.length} 
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
                    headers={["Name", "Category", "Address", "Owner ID", "Status"]} 
                    loading={loading}
                    emptyMessage="No organizations registered in the system."
                >
                    {organizations.map((org) => (
                        <tr key={org._id} className="border-b border-[#35363B] text-sm text-[#F5F5F5] hover:bg-[#202126]/30">
                            <td className="px-6 py-4 font-bold">{org.name}</td>
                            <td className="px-6 py-4 font-semibold text-[#EFB477]">{org.category}</td>
                            <td className="px-6 py-4 text-[#A8A8A8]">{org.address}</td>
                            <td className="px-6 py-4 text-xs font-mono text-[#707176]">{org.owner}</td>
                            <td className="px-6 py-4">
                                <span className={`text-xs font-semibold ${org.status === "ACTIVE" ? "text-emerald-400" : "text-[#BF1F1B]"}`}>
                                    {org.status}
                                </span>
                            </td>
                        </tr>
                    ))}
                </Table>
            </div>

            {/* Create Org Modal */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Register Tenant Organization">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Organization Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Metro Bank Corporate"
                        required
                        disabled={submitLoading}
                    />

                    <Input
                        label="Description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Business consultation unit..."
                        disabled={submitLoading}
                    />

                    <Input
                        label="Address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="123 Financial Row, City"
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

                    <Input
                        label="Owner User ID (MongoDB ID)"
                        value={ownerId}
                        onChange={(e) => setOwnerId(e.target.value)}
                        placeholder="Paste the registered user's MongoDB ID"
                        required
                        disabled={submitLoading}
                    />

                    <div className="flex items-center justify-end space-x-3 pt-2">
                        <Button variant="outline" onClick={() => setModalOpen(false)} disabled={submitLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={submitLoading}>
                            {submitLoading ? "Registering..." : "Register"}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default AdminDashboard;
