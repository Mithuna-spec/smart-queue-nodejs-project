import API from "./axios";

export const createOrganization = async (orgData) => {
    const response = await API.post("/api/organizations", orgData);
    return response.data;
};

export const getOrganizations = async (page = 1, limit = 10) => {
    const response = await API.get("/api/organizations", {
        params: { page, limit }
    });
    return response.data;
};

export const getAvailableOrganizations = async () => {
    const response = await API.get("/api/organizations/available");
    return response.data;
};

export const getMyOrganization = async () => {
    const response = await API.get("/api/organizations/me");
    return response.data;
};

export const getOrganizationById = async (id) => {
    const response = await API.get(`/api/organizations/${id}`);
    return response.data;
};

export const updateOrganization = async (id, orgData) => {
    const response = await API.patch(`/api/organizations/${id}`, orgData);
    return response.data;
};

export const deleteOrganization = async (id) => {
    const response = await API.delete(`/api/organizations/${id}`);
    return response.data;
};
