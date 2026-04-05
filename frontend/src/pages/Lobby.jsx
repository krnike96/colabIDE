import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Copy, Check } from 'lucide-react';   // added icons

const Lobby = () => {
    const [rooms, setRooms] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [roomName, setRoomName] = useState('');
    const [roomPassword, setRoomPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [copiedRoomId, setCopiedRoomId] = useState(null); // track which room was copied
    const navigate = useNavigate();

    const fetchRooms = async () => {
        try {
            const { data } = await api.get('/rooms');
            setRooms(data);
        } catch (err) {
            console.error('Failed to fetch rooms', err);
        }
    };

    useEffect(() => {
        fetchRooms();
        const interval = setInterval(fetchRooms, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleCreateRoom = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const { data } = await api.post('/rooms', { name: roomName, password: roomPassword });
            sessionStorage.setItem(`room_${data.id}_password`, roomPassword);
            navigate(`/editor/${data.id}`);
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to create room');
        } finally {
            setIsLoading(false);
            setShowCreateModal(false);
            setRoomName('');
            setRoomPassword('');
        }
    };

    const handleJoinRoom = async (roomId, password) => {
        try {
            await api.post('/rooms/join', { roomId, password });
            sessionStorage.setItem(`room_${roomId}_password`, password);
            navigate(`/editor/${roomId}`);
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to join room');
        }
    };

    const copyRoomLink = (roomId) => {
        const link = `${window.location.origin}/join/${roomId}`;
        navigator.clipboard.writeText(link);
        setCopiedRoomId(roomId);
        setTimeout(() => setCopiedRoomId(null), 2000);
    };

    return (
        <div className="h-screen w-full bg-editor flex flex-col text-white">
            <div className="bg-sidebar p-4 flex justify-between items-center border-b border-white/10">
                <h1 className="text-2xl font-bold">ColabIDE</h1>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-accent rounded hover:bg-blue-600"
                >
                    New Workspace
                </button>
            </div>
            <div className="flex-1 p-6 overflow-y-auto">
                <h2 className="text-xl mb-4">Active Workspaces</h2>
                {rooms.length === 0 ? (
                    <p className="text-gray-500">No active workspaces. Create one!</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {rooms.map(room => (
                            <div key={room.id} className="bg-sidebar p-4 rounded border border-white/10">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-semibold">{room.name}</h3>
                                        <p className="text-sm text-gray-400">ID: {room.id.slice(0, 8)}...</p>
                                    </div>
                                    <button
                                        onClick={() => copyRoomLink(room.id)}
                                        className="p-1 hover:bg-white/10 rounded transition-colors"
                                        title="Copy invite link"
                                    >
                                        {copiedRoomId === room.id ? (
                                            <Check size={16} className="text-green-500" />
                                        ) : (
                                            <Copy size={16} className="text-gray-400" />
                                        )}
                                    </button>
                                </div>
                                <button
                                    onClick={() => {
                                        setSelectedRoom(room);
                                        setShowJoinModal(true);
                                    }}
                                    className="mt-2 px-3 py-1 bg-accent rounded text-sm hover:bg-blue-600 w-full"
                                >
                                    Join
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Modal (unchanged) */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-sidebar rounded p-6 w-96">
                        <h2 className="text-xl mb-4">Create Workspace</h2>
                        <form onSubmit={handleCreateRoom}>
                            <input
                                type="text"
                                placeholder="Room Name"
                                className="w-full p-2 bg-editor border border-white/10 rounded mb-3"
                                value={roomName}
                                onChange={e => setRoomName(e.target.value)}
                                required
                            />
                            <input
                                type="password"
                                placeholder="Room Password"
                                className="w-full p-2 bg-editor border border-white/10 rounded mb-4"
                                value={roomPassword}
                                onChange={e => setRoomPassword(e.target.value)}
                                required
                            />
                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 bg-gray-600 rounded">Cancel</button>
                                <button type="submit" disabled={isLoading} className="px-4 py-2 bg-accent rounded">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Join Modal (unchanged) */}
            {showJoinModal && selectedRoom && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-sidebar rounded p-6 w-96">
                        <h2 className="text-xl mb-4">Join {selectedRoom.name}</h2>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const pwd = e.target.password.value;
                            handleJoinRoom(selectedRoom.id, pwd);
                        }}>
                            <input
                                type="password"
                                name="password"
                                placeholder="Room Password"
                                className="w-full p-2 bg-editor border border-white/10 rounded mb-4"
                                required
                            />
                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => setShowJoinModal(false)} className="px-4 py-2 bg-gray-600 rounded">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-accent rounded">Join</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Lobby;