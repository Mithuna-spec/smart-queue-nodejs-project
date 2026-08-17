import API from "./axios";

export const createSlot = async (slotData) => {
    const response = await API.post("/api/appointment-slots", slotData);
    return response.data;
};

export const getAvailableSlots = async (serviceId, date) => {
    const response = await API.get("/api/appointment-slots/available", {
        params: { serviceId, date }
    });
    return response.data;
};
