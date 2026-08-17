import API from "./axios";

export const getTokenStatus = async (id) => {
    const response = await API.get(`/api/tokens/${id}/status`);
    return response.data;
};

export const completeToken = async (id) => {
    const response = await API.post(`/api/tokens/${id}/complete`);
    return response.data;
};

export const skipToken = async (id) => {
    const response = await API.post(`/api/tokens/${id}/skip`);
    return response.data;
};

export const cancelToken = async (id) => {
    const response = await API.post(`/api/tokens/${id}/cancel`);
    return response.data;
};

export const startService = async (id) => {
    const response = await API.post(`/api/tokens/${id}/start`);
    return response.data;
};
