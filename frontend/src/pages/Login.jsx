import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Input from "../components/Input";
import Button from "../components/Button";
import ErrorMessage from "../components/ErrorMessage";

const Login = () => {
    const { loginUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const from = location.state?.from?.pathname || "/";

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        if (!email || !password) {
            setError("Email and password are required.");
            return;
        }

        setLoading(true);
        try {
            const user = await loginUser(email, password);
            // Redirect based on role
            if (user.role === "ADMIN") {
                navigate("/admin/dashboard");
            } else if (user.role === "ORGANIZATION") {
                navigate("/organization/dashboard");
            } else if (user.role === "STAFF") {
                navigate("/staff/dashboard");
            } else {
                navigate("/dashboard");
            }
        } catch (err) {
            console.error("Login component error:", err);
            setError(err.response?.data?.message || "Invalid email or password.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#202126] flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#292A2F] border border-[#35363B] rounded-2xl p-8 space-y-6 shadow-2xl">
                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="w-12 h-12 rounded-xl bg-[#DC423E] mx-auto flex items-center justify-center text-[#F5F5F5] font-black text-2xl shadow-lg select-none">
                        Q
                    </div>
                    <h2 className="text-[#F5F5F5] font-extrabold text-2xl tracking-tight">
                        Sign In
                    </h2>
                    <p className="text-xs text-[#A8A8A8]">
                        Enter your credentials to access the Smart Queue dashboard.
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && <ErrorMessage message={error} />}

                    <Input
                        label="Email Address"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        disabled={loading}
                        required
                    />

                    <Input
                        label="Password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        disabled={loading}
                        required
                    />

                    <Button 
                        type="submit" 
                        className="w-full font-bold py-2.5 mt-2" 
                        disabled={loading}
                    >
                        {loading ? "Signing in..." : "Sign In"}
                    </Button>
                </form>

                {/* Switch to Register */}
                <div className="text-center pt-2">
                    <p className="text-xs text-[#A8A8A8]">
                        Don't have an account?{" "}
                        <Link 
                            to="/register" 
                            className="text-[#EFB477] font-semibold hover:text-[#ED9663] transition-colors"
                        >
                            Create account
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
