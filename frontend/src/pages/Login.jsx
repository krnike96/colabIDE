import React from 'react';
import { Link } from 'react-router-dom';

const Login = () => {
    return (
        <div className="h-screen flex items-center justify-center bg-editor text-white">
            <div className="bg-sidebar p-8 rounded-lg border border-white/10 w-96">
                <h2 className="text-2xl font-bold mb-6 text-center">Welcome Back</h2>
                <div className="space-y-4">
                    <input type="email" placeholder="Email" className="w-full p-2 bg-editor border border-white/10 rounded" />
                    <input type="password" placeholder="Password" className="w-full p-2 bg-editor border border-white/10 rounded" />
                    <button className="w-full py-2 bg-accent rounded font-bold hover:bg-blue-600">Login</button>
                </div>
                <p className="mt-4 text-sm text-gray-400 text-center">
                    Don't have an account? <Link to="/signup" className="text-accent">Sign up</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;