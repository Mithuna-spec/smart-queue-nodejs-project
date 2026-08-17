import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Input from "../components/Input";
import Button from "../components/Button";
import ErrorMessage from "../components/ErrorMessage";

const Register = () => {
    const { registerUser } = useAuth();
    const navigate = useNavigate();
    
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [phone, setPhone] = useState("");
    
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!name || !email || !password || !phone) {
            setError("All fields are required.");
            return;
        }

        setLoading(true);
        try {
            await registerUser(name, email, password, phone);
            setSuccess("Registration successful! Redirecting to login...");
            setTimeout(() => {
                navigate("/login");
            }, 2000);
        } catch (err) {
            console.error("Register component error:", err);
            setError(err.response?.data?.message || "Registration failed. Try again.");
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
                        Create Account
                    </h2>
                    <p className="text-xs text-[#A8A8A8]">
                        Register a standard user account to join queues and book slots.
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && <ErrorMessage message={error} />}
                    {success && (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg text-xs font-semibold text-center select-none">
                            {success}
                        </div>
                    )}

                    <Input
                        label="Full Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        disabled={loading}
                        required
                    />

                    <Input
                        label="Email Address"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="john@example.com"
                        disabled={loading}
                        required
                    />

                    <Input
                        label="Phone Number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="1234567"
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
                        {loading ? "Registering..." : "Register"}
                    </Button>
                </form>

                {/* Switch to Login */}
                <div className="text-center pt-2">
                    <p className="text-xs text-[#A8A8A8]">
                        Already have an account?{" "}
                        <Link 
                            to="/login" 
                            className="text-[#EFB477] font-semibold hover:text-[#ED9663] transition-colors"
                        >
                            Sign In
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
