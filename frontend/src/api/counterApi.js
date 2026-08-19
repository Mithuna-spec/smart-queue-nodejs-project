import API from "./axios";

export const createCounter = async (counterData) => {
    const response = await API.post("/api/counters", counterData);
    return response.data;
};

export const getCountersByOrganization = async (organizationId, page = 1, limit = 10) => {
    const response = await API.get(`/api/counters/organization/${organizationId}`, {
        params: { page, limit }
    });
    return response.data;
};

export const getAssignedCounter = async () => {
    const response = await API.get("/api/counters/assigned");
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

export const updateCounterAll = async (counterId, counterData) => {
    const response = await API.patch(`/api/counters/${counterId}/status`, counterData);
    return response.data;
};
