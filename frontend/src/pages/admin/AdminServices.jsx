import React, { useState, useEffect } from "react";
import { getOrganizations } from "../../api/organizationApi";
import { getServicesByOrganization, createService, deleteService } from "../../api/serviceApi";
import Button from "../../components/Button";
import Table from "../../components/Table";
import Modal from "../../components/Modal";
import Input from "../../components/Input";
import Select from "../../components/Select";
import Loader from "../../components/Loader";
import ErrorMessage from "../../components/ErrorMessage";
import { FiPlus, FiTrash2, FiRefreshCw } from "react-icons/fi";

const AdminServices = () => {
    const [organizations, setOrganizations] = useState([]);
    const [selectedOrg, setSelectedOrg] = useState("");
    const [services, setServices] = useState([]);
    
    const [loadingOrgs, setLoadingOrgs] = useState(false);
    const [loadingServices, setLoadingServices] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Modal state for service creation
    const [modalOpen, setModalOpen] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [avgTime, setAvgTime] = useState(15);
    const [apptEnabled, setApptEnabled] = useState("true");
    const [submitLoading, setSubmitLoading] = useState(false);

    useEffect(() => {
        fetchOrgs();
    }, []);

    const fetchOrgs = async () => {
        setLoadingOrgs(true);
        setError("");
        try {
            const data = await getOrganizations();
            setOrganizations(data.organizations || []);
        } catch (err) {
            console.error(err);
            setError("Failed to fetch organizations.");
        } finally {
            setLoadingOrgs(false);
        }
    };

    const fetchServices = async (orgId) => {
        if (!orgId) {
            setServices([]);
            return;
        }
        setLoadingServices(true);
        setError("");
        setSuccess("");
        try {
            const data = await getServicesByOrganization(orgId);
            setServices(data.services || []);
        } catch (err) {
            console.error(err);
            setError("Failed to fetch services for the selected organization.");
        } finally {
            setLoadingServices(false);
        }
    };

    const handleOrgChange = (e) => {
        const orgId = e.target.value;
        setSelectedOrg(orgId);
        fetchServices(orgId);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        if (!name || !selectedOrg) return;

        setSubmitLoading(true);
        try {
            await createService({
                organizationId: selectedOrg,
                name,
                description,
                averageServiceTime: Number(avgTime),
                appointmentEnabled: apptEnabled === "true"
            });
            setSuccess("Service created successfully.");
            setName("");
            setDescription("");
            setAvgTime(15);
            setApptEnabled("true");
            setModalOpen(false);
            await fetchServices(selectedOrg);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to create service.");
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this service?")) return;
        setError("");
        try {
            await deleteService(id);
            setSuccess("Service deleted successfully.");
            await fetchServices(selectedOrg);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to delete service.");
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                <div>
                    <h1 className="text-2xl font-black text-[#F5F5F5] tracking-tight">System Services</h1>
                    <p className="text-sm text-[#A8A8A8] mt-1">Configure and audit services configured under specific organizations.</p>
                </div>
                {selectedOrg && (
                    <div className="flex items-center space-x-3">
                        <Button variant="outline" onClick={() => fetchServices(selectedOrg)} disabled={loadingServices}>
                            <FiRefreshCw className={`mr-2 ${loadingServices ? "animate-spin" : ""}`} /> Refresh
                        </Button>
                        <Button onClick={() => setModalOpen(true)}>
                            <FiPlus className="mr-2" /> Add Service
                        </Button>
                    </div>
                )}
            </div>

            {error && (
                <div className="flex flex-col items-center justify-center space-y-4">
                    <ErrorMessage message={error} />
                    <Button onClick={() => (selectedOrg ? fetchServices(selectedOrg) : fetchOrgs())}>Retry</Button>
                </div>
            )}
            
            {success && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg text-xs font-semibold select-none">
                    {success}
                </div>
            )}

            {/* Filter Section */}
            <div className="bg-[#292A2F] border border-[#35363B] p-6 rounded-xl">
                <Select
                    label="Choose Organization to Manage"
                    value={selectedOrg}
                    onChange={handleOrgChange}
                    placeholder="Choose organization..."
                    options={organizations.map(o => ({ value: o._id, label: o.name }))}
                    disabled={loadingOrgs}
                />
            </div>

            {/* Services Table */}
            {selectedOrg ? (
                <Table 
                    headers={["Service Name", "Description", "Avg. Time", "Appointments", "Actions"]} 
                    loading={loadingServices}
                    emptyMessage="No services defined under this organization."
                >
                    {services.map((s) => (
                        <tr key={s._id} className="border-b border-[#35363B] text-sm text-[#F5F5F5] hover:bg-[#202126]/30">
                            <td className="px-6 py-4 font-bold">{s.name}</td>
                            <td className="px-6 py-4 text-[#A8A8A8]">{s.description || "-"}</td>
                            <td className="px-6 py-4">{s.averageServiceTime} mins</td>
                            <td className="px-6 py-4">
                                <span className={`text-xs font-semibold ${s.appointmentEnabled ? "text-emerald-400" : "text-[#707176]"}`}>
                                    {s.appointmentEnabled ? "Enabled" : "Disabled"}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => handleDelete(s._id)}
                                    className="border-red-500/10 hover:bg-[#BF1F1B]/10 hover:text-[#BF1F1B]"
                                >
                                    <FiTrash2 />
                                </Button>
                            </td>
                        </tr>
                    ))}
                </Table>
            ) : (
                <div className="bg-[#292A2F] border border-[#35363B] rounded-xl p-8 text-center flex flex-col items-center justify-center space-y-2">
                    <span className="text-3xl">🏢</span>
                    <h3 className="text-sm font-bold text-[#F5F5F5]">Filter Required</h3>
                    <p className="text-xs text-[#A8A8A8]">Please select an organization in the dropdown above to manage services.</p>
                </div>
            )}

            {/* Create Service Modal */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create New Service">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Service Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Consulting Consultation"
                        required
                        disabled={submitLoading}
                    />

                    <Input
                        label="Description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Enter short details..."
                        disabled={submitLoading}
                    />

                    <Input
                        label="Average Service Time (minutes)"
                        type="number"
                        value={avgTime}
                        onChange={(e) => setAvgTime(e.target.value)}
                        required
                        disabled={submitLoading}
                    />

                    <Select
                        label="Appointment Booking"
                        value={apptEnabled}
                        onChange={(e) => setApptEnabled(e.target.value)}
                        options={[
                            { value: "true", label: "Enabled" },
                            { value: "false", label: "Disabled" }
                        ]}
                        placeholder={null}
                        disabled={submitLoading}
                    />

                    <div className="flex items-center justify-end space-x-3 pt-2">
                        <Button variant="outline" onClick={() => setModalOpen(false)} disabled={submitLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={submitLoading}>
                            {submitLoading ? "Creating..." : "Create"}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default AdminServices;
