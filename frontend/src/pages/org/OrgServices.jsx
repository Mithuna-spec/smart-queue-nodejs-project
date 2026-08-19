import React, { useState, useEffect } from "react";
import { useOrg } from "../../hooks/useOrg";
import { getServicesByOrganization, createService, updateService, deleteService } from "../../api/serviceApi";
import Button from "../../components/Button";
import Table from "../../components/Table";
import Modal from "../../components/Modal";
import Input from "../../components/Input";
import Select from "../../components/Select";
import Loader from "../../components/Loader";
import ErrorMessage from "../../components/ErrorMessage";
import Pagination from "../../components/Pagination";
import { FiPlus, FiTrash2, FiEdit2 } from "react-icons/fi";

const OrgServices = () => {
    const { orgId } = useOrg();
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Pagination state
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    // Modal creation/edit states
    const [modalOpen, setModalOpen] = useState(false);
    const [editingService, setEditingService] = useState(null);
    
    // Form fields
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [avgTime, setAvgTime] = useState(15);
    const [apptEnabled, setApptEnabled] = useState("true");
    const [submitLoading, setSubmitLoading] = useState(false);

    useEffect(() => {
        if (orgId) {
            fetchServices(page);
        }
    }, [orgId, page]);

    const fetchServices = async (targetPage) => {
        setLoading(true);
        setError("");
        try {
            const data = await getServicesByOrganization(orgId, targetPage, 5);
            setServices(data.services || []);
            setPage(data.pagination?.page || 1);
            setTotalPages(data.pagination?.totalPages || 1);
            setTotalRecords(data.pagination?.total || 0);
        } catch (err) {
            console.error(err);
            setError("Failed to fetch services list.");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCreate = () => {
        setEditingService(null);
        setName("");
        setDescription("");
        setAvgTime(15);
        setApptEnabled("true");
        setModalOpen(true);
    };

    const handleOpenEdit = (s) => {
        setEditingService(s);
        setName(s.name || "");
        setDescription(s.description || "");
        setAvgTime(s.averageServiceTime || 15);
        setApptEnabled(s.appointmentEnabled ? "true" : "false");
        setModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        if (!name) return;

        setSubmitLoading(true);
        try {
            const payload = {
                organizationId: orgId,
                name,
                description,
                averageServiceTime: Number(avgTime),
                appointmentEnabled: apptEnabled === "true"
            };

            if (editingService) {
                await updateService(editingService._id, payload);
                setSuccess("Service updated successfully.");
            } else {
                await createService(payload);
                setSuccess("Service created successfully.");
            }

            setName("");
            setDescription("");
            setAvgTime(15);
            setApptEnabled("true");
            setModalOpen(false);
            setEditingService(null);
            await fetchServices(editingService ? page : 1);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to save service details.");
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this service?")) return;
        setError("");
        setSuccess("");
        try {
            await deleteService(id);
            setSuccess("Service deleted successfully.");
            await fetchServices(page);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to delete service.");
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-[#F5F5F5] tracking-tight">Services</h1>
                    <p className="text-sm text-[#A8A8A8] mt-1">Configure and manage services provided by your organization.</p>
                </div>
                <Button onClick={handleOpenCreate}>
                    <FiPlus className="mr-2" /> Add Service
                </Button>
            </div>

            {error && <ErrorMessage message={error} />}
            {success && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg text-xs font-semibold select-none text-center">
                    {success}
                </div>
            )}

            <div className="space-y-4">
                <Table 
                    headers={["Service Name", "Description", "Avg. Time", "Appointments", "Actions"]} 
                    loading={loading}
                    emptyMessage="No services defined yet."
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
                                <div className="flex items-center space-x-3">
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={() => handleOpenEdit(s)}
                                    >
                                        <FiEdit2 />
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={() => handleDelete(s._id)}
                                        className="border-red-500/10 hover:bg-[#BF1F1B]/10 hover:text-[#BF1F1B]"
                                    >
                                        <FiTrash2 />
                                    </Button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </Table>

                <Pagination 
                    currentPage={page}
                    totalPages={totalPages}
                    totalRecords={totalRecords}
                    onPageChange={(p) => setPage(p)}
                    limit={5}
                />
            </div>

            {/* Create/Edit Service Modal */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingService ? "Edit Service" : "Create New Service"}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Service Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Card Consultation"
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
                            {submitLoading ? "Saving..." : (editingService ? "Save" : "Create")}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default OrgServices;
