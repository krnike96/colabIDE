import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import Editor from '@monaco-editor/react';
import { Save, Play, Code2, FileJson, Hash, Layout, Plus, Trash2, Edit3 } from 'lucide-react';
import { generateOutput } from '../utils/generateOutput';
import api from '../api';

const EditorPage = () => {
    const [files, setFiles] = useState([]);
    const [activeFileId, setActiveFileId] = useState(null);
    const [srcDoc, setSrcDoc] = useState('');
    const [logs, setLogs] = useState([]);
    const [showPreview, setShowPreview] = useState(true);
    const [executionKey, setExecutionKey] = useState(0);
    const { roomId } = useParams();

    const [menuPos, setMenuPos] = useState(null);
    const [selectedFileId, setSelectedFileId] = useState(null);

    const activeFile = files.find(f => f.id === activeFileId);

    // Fetch files on load and refresh
    const fetchProject = async () => {
        try {
            const { data } = await api.get(`/projects/room/${roomId}`);
            setFiles(data);
            // On refresh, try to maintain selection or pick first
            if (data.length > 0 && !activeFileId) {
                setActiveFileId(data[0].id);
            }
        } catch (err) {
            console.error("Failed to load project files", err);
        }
    };

    useEffect(() => {
        fetchProject();
    }, [roomId]);

    useEffect(() => {
        const handleMessage = (event) => {
            if (event.data.type === 'CONSOLE_LOG') {
                setLogs(prev => [...prev, event.data.payload.join(' ')]);
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    const createFile = async () => {
        const fileName = prompt("Enter file name:");
        if (!fileName) return;

        // Frontend check for duplicate
        if (files.some(f => f.name.toLowerCase() === fileName.toLowerCase())) {
            alert("A file with this name already exists!");
            return;
        }

        const extension = fileName.split('.').pop();
        const langMap = { js: 'javascript', html: 'html', css: 'css' };

        try {
            const { data } = await api.post('/files', {
                name: fileName,
                content: '',
                language: langMap[extension] || 'javascript',
                roomId: roomId
            });
            setFiles(prev => [...prev, data]);
            setActiveFileId(data.id);
        } catch (err) {
            alert(err.response?.data?.error || "Error creating file");
        }
    };

    const saveProject = async () => {
        if (!activeFileId || !activeFile) return;
        try {
            await api.put(`/projects/file/${activeFileId}`, { content: activeFile.content });
            alert("Saved!");
        } catch (err) {
            alert("Save failed");
        }
    };

    const deleteFile = async (id) => {
        if (!window.confirm("Delete this file?")) return;
        try {
            await api.delete(`/files/${id}`);
            const updated = files.filter(f => f.id !== id);
            setFiles(updated);
            if (activeFileId === id) setActiveFileId(updated[0]?.id || null);
        } catch (err) { alert("Delete failed"); }
    };

    const renameFile = async (id, currentName) => {
        const newName = prompt("New name:", currentName);
        if (!newName || newName === currentName) return;

        try {
            await api.patch(`/projects/file/${id}/rename`, { name: newName });
            setFiles(prev => prev.map(f => f.id === id ? { ...f, name: newName } : f));
        } catch (err) {
            alert(err.response?.data?.error || "Rename failed");
        }
    };

    const runCode = () => {
        setLogs([]);
        const html = files.find(f => f.name.toLowerCase().endsWith('.html'))?.content || '';
        const css = files.find(f => f.name.toLowerCase().endsWith('.css'))?.content || '';
        const js = files.find(f => f.name.toLowerCase().endsWith('.js'))?.content || '';
        setSrcDoc(generateOutput(html, css, js));
        setExecutionKey(prev => prev + 1);
    };

    const handleContextMenu = (e, fileId) => {
        e.preventDefault();
        setMenuPos({ x: e.pageX, y: e.pageY });
        setSelectedFileId(fileId);
    };

    const getFileIcon = (name) => {
        if (name.endsWith('.html')) return <Code2 size={14} className="text-orange-500" />;
        if (name.endsWith('.css')) return <Hash size={14} className="text-blue-400" />;
        if (name.endsWith('.js')) return <FileJson size={14} className="text-yellow-400" />;
        return <Plus size={14} className="text-gray-400" />;
    };

    const sidebarContent = (
        <div className="flex flex-col h-full" onClick={() => setMenuPos(null)}>
            <div className="p-3 border-b border-white/5 flex items-center justify-between">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Explorer</span>
                <button onClick={createFile} className="p-1 hover:bg-white/10 rounded text-gray-400"><Plus size={14} /></button>
            </div>
            <div className="flex-grow overflow-y-auto">
                {files.map(file => (
                    <div
                        key={file.id}
                        onContextMenu={(e) => handleContextMenu(e, file.id)}
                        onClick={() => setActiveFileId(file.id)}
                        className={`px-4 py-1.5 text-sm cursor-pointer flex items-center gap-2 ${activeFileId === file.id ? 'bg-accent/20 text-white' : 'hover:bg-white/5 text-gray-400'}`}
                    >
                        {getFileIcon(file.name)} {file.name}
                    </div>
                ))}
            </div>
            {menuPos && (
                <div className="fixed bg-sidebar border border-white/10 shadow-2xl rounded py-1 z-50 w-40" style={{ top: menuPos.y, left: menuPos.x }}>
                    <button onClick={() => renameFile(selectedFileId, files.find(f => f.id === selectedFileId)?.name)} className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-accent hover:text-white flex items-center gap-2"><Edit3 size={12} /> Rename</button>
                    <button onClick={() => deleteFile(selectedFileId)} className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-500 hover:text-white flex items-center gap-2"><Trash2 size={12} /> Delete</button>
                </div>
            )}
        </div>
    );

    return (
        <MainLayout sidebarContent={sidebarContent}>
            <div className="flex flex-col h-full" onClick={() => setMenuPos(null)}>
                <div className="flex bg-sidebar border-b border-white/10 items-center px-2">
                    <div className="flex overflow-x-auto flex-grow no-scrollbar">
                        {files.map(file => (
                            <button key={file.id} onClick={() => setActiveFileId(file.id)} className={`px-4 py-2 text-xs border-r border-white/5 whitespace-nowrap ${activeFileId === file.id ? 'bg-editor text-white border-t-2 border-t-accent' : 'text-gray-500'}`}>
                                {file.name}
                            </button>
                        ))}
                    </div>
                    <div className="flex gap-1 ml-2">
                        <button onClick={saveProject} className="p-2 text-accent hover:text-white"><Save size={16} /></button>
                        <button onClick={runCode} className="p-2 text-green-500 hover:text-white"><Play size={16} /></button>
                        <button onClick={() => setShowPreview(!showPreview)} className="p-2 text-gray-400 hover:text-white"><Layout size={16} /></button>
                    </div>
                </div>
                <div className="flex flex-grow overflow-hidden">
                    <div className={`${showPreview ? 'w-1/2' : 'w-full'} h-full border-r border-white/10`}>
                        {activeFile ? (
                            <Editor height="100%" theme="vs-dark" language={activeFile.language} value={activeFile.content} onChange={(v) => setFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, content: v } : f))} />
                        ) : <div className="p-10 text-gray-600 italic">Select a file...</div>}
                    </div>
                    {showPreview && (
                        <div className="w-1/2 h-full flex flex-col bg-white">
                            <iframe key={executionKey} srcDoc={srcDoc} className="flex-grow w-full border-none" sandbox="allow-scripts" />
                            <div className="h-40 bg-editor border-t border-white/10 p-2 font-mono text-[10px] overflow-y-auto">
                                <div className="text-gray-500 mb-1 border-b border-white/5 pb-1 flex justify-between uppercase"><span>Console</span><button onClick={() => setLogs([])}>Clear</button></div>
                                {logs.map((log, i) => <div key={i} className="text-green-400 py-0.5 border-b border-white/5 last:border-none">{`> ${log}`}</div>)}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
};

export default EditorPage;