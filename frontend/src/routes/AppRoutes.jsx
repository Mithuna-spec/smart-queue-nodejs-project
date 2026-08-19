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
import UserOrganizations from "../pages/user/UserOrganizations";
import UserProfile from "../pages/user/UserProfile";

// ORGANIZATION Pages
import OrgDashboard from "../pages/org/OrgDashboard";
import OrgServices from "../pages/org/OrgServices";
import OrgStaff from "../pages/org/OrgStaff";
import OrgCounters from "../pages/org/OrgCounters";
import OrgQueues from "../pages/org/OrgQueues";
import OrgAppointments from "../pages/org/OrgAppointments";
import OrgAnalytics from "../pages/org/OrgAnalytics";
import OrgProfile from "../pages/org/OrgProfile";

// STAFF Pages
import StaffDashboard from "../pages/staff/StaffDashboard";
import StaffCounter from "../pages/staff/StaffCounter";
import StaffQueue from "../pages/staff/StaffQueue";
import StaffTokens from "../pages/staff/StaffTokens";

// ADMIN Pages
import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminOrganizations from "../pages/admin/AdminOrganizations";
import AdminProfile from "../pages/admin/AdminProfile";

// Root path selector that redirects users directly based on role
const RootRedirect = () => {
    const { user } = useAuth();
    if (!user) return <Navigate to="/login" replace />;

    switch (user.role) {
        case "ADMIN":
            return <Navigate to="/admin" replace />;
        case "ORGANIZATION":
            return <Navigate to="/organization" replace />;
        case "STAFF":
            return <Navigate to="/staff" replace />;
        default:
            return <Navigate to="/user" replace />;
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

            {/* Legacy/Compat Redirects */}
            <Route path="/dashboard" element={<Navigate to="/user" replace />} />
            <Route path="/appointments" element={<Navigate to="/user/appointments" replace />} />
            <Route path="/my-token" element={<Navigate to="/user/my-queue" replace />} />
            <Route path="/admin/dashboard" element={<Navigate to="/admin" replace />} />
            <Route path="/organization/dashboard" element={<Navigate to="/organization" replace />} />
            <Route path="/staff/dashboard" element={<Navigate to="/staff" replace />} />

            {/* USER Protected Routes */}
            <Route 
                path="/user" 
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
                path="/user/organizations" 
                element={
                    <ProtectedRoute>
                        <RoleRoute allowedRoles={["USER"]}>
                            <DashboardLayout>
                                <UserOrganizations />
                            </DashboardLayout>
                        </RoleRoute>
                    </ProtectedRoute>
                } 
            />
            <Route 
                path="/user/appointments" 
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
                path="/user/my-queue" 
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
            <Route 
                path="/user/profile" 
                element={
                    <ProtectedRoute>
                        <RoleRoute allowedRoles={["USER"]}>
                            <DashboardLayout>
                                <UserProfile />
                            </DashboardLayout>
                        </RoleRoute>
                    </ProtectedRoute>
                } 
            />

            {/* ORGANIZATION Protected Routes */}
            <Route 
                path="/organization" 
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
                path="/organization/profile" 
                element={
                    <ProtectedRoute>
                        <RoleRoute allowedRoles={["ORGANIZATION"]}>
                            <DashboardLayout>
                                <OrgProfile />
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
                path="/staff" 
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
            <Route 
                path="/staff/tokens" 
                element={
                    <ProtectedRoute>
                        <RoleRoute allowedRoles={["STAFF"]}>
                            <DashboardLayout>
                                <StaffTokens />
                            </DashboardLayout>
                        </RoleRoute>
                    </ProtectedRoute>
                } 
            />

            {/* ADMIN Protected Routes */}
            <Route 
                path="/admin" 
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
                path="/admin/profile" 
                element={
                    <ProtectedRoute>
                        <RoleRoute allowedRoles={["ADMIN"]}>
                            <DashboardLayout>
                                <AdminProfile />
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
