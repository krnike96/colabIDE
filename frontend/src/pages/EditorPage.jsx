import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';   // <-- added useNavigate
import Editor from '@monaco-editor/react';
import { Save, Play, Code2, FileJson, Hash, Layout, Plus, Trash2, Edit3, Loader2, Files, MessageSquare, Users, Settings } from 'lucide-react';
import { generateOutput } from '../utils/generateOutput';
import api from '../api';
import { socket } from '../socket';
import * as Y from 'yjs';
import { MonacoBinding } from 'y-monaco';
import * as awarenessProtocol from 'y-protocols/awareness';

// Utility to generate a consistent HEX color based on a username string
const stringToHexColor = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return '#' + '00000'.substring(0, 6 - c.length) + c;
};

// --- MainLayout Component (unchanged) ---
const MainLayout = ({ children, sidebarPanels = {}, activeUserCount = 0 }) => {
    const [activeTab, setActiveTab] = useState('files');
    return (
        <div className="flex h-screen w-screen bg-[#1e1e1e] text-gray-300 font-sans">
            <div className="w-12 bg-[#333333] flex flex-col items-center py-4 space-y-6 border-r border-white/10 z-20">
                <button onClick={() => setActiveTab('files')} title="Files" className="w-full flex justify-center outline-none">
                    <Files className={`cursor-pointer transition-colors ${activeTab === 'files' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`} />
                </button>
                <div className="relative w-full flex justify-center">
                    <button onClick={() => setActiveTab('users')} title="Active Users" className="outline-none">
                        <Users className={`cursor-pointer transition-colors ${activeTab === 'users' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`} />
                    </button>
                    {activeUserCount > 0 && (
                        <div className="absolute top-0 right-1 bg-blue-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full transform translate-x-1/2 -translate-y-1/2 pointer-events-none shadow-md">
                            {activeUserCount}
                        </div>
                    )}
                </div>
                <button onClick={() => setActiveTab('chat')} title="Chat" className="w-full flex justify-center outline-none">
                    <MessageSquare className={`cursor-pointer transition-colors ${activeTab === 'chat' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`} />
                </button>
                <div className="flex-grow"></div>
                <button title="Settings" className="w-full flex justify-center outline-none">
                    <Settings className="text-gray-500 cursor-pointer mb-2 hover:text-gray-300 transition-colors" />
                </button>
            </div>
            <div className="w-64 bg-[#252526] border-r border-white/10 flex flex-col z-10">
                <div className="flex-grow overflow-hidden">
                    {sidebarPanels[activeTab] || (
                        <div className="p-4 text-sm text-gray-500 italic">
                            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} coming soon...
                        </div>
                    )}
                </div>
            </div>
            <div className="flex-grow flex flex-col overflow-hidden relative">
                {children}
            </div>
        </div>
    );
};

// --- Main EditorPage Component ---
const EditorPage = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();               // <-- added navigate
    const [files, setFiles] = useState([]);
    const [activeFileId, setActiveFileId] = useState(null);
    const [srcDoc, setSrcDoc] = useState('');
    const [logs, setLogs] = useState([]);
    const [showPreview, setShowPreview] = useState(true);
    const [executionKey, setExecutionKey] = useState(0);

    const [isSynced, setIsSynced] = useState(false);
    const [activeUsers, setActiveUsers] = useState([]);

    const [menuPos, setMenuPos] = useState(null);
    const [selectedFileId, setSelectedFileId] = useState(null);

    // PERSISTENT REFS
    const yDocRef = useRef(new Y.Doc());
    const awarenessRef = useRef(new awarenessProtocol.Awareness(yDocRef.current));
    const bindingRef = useRef(null);
    const seededFiles = useRef(new Set());
    const filesRef = useRef(files);

    const activeFile = files.find(f => f.id === activeFileId);

    useEffect(() => {
        filesRef.current = files;
    }, [files]);

    // --- 1. SOCKET & YJS SYNC LOGIC (UPDATED with password) ---
    useEffect(() => {
        // Retrieve password from sessionStorage (set during join/create)
        const roomPassword = sessionStorage.getItem(`room_${roomId}_password`);
        if (!roomPassword) {
            alert('No password found for this room. Redirecting to lobby...');
            navigate('/lobby');
            return;
        }

        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : {};
        const username = user.username || 'Anonymous';

        if (!socket.connected) {
            socket.connect();
        }

        // Listen for authentication errors from server
        const handleJoinError = (error) => {
            alert(error.error);
            navigate('/lobby');
        };
        socket.on('join-error', handleJoinError);

        // Send join event with password
        socket.emit('join-room', { roomId, username, roomPassword });

        // --- Setup Local User Awareness ---
        const userColor = stringToHexColor(username);
        awarenessRef.current.setLocalStateField('user', {
            name: username,
            color: userColor
        });

        const handleAwarenessChange = ({ added, updated, removed }) => {
            const states = Array.from(awarenessRef.current.getStates().values());
            const users = states.map(state => state.user).filter(Boolean);
            const uniqueUsers = Array.from(new Map(users.map(u => [u.name, u])).values());
            setActiveUsers(uniqueUsers);

            const changedClients = added.concat(updated, removed);
            const update = awarenessProtocol.encodeAwarenessUpdate(awarenessRef.current, changedClients);
            socket.emit('awareness-update', { roomId, update: Array.from(update) });
        };

        awarenessRef.current.on('change', handleAwarenessChange);

        const handleRemoteAwareness = (data) => {
            try {
                const uint8Update = new Uint8Array(data.update || data);
                awarenessProtocol.applyAwarenessUpdate(awarenessRef.current, uint8Update, 'remote');
            } catch (err) {
                console.error("Awareness Sync Error:", err);
            }
        };

        const handleRemoteUpdate = (data) => {
            try {
                if (data.requestSync) {
                    const fullState = Y.encodeStateAsUpdate(yDocRef.current);
                    socket.emit('yjs-update', {
                        roomId,
                        update: Array.from(fullState),
                        isFullState: true
                    });
                    return;
                }

                if (data.roomId === roomId && data.update) {
                    const uint8Update = new Uint8Array(data.update);
                    Y.applyUpdate(yDocRef.current, uint8Update, 'remote');
                    if (data.isFullState) {
                        setIsSynced(true);
                    }
                }
            } catch (err) {
                console.error("Yjs Sync Error:", err);
            }
        };

        const handleLocalUpdate = (update, origin) => {
            if (origin !== 'remote') {
                socket.emit('yjs-update', {
                    roomId,
                    update: Array.from(update)
                });
            }
        };

        socket.on('yjs-update', handleRemoteUpdate);
        socket.on('awareness-update', handleRemoteAwareness);
        yDocRef.current.on('update', handleLocalUpdate);

        socket.emit('yjs-update', { roomId, requestSync: true });

        const syncTimeout = setTimeout(() => {
            setIsSynced(true);
        }, 1500);

        return () => {
            socket.off('join-error', handleJoinError);
            socket.off('yjs-update', handleRemoteUpdate);
            socket.off('awareness-update', handleRemoteAwareness);
            yDocRef.current.off('update', handleLocalUpdate);
            awarenessRef.current.off('change', handleAwarenessChange);
            clearTimeout(syncTimeout);
        };
    }, [roomId, navigate]);

    // --- 2. BINDING & MODEL MANAGEMENT (unchanged) ---
    const handleEditorDidMount = (editor) => {
        if (!activeFileId || !isSynced) return;

        if (bindingRef.current) {
            bindingRef.current.destroy();
            bindingRef.current = null;
        }

        const fileIdStr = activeFileId.toString();
        const yText = yDocRef.current.getText(fileIdStr);

        if (!seededFiles.current.has(fileIdStr)) {
            const currentFile = filesRef.current.find(f => f.id === activeFileId);
            if (yText.toString() === '' && currentFile?.content) {
                yText.insert(0, currentFile.content);
            }
            seededFiles.current.add(fileIdStr);
        }

        bindingRef.current = new MonacoBinding(
            yText,
            editor.getModel(),
            new Set([editor]),
            awarenessRef.current
        );
    };

    useEffect(() => {
        return () => {
            if (bindingRef.current) {
                bindingRef.current.destroy();
                bindingRef.current = null;
            }
        };
    }, [activeFileId]);

    // --- 3. DATA FETCHING & FILE OPS (unchanged) ---
    const loadProject = async () => {
        try {
            const { data } = await api.get(`/projects/room/${roomId}`);
            setFiles(data);
            if (data.length > 0 && !activeFileId) {
                setActiveFileId(data[0].id);
            }
        } catch (err) {
            console.error("Load error:", err);
        }
    };

    useEffect(() => {
        loadProject();
    }, [roomId]);

    const saveProject = async () => {
        if (!activeFileId) return;
        try {
            const content = yDocRef.current.getText(activeFileId.toString()).toString();
            await api.put(`/projects/file/${activeFileId}`, { content });
            setFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, content } : f));
        } catch (err) {
            console.error("Save error");
        }
    };

    const runCode = () => {
        setLogs([]);
        const getC = (ext) => {
            const f = files.find(file => file.name.toLowerCase().endsWith(ext));
            return f ? yDocRef.current.getText(f.id.toString()).toString() : '';
        };
        const html = getC('.html');
        const css = getC('.css');
        const js = getC('.js');
        setSrcDoc(generateOutput(html, css, js));
        setExecutionKey(prev => prev + 1);
    };

    useEffect(() => {
        const onMsg = (e) => {
            if (e.data.type === 'CONSOLE_LOG') {
                setLogs(prev => [...prev, e.data.payload.join(' ')]);
            }
        };
        window.addEventListener('message', onMsg);
        return () => window.removeEventListener('message', onMsg);
    }, []);

    const createFile = async () => {
        const name = prompt("Filename:");
        if (!name) return;
        const ext = name.split('.').pop();
        const langMap = { js: 'javascript', html: 'html', css: 'css' };
        try {
            const { data } = await api.post('/files', {
                name,
                content: '',
                language: langMap[ext] || 'javascript',
                roomId
            });
            setFiles(prev => [...prev, data]);
            setActiveFileId(data.id);
        } catch (err) { console.error("Create error"); }
    };

    const renameFile = async (id, oldName) => {
        const newName = prompt("Rename to:", oldName);
        if (!newName || newName === oldName) return;
        try {
            await api.patch(`/projects/file/${id}/rename`, { name: newName });
            setFiles(prev => prev.map(f => f.id === id ? { ...f, name: newName } : f));
        } catch (err) { console.error("Rename failed"); }
    };

    const deleteFile = async (id) => {
        if (!window.confirm("Delete file?")) return;
        try {
            await api.delete(`/files/${id}`);
            const remaining = files.filter(f => f.id !== id);
            setFiles(remaining);
            if (activeFileId === id) setActiveFileId(remaining[0]?.id || null);
        } catch (err) { console.error("Delete error"); }
    };

    const getFileIcon = (name) => {
        if (name.endsWith('.html')) return <Code2 size={14} className="text-orange-500" />;
        if (name.endsWith('.css')) return <Hash size={14} className="text-blue-400" />;
        if (name.endsWith('.js')) return <FileJson size={14} className="text-yellow-400" />;
        return <Plus size={14} className="text-gray-400" />;
    };

    // --- SIDEBAR PANELS (unchanged) ---
    const filesPanel = (
        <div className="flex flex-col h-full bg-[#252526]" onClick={() => setMenuPos(null)}>
            <div className="p-4 border-b border-white/5 flex justify-between items-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Explorer</span>
                <button onClick={createFile} className="p-1 hover:bg-white/10 rounded transition-colors text-gray-400"><Plus size={14} /></button>
            </div>
            <div className="flex-grow overflow-y-auto">
                {files.map(file => (
                    <div
                        key={file.id}
                        onContextMenu={(e) => {
                            e.preventDefault();
                            setMenuPos({ x: e.pageX, y: e.pageY });
                            setSelectedFileId(file.id);
                        }}
                        onClick={() => setActiveFileId(file.id)}
                        className={`px-4 py-2 text-sm flex items-center gap-2 cursor-pointer transition-colors ${activeFileId === file.id ? 'bg-accent/20 text-white border-l-2 border-accent' : 'text-gray-400 hover:bg-white/5'}`}
                    >
                        {getFileIcon(file.name)}
                        <span className="truncate">{file.name}</span>
                    </div>
                ))}
            </div>
            {menuPos && (
                <div className="fixed bg-[#1e1e1e] border border-white/10 shadow-2xl py-1 z-50 w-40 rounded" style={{ top: menuPos.y, left: menuPos.x }}>
                    <button onClick={() => renameFile(selectedFileId, files.find(f => f.id === selectedFileId)?.name)} className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-accent hover:text-white flex items-center gap-2">
                        <Edit3 size={12} /> Rename
                    </button>
                    <button onClick={() => deleteFile(selectedFileId)} className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-500 hover:text-white flex items-center gap-2">
                        <Trash2 size={12} /> Delete
                    </button>
                </div>
            )}
        </div>
    );

    const usersPanel = (
        <div className="flex flex-col h-full bg-[#252526]">
            <div className="p-4 border-b border-white/5 flex justify-between items-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Users ({activeUsers.length})</span>
            </div>
            <div className="flex-grow overflow-y-auto p-2 space-y-1">
                {activeUsers.map((u, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded hover:bg-white/5 transition-colors">
                        <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm"
                            style={{ backgroundColor: u.color }}
                        >
                            {u.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-gray-300 truncate">{u.name}</span>
                        <div className="w-2 h-2 rounded-full bg-green-500 ml-auto shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <MainLayout sidebarPanels={{ files: filesPanel, users: usersPanel }} activeUserCount={activeUsers.length}>
            <style>{`
                .yRemoteSelection { background-color: inherit; opacity: 0.4; }
                .yRemoteSelectionHead {
                    position: absolute;
                    border-left: 2px solid;
                    height: 100%;
                    box-sizing: border-box;
                    z-index: 10;
                }
                .yRemoteSelectionHead::after {
                    content: attr(data-user);
                    position: absolute;
                    top: -20px;
                    left: -2px;
                    color: white;
                    font-size: 11px;
                    font-family: ui-sans-serif, system-ui, sans-serif;
                    font-weight: 600;
                    padding: 2px 6px;
                    border-radius: 4px;
                    border-bottom-left-radius: 0;
                    white-space: nowrap;
                    pointer-events: none;
                    z-index: 50;
                    background-color: inherit;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                }
            `}</style>
            <div className="flex flex-col h-full bg-[#1e1e1e]" onClick={() => setMenuPos(null)}>
                <div className="flex bg-[#1e1e1e] border-b border-white/10 items-center px-2 z-10">
                    <div className="flex flex-grow overflow-x-auto no-scrollbar">
                        {files.map(file => (
                            <button
                                key={file.id}
                                onClick={() => setActiveFileId(file.id)}
                                className={`px-4 py-2.5 text-xs border-r border-white/5 whitespace-nowrap transition-colors ${activeFileId === file.id ? 'bg-[#1e1e1e] text-white border-t-2 border-accent' : 'text-gray-500 hover:bg-white/5'}`}
                            >
                                {file.name}
                            </button>
                        ))}
                    </div>
                    <div className="flex gap-1 ml-auto px-2">
                        <button onClick={saveProject} className="p-2 text-accent hover:text-white" title="Save All"><Save size={16} /></button>
                        <button onClick={runCode} className="p-2 text-green-500 hover:text-white" title="Run Code"><Play size={16} /></button>
                        <button onClick={() => setShowPreview(!showPreview)} className="p-2 text-gray-400 hover:text-white"><Layout size={16} /></button>
                    </div>
                </div>
                <div className="flex flex-grow overflow-hidden">
                    <div className={`${showPreview ? 'w-1/2' : 'w-full'} h-full border-r border-white/10 relative`}>
                        {!isSynced ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3 font-mono text-sm">
                                <Loader2 size={32} className="animate-spin text-accent" />
                                <p>Synchronizing workspace...</p>
                            </div>
                        ) : activeFile ? (
                            <Editor
                                key={activeFile.id}
                                height="100%"
                                theme="vs-dark"
                                path={activeFile.id.toString()}
                                language={activeFile.language}
                                onMount={handleEditorDidMount}
                                options={{
                                    fontSize: 14,
                                    minimap: { enabled: false },
                                    automaticLayout: true,
                                    wordWrap: 'on',
                                    padding: { top: 24 }
                                }}
                            />
                        ) : <div className="flex items-center justify-center h-full text-gray-700 italic">Select a file...</div>}
                    </div>
                    {showPreview && (
                        <div className="w-1/2 h-full flex flex-col bg-white">
                            <iframe key={executionKey} srcDoc={srcDoc} className="flex-grow w-full border-none" sandbox="allow-scripts" title="Preview" />
                            <div className="h-40 bg-[#1e1e1e] border-t border-white/10 overflow-y-auto p-2 font-mono text-[10px]">
                                <div className="text-gray-500 mb-1 flex justify-between border-b border-white/5 uppercase pb-1">
                                    <span>Console</span>
                                    <button onClick={() => setLogs([])} className="hover:text-white">Clear</button>
                                </div>
                                {logs.map((l, i) => <div key={i} className="text-green-400 py-0.5 border-b border-white/5 last:border-none truncate">{`> ${l}`}</div>)}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
};

export default EditorPage;