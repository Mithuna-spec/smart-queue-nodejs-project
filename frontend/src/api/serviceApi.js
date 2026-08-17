import API from "./axios";

export const createService = async (serviceData) => {
    const response = await API.post("/api/services", serviceData);
    return response.data;
};

export const getServicesByOrganization = async (organizationId) => {
    const response = await API.get(`/api/services/organization/${organizationId}`);
    return response.data;
};

export const getServiceById = async (id) => {
    const response = await API.get(`/api/services/${id}`);
    return response.data;
};

export const updateService = async (id, serviceData) => {
    const response = await API.patch(`/api/services/${id}`, serviceData);
    return response.data;
};

export const deleteService = async (id) => {
    const response = await API.delete(`/api/services/${id}`);
    return response.data;
};
