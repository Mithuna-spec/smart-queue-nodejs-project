import React, { createContext, useState, useEffect, useContext } from "react";
import { login as apiLogin, register as apiRegister, getMe as apiGetMe } from "../api/authApi";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem("token"));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUser = async () => {
            if (token) {
                try {
                    const data = await apiGetMe();
                    setUser(data.user);
                } catch (err) {
                    console.error("Failed to load user info:", err);
                    // Clear invalid session
                    localStorage.removeItem("token");
                    setToken(null);
                    setUser(null);
                }
            }
            setLoading(false);
        };
        loadUser();
    }, [token]);

    const loginUser = async (email, password, role) => {
        setLoading(true);
        try {
            const data = await apiLogin(email, password, role);
            localStorage.setItem("token", data.token);
            setToken(data.token);
            setUser(data.user);
            return data.user;
        } catch (err) {
            console.error("Login failed:", err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const registerUser = async (name, email, password, phone) => {
        setLoading(true);
        try {
            const data = await apiRegister(name, email, password, phone);
            return data;
        } catch (err) {
            console.error("Registration failed:", err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const logoutUser = () => {
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
    };

    const value = {
        user,
        token,
        loading,
        loginUser,
        registerUser,
        logoutUser,
        isAuthenticated: !!token && !!user,
        hasRole: (roles) => user && roles.includes(user.role)
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
