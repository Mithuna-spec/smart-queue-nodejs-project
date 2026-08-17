import API from "./axios";

export const createOrganization = async (orgData) => {
    const response = await API.post("/api/organizations", orgData);
    return response.data;
};

export const getOrganizations = async () => {
    const response = await API.get("/api/organizations");
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
