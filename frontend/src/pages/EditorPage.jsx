import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import Editor from '@monaco-editor/react';
import { Save, Play, Terminal, Code2, FileJson, Hash, Layout } from 'lucide-react';
import { generateOutput } from '../utils/generateOutput';
import api from '../api';

const EditorPage = () => {
    const [files, setFiles] = useState({
        html: '<h1>Hello World</h1>',
        css: 'h1 { color: #007acc; text-align: center; font-family: sans-serif; }',
        js: 'console.log("Console is working!");'
    });

    const [activeTab, setActiveTab] = useState('html');
    const [srcDoc, setSrcDoc] = useState('');
    const [logs, setLogs] = useState([]);
    const [showPreview, setShowPreview] = useState(true);
    const [executionKey, setExecutionKey] = useState(0);
    const { roomId } = useParams();

    // Catch console logs from the iframe
    useEffect(() => {
        const handleMessage = (event) => {
            if (event.data.type === 'CONSOLE_LOG') {
                setLogs(prev => [...prev, event.data.payload.join(' ')]);
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    // 1. Fetch project data from DB on component mount
    useEffect(() => {
        const fetchProject = async () => {
            try {
                const { data } = await api.get(`/projects/${roomId}`);
                if (data) {
                    setFiles({
                        html: data.html || '<h1>Hello World</h1>',
                        css: data.css || '',
                        js: data.js || ''
                    });
                }
            } catch (err) {
                console.error("New room or failed to load:", err);
            }
        };
        fetchProject();
    }, [roomId]);

    // 2. Manual Save function to persist current state to DB
    const saveProject = async () => {
        try {
            await api.put(`/projects/${roomId}`, {
                html: files.html,
                css: files.css,
                js: files.js
            });
            alert("Project saved successfully!");
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.error || "Failed to save project");
        }
    };

    const runCode = () => {
        setLogs([]);
        setSrcDoc(generateOutput(files.html, files.css, files.js));
        setShowPreview(true);
        setExecutionKey(prev => prev + 1); // Increment key to force-mount a new iframe
    };

    const handleEditorChange = (value) => {
        setFiles(prev => ({ ...prev, [activeTab]: value }));
    };

    return (
        <MainLayout>
            <div className="flex h-full w-full bg-editor overflow-hidden relative">

                {/* Left: Editor Panel */}
                <div
                    className={`flex flex-col border-r border-white/10 transition-all duration-300 ease-in-out ${showPreview ? 'w-1/2' : 'w-full'
                        }`}
                >
                    {/* Tab Bar */}
                    <div className="flex bg-sidebar border-b border-white/10 items-center">
                        {['html', 'css', 'js'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 text-xs flex items-center gap-2 border-r border-white/5 transition-all ${activeTab === tab
                                    ? 'bg-editor text-white border-t-2 border-t-accent'
                                    : 'text-gray-500 hover:bg-editor/50'
                                    }`}
                            >
                                {tab === 'html' && <Code2 size={14} className="text-orange-500" />}
                                {tab === 'css' && <Hash size={14} className="text-blue-400" />}
                                {tab === 'js' && <FileJson size={14} className="text-yellow-400" />}
                                {tab.toUpperCase()}
                            </button>
                        ))}

                        <div className="flex-grow"></div>

                        {/* Toolbar */}
                        <div className="flex items-center gap-2 px-2">
                            <button
                                onClick={saveProject}
                                className="px-3 py-1 text-xs bg-accent hover:bg-blue-600 rounded text-white flex items-center gap-2 transition-colors font-bold"
                            >
                                <Save size={14} /> SAVE
                            </button>
                            <button
                                onClick={() => setShowPreview(!showPreview)}
                                className={`p-1.5 rounded hover:bg-white/10 transition-colors ${!showPreview ? 'text-accent bg-accent/10' : 'text-gray-400'}`}
                                title={showPreview ? "Hide Preview" : "Show Preview"}
                            >
                                <Layout size={16} />
                            </button>

                            <button
                                className="my-1 px-3 py-1 text-xs bg-green-600 hover:bg-green-700 rounded text-white flex items-center gap-2 transition-colors font-bold"
                                onClick={runCode}
                            >
                                <Play size={14} fill="currentColor" /> RUN
                            </button>
                        </div>
                    </div>

                    <div className="flex-grow">
                        <Editor
                            height="100%"
                            theme="vs-dark"
                            language={activeTab === 'js' ? 'javascript' : activeTab}
                            value={files[activeTab]}
                            onChange={handleEditorChange}
                            options={{
                                fontSize: 14,
                                minimap: { enabled: false },
                                wordWrap: "on",
                                automaticLayout: true,
                            }}
                        />
                    </div>
                </div>

                {/* Right: Preview & Console */}
                {showPreview && (
                    <div className="w-1/2 flex flex-col animate-in slide-in-from-right duration-300">
                        <div className="flex-grow bg-white relative">
                            <iframe
                                key={executionKey}
                                srcDoc={srcDoc}
                                title="output"
                                sandbox="allow-scripts"
                                className="w-full h-full border-none"
                            />
                        </div>

                        <div className="h-40 bg-sidebar border-t border-white/10 flex flex-col">
                            <div className="px-3 py-1 bg-activity text-[10px] uppercase tracking-widest text-gray-400 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Terminal size={12} /> Live Console
                                </div>
                                <button onClick={() => setLogs([])} className="hover:text-white transition-colors">Clear</button>
                            </div>
                            <div className="flex-grow p-2 font-mono text-xs overflow-y-auto bg-black/20">
                                {logs.length === 0 && <span className="text-gray-600 italic">No output yet. Press Run...</span>}
                                {logs.map((log, i) => (
                                    <div key={i} className="text-green-400 py-0.5 border-b border-white/5 last:border-none">
                                        <span className="text-gray-500 mr-2 text-[10px]">
                                            [{new Date().toLocaleTimeString([], { hour12: false })}]
                                        </span>
                                        {log}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
};

export default EditorPage;