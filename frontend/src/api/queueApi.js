import API from "./axios";

export const createQueue = async (queueData) => {
    const response = await API.post("/api/queues", queueData);
    return response.data;
};

export const getQueuesByOrganization = async (organizationId, page = 1, limit = 10) => {
    const response = await API.get(`/api/queues/organization/${organizationId}`, {
        params: { page, limit }
    });
    return response.data;
};

export const getAvailableQueues = async (organizationId) => {
    const response = await API.get(`/api/queues/available/${organizationId}`);
    return response.data;
};

export const getQueueById = async (id) => {
    const response = await API.get(`/api/queues/${id}`);
    return response.data;
};

export const joinQueue = async (queueId) => {
    const response = await API.post(`/api/queues/${queueId}/join`, {});
    return response.data;
};

export const callNextToken = async (queueId, counterId) => {
    const response = await API.post(`/api/queues/${queueId}/next`, { counterId });
    return response.data;
};

export const updateQueuePolicy = async (queueId, policyData) => {
    const response = await API.patch(`/api/queues/${queueId}/policy`, policyData);
    return response.data;
};

export const getQueueAnalytics = async (queueId) => {
    const response = await API.get(`/api/queues/${queueId}/analytics`);
    return response.data;
};

export const getAssignedQueue = async () => {
    const response = await API.get("/api/queues/assigned");
    return response.data;
};
