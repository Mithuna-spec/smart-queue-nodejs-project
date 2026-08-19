import React, { useState, useEffect } from "react";
import { useOrg } from "../../hooks/useOrg";
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
import Pagination from "../../components/Pagination";
import { FiPlus, FiSettings, FiEdit2 } from "react-icons/fi";

const OrgQueues = () => {
    const { orgId } = useOrg();
    const [queues, setQueues] = useState([]);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Pagination state
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    // Modal state for creation/edit
    const [modalOpen, setModalOpen] = useState(false);
    const [editingQueue, setEditingQueue] = useState(null);
    
    // Form fields
    const [name, setName] = useState("");
    const [serviceId, setServiceId] = useState("");
    const [policy, setPolicy] = useState("FIFO");
    const [status, setStatus] = useState("OPEN");
    const [priorityOrder, setPriorityOrder] = useState("URGENT,PRIORITY,NORMAL");
    
    const [submitLoading, setSubmitLoading] = useState(false);

    useEffect(() => {
        if (orgId) {
            fetchQueuesAndServices(page);
        }
    }, [orgId, page]);

    const fetchQueuesAndServices = async (targetPage) => {
        setLoading(true);
        setError("");
        try {
            const [queuesRes, servicesRes] = await Promise.all([
                getQueuesByOrganization(orgId, targetPage, 5),
                getServicesByOrganization(orgId, 1, 100) // fetch services without pagination for selector
            ]);
            setQueues(queuesRes.queues || []);
            setServices(servicesRes.services || []);
            setPage(queuesRes.pagination?.page || 1);
            setTotalPages(queuesRes.pagination?.totalPages || 1);
            setTotalRecords(queuesRes.pagination?.total || 0);
        } catch (err) {
            console.error(err);
            setError("Failed to fetch queues or services.");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCreate = () => {
        setEditingQueue(null);
        setName("");
        setServiceId("");
        setPolicy("FIFO");
        setStatus("OPEN");
        setPriorityOrder("URGENT,PRIORITY,NORMAL");
        setModalOpen(true);
    };

    const handleOpenEdit = (q) => {
        setEditingQueue(q);
        setName(q.name || "");
        setServiceId(q.serviceId?._id || q.serviceId || "");
        setPolicy(q.queuePolicy || "FIFO");
        setStatus(q.status || "OPEN");
        setPriorityOrder(q.priorityOrder?.join(",") || "URGENT,PRIORITY,NORMAL");
        setModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        if (!name || (!editingQueue && !serviceId)) return;

        setSubmitLoading(true);
        try {
            const orderArray = priorityOrder.split(",").map(o => o.trim().toUpperCase());
            
            if (editingQueue) {
                await updateQueuePolicy(editingQueue._id, {
                    name,
                    status,
                    queuePolicy: policy,
                    priorityOrder: orderArray
                });
                setSuccess("Queue details updated successfully.");
            } else {
                await createQueue({
                    organizationId: orgId,
                    serviceId,
                    name,
                    queuePolicy: policy
                });
                setSuccess("Queue created successfully.");
            }

            setName("");
            setServiceId("");
            setPolicy("FIFO");
            setStatus("OPEN");
            setPriorityOrder("URGENT,PRIORITY,NORMAL");
            setModalOpen(false);
            setEditingQueue(null);
            await fetchQueuesAndServices(editingQueue ? page : 1);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to save queue config.");
        } finally {
            setSubmitLoading(false);
        }
    };

    const getServiceName = (sId) => {
        const serv = services.find(s => s._id === sId || s._id === sId?._id);
        return serv ? serv.name : "N/A";
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-[#F5F5F5] tracking-tight">Queues</h1>
                    <p className="text-sm text-[#A8A8A8] mt-1">Manage active queue parameters and policies (FIFO or Priority based).</p>
                </div>
                <Button onClick={handleOpenCreate}>
                    <FiPlus className="mr-2" /> Add Queue
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
                    headers={["Queue Name", "Service", "Policy", "Status", "Actions"]} 
                    loading={loading}
                    emptyMessage="No queues defined yet."
                >
                    {queues.map((q) => (
                        <tr key={q._id} className="border-b border-[#35363B] text-sm text-[#F5F5F5] hover:bg-[#202126]/30">
                            <td className="px-6 py-4 font-bold">{q.name}</td>
                            <td className="px-6 py-4 text-[#A8A8A8]">{getServiceName(q.serviceId)}</td>
                            <td className="px-6 py-4 font-semibold text-[#EFB477]">{q.queuePolicy}</td>
                            <td className="px-6 py-4">
                                <StatusBadge status={q.status} />
                            </td>
                            <td className="px-6 py-4">
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => handleOpenEdit(q)}
                                >
                                    <FiSettings className="mr-1.5" /> Edit Queue
                                </Button>
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

            {/* Create / Edit Queue Modal */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingQueue ? "Edit Queue Details" : "Create New Queue"}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Queue Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Standard Checkin Line"
                        required
                        disabled={submitLoading}
                    />

                    {!editingQueue && (
                        <Select
                            label="Assigned Service"
                            value={serviceId}
                            onChange={(e) => setServiceId(e.target.value)}
                            placeholder="Select service..."
                            options={services.map(s => ({ value: s._id, label: s.name }))}
                            required
                            disabled={submitLoading}
                        />
                    )}

                    {editingQueue && (
                        <Select
                            label="Queue Status"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            placeholder={null}
                            options={[
                                { value: "OPEN", label: "Open" },
                                { value: "PAUSED", label: "Paused" },
                                { value: "CLOSED", label: "Closed" }
                            ]}
                            required
                            disabled={submitLoading}
                        />
                    )}

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

                    {policy === "PRIORITY" && (
                        <Input
                            label="Priority Level Order"
                            value={priorityOrder}
                            onChange={(e) => setPriorityOrder(e.target.value)}
                            placeholder="URGENT,PRIORITY,NORMAL"
                            required
                            disabled={submitLoading}
                        />
                    )}

                    <div className="flex items-center justify-end space-x-3 pt-2">
                        <Button variant="outline" onClick={() => setModalOpen(false)} disabled={submitLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={submitLoading}>
                            {submitLoading ? "Saving..." : (editingQueue ? "Save" : "Create")}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default OrgQueues;
