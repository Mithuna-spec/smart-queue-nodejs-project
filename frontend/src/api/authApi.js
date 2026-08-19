import API from "./axios";

export const login = async (email, password, role) => {
    const response = await API.post("/api/auth/login", { email, password, role });
    return response.data;
};

export const register = async (name, email, password, phone) => {
    const response = await API.post("/api/auth/register", { name, email, password, phone });
    return response.data;
};

export const getMe = async () => {
    const response = await API.get("/api/auth/me");
    return response.data;
};
