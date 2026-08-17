import React, { useState, useEffect } from "react";
import { getOrganizations } from "../../api/organizationApi";
import { getOrganizationStaff, addStaff, removeStaff } from "../../api/organizationStaffApi";
import { getCountersByOrganization, assignStaffToCounter } from "../../api/counterApi";
import Button from "../../components/Button";
import Table from "../../components/Table";
import Modal from "../../components/Modal";
import Input from "../../components/Input";
import Select from "../../components/Select";
import Loader from "../../components/Loader";
import ErrorMessage from "../../components/ErrorMessage";
import { FiPlus, FiUserMinus, FiUserCheck, FiRefreshCw } from "react-icons/fi";

const AdminStaff = () => {
    const [organizations, setOrganizations] = useState([]);
    const [selectedOrg, setSelectedOrg] = useState("");
    const [staffList, setStaffList] = useState([]);
    const [counters, setCounters] = useState([]);
    
    const [loadingOrgs, setLoadingOrgs] = useState(false);
    const [loadingStaff, setLoadingStaff] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Modal state for registration
    const [addStaffOpen, setAddStaffOpen] = useState(false);
    const [staffUserId, setStaffUserId] = useState("");
    const [submitLoading, setSubmitLoading] = useState(false);

    // Modal state for assignment
    const [assignCounterOpen, setAssignCounterOpen] = useState(false);
    const [selectedStaffMember, setSelectedStaffMember] = useState(null);
    const [selectedCounterId, setSelectedCounterId] = useState("");
    const [assignLoading, setAssignLoading] = useState(false);

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

    const fetchStaffAndCounters = async (orgId) => {
        if (!orgId) {
            setStaffList([]);
            setCounters([]);
            return;
        }
        setLoadingStaff(true);
        setError("");
        setSuccess("");
        try {
            const [staffRes, countersRes] = await Promise.all([
                getOrganizationStaff(orgId),
                getCountersByOrganization(orgId)
            ]);
            setStaffList(staffRes.staff || []);
            setCounters(countersRes.counters || []);
        } catch (err) {
            console.error(err);
            setError("Failed to fetch organization staff or counters.");
        } finally {
            setLoadingStaff(false);
        }
    };

    const handleOrgChange = (e) => {
        const orgId = e.target.value;
        setSelectedOrg(orgId);
        fetchStaffAndCounters(orgId);
    };

    const handleAddStaff = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        if (!staffUserId || !selectedOrg) return;

        setSubmitLoading(true);
        try {
            await addStaff({
                organizationId: selectedOrg,
                userId: staffUserId
            });
            setSuccess("Staff member added successfully.");
            setStaffUserId("");
            setAddStaffOpen(false);
            await fetchStaffAndCounters(selectedOrg);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to add staff member.");
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleRemoveStaff = async (id) => {
        if (!window.confirm("Are you sure you want to remove this staff member?")) return;
        setError("");
        try {
            await removeStaff(id);
            setSuccess("Staff member removed successfully.");
            await fetchStaffAndCounters(selectedOrg);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to remove staff member.");
        }
    };

    const openAssignModal = (staff) => {
        setSelectedStaffMember(staff);
        const currentCounter = counters.find(
            c => c.assignedStaff?._id === staff.userId?._id || c.assignedStaff === staff.userId?._id
        );
        setSelectedCounterId(currentCounter?._id || "");
        setAssignCounterOpen(true);
    };

    const handleAssignCounter = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        if (!selectedStaffMember || !selectedCounterId) return;

        setAssignLoading(true);
        try {
            await assignStaffToCounter(selectedCounterId, selectedStaffMember.userId._id || selectedStaffMember.userId);
            setSuccess(`Assigned ${selectedStaffMember.userId.name} to counter successfully.`);
            setAssignCounterOpen(false);
            await fetchStaffAndCounters(selectedOrg);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to assign staff member to counter.");
        } finally {
            setAssignLoading(false);
        }
    };

    const getAssignedCounterName = (userId) => {
        const counter = counters.find(c => c.assignedStaff === userId || c.assignedStaff?._id === userId);
        return counter ? counter.name : "None";
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                <div>
                    <h1 className="text-2xl font-black text-[#F5F5F5] tracking-tight">System Staff Registry</h1>
                    <p className="text-sm text-[#A8A8A8] mt-1">Add staff users and manage operational counter mappings.</p>
                </div>
                {selectedOrg && (
                    <div className="flex items-center space-x-3">
                        <Button variant="outline" onClick={() => fetchStaffAndCounters(selectedOrg)} disabled={loadingStaff}>
                            <FiRefreshCw className={`mr-2 ${loadingStaff ? "animate-spin" : ""}`} /> Refresh
                        </Button>
                        <Button onClick={() => setAddStaffOpen(true)}>
                            <FiPlus className="mr-2" /> Add Staff Member
                        </Button>
                    </div>
                )}
            </div>

            {error && (
                <div className="flex flex-col items-center justify-center space-y-4">
                    <ErrorMessage message={error} />
                    <Button onClick={() => (selectedOrg ? fetchStaffAndCounters(selectedOrg) : fetchOrgs())}>Retry</Button>
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

            {/* Staff Table */}
            {selectedOrg ? (
                <Table 
                    headers={["Name", "Email", "Assigned Counter", "Actions"]} 
                    loading={loadingStaff}
                    emptyMessage="No staff registered under this organization."
                >
                    {staffList.map((s) => {
                        const u = s.userId || {};
                        return (
                            <tr key={s._id} className="border-b border-[#35363B] text-sm text-[#F5F5F5] hover:bg-[#202126]/30">
                                <td className="px-6 py-4 font-bold">{u.name || "N/A"}</td>
                                <td className="px-6 py-4 text-[#A8A8A8]">{u.email || "-"}</td>
                                <td className="px-6 py-4">
                                    <span className={`text-xs font-semibold ${getAssignedCounterName(u._id) !== "None" ? "text-[#EFB477]" : "text-[#707176]"}`}>
                                        {getAssignedCounterName(u._id)}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center space-x-3">
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            onClick={() => openAssignModal(s)}
                                        >
                                            <FiUserCheck className="mr-1.5" /> Assign Counter
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            onClick={() => handleRemoveStaff(s._id)}
                                            className="border-red-500/10 hover:bg-[#BF1F1B]/10 hover:text-[#BF1F1B]"
                                        >
                                            <FiUserMinus />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </Table>
            ) : (
                <div className="bg-[#292A2F] border border-[#35363B] rounded-xl p-8 text-center flex flex-col items-center justify-center space-y-2">
                    <span className="text-3xl">🏢</span>
                    <h3 className="text-sm font-bold text-[#F5F5F5]">Filter Required</h3>
                    <p className="text-xs text-[#A8A8A8]">Please select an organization in the dropdown above to manage staff.</p>
                </div>
            )}

            {/* Add Staff Modal */}
            <Modal isOpen={addStaffOpen} onClose={() => setAddStaffOpen(false)} title="Register Staff Member">
                <form onSubmit={handleAddStaff} className="space-y-4">
                    <p className="text-xs text-[#A8A8A8] leading-relaxed">
                        To register a staff user, enter their MongoDB User ID. The user must be pre-registered with the role **STAFF**.
                    </p>
                    <Input
                        label="MongoDB User ID"
                        value={staffUserId}
                        onChange={(e) => setStaffUserId(e.target.value)}
                        placeholder="e.g. 6a83432f9739c..."
                        required
                        disabled={submitLoading}
                    />

                    <div className="flex items-center justify-end space-x-3 pt-2">
                        <Button variant="outline" onClick={() => setAddStaffOpen(false)} disabled={submitLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={submitLoading}>
                            {submitLoading ? "Adding..." : "Add Member"}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Assign Counter Modal */}
            <Modal isOpen={assignCounterOpen} onClose={() => setAssignCounterOpen(false)} title="Assign Staff to Counter">
                {selectedStaffMember && (
                    <form onSubmit={handleAssignCounter} className="space-y-4">
                        <p className="text-sm text-[#F5F5F5]">
                            Assigning <span className="font-bold text-[#EFB477]">{selectedStaffMember.userId.name}</span> to:
                        </p>
                        
                        <Select
                            label="Choose Counter"
                            value={selectedCounterId}
                            onChange={(e) => setSelectedCounterId(e.target.value)}
                            placeholder="Choose counter..."
                            options={counters.map(c => ({ value: c._id, label: `${c.name} (Counter ${c.counterNumber})` }))}
                            disabled={assignLoading}
                            required
                        />

                        <div className="flex items-center justify-end space-x-3 pt-2">
                            <Button variant="outline" onClick={() => setAssignCounterOpen(false)} disabled={assignLoading}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={assignLoading}>
                                {assignLoading ? "Assigning..." : "Assign"}
                            </Button>
                        </div>
                    </form>
                )}
            </Modal>
        </div>
    );
};

export default AdminStaff;
