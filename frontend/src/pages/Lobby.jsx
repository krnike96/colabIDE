import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const Lobby = () => {
    const [roomName, setRoomName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleCreateRoom = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            // Hits your backend RoomController.create endpoint
            // This endpoint creates the room and returns the room object with its ID
            const { data } = await api.post('/rooms', { name: roomName });

            // Redirect to the editor with the new unique room ID
            navigate(`/editor/${data.id}`);
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.error || "Error creating room. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-screen w-full bg-editor flex items-center justify-center text-white p-4">
            <div className="bg-sidebar p-8 rounded-lg border border-white/10 w-full max-w-md shadow-2xl">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Create a Workspace</h1>
                    <p className="text-gray-400 text-sm">Give your room a name to start coding together</p>
                </div>

                <form onSubmit={handleCreateRoom} className="space-y-6">
                    <div>
                        <label className="block text-xs uppercase tracking-widest text-gray-500 font-bold mb-2">
                            Room Name
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. Portfolio Project, Bug Fix Session..."
                            className="w-full p-3 bg-editor border border-white/10 rounded focus:border-accent outline-none transition-all"
                            value={roomName}
                            onChange={(e) => setRoomName(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full py-3 rounded font-bold transition-all flex items-center justify-center gap-2 ${isLoading
                                ? 'bg-gray-600 cursor-not-allowed'
                                : 'bg-accent hover:bg-blue-600 active:scale-95 text-white'
                            }`}
                    >
                        {isLoading ? 'Creating Room...' : 'Start Coding'}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-white/5">
                    <p className="text-center text-xs text-gray-500 italic">
                        Once created, you can invite others by sharing the URL.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Lobby;