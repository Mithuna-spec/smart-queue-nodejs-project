import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getOrganizations } from "../api/organizationApi";
import { getOrganizationStaff } from "../api/organizationStaffApi";

export const useOrg = () => {
    const { user } = useAuth();
    const [orgId, setOrgId] = useState(localStorage.getItem("detectedOrgId") || null);
    const [orgName, setOrgName] = useState(localStorage.getItem("detectedOrgName") || null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!user) return;

        // If we already have a cached orgId, verify or skip loading if already set
        if (orgId) return;

        const detectOrg = async () => {
            setLoading(true);
            try {
                const orgsRes = await getOrganizations();
                const allOrgs = orgsRes.organizations || [];

                if (user.role === "ORGANIZATION") {
                    // Match owner of organization
                    const matched = allOrgs.find(
                        (o) => o.owner.toString() === (user.id || user._id).toString()
                    );
                    if (matched) {
                        setOrgId(matched._id);
                        setOrgName(matched.name);
                        localStorage.setItem("detectedOrgId", matched._id);
                        localStorage.setItem("detectedOrgName", matched.name);
                    } else {
                        setError("No organization matches this owner profile.");
                    }
                } else if (user.role === "STAFF") {
                    // STAFF: Loop active organizations and search staff list to match user ID
                    let matchedOrgId = null;
                    let matchedOrgName = null;
                    
                    for (const org of allOrgs) {
                        try {
                            const staffRes = await getOrganizationStaff(org._id);
                            const staffList = staffRes.staff || [];
                            const isMember = staffList.some(
                                (s) => (s.userId._id || s.userId.id || s.userId).toString() === (user.id || user._id).toString()
                            );
                            if (isMember) {
                                matchedOrgId = org._id;
                                matchedOrgName = org.name;
                                break;
                            }
                        } catch (err) {
                            // Staff might not have permission to view other orgs' staff lists (expected 403)
                        }
                    }

                    if (matchedOrgId) {
                        setOrgId(matchedOrgId);
                        setOrgName(matchedOrgName);
                        localStorage.setItem("detectedOrgId", matchedOrgId);
                        localStorage.setItem("detectedOrgName", matchedOrgName);
                    } else {
                        setError("This staff account is not assigned to any active organization.");
                    }
                }
            } catch (err) {
                console.error("Org detection hook error:", err);
                setError("Could not resolve organization associations.");
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
