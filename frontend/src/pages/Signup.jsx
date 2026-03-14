import React from 'react';
import { Link } from 'react-router-dom';

const Signup = () => {
    return (
        <div className="h-screen flex items-center justify-center bg-editor text-white">
            <div className="bg-sidebar p-8 rounded-lg border border-white/10 w-96">
                <h2 className="text-2xl font-bold mb-6 text-center">Create Account</h2>
                <div className="space-y-4">
                    <input
                        type="text"
                        placeholder="Username"
                        className="w-full p-2 bg-editor border border-white/10 rounded focus:border-accent outline-none"
                    />
                    <input
                        type="email"
                        placeholder="Email Address"
                        className="w-full p-2 bg-editor border border-white/10 rounded focus:border-accent outline-none"
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        className="w-full p-2 bg-editor border border-white/10 rounded focus:border-accent outline-none"
                    />
                    <button className="w-full py-2 bg-accent rounded font-bold hover:bg-blue-600 transition-colors">
                        Sign Up
                    </button>
                </div>
                <p className="mt-4 text-sm text-gray-400 text-center">
                    Already have an account? <Link to="/login" className="text-accent hover:underline">Login</Link>
                </p>
            </div>
        </div>
    );
};

export default Signup;