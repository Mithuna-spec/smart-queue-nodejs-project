import API from "./axios";

export const createCounter = async (counterData) => {
    const response = await API.post("/api/counters", counterData);
    return response.data;
};

export const getCountersByOrganization = async (organizationId) => {
    const response = await API.get(`/api/counters/organization/${organizationId}`);
    return response.data;
};

export const assignStaffToCounter = async (counterId, staffId) => {
    const response = await API.patch(`/api/counters/${counterId}/staff`, { staffId });
    return response.data;
};

export const updateCounterStatus = async (counterId, status) => {
    const response = await API.patch(`/api/counters/${counterId}/status`, { status });
    return response.data;
};
