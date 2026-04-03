import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import Editor from '@monaco-editor/react';
import { Save, Play, Code2, FileJson, Hash, Layout, Plus, Trash2, Edit3, Loader2 } from 'lucide-react';
import { generateOutput } from '../utils/generateOutput';
import api from '../api';
import { socket } from '../socket';
import * as Y from 'yjs';
import { MonacoBinding } from 'y-monaco';

const EditorPage = () => {
    const { roomId } = useParams();
    const [files, setFiles] = useState([]);
    const [activeFileId, setActiveFileId] = useState(null);
    const [srcDoc, setSrcDoc] = useState('');
    const [logs, setLogs] = useState([]);
    const [showPreview, setShowPreview] = useState(true);
    const [executionKey, setExecutionKey] = useState(0);

    // Crucial: Track if we have received the full collaborative state from peers
    const [isSynced, setIsSynced] = useState(false);

    const [menuPos, setMenuPos] = useState(null);
    const [selectedFileId, setSelectedFileId] = useState(null);

    // PERSISTENT REFS
    const yDocRef = useRef(new Y.Doc());
    const editorRef = useRef(null);
    const bindingRef = useRef(null);
    const seededFiles = useRef(new Set());
    const filesRef = useRef(files);

    const activeFile = files.find(f => f.id === activeFileId);

    // Keep ref updated to avoid stale closures in setTimeout
    useEffect(() => {
        filesRef.current = files;
    }, [files]);

    // --- 1. FULL STATE SYNC & SOCKET INITIALIZATION ---
    useEffect(() => {
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : {};

        if (!socket.connected) {
            socket.connect();
        }

        socket.emit('join-room', { roomId, username: user.username || 'Anonymous' });

        const handleRemoteUpdate = (data) => {
            // 1. If someone else just joined and needs the history, send them our full state
            if (data.requestSync) {
                const fullState = Y.encodeStateAsUpdate(yDocRef.current);
                socket.emit('yjs-update', {
                    roomId,
                    update: Array.from(fullState),
                    isFullState: true
                });
                return;
            }

            // 2. Apply incoming updates (both incremental and full states)
            const update = data.update || data;
            if (update) {
                try {
                    const uint8Update = new Uint8Array(update);
                    // 'remote' origin ensures we don't infinitely echo updates back
                    Y.applyUpdate(yDocRef.current, uint8Update, 'remote');

                    if (data.isFullState) {
                        setIsSynced(true);
                    }
                } catch (err) {
                    console.error("Yjs Sync Error:", err);
                }
            }
        };

        const handleLocalUpdate = (update, origin) => {
            if (origin !== 'remote') {
                socket.emit('yjs-update', {
                    roomId,
                    update: Array.from(update) // Convert safely for JSON socket transport
                });
            }
        };

        socket.on('yjs-update', handleRemoteUpdate);
        yDocRef.current.on('update', handleLocalUpdate);

        // Request the current state of the document from anyone already in the room
        socket.emit('yjs-update', { roomId, requestSync: true });

        // Fallback: If we don't get a response in 1.5 seconds, assume we are the first person here.
        const syncTimeout = setTimeout(() => {
            setIsSynced(true);
        }, 1500);

        return () => {
            socket.off('yjs-update', handleRemoteUpdate);
            yDocRef.current.off('update', handleLocalUpdate);
            clearTimeout(syncTimeout);
        };
    }, [roomId]);

    // --- 2. BINDING & MODEL MANAGEMENT ---
    const bindEditorToYjs = (fileId) => {
        if (!editorRef.current || !fileId || !isSynced) return;

        if (bindingRef.current) {
            bindingRef.current.destroy();
            bindingRef.current = null;
        }

        const fileIdStr = fileId.toString();
        const yText = yDocRef.current.getText(fileIdStr);

        // Wait slightly for Monaco to definitely map the new model via the `path` prop
        setTimeout(() => {
            if (!editorRef.current) return;
            const model = editorRef.current.getModel();
            if (!model) return;

            // Seed DB content ONLY if it's our first time looking at this file 
            // AND the collaborative document is truly empty.
            if (!seededFiles.current.has(fileIdStr)) {
                const currentFile = filesRef.current.find(f => f.id === fileId);
                if (yText.toString() === '' && currentFile?.content) {
                    yText.insert(0, currentFile.content);
                }
                seededFiles.current.add(fileIdStr);
            }

            bindingRef.current = new MonacoBinding(
                yText,
                model,
                new Set([editorRef.current])
            );
        }, 50);
    };

    const handleEditorDidMount = (editor) => {
        editorRef.current = editor;
        bindEditorToYjs(activeFileId);
    };

    useEffect(() => {
        bindEditorToYjs(activeFileId);
        return () => {
            if (bindingRef.current) {
                bindingRef.current.destroy();
                bindingRef.current = null;
            }
        };
    }, [activeFileId, isSynced]);

    // --- 3. DATA FETCHING & FILE OPS ---
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

    const sidebarContent = (
        <div className="flex flex-col h-full bg-[#1e1e1e]" onClick={() => setMenuPos(null)}>
            <div className="p-4 border-b border-white/5 flex justify-between items-center">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Explorer</span>
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
                        className={`px-4 py-2 text-sm flex items-center gap-2 cursor-pointer transition-colors ${activeFileId === file.id ? 'bg-accent/20 text-white' : 'text-gray-400 hover:bg-white/5'}`}
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

    return (
        <MainLayout sidebarContent={sidebarContent}>
            <div className="flex flex-col h-full bg-[#1e1e1e]" onClick={() => setMenuPos(null)}>
                <div className="flex bg-[#1e1e1e] border-b border-white/10 items-center px-2">
                    <div className="flex flex-grow overflow-x-auto no-scrollbar">
                        {files.map(file => (
                            <button
                                key={file.id}
                                onClick={() => setActiveFileId(file.id)}
                                className={`px-4 py-2 text-xs border-r border-white/5 whitespace-nowrap transition-colors ${activeFileId === file.id ? 'bg-[#1e1e1e] text-white border-t-2 border-accent' : 'text-gray-500'}`}
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
                                height="100%"
                                theme="vs-dark"
                                path={activeFile.id.toString()} // Forces Monaco to isolate history and text models per file
                                language={activeFile.language}
                                onMount={handleEditorDidMount}
                                options={{
                                    fontSize: 14,
                                    minimap: { enabled: false },
                                    automaticLayout: true,
                                    wordWrap: 'on'
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