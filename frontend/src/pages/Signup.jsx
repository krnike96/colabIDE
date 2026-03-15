import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

const Signup = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: ''
    });
    const navigate = useNavigate();

    const handleSignup = async (e) => {
        e.preventDefault();
        try {
            // Post registration data to backend
            await api.post('/auth/register', formData);
            alert("Account created successfully! Please login.");
            navigate('/login');
        } catch (error) {
            alert(error.response?.data?.error || "Signup failed");
        }
    };

    return (
        <div className="h-screen flex items-center justify-center bg-editor text-white">
            <form onSubmit={handleSignup} className="bg-sidebar p-8 rounded-lg border border-white/10 w-96">
                <h2 className="text-2xl font-bold mb-6 text-center">Create Account</h2>
                <div className="space-y-4">
                    <input
                        type="text"
                        placeholder="Username"
                        className="w-full p-2 bg-editor border border-white/10 rounded focus:border-accent outline-none"
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        required
                    />
                    <input
                        type="email"
                        placeholder="Email Address"
                        className="w-full p-2 bg-editor border border-white/10 rounded focus:border-accent outline-none"
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        className="w-full p-2 bg-editor border border-white/10 rounded focus:border-accent outline-none"
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                    />
                    <button type="submit" className="w-full py-2 bg-accent rounded font-bold hover:bg-blue-600 transition-colors">
                        Sign Up
                    </button>
                </div>
                <p className="mt-4 text-sm text-gray-400 text-center">
                    Already have an account? <Link to="/login" className="text-accent hover:underline">Login</Link>
                </p>
            </form>
        </div>
    );
};

export default Signup;