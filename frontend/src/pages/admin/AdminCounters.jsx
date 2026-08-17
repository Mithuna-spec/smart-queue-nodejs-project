import React, { useState, useEffect } from "react";
import { getOrganizations } from "../../api/organizationApi";
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
import { FiPlus, FiPower, FiRefreshCw } from "react-icons/fi";

const AdminCounters = () => {
    const [organizations, setOrganizations] = useState([]);
    const [selectedOrg, setSelectedOrg] = useState("");
    const [counters, setCounters] = useState([]);
    const [services, setServices] = useState([]);
    const [staff, setStaff] = useState([]);
    
    const [loadingOrgs, setLoadingOrgs] = useState(false);
    const [loadingCounters, setLoadingCounters] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Modal state for counter creation
    const [modalOpen, setModalOpen] = useState(false);
    const [name, setName] = useState("");
    const [serviceId, setServiceId] = useState("");
    const [counterNumber, setCounterNumber] = useState(1);
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

    const fetchCountersAndDetails = async (orgId) => {
        if (!orgId) {
            setCounters([]);
            setServices([]);
            setStaff([]);
            return;
        }
        setLoadingCounters(true);
        setError("");
        setSuccess("");
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
            setError("Failed to fetch counters, services, or staff details.");
        } finally {
            setLoadingCounters(false);
        }
    };

    const handleOrgChange = (e) => {
        const orgId = e.target.value;
        setSelectedOrg(orgId);
        fetchCountersAndDetails(orgId);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        if (!name || !serviceId || !selectedOrg) return;

        setSubmitLoading(true);
        try {
            await createCounter({
                organizationId: selectedOrg,
                serviceId,
                name,
                counterNumber: Number(counterNumber)
            });
            setSuccess("Counter created successfully.");
            setName("");
            setServiceId("");
            setCounterNumber(counters.length + 2);
            setModalOpen(false);
            await fetchCountersAndDetails(selectedOrg);
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
            await fetchCountersAndDetails(selectedOrg);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to update counter status.");
        }
    };

    const getServiceName = (sId) => {
        const serv = services.find(s => s._id === sId || s._id === sId?._id);
        return serv ? serv.name : "N/A";
    };

    const getStaffName = (staffObj) => {
        if (!staffObj) return "Unassigned";
        if (staffObj.name) return staffObj.name;
        
        const matched = staff.find(s => s.userId?._id === staffObj || s.userId === staffObj);
        return matched ? matched.userId.name : "Unassigned";
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                <div>
                    <h1 className="text-2xl font-black text-[#F5F5F5] tracking-tight">System Counters</h1>
                    <p className="text-sm text-[#A8A8A8] mt-1">Audit active service counters and desks configured per organization.</p>
                </div>
                {selectedOrg && (
                    <div className="flex items-center space-x-3">
                        <Button variant="outline" onClick={() => fetchCountersAndDetails(selectedOrg)} disabled={loadingCounters}>
                            <FiRefreshCw className={`mr-2 ${loadingCounters ? "animate-spin" : ""}`} /> Refresh
                        </Button>
                        <Button onClick={() => setModalOpen(true)}>
                            <FiPlus className="mr-2" /> Add Counter
                        </Button>
                    </div>
                )}
            </div>

            {error && (
                <div className="flex flex-col items-center justify-center space-y-4">
                    <ErrorMessage message={error} />
                    <Button onClick={() => (selectedOrg ? fetchCountersAndDetails(selectedOrg) : fetchOrgs())}>Retry</Button>
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

            {/* Counters Table */}
            {selectedOrg ? (
                <Table 
                    headers={["Number", "Counter Name", "Service", "Assigned Staff", "Status", "Actions"]} 
                    loading={loadingCounters}
                    emptyMessage="No counters defined under this organization."
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
            ) : (
                <div className="bg-[#292A2F] border border-[#35363B] rounded-xl p-8 text-center flex flex-col items-center justify-center space-y-2">
                    <span className="text-3xl">🏢</span>
                    <h3 className="text-sm font-bold text-[#F5F5F5]">Filter Required</h3>
                    <p className="text-xs text-[#A8A8A8]">Please select an organization in the dropdown above to manage counters.</p>
                </div>
            )}

            {/* Create Counter Modal */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create New Counter">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Counter Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Reception Consultation Desk"
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

export default AdminCounters;
