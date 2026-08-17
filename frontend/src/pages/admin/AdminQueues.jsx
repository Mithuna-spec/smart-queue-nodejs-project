import React, { useState, useEffect } from "react";
import { getOrganizations } from "../../api/organizationApi";
import { getQueuesByOrganization, createQueue, updateQueuePolicy } from "../../api/queueApi";
import { getServicesByOrganization } from "../../api/serviceApi";
import Button from "../../components/Button";
import Table from "../../components/Table";
import Modal from "../../components/Modal";
import Input from "../../components/Input";
import Select from "../../components/Select";
import StatusBadge from "../../components/StatusBadge";
import Loader from "../../components/Loader";
import ErrorMessage from "../../components/ErrorMessage";
import { FiPlus, FiSettings, FiRefreshCw } from "react-icons/fi";

const AdminQueues = () => {
    const [organizations, setOrganizations] = useState([]);
    const [selectedOrg, setSelectedOrg] = useState("");
    const [queues, setQueues] = useState([]);
    const [services, setServices] = useState([]);
    
    const [loadingOrgs, setLoadingOrgs] = useState(false);
    const [loadingQueues, setLoadingQueues] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Modal state for creation
    const [createOpen, setCreateOpen] = useState(false);
    const [name, setName] = useState("");
    const [serviceId, setServiceId] = useState("");
    const [policy, setPolicy] = useState("FIFO");
    const [submitLoading, setSubmitLoading] = useState(false);

    // Modal state for policy edit
    const [policyOpen, setPolicyOpen] = useState(false);
    const [selectedQueue, setSelectedQueue] = useState(null);
    const [selectedPolicy, setSelectedPolicy] = useState("FIFO");
    const [priorityOrder, setPriorityOrder] = useState("URGENT,PRIORITY,NORMAL");
    const [policyLoading, setPolicyLoading] = useState(false);

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

    const fetchQueuesAndServices = async (orgId) => {
        if (!orgId) {
            setQueues([]);
            setServices([]);
            return;
        }
        setLoadingQueues(true);
        setError("");
        setSuccess("");
        try {
            const [queuesRes, servicesRes] = await Promise.all([
                getQueuesByOrganization(orgId),
                getServicesByOrganization(orgId)
            ]);
            setQueues(queuesRes.queues || []);
            setServices(servicesRes.services || []);
        } catch (err) {
            console.error(err);
            setError("Failed to fetch queues or services.");
        } finally {
            setLoadingQueues(false);
        }
    };

    const handleOrgChange = (e) => {
        const orgId = e.target.value;
        setSelectedOrg(orgId);
        fetchQueuesAndServices(orgId);
    };

    const handleCreateQueue = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        if (!name || !serviceId || !selectedOrg) return;

        setSubmitLoading(true);
        try {
            await createQueue({
                organizationId: selectedOrg,
                serviceId,
                name,
                queuePolicy: policy
            });
            setSuccess("Queue created successfully.");
            setName("");
            setServiceId("");
            setPolicy("FIFO");
            setCreateOpen(false);
            await fetchQueuesAndServices(selectedOrg);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to create queue.");
        } finally {
            setSubmitLoading(false);
        }
    };

    const openPolicyModal = (queue) => {
        setSelectedQueue(queue);
        setSelectedPolicy(queue.queuePolicy);
        setPriorityOrder(queue.priorityOrder?.join(",") || "URGENT,PRIORITY,NORMAL");
        setPolicyOpen(true);
    };

    const handleUpdatePolicy = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        if (!selectedQueue) return;

        setPolicyLoading(true);
        try {
            const orderArray = priorityOrder.split(",").map(o => o.trim().toUpperCase());
            await updateQueuePolicy(selectedQueue._id, {
                queuePolicy: selectedPolicy,
                priorityOrder: orderArray
            });
            setSuccess(`Updated policy for ${selectedQueue.name} to ${selectedPolicy}.`);
            setPolicyOpen(false);
            await fetchQueuesAndServices(selectedOrg);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to update queue policy.");
        } finally {
            setPolicyLoading(false);
        }
    };

    const getServiceName = (sId) => {
        const serv = services.find(s => s._id === sId || s._id === sId?._id);
        return serv ? serv.name : "N/A";
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                <div>
                    <h1 className="text-2xl font-black text-[#F5F5F5] tracking-tight">System Queues</h1>
                    <p className="text-sm text-[#A8A8A8] mt-1">Configure and manage active queue properties and policies.</p>
                </div>
                {selectedOrg && (
                    <div className="flex items-center space-x-3">
                        <Button variant="outline" onClick={() => fetchQueuesAndServices(selectedOrg)} disabled={loadingQueues}>
                            <FiRefreshCw className={`mr-2 ${loadingQueues ? "animate-spin" : ""}`} /> Refresh
                        </Button>
                        <Button onClick={() => setCreateOpen(true)}>
                            <FiPlus className="mr-2" /> Add Queue
                        </Button>
                    </div>
                )}
            </div>

            {error && (
                <div className="flex flex-col items-center justify-center space-y-4">
                    <ErrorMessage message={error} />
                    <Button onClick={() => (selectedOrg ? fetchQueuesAndServices(selectedOrg) : fetchOrgs())}>Retry</Button>
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

            {/* Queues Table */}
            {selectedOrg ? (
                <Table 
                    headers={["Queue Name", "Service", "Policy", "Status", "Actions"]} 
                    loading={loadingQueues}
                    emptyMessage="No queues defined under this organization."
                >
                    {queues.map((q) => (
                        <tr key={q._id} className="border-b border-[#35363B] text-sm text-[#F5F5F5] hover:bg-[#202126]/30">
                            <td className="px-6 py-4 font-bold">{q.name}</td>
                            <td className="px-6 py-4 text-[#A8A8A8]">{getServiceName(q.serviceId)}</td>
                            <td className="px-6 py-4 font-semibold text-[#EFB477]">{q.queuePolicy}</td>
                            <td className="px-6 py-4">
                                <span className={`text-xs font-semibold ${q.status === "OPEN" ? "text-emerald-400" : "text-[#BF1F1B]"}`}>
                                    {q.status}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => openPolicyModal(q)}
                                >
                                    <FiSettings className="mr-1.5" /> Edit Policy
                                </Button>
                            </td>
                        </tr>
                    ))}
                </Table>
            ) : (
                <div className="bg-[#292A2F] border border-[#35363B] rounded-xl p-8 text-center flex flex-col items-center justify-center space-y-2">
                    <span className="text-3xl">🏢</span>
                    <h3 className="text-sm font-bold text-[#F5F5F5]">Filter Required</h3>
                    <p className="text-xs text-[#A8A8A8]">Please select an organization in the dropdown above to manage queues.</p>
                </div>
            )}

            {/* Create Queue Modal */}
            <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Create New Queue">
                <form onSubmit={handleCreateQueue} className="space-y-4">
                    <Input
                        label="Queue Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Counter Consultation line"
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

                    <Select
                        label="Queue Policy"
                        value={policy}
                        onChange={(e) => setPolicy(e.target.value)}
                        placeholder={null}
                        options={[
                            { value: "FIFO", label: "FIFO (First In, First Out)" },
                            { value: "PRIORITY", label: "PRIORITY (Role/Severity First)" }
                        ]}
                        disabled={submitLoading}
                    />

                    <div className="flex items-center justify-end space-x-3 pt-2">
                        <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={submitLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={submitLoading}>
                            {submitLoading ? "Creating..." : "Create"}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Edit Policy Modal */}
            <Modal isOpen={policyOpen} onClose={() => setPolicyOpen(false)} title="Edit Queue Policy">
                {selectedQueue && (
                    <form onSubmit={handleUpdatePolicy} className="space-y-4">
                        <p className="text-sm text-[#F5F5F5]">
                            Configure waitlist policies for queue <span className="font-bold text-[#EFB477]">{selectedQueue.name}</span>
                        </p>
                        
                        <Select
                            label="Queue Policy"
                            value={selectedPolicy}
                            onChange={(e) => setSelectedPolicy(e.target.value)}
                            placeholder={null}
                            options={[
                                { value: "FIFO", label: "FIFO" },
                                { value: "PRIORITY", label: "PRIORITY" }
                            ]}
                            disabled={policyLoading}
                        />

                        {selectedPolicy === "PRIORITY" && (
                            <Input
                                label="Priority Order (comma separated)"
                                value={priorityOrder}
                                onChange={(e) => setPriorityOrder(e.target.value)}
                                placeholder="URGENT,PRIORITY,NORMAL"
                                disabled={policyLoading}
                                required
                            />
                        )}

                        <div className="flex items-center justify-end space-x-3 pt-2">
                            <Button variant="outline" onClick={() => setPolicyOpen(false)} disabled={policyLoading}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={policyLoading}>
                                {policyLoading ? "Updating..." : "Update Policy"}
                            </Button>
                        </div>
                    </form>
                )}
            </Modal>
        </div>
    );
};

export default AdminQueues;
