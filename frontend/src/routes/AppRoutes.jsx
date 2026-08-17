import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";
import DashboardLayout from "../layouts/DashboardLayout";

// Common Pages
import Login from "../pages/Login";
import Register from "../pages/Register";
import Unauthorized from "../pages/Unauthorized";
import NotFound from "../pages/NotFound";

// USER Pages
import UserDashboard from "../pages/user/UserDashboard";
import UserAppointments from "../pages/user/UserAppointments";
import UserTokenStatus from "../pages/user/UserTokenStatus";

// ORGANIZATION Pages
import OrgDashboard from "../pages/org/OrgDashboard";
import OrgServices from "../pages/org/OrgServices";
import OrgStaff from "../pages/org/OrgStaff";
import OrgCounters from "../pages/org/OrgCounters";
import OrgQueues from "../pages/org/OrgQueues";
import OrgAppointments from "../pages/org/OrgAppointments";
import OrgAnalytics from "../pages/org/OrgAnalytics";

// STAFF Pages
import StaffDashboard from "../pages/staff/StaffDashboard";
import StaffCounter from "../pages/staff/StaffCounter";
import StaffQueue from "../pages/staff/StaffQueue";

// ADMIN Pages
import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminOrganizations from "../pages/admin/AdminOrganizations";
import AdminServices from "../pages/admin/AdminServices";
import AdminQueues from "../pages/admin/AdminQueues";
import AdminCounters from "../pages/admin/AdminCounters";
import AdminStaff from "../pages/admin/AdminStaff";
import AdminAnalytics from "../pages/admin/AdminAnalytics";

// Root path director that routes users directly based on role
const RootRedirect = () => {
    const { user } = useAuth();
    if (!user) return <Navigate to="/login" replace />;

    switch (user.role) {
        case "ADMIN":
            return <Navigate to="/admin/dashboard" replace />;
        case "ORGANIZATION":
            return <Navigate to="/organization/dashboard" replace />;
        case "STAFF":
            return <Navigate to="/staff/dashboard" replace />;
        default:
            return <Navigate to="/dashboard" replace />;
    }
};

const AppRoutes = () => {
    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Root Path Selector */}
            <Route path="/" element={<RootRedirect />} />

            {/* USER Protected Routes */}
            <Route 
                path="/dashboard" 
                element={
                    <ProtectedRoute>
                        <RoleRoute allowedRoles={["USER"]}>
                            <DashboardLayout>
                                <UserDashboard />
                            </DashboardLayout>
                        </RoleRoute>
                    </ProtectedRoute>
                } 
            />
            <Route 
                path="/appointments" 
                element={
                    <ProtectedRoute>
                        <RoleRoute allowedRoles={["USER"]}>
                            <DashboardLayout>
                                <UserAppointments />
                            </DashboardLayout>
                        </RoleRoute>
                    </ProtectedRoute>
                } 
            />
            <Route 
                path="/my-token" 
                element={
                    <ProtectedRoute>
                        <RoleRoute allowedRoles={["USER"]}>
                            <DashboardLayout>
                                <UserTokenStatus />
                            </DashboardLayout>
                        </RoleRoute>
                    </ProtectedRoute>
                } 
            />

            {/* ORGANIZATION Protected Routes */}
            <Route 
                path="/organization/dashboard" 
                element={
                    <ProtectedRoute>
                        <RoleRoute allowedRoles={["ORGANIZATION"]}>
                            <DashboardLayout>
                                <OrgDashboard />
                            </DashboardLayout>
                        </RoleRoute>
                    </ProtectedRoute>
                } 
            />
            <Route 
                path="/organization/services" 
                element={
                    <ProtectedRoute>
                        <RoleRoute allowedRoles={["ORGANIZATION"]}>
                            <DashboardLayout>
                                <OrgServices />
                            </DashboardLayout>
                        </RoleRoute>
                    </ProtectedRoute>
                } 
            />
            <Route 
                path="/organization/staff" 
                element={
                    <ProtectedRoute>
                        <RoleRoute allowedRoles={["ORGANIZATION"]}>
                            <DashboardLayout>
                                <OrgStaff />
                            </DashboardLayout>
                        </RoleRoute>
                    </ProtectedRoute>
                } 
            />
            <Route 
                path="/organization/counters" 
                element={
                    <ProtectedRoute>
                        <RoleRoute allowedRoles={["ORGANIZATION"]}>
                            <DashboardLayout>
                                <OrgCounters />
                            </DashboardLayout>
                        </RoleRoute>
                    </ProtectedRoute>
                } 
            />
            <Route 
                path="/organization/queues" 
                element={
                    <ProtectedRoute>
                        <RoleRoute allowedRoles={["ORGANIZATION"]}>
                            <DashboardLayout>
                                <OrgQueues />
                            </DashboardLayout>
                        </RoleRoute>
                    </ProtectedRoute>
                } 
            />
            <Route 
                path="/organization/appointments" 
                element={
                    <ProtectedRoute>
                        <RoleRoute allowedRoles={["ORGANIZATION"]}>
                            <DashboardLayout>
                                <OrgAppointments />
                            </DashboardLayout>
                        </RoleRoute>
                    </ProtectedRoute>
                } 
            />
            <Route 
                path="/organization/analytics" 
                element={
                    <ProtectedRoute>
                        <RoleRoute allowedRoles={["ORGANIZATION"]}>
                            <DashboardLayout>
                                <OrgAnalytics />
                            </DashboardLayout>
                        </RoleRoute>
                    </ProtectedRoute>
                } 
            />

            {/* STAFF Protected Routes */}
            <Route 
                path="/staff/dashboard" 
                element={
                    <ProtectedRoute>
                        <RoleRoute allowedRoles={["STAFF"]}>
                            <DashboardLayout>
                                <StaffDashboard />
                            </DashboardLayout>
                        </RoleRoute>
                    </ProtectedRoute>
                } 
            />
            <Route 
                path="/staff/my-counter" 
                element={
                    <ProtectedRoute>
                        <RoleRoute allowedRoles={["STAFF"]}>
                            <DashboardLayout>
                                <StaffCounter />
                            </DashboardLayout>
                        </RoleRoute>
                    </ProtectedRoute>
                } 
            />
            <Route 
                path="/staff/queue" 
                element={
                    <ProtectedRoute>
                        <RoleRoute allowedRoles={["STAFF"]}>
                            <DashboardLayout>
                                <StaffQueue />
                            </DashboardLayout>
                        </RoleRoute>
                    </ProtectedRoute>
                } 
            />

            {/* ADMIN Protected Routes */}
            <Route 
                path="/admin/dashboard" 
                element={
                    <ProtectedRoute>
                        <RoleRoute allowedRoles={["ADMIN"]}>
                            <DashboardLayout>
                                <AdminDashboard />
                            </DashboardLayout>
                        </RoleRoute>
                    </ProtectedRoute>
                } 
            />
            <Route 
                path="/admin/organizations" 
                element={
                    <ProtectedRoute>
                        <RoleRoute allowedRoles={["ADMIN"]}>
                            <DashboardLayout>
                                <AdminOrganizations />
                            </DashboardLayout>
                        </RoleRoute>
                    </ProtectedRoute>
                } 
            />
            <Route 
                path="/admin/services" 
                element={
                    <ProtectedRoute>
                        <RoleRoute allowedRoles={["ADMIN"]}>
                            <DashboardLayout>
                                <AdminServices />
                            </DashboardLayout>
                        </RoleRoute>
                    </ProtectedRoute>
                } 
            />
            <Route 
                path="/admin/queues" 
                element={
                    <ProtectedRoute>
                        <RoleRoute allowedRoles={["ADMIN"]}>
                            <DashboardLayout>
                                <AdminQueues />
                            </DashboardLayout>
                        </RoleRoute>
                    </ProtectedRoute>
                } 
            />
            <Route 
                path="/admin/counters" 
                element={
                    <ProtectedRoute>
                        <RoleRoute allowedRoles={["ADMIN"]}>
                            <DashboardLayout>
                                <AdminCounters />
                            </DashboardLayout>
                        </RoleRoute>
                    </ProtectedRoute>
                } 
            />
            <Route 
                path="/admin/staff" 
                element={
                    <ProtectedRoute>
                        <RoleRoute allowedRoles={["ADMIN"]}>
                            <DashboardLayout>
                                <AdminStaff />
                            </DashboardLayout>
                        </RoleRoute>
                    </ProtectedRoute>
                } 
            />
            <Route 
                path="/admin/analytics" 
                element={
                    <ProtectedRoute>
                        <RoleRoute allowedRoles={["ADMIN"]}>
                            <DashboardLayout>
                                <AdminAnalytics />
                            </DashboardLayout>
                        </RoleRoute>
                    </ProtectedRoute>
                } 
            />

            {/* Wildcard 404 Route */}
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
};

export default AppRoutes;
