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
import Pagination from "../../components/Pagination";
import { FiPlus, FiUserMinus, FiUserCheck } from "react-icons/fi";

const OrgStaff = () => {
    const { orgId } = useOrg();
    const [staffList, setStaffList] = useState([]);
    const [counters, setCounters] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Pagination state
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    // Modal forms
    const [addStaffOpen, setAddStaffOpen] = useState(false);
    const [staffName, setStaffName] = useState("");
    const [staffEmail, setStaffEmail] = useState("");
    const [staffPhone, setStaffPhone] = useState("");
    const [staffPassword, setStaffPassword] = useState("");
    const [submitLoading, setSubmitLoading] = useState(false);

    const [assignCounterOpen, setAssignCounterOpen] = useState(false);
    const [selectedStaffMember, setSelectedStaffMember] = useState(null);
    const [selectedCounterId, setSelectedCounterId] = useState("");
    const [assignLoading, setAssignLoading] = useState(false);

    useEffect(() => {
        if (orgId) {
            fetchStaffAndCounters(page);
        }
    }, [orgId, page]);

    const fetchStaffAndCounters = async (targetPage) => {
        setLoading(true);
        setError("");
        try {
            const [staffRes, countersRes] = await Promise.all([
                getOrganizationStaff(orgId, targetPage, 5),
                getCountersByOrganization(orgId, 1, 100) // retrieve counters without paging filter for selector
            ]);
            setStaffList(staffRes.staff || []);
            setCounters(countersRes.counters || []);
            setPage(staffRes.pagination?.page || 1);
            setTotalPages(staffRes.pagination?.totalPages || 1);
            setTotalRecords(staffRes.pagination?.total || 0);
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
        if (!staffName || !staffEmail || !staffPhone || !staffPassword) {
            setError("All fields are required.");
            return;
        }

        setSubmitLoading(true);
        try {
            await addStaff(orgId, {
                name: staffName,
                email: staffEmail,
                phone: staffPhone,
                password: staffPassword
            });
            setSuccess("Staff account created and added successfully.");
            
            // Reset fields
            setStaffName("");
            setStaffEmail("");
            setStaffPhone("");
            setStaffPassword("");
            
            setAddStaffOpen(false);
            await fetchStaffAndCounters(1);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to create staff member.");
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
            await fetchStaffAndCounters(page);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to remove staff member.");
        }
    };

    const openAssignModal = (staff) => {
        setSelectedStaffMember(staff);
        // Find if this staff is already assigned to some counter
        const uId = staff.userId?._id || staff.userId;
        const currentCounter = counters.find(c => c.assignedStaffId?._id === uId || c.assignedStaffId === uId);
        setSelectedCounterId(currentCounter?._id || "");
        setAssignCounterOpen(true);
    };

    const handleAssignCounter = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        if (!selectedStaffMember || !selectedCounterId) return;

        setAssignLoading(true);
        const staffUserIdVal = selectedStaffMember.userId?._id || selectedStaffMember.userId;
        try {
            await assignStaffToCounter(selectedCounterId, staffUserIdVal);
            setSuccess(`Assigned ${selectedStaffMember.userId?.name || "staff"} to counter successfully.`);
            setAssignCounterOpen(false);
            await fetchStaffAndCounters(page);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to assign staff member to counter.");
        } finally {
            setAssignLoading(false);
        }
    };

    const getAssignedCounterName = (userId) => {
        const counter = counters.find(c => c.assignedStaffId?._id === userId || c.assignedStaffId === userId);
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
                    <FiPlus className="mr-2" /> Register Staff Member
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
                    headers={["Name", "Email", "Mobile Phone", "Assigned Counter", "Actions"]} 
                    loading={loading}
                    emptyMessage="No staff registered for this organization."
                >
                    {staffList.map((s) => {
                        const u = s.userId || {};
                        return (
                            <tr key={s._id} className="border-b border-[#35363B] text-sm text-[#F5F5F5] hover:bg-[#202126]/30">
                                <td className="px-6 py-4 font-bold">{u.name || "N/A"}</td>
                                <td className="px-6 py-4 text-[#A8A8A8]">{u.email || "-"}</td>
                                <td className="px-6 py-4 text-xs text-[#A8A8A8]">{u.phone || "-"}</td>
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

                <Pagination 
                    currentPage={page}
                    totalPages={totalPages}
                    totalRecords={totalRecords}
                    onPageChange={(p) => setPage(p)}
                    limit={5}
                />
            </div>

            {/* Add Staff Modal */}
            <Modal isOpen={addStaffOpen} onClose={() => setAddStaffOpen(false)} title="Register Staff Member">
                <form onSubmit={handleAddStaff} className="space-y-4">
                    <Input
                        label="Full Name"
                        value={staffName}
                        onChange={(e) => setStaffName(e.target.value)}
                        placeholder="e.g. Alice Smith"
                        required
                        disabled={submitLoading}
                    />

                    <Input
                        label="Email (Username)"
                        type="email"
                        value={staffEmail}
                        onChange={(e) => setStaffEmail(e.target.value)}
                        placeholder="alice@domain.com"
                        required
                        disabled={submitLoading}
                    />

                    <Input
                        label="Mobile Number"
                        type="tel"
                        value={staffPhone}
                        onChange={(e) => setStaffPhone(e.target.value)}
                        placeholder="e.g. +12345678"
                        required
                        disabled={submitLoading}
                    />

                    <Input
                        label="Password"
                        type="password"
                        value={staffPassword}
                        onChange={(e) => setStaffPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        disabled={submitLoading}
                    />

                    <div className="flex items-center justify-end space-x-3 pt-2">
                        <Button variant="outline" onClick={() => setAddStaffOpen(false)} disabled={submitLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={submitLoading}>
                            {submitLoading ? "Registering..." : "Register"}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Assign Counter Modal */}
            <Modal isOpen={assignCounterOpen} onClose={() => setAssignCounterOpen(false)} title="Assign Staff to Counter">
                {selectedStaffMember && (
                    <form onSubmit={handleAssignCounter} className="space-y-4">
                        <p className="text-sm text-[#F5F5F5]">
                            Assigning <span className="font-bold text-[#EFB477]">{selectedStaffMember.userId?.name}</span> to:
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
