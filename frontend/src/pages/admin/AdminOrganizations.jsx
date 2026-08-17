import React, { useState, useEffect } from "react";
import { getOrganizations, createOrganization } from "../../api/organizationApi";
import Button from "../../components/Button";
import Table from "../../components/Table";
import Modal from "../../components/Modal";
import Input from "../../components/Input";
import Select from "../../components/Select";
import StatusBadge from "../../components/StatusBadge";
import Loader from "../../components/Loader";
import ErrorMessage from "../../components/ErrorMessage";
import { FiPlus, FiRefreshCw } from "react-icons/fi";

const AdminOrganizations = () => {
    const [organizations, setOrganizations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Modal state for registration
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
        setSuccess("");
        try {
            const data = await getOrganizations();
            setOrganizations(data.organizations || []);
        } catch (err) {
            console.error(err);
            setError("Failed to fetch system organizations.");
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
                    <h1 className="text-2xl font-black text-[#F5F5F5] tracking-tight">System Organizations</h1>
                    <p className="text-sm text-[#A8A8A8] mt-1">Oversight of all active tenant organizations.</p>
                </div>
                <div className="flex items-center space-x-3">
                    <Button variant="outline" onClick={fetchOrgs} disabled={loading}>
                        <FiRefreshCw className={`mr-2 ${loading ? "animate-spin" : ""}`} /> Refresh
                    </Button>
                    <Button onClick={() => setModalOpen(true)}>
                        <FiPlus className="mr-2" /> Register Organization
                    </Button>
                </div>
            </div>

            {error && (
                <div className="flex flex-col items-center justify-center space-y-4">
                    <ErrorMessage message={error} />
                    <Button onClick={fetchOrgs}>Retry Connection</Button>
                </div>
            )}
            
            {success && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg text-xs font-semibold select-none">
                    {success}
                </div>
            )}

            {!error && (
                <Table 
                    headers={["Name", "Category", "Address", "Owner ID", "Status", "Created Date"]} 
                    loading={loading}
                    emptyMessage="No organizations registered in the system."
                >
                    {organizations.map((org) => {
                        const dateStr = org.createdAt ? new Date(org.createdAt).toLocaleDateString() : "-";
                        return (
                            <tr key={org._id} className="border-b border-[#35363B] text-sm text-[#F5F5F5] hover:bg-[#202126]/30">
                                <td className="px-6 py-4 font-bold">{org.name}</td>
                                <td className="px-6 py-4 font-semibold text-[#EFB477]">{org.category}</td>
                                <td className="px-6 py-4 text-[#A8A8A8]">{org.address}</td>
                                <td className="px-6 py-4 text-xs font-mono text-[#707176]">{org.owner}</td>
                                <td className="px-6 py-4">
                                    <StatusBadge status={org.status} />
                                </td>
                                <td className="px-6 py-4 text-xs text-[#A8A8A8]">{dateStr}</td>
                            </tr>
                        );
                    })}
                </Table>
            )}

            {/* Create Org Modal */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Register Tenant Organization">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Organization Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Health Consult Group"
                        required
                        disabled={submitLoading}
                    />

                    <Input
                        label="Description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Organization unit details..."
                        disabled={submitLoading}
                    />

                    <Input
                        label="Address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="123 Hospital Lane, City"
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

export default AdminOrganizations;
