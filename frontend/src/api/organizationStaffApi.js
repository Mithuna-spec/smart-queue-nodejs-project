import API from "./axios";

export const addStaff = async (staffData) => {
    const response = await API.post("/api/organization-staff", staffData);
    return response.data;
};

export const getOrganizationStaff = async (organizationId) => {
    const response = await API.get(`/api/organization-staff/organization/${organizationId}`);
    return response.data;
};

export const removeStaff = async (id) => {
    const response = await API.patch(`/api/organization-staff/${id}/remove`);
    return response.data;
};
