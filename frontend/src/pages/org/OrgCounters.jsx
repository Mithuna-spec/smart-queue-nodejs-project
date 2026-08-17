import React, { useState, useEffect } from "react";
import { useOrg } from "../../hooks/useOrg";
import { getCountersByOrganization, createCounter, updateCounterStatus } from "../../api/counterApi";
import { getServicesByOrganization } from "../../api/serviceApi";
import { getOrganizationStaff } from "../../api/organizationStaffApi";
import Button from "../../components/Button";
import Table from "../../components/Table";
import Modal from "../../components/Modal";
import Input from "../../components/Input";
import Select from "../../components/Select";
import StatusBadge from "../../components/StatusBadge";
import Loader from "../../components/Loader";
import ErrorMessage from "../../components/ErrorMessage";
import { FiPlus, FiPower } from "react-icons/fi";

const OrgCounters = () => {
    const { orgId } = useOrg();
    const [counters, setCounters] = useState([]);
    const [services, setServices] = useState([]);
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [name, setName] = useState("");
    const [serviceId, setServiceId] = useState("");
    const [counterNumber, setCounterNumber] = useState(1);
    const [submitLoading, setSubmitLoading] = useState(false);

    useEffect(() => {
        if (orgId) {
            fetchCountersAndDetails();
        }
    }, [orgId]);

    const fetchCountersAndDetails = async () => {
        setLoading(true);
        try {
            const [countersRes, servicesRes, staffRes] = await Promise.all([
                getCountersByOrganization(orgId),
                getServicesByOrganization(orgId),
                getOrganizationStaff(orgId)
            ]);
            setCounters(countersRes.counters || []);
            setServices(servicesRes.services || []);
            setStaff(staffRes.staff || []);
        } catch (err) {
            console.error(err);
            setError("Failed to fetch counters or services.");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        if (!name || !serviceId) return;

        setSubmitLoading(true);
        try {
            await createCounter({
                organizationId: orgId,
                serviceId,
                name,
                counterNumber: Number(counterNumber)
            });
            setSuccess("Counter created successfully.");
            setName("");
            setServiceId("");
            setCounterNumber(counters.length + 2);
            setModalOpen(false);
            await fetchCountersAndDetails();
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to create counter.");
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleToggleStatus = async (counter) => {
        setError("");
        const nextStatus = counter.status === "OFFLINE" ? "AVAILABLE" : "OFFLINE";
        try {
            await updateCounterStatus(counter._id, nextStatus);
            setSuccess(`Counter ${counter.name} is now ${nextStatus}.`);
            await fetchCountersAndDetails();
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to update status.");
        }
    };

    const getServiceName = (sId) => {
        const serv = services.find(s => s._id === sId || s._id === sId?._id);
        return serv ? serv.name : "N/A";
    };

    const getStaffName = (staffObj) => {
        if (!staffObj) return "Unassigned";
        // If populated user details exist
        if (staffObj.name) return staffObj.name;
        // Search in local staff details list
        const matched = staff.find(s => s.userId?._id === staffObj || s.userId === staffObj);
        return matched ? matched.userId.name : "Unassigned";
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-[#F5F5F5] tracking-tight">Counters</h1>
                    <p className="text-sm text-[#A8A8A8] mt-1">Configure counters and set their status to manage user calls.</p>
                </div>
                <Button onClick={() => setModalOpen(true)}>
                    <FiPlus className="mr-2" /> Add Counter
                </Button>
            </div>

            {error && <ErrorMessage message={error} />}
            {success && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg text-xs font-semibold select-none">
                    {success}
                </div>
            )}

            <Table 
                headers={["Number", "Counter Name", "Service", "Assigned Staff", "Status", "Actions"]} 
                loading={loading}
                emptyMessage="No counters defined yet."
            >
                {counters.map((c) => (
                    <tr key={c._id} className="border-b border-[#35363B] text-sm text-[#F5F5F5] hover:bg-[#202126]/30">
                        <td className="px-6 py-4 font-extrabold">{c.counterNumber}</td>
                        <td className="px-6 py-4 font-semibold">{c.name}</td>
                        <td className="px-6 py-4 text-[#A8A8A8]">{getServiceName(c.serviceId)}</td>
                        <td className="px-6 py-4">
                            <span className={`font-medium ${getStaffName(c.assignedStaff) !== "Unassigned" ? "text-[#EFB477]" : "text-[#707176]"}`}>
                                {getStaffName(c.assignedStaff)}
                            </span>
                        </td>
                        <td className="px-6 py-4">
                            <StatusBadge status={c.status} />
                        </td>
                        <td className="px-6 py-4">
                            <Button 
                                variant={c.status === "OFFLINE" ? "secondary" : "outline"} 
                                size="sm" 
                                onClick={() => handleToggleStatus(c)}
                                className={c.status !== "OFFLINE" ? "border-amber-500/20 hover:bg-[#ED9663]/10 hover:text-[#ED9663]" : ""}
                            >
                                <FiPower className="mr-1.5" /> 
                                {c.status === "OFFLINE" ? "Go Online" : "Go Offline"}
                            </Button>
                        </td>
                    </tr>
                ))}
            </Table>

            {/* Create Counter Modal */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create New Counter">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Counter Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Counter 1 - Reception"
                        required
                        disabled={submitLoading}
                    />

                    <Select
                        label="Assigned Service"
                        value={serviceId}
                        onChange={(e) => setServiceId(e.target.value)}
                        placeholder="Select service..."
                        options={services.map(s => ({ value: s._id, label: s.name }))}
                        required
                        disabled={submitLoading}
                    />

                    <Input
                        label="Counter Number"
                        type="number"
                        value={counterNumber}
                        onChange={(e) => setCounterNumber(e.target.value)}
                        required
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

export default OrgCounters;
