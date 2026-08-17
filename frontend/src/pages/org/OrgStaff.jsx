import React, { useState, useEffect } from "react";
import { useOrg } from "../../hooks/useOrg";
import { getOrganizationStaff, addStaff, removeStaff } from "../../api/organizationStaffApi";
import { getCountersByOrganization, assignStaffToCounter } from "../../api/counterApi";
import Button from "../../components/Button";
import Table from "../../components/Table";
import Modal from "../../components/Modal";
import Input from "../../components/Input";
import Select from "../../components/Select";
import Loader from "../../components/Loader";
import ErrorMessage from "../../components/ErrorMessage";
import { FiPlus, FiUserMinus, FiUserCheck } from "react-icons/fi";

const OrgStaff = () => {
    const { orgId } = useOrg();
    const [staffList, setStaffList] = useState([]);
    const [counters, setCounters] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Modal forms
    const [addStaffOpen, setAddStaffOpen] = useState(false);
    const [staffUserId, setStaffUserId] = useState("");
    const [submitLoading, setSubmitLoading] = useState(false);

    const [assignCounterOpen, setAssignCounterOpen] = useState(false);
    const [selectedStaffMember, setSelectedStaffMember] = useState(null);
    const [selectedCounterId, setSelectedCounterId] = useState("");
    const [assignLoading, setAssignLoading] = useState(false);

    useEffect(() => {
        if (orgId) {
            fetchStaffAndCounters();
        }
    }, [orgId]);

    const fetchStaffAndCounters = async () => {
        setLoading(true);
        try {
            const [staffRes, countersRes] = await Promise.all([
                getOrganizationStaff(orgId),
                getCountersByOrganization(orgId)
            ]);
            setStaffList(staffRes.staff || []);
            setCounters(countersRes.counters || []);
        } catch (err) {
            console.error(err);
            setError("Failed to fetch staff members or counters list.");
        } finally {
            setLoading(false);
        }
    };

    const handleAddStaff = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        if (!staffUserId) return;

        setSubmitLoading(true);
        try {
            await addStaff({
                organizationId: orgId,
                userId: staffUserId
            });
            setSuccess("Staff member added successfully.");
            setStaffUserId("");
            setAddStaffOpen(false);
            await fetchStaffAndCounters();
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to add staff member.");
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleRemoveStaff = async (id) => {
        if (!window.confirm("Are you sure you want to remove this staff member from the organization?")) return;
        setError("");
        try {
            await removeStaff(id);
            setSuccess("Staff member removed successfully.");
            await fetchStaffAndCounters();
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to remove staff member.");
        }
    };

    const openAssignModal = (staff) => {
        setSelectedStaffMember(staff);
        // Find if this staff is already assigned to some counter
        const currentCounter = counters.find(c => c.assignedStaff?._id === staff.userId?._id || c.assignedStaff === staff.userId?._id);
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
            await fetchStaffAndCounters();
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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-[#F5F5F5] tracking-tight">Staff Management</h1>
                    <p className="text-sm text-[#A8A8A8] mt-1">Register staff members and assign them to active counters.</p>
                </div>
                <Button onClick={() => setAddStaffOpen(true)}>
                    <FiPlus className="mr-2" /> Add Staff Member
                </Button>
            </div>

            {error && <ErrorMessage message={error} />}
            {success && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg text-xs font-semibold select-none">
                    {success}
                </div>
            )}

            <Table 
                headers={["Name", "Email", "Assigned Counter", "Actions"]} 
                loading={loading}
                emptyMessage="No staff registered for this organization."
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

            {/* Add Staff Modal */}
            <Modal isOpen={addStaffOpen} onClose={() => setAddStaffOpen(false)} title="Register Staff Member">
                <form onSubmit={handleAddStaff} className="space-y-4">
                    <p className="text-xs text-[#A8A8A8] leading-relaxed">
                        To add a staff member, paste their MongoDB User ID. Note that the user must be registered in the system with the role **STAFF**.
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

export default OrgStaff;
