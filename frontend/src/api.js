import axios from 'axios';

// Create a central axios instance with your backend base URL
const api = axios.create({
    baseURL: 'http://localhost:5000/api',
});

// Interceptor to attach the JWT token to every request automatically
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;