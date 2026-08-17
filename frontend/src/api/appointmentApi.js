import API from "./axios";

export const createAppointment = async (apptData) => {
    const response = await API.post("/api/appointments", apptData);
    return response.data;
};

export const getMyAppointments = async () => {
    const response = await API.get("/api/appointments/my");
    return response.data;
};

export const cancelAppointment = async (id) => {
    const response = await API.post(`/api/appointments/${id}/cancel`);
    return response.data;
};

export const getOrganizationAppointments = async (organizationId) => {
    const response = await API.get(`/api/appointments/organization/${organizationId}`);
    return response.data;
};

export const confirmAppointment = async (id) => {
    const response = await API.patch(`/api/appointments/${id}/confirm`);
    return response.data;
};

export const completeAppointment = async (id) => {
    const response = await API.patch(`/api/appointments/${id}/complete`);
    return response.data;
};

export const checkInAppointment = async (id) => {
    const response = await API.post(`/api/appointments/${id}/check-in`);
    return response.data;
};
