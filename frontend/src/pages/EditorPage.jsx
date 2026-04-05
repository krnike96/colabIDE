import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { Copy, Check, Save, Play, Code2, FileJson, Hash, Layout, Plus, Trash2, Edit3, Loader2, Files, MessageSquare, Users, Settings } from 'lucide-react';
import { generateOutput } from '../utils/generateOutput';
import api from '../api';
import { socket } from '../socket';
import * as Y from 'yjs';
import { MonacoBinding } from 'y-monaco';
import * as awarenessProtocol from 'y-protocols/awareness';
import ChatPanel from '../components/ChatPanel';

const stringToHexColor = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return '#' + '00000'.substring(0, 6 - c.length) + c;
};

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

const EditorPage = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
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
    const [linkCopied, setLinkCopied] = useState(false);
    const [chatMessages, setChatMessages] = useState([]);

    const userStr = localStorage.getItem('user');
    const currentUsername = userStr ? JSON.parse(userStr).username : 'Anonymous';

    const yDocRef = useRef(new Y.Doc());
    const awarenessRef = useRef(new awarenessProtocol.Awareness(yDocRef.current));
    const bindingRef = useRef(null);
    const seededFiles = useRef(new Set());
    const filesRef = useRef(files);

    const activeFile = files.find(f => f.id === activeFileId);

    useEffect(() => {
        filesRef.current = files;
    }, [files]);

    // --- Load chat messages from localStorage on mount ---
    useEffect(() => {
        const stored = localStorage.getItem(`chat_${roomId}`);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) {
                    setChatMessages(parsed);
                }
            } catch (e) { console.error("Failed to load chat history"); }
        }
    }, [roomId]);

    // --- Save chat messages to localStorage whenever they change ---
    useEffect(() => {
        if (chatMessages.length > 0) {
            // Optional: limit to last 200 messages to avoid huge storage
            const toStore = chatMessages.slice(-200);
            localStorage.setItem(`chat_${roomId}`, JSON.stringify(toStore));
        } else {
            // If empty, you might want to remove the key, but we'll keep as is
            localStorage.removeItem(`chat_${roomId}`);
        }
    }, [chatMessages, roomId]);

    const addChatMessage = useCallback((message) => {
        setChatMessages(prev => [...prev, {
            id: Date.now() + Math.random(),
            sender: message.sender,
            text: message.text,
            timestamp: message.timestamp
        }]);
    }, []);

    // --- Helper to update files state (used by socket listener) ---
    const updateFiles = useCallback((newFiles) => {
        setFiles(newFiles);
    }, []);

    // --- Socket & Yjs sync (unchanged) ---
    useEffect(() => {
        const roomPassword = sessionStorage.getItem(`room_${roomId}_password`);
        if (!roomPassword) {
            alert('No password found for this room. Redirecting to lobby...');
            navigate('/lobby');
            return;
        }

        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const username = user.username || 'Anonymous';

        if (!socket.connected) socket.connect();

        const handleJoinError = (error) => {
            alert(error.error);
            navigate('/lobby');
        };
        socket.on('join-error', handleJoinError);

        socket.emit('join-room', { roomId, username, roomPassword });

        const userColor = stringToHexColor(username);
        awarenessRef.current.setLocalStateField('user', { name: username, color: userColor });

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
            } catch (err) { console.error("Awareness Sync Error:", err); }
        };

        const handleRemoteUpdate = (data) => {
            try {
                if (data.requestSync) {
                    const fullState = Y.encodeStateAsUpdate(yDocRef.current);
                    socket.emit('yjs-update', { roomId, update: Array.from(fullState), isFullState: true });
                    return;
                }
                if (data.roomId === roomId && data.update) {
                    const uint8Update = new Uint8Array(data.update);
                    Y.applyUpdate(yDocRef.current, uint8Update, 'remote');
                    if (data.isFullState) setIsSynced(true);
                }
            } catch (err) { console.error("Yjs Sync Error:", err); }
        };

        const handleLocalUpdate = (update, origin) => {
            if (origin !== 'remote') {
                socket.emit('yjs-update', { roomId, update: Array.from(update) });
            }
        };

        const handleReceiveMessage = (data) => {
            addChatMessage(data);
        };
        socket.on('receive-message', handleReceiveMessage);

        socket.on('yjs-update', handleRemoteUpdate);
        socket.on('awareness-update', handleRemoteAwareness);
        yDocRef.current.on('update', handleLocalUpdate);

        socket.emit('yjs-update', { roomId, requestSync: true });

        const syncTimeout = setTimeout(() => setIsSynced(true), 1500);

        return () => {
            socket.off('join-error', handleJoinError);
            socket.off('receive-message', handleReceiveMessage);
            socket.off('yjs-update', handleRemoteUpdate);
            socket.off('awareness-update', handleRemoteAwareness);
            yDocRef.current.off('update', handleLocalUpdate);
            awarenessRef.current.off('change', handleAwarenessChange);
            clearTimeout(syncTimeout);
        };
    }, [roomId, navigate, addChatMessage]);

    // --- File operation sync listener ---
    useEffect(() => {
        const handleFileOperation = (data) => {
            if (data.roomId !== roomId) return;

            switch (data.type) {
                case 'create':
                    setFiles(prev => [...prev, data.file]);
                    break;
                case 'rename':
                    setFiles(prev => prev.map(f =>
                        f.id === data.fileId ? { ...f, name: data.newName } : f
                    ));
                    break;
                case 'delete':
                    setFiles(prev => {
                        const newFiles = prev.filter(f => f.id !== data.fileId);
                        if (activeFileId === data.fileId) {
                            setActiveFileId(newFiles[0]?.id || null);
                        }
                        return newFiles;
                    });
                    break;
                default:
                    break;
            }
        };

        socket.on('file-operation', handleFileOperation);
        return () => socket.off('file-operation', handleFileOperation);
    }, [roomId, activeFileId]);

    // --- Monaco binding (unchanged) ---
    const handleEditorDidMount = (editor) => {
        if (!activeFileId || !isSynced) return;
        if (bindingRef.current) bindingRef.current.destroy();
        const fileIdStr = activeFileId.toString();
        const yText = yDocRef.current.getText(fileIdStr);
        if (!seededFiles.current.has(fileIdStr)) {
            const currentFile = filesRef.current.find(f => f.id === activeFileId);
            if (yText.toString() === '' && currentFile?.content) yText.insert(0, currentFile.content);
            seededFiles.current.add(fileIdStr);
        }
        bindingRef.current = new MonacoBinding(yText, editor.getModel(), new Set([editor]), awarenessRef.current);
    };

    useEffect(() => {
        return () => { if (bindingRef.current) bindingRef.current.destroy(); };
    }, [activeFileId]);

    // --- Data fetching ---
    const loadProject = async () => {
        try {
            const { data } = await api.get(`/projects/room/${roomId}`);
            setFiles(data);
            if (data.length > 0 && !activeFileId) setActiveFileId(data[0].id);
        } catch (err) { console.error("Load error:", err); }
    };

    useEffect(() => { loadProject(); }, [roomId]);

    // --- File operations with socket broadcast ---
    const saveProject = async () => {
        if (!activeFileId) return;
        try {
            const content = yDocRef.current.getText(activeFileId.toString()).toString();
            await api.put(`/projects/file/${activeFileId}`, { content });
            setFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, content } : f));
        } catch (err) { console.error("Save error"); }
    };

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
            socket.emit('file-operation', { roomId, type: 'create', file: data });
        } catch (err) { console.error("Create error"); alert(err.response?.data?.error || "Create failed"); }
    };

    const renameFile = async (id, oldName) => {
        const newName = prompt("Rename to:", oldName);
        if (!newName || newName === oldName) return;
        try {
            await api.patch(`/projects/file/${id}/rename`, { name: newName });
            setFiles(prev => prev.map(f => f.id === id ? { ...f, name: newName } : f));
            socket.emit('file-operation', { roomId, type: 'rename', fileId: id, newName });
        } catch (err) { console.error("Rename failed"); alert(err.response?.data?.error || "Rename failed"); }
    };

    const deleteFile = async (id) => {
        if (!window.confirm("Delete file?")) return;
        try {
            await api.delete(`/files/${id}`);
            const remaining = files.filter(f => f.id !== id);
            setFiles(remaining);
            if (activeFileId === id) setActiveFileId(remaining[0]?.id || null);
            socket.emit('file-operation', { roomId, type: 'delete', fileId: id });
        } catch (err) { console.error("Delete error"); alert("Delete failed"); }
    };

    // --- Preview and code execution ---
    const runCode = () => {
        setLogs([]);
        const getC = (ext) => {
            const f = files.find(file => file.name.toLowerCase().endsWith(ext));
            return f ? yDocRef.current.getText(f.id.toString()).toString() : '';
        };
        setSrcDoc(generateOutput(getC('.html'), getC('.css'), getC('.js')));
        setExecutionKey(prev => prev + 1);
    };

    useEffect(() => {
        const onMsg = (e) => { if (e.data.type === 'CONSOLE_LOG') setLogs(prev => [...prev, e.data.payload.join(' ')]); };
        window.addEventListener('message', onMsg);
        return () => window.removeEventListener('message', onMsg);
    }, []);

    const getFileIcon = (name) => {
        if (name.endsWith('.html')) return <Code2 size={14} className="text-orange-500" />;
        if (name.endsWith('.css')) return <Hash size={14} className="text-blue-400" />;
        if (name.endsWith('.js')) return <FileJson size={14} className="text-yellow-400" />;
        return <Plus size={14} className="text-gray-400" />;
    };

    // --- Sidebar panels (unchanged) ---
    const filesPanel = (
        <div className="flex flex-col h-full bg-[#252526]" onClick={() => setMenuPos(null)}>
            <div className="p-4 border-b border-white/5 flex justify-between items-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Explorer</span>
                <button onClick={createFile} className="p-1 hover:bg-white/10 rounded"><Plus size={14} /></button>
            </div>
            <div className="flex-grow overflow-y-auto">
                {files.map(file => (
                    <div
                        key={file.id}
                        onContextMenu={(e) => { e.preventDefault(); setMenuPos({ x: e.pageX, y: e.pageY }); setSelectedFileId(file.id); }}
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
                    <button onClick={() => renameFile(selectedFileId, files.find(f => f.id === selectedFileId)?.name)} className="w-full text-left px-3 py-2 text-xs hover:bg-accent hover:text-white flex items-center gap-2">
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
            <div className="p-4 border-b border-white/5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Users ({activeUsers.length})</span>
            </div>
            <div className="flex-grow overflow-y-auto p-2 space-y-1">
                {activeUsers.map((u, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded hover:bg-white/5">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm" style={{ backgroundColor: u.color }}>
                            {u.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-gray-300 truncate">{u.name}</span>
                        <div className="w-2 h-2 rounded-full bg-green-500 ml-auto"></div>
                    </div>
                ))}
            </div>
        </div>
    );

    const chatPanel = (
        <ChatPanel
            roomId={roomId}
            currentUser={currentUsername}
            messages={chatMessages}
            onSendMessage={(messageData) => {
                socket.emit('send-message', messageData);
            }}
        />
    );

    const copyRoomLink = () => {
        const link = `${window.location.origin}/join/${roomId}`;
        navigator.clipboard.writeText(link);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
    };

    return (
        <MainLayout sidebarPanels={{ files: filesPanel, users: usersPanel, chat: chatPanel }} activeUserCount={activeUsers.length}>
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
                            <button key={file.id} onClick={() => setActiveFileId(file.id)} className={`px-4 py-2.5 text-xs border-r border-white/5 whitespace-nowrap transition-colors ${activeFileId === file.id ? 'bg-[#1e1e1e] text-white border-t-2 border-accent' : 'text-gray-500 hover:bg-white/5'}`}>
                                {file.name}
                            </button>
                        ))}
                    </div>
                    <div className="flex gap-1 ml-auto px-2">
                        <button onClick={saveProject} className="p-2 text-accent hover:text-white" title="Save All"><Save size={16} /></button>
                        <button onClick={runCode} className="p-2 text-green-500 hover:text-white" title="Run Code"><Play size={16} /></button>
                        <button onClick={() => setShowPreview(!showPreview)} className="p-2 text-gray-400 hover:text-white"><Layout size={16} /></button>
                        <button onClick={copyRoomLink} className="p-2 text-gray-400 hover:text-white" title="Copy invite link">
                            {linkCopied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                        </button>
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