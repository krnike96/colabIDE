import React, { useState, useEffect} from 'react';
import MainLayout from '../components/MainLayout';
import Editor from '@monaco-editor/react';
import { Play, Terminal, Code2, FileJson, Hash } from 'lucide-react';
import { generateOutput } from '../utils/generateOutput';

const EditorPage = () => {
    // State for each "file"
    const [files, setFiles] = useState({
        html: '<h1>Hello World</h1>',
        css: 'h1 { color: #007acc; text-align: center; font-family: sans-serif; }',
        js: 'console.log("Console is working!");'
    });

    const [activeTab, setActiveTab] = useState('html');
    const [srcDoc, setSrcDoc] = useState('');
    const [logs, setLogs] = useState([]);

    useEffect(() => {
    const handleMessage = (event) => {
      if (event.data.type === 'CONSOLE_LOG') {
        // args comes as an array, we join them for display
        setLogs(prev => [...prev, event.data.payload.join(' ')]);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

    const runCode = () => {
        setLogs([]); // Clear console on run
        setSrcDoc(generateOutput(files.html, files.css, files.js));
    };

    const handleEditorChange = (value) => {
        setFiles(prev => ({ ...prev, [activeTab]: value }));
    };

    return (
        <MainLayout>
            <div className="flex h-full w-full bg-editor overflow-hidden">
                {/* Left: Editor Panel */}
                <div className="w-1/2 border-r border-white/10 flex flex-col">
                    {/* Tab Bar */}
                    <div className="flex bg-sidebar border-b border-white/10">
                        {['html', 'css', 'js'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 text-xs flex items-center gap-2 border-r border-white/5 transition-all ${activeTab === tab ? 'bg-editor text-white border-t-2 border-t-accent' : 'text-gray-500 hover:bg-editor/50'
                                    }`}
                            >
                                {tab === 'html' && <Code2 size={14} className="text-orange-500" />}
                                {tab === 'css' && <Hash size={14} className="text-blue-400" />}
                                {tab === 'js' && <FileJson size={14} className="text-yellow-400" />}
                                {tab.toUpperCase()}
                            </button>
                        ))}
                        <div className="flex-grow"></div>
                        <button
                            className="m-1 px-3 py-1 text-xs bg-green-600 hover:bg-green-700 rounded text-white flex items-center gap-2 transition-colors"
                            onClick={runCode}
                        >
                            <Play size={14} fill="currentColor" /> RUN
                        </button>
                    </div>

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
                            scrollBeyondLastLine: false,
                        }}
                    />
                </div>

                {/* Right: Preview & Console */}
                <div className="w-1/2 flex flex-col">
                    <div className="flex-grow bg-white">
                        <iframe
                            srcDoc={srcDoc}
                            title="output"
                            sandbox="allow-scripts"
                            className="w-full h-full border-none"
                        />
                    </div>

                    {/* Console Section */}
                    <div className="h-40 bg-sidebar border-t border-white/10 flex flex-col">
                        <div className="px-3 py-1 bg-activity text-[10px] uppercase tracking-widest text-gray-400 flex items-center gap-2">
                            <Terminal size={12} /> Live Console
                        </div>
                        <div className="flex-grow p-2 font-mono text-xs overflow-y-auto bg-black/20">
                            {logs.length === 0 && <span className="text-gray-600">No output yet. Press Run...</span>}
                            {logs.map((log, i) => (
                                <div key={i} className="text-green-400 py-0.5 border-b border-white/5">
                                    <span className="text-gray-500 mr-2">[{new Date().toLocaleTimeString()}]</span>
                                    {log}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default EditorPage;