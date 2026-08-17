import React, { useState, useEffect } from "react";
import { useOrg } from "../../hooks/useOrg";
import { getServicesByOrganization, createService, deleteService } from "../../api/serviceApi";
import Button from "../../components/Button";
import Table from "../../components/Table";
import Modal from "../../components/Modal";
import Input from "../../components/Input";
import Select from "../../components/Select";
import Loader from "../../components/Loader";
import ErrorMessage from "../../components/ErrorMessage";
import { FiPlus, FiTrash2 } from "react-icons/fi";

const OrgServices = () => {
    const { orgId } = useOrg();
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Form modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [avgTime, setAvgTime] = useState(15);
    const [apptEnabled, setApptEnabled] = useState("true");
    const [submitLoading, setSubmitLoading] = useState(false);

    useEffect(() => {
        if (orgId) {
            fetchServices();
        }
    }, [orgId]);

    const fetchServices = async () => {
        setLoading(true);
        try {
            const data = await getServicesByOrganization(orgId);
            setServices(data.services || []);
        } catch (err) {
            console.error(err);
            setError("Failed to fetch services list.");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        if (!name) return;

        setSubmitLoading(true);
        try {
            await createService({
                organizationId: orgId,
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
            await fetchServices();
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
            await fetchServices();
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
                <Button onClick={() => setModalOpen(true)}>
                    <FiPlus className="mr-2" /> Add Service
                </Button>
            </div>

            {error && <ErrorMessage message={error} />}
            {success && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg text-xs font-semibold select-none">
                    {success}
                </div>
            )}

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

            {/* Create Service Modal */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create New Service">
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
                            {submitLoading ? "Creating..." : "Create"}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default OrgServices;
