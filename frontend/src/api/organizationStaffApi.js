import API from "./axios";

export const addStaff = async (organizationId, staffData) => {
    const response = await API.post(`/api/organization-staff/organization/${organizationId}`, staffData);
    return response.data;
};

export const getOrganizationStaff = async (organizationId, page = 1, limit = 10) => {
    const response = await API.get(`/api/organization-staff/organization/${organizationId}`, {
        params: { page, limit }
    });
    return response.data;
};

export const getMyStaffOrganization = async () => {
    const response = await API.get("/api/organization-staff/me/organization");
    return response.data;
};

export const removeStaff = async (id) => {
    const response = await API.patch(`/api/organization-staff/${id}/remove`);
    return response.data;
};
