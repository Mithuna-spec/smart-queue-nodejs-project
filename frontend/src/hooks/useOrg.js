import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getMyOrganization } from "../api/organizationApi";
import { getMyStaffOrganization } from "../api/organizationStaffApi";

export const useOrg = () => {
    const { user } = useAuth();
    
    const getCachedId = () => {
        const val = localStorage.getItem("detectedOrgId");
        return (val && val !== "undefined" && val !== "null") ? val : null;
    };
    const getCachedName = () => {
        const val = localStorage.getItem("detectedOrgName");
        return (val && val !== "undefined" && val !== "null") ? val : null;
    };

    const [orgId, setOrgId] = useState(getCachedId());
    const [orgName, setOrgName] = useState(getCachedName());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!user) return;

        // If we already have a cached orgId, skip loading
        if (orgId) return;

        const detectOrg = async () => {
            setLoading(true);
            setError("");
            try {
                if (user.role === "ORGANIZATION") {
                    const data = await getMyOrganization();
                    if (data.organization) {
                        setOrgId(data.organization._id);
                        setOrgName(data.organization.name);
                        localStorage.setItem("detectedOrgId", data.organization._id);
                        localStorage.setItem("detectedOrgName", data.organization.name);
                    } else {
                        setError("No organization matched this profile.");
                    }
                } else if (user.role === "STAFF") {
                    const data = await getMyStaffOrganization();
                    if (data.organization) {
                        setOrgId(data.organization._id);
                        setOrgName(data.organization.name);
                        localStorage.setItem("detectedOrgId", data.organization._id);
                        localStorage.setItem("detectedOrgName", data.organization.name);
                    } else {
                        setError("This staff account is not assigned to any active organization.");
                    }
                }
            } catch (err) {
                console.error("Org detection hook error:", err);
                setError(err.response?.data?.message || "Could not resolve organization associations.");
            } finally {
                setLoading(false);
            }
        };

        detectOrg();
    }, [user, orgId]);

    const resetOrgCache = () => {
        localStorage.removeItem("detectedOrgId");
        localStorage.removeItem("detectedOrgName");
        setOrgId(null);
        setOrgName(null);
    };

    return {
        orgId,
        orgName,
        loading,
        error,
        resetOrgCache
    };
};
