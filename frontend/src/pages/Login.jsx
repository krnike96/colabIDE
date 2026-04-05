import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    // Check if there's a redirect target stored from before login
    useEffect(() => {
        const redirect = sessionStorage.getItem('redirectAfterLogin');
        if (redirect) {
            // Clear it after reading? We'll clear after login success.
        }
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const { data } = await api.post('/auth/login', { email, password });
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            // Check if we have a saved redirect path
            const redirectPath = sessionStorage.getItem('redirectAfterLogin');
            if (redirectPath) {
                sessionStorage.removeItem('redirectAfterLogin');
                navigate(redirectPath);
            } else {
                navigate('/lobby');
            }
        } catch (error) {
            alert(error.response?.data?.error || "Login failed. Please check your credentials.");
        }
    };

    return (
        <div className="h-screen flex items-center justify-center bg-editor text-white">
            <form onSubmit={handleLogin} className="bg-sidebar p-8 rounded-lg border border-white/10 w-96">
                <h2 className="text-2xl font-bold mb-6 text-center">Welcome Back</h2>
                <div className="space-y-4">
                    <input
                        type="email"
                        placeholder="Email"
                        className="w-full p-2 bg-editor border border-white/10 rounded focus:border-accent outline-none"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        className="w-full p-2 bg-editor border border-white/10 rounded focus:border-accent outline-none"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <button type="submit" className="w-full py-2 bg-accent rounded font-bold hover:bg-blue-600 transition-colors">
                        Login
                    </button>
                </div>
                <p className="mt-4 text-sm text-gray-400 text-center">
                    Don't have an account? <Link to="/signup" className="text-accent hover:underline">Sign up</Link>
                </p>
            </form>
        </div>
    );
};

export default Login;