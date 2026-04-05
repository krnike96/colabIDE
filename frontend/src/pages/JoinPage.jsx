import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { Lock, ArrowLeft, Home } from 'lucide-react';

const JoinPage = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [roomInfo, setRoomInfo] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isJoining, setIsJoining] = useState(false);
    const [error, setError] = useState('');

    // First, check if user is logged in
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            // Store the intended destination and redirect to login
            sessionStorage.setItem('redirectAfterLogin', `/join/${roomId}`);
            navigate('/login');
            return;
        }

        // Fetch room info (just name, existence) – no password needed yet
        const fetchRoomInfo = async () => {
            try {
                const { data } = await api.get(`/rooms/${roomId}/join-info`);
                setRoomInfo(data);
            } catch (err) {
                setError(err.response?.data?.error || 'Room not found or inactive');
            } finally {
                setIsLoading(false);
            }
        };

        fetchRoomInfo();
    }, [roomId, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsJoining(true);
        setError('');

        try {
            // Validate password and join
            await api.post('/rooms/join', { roomId, password });
            // Store password for socket connection
            sessionStorage.setItem(`room_${roomId}_password`, password);
            // Redirect to editor
            navigate(`/editor/${roomId}`);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to join room. Please check the password.');
            setIsJoining(false);
        }
    };

    if (isLoading) {
        return (
            <div className="h-screen w-full bg-editor flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
            </div>
        );
    }

    if (error && !roomInfo) {
        return (
            <div className="h-screen w-full bg-editor flex items-center justify-center p-4">
                <div className="bg-sidebar rounded-lg border border-white/10 p-8 max-w-md text-center">
                    <Lock size={48} className="text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-white mb-2">Cannot Join Room</h2>
                    <p className="text-gray-400 mb-6">{error}</p>
                    <div className="flex gap-3 justify-center">
                        <button onClick={() => navigate('/lobby')} className="px-5 py-2 bg-accent hover:bg-blue-600 rounded-lg transition-colors flex items-center gap-2">
                            <Home size={18} />
                            Go to Lobby
                        </button>
                        <button onClick={() => navigate(-1)} className="px-5 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2">
                            <ArrowLeft size={18} />
                            Go Back
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen w-full bg-editor flex items-center justify-center p-4">
            <div className="bg-sidebar rounded-lg border border-white/10 w-full max-w-md shadow-2xl">
                <div className="p-6 border-b border-white/10">
                    <h2 className="text-2xl font-bold text-white text-center">Join Workspace</h2>
                    <p className="text-gray-400 text-center mt-2">You've been invited to join</p>
                </div>

                <div className="p-6">
                    <div className="bg-editor rounded-lg p-4 mb-6 border border-white/10">
                        <p className="text-sm text-gray-400 mb-1">Room Name</p>
                        <p className="text-white font-semibold text-lg">{roomInfo?.name}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs uppercase tracking-widest text-gray-500 font-bold mb-2">
                                Room Password
                            </label>
                            <input
                                type="password"
                                placeholder="Enter the room password"
                                className="w-full p-3 bg-editor border border-white/10 rounded focus:border-accent outline-none transition-all text-white"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoFocus
                            />
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/50 rounded p-3 text-sm text-red-400">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isJoining}
                            className={`w-full py-3 rounded font-bold transition-all flex items-center justify-center gap-2 ${isJoining
                                    ? 'bg-gray-600 cursor-not-allowed'
                                    : 'bg-accent hover:bg-blue-600 text-white'
                                }`}
                        >
                            {isJoining ? 'Joining...' : 'Join Room'}
                        </button>

                        <button
                            type="button"
                            onClick={() => navigate('/lobby')}
                            className="w-full py-2 text-gray-400 hover:text-white transition-colors text-sm"
                        >
                            Browse all workspaces
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default JoinPage;