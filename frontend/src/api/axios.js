import axios from "axios";

const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
    headers: {
        "Content-Type": "application/json"
    }
});

// Request interceptor to attach JWT token
API.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle token expiry / error codes globally
API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            // Handle unauthorized access globally
            if (error.response.status === 401) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                // Optional: redirect to login
                if (window.location.pathname !== "/login" && window.location.pathname !== "/register") {
                    window.location.href = "/login";
                }
            }
        }
        return Promise.reject(error);
    }
);

export default API;
