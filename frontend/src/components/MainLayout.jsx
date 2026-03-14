import React, { useState } from 'react';
import { Files, MessageSquare, Users, Settings, Play } from 'lucide-react';

const MainLayout = ({ children }) => {
    const [activeTab, setActiveTab] = useState('files');

    return (
        <div className="flex h-screen w-screen bg-editor text-gray-300 font-sans">
            {/* 1. Activity Bar (Slim Left) */}
            <div className="w-12 bg-activity flex flex-col items-center py-4 space-y-6 border-r border-white/10">
                <Files className={`cursor-pointer ${activeTab === 'files' ? 'text-white' : 'text-gray-500'}`} onClick={() => setActiveTab('files')} />
                <MessageSquare className={`cursor-pointer ${activeTab === 'chat' ? 'text-white' : 'text-gray-500'}`} onClick={() => setActiveTab('chat')} />
                <Users className="text-gray-500 cursor-pointer" />
                <div className="flex-grow"></div>
                <Settings className="text-gray-500 cursor-pointer mb-2" />
            </div>

            {/* 2. Side Pane (Dynamic Content) */}
            <div className="w-64 bg-sidebar border-r border-white/10 flex flex-col">
                <div className="p-3 uppercase text-xs font-bold tracking-widest text-gray-500">
                    {activeTab}
                </div>
                <div className="flex-grow p-2">
                    {/* File Explorer or Chat will go here */}
                    <p className="text-sm text-gray-400">Explorer Content...</p>
                </div>
            </div>

            {/* 3. Main Editor Area */}
            <div className="flex-grow flex flex-col">
                {/* Tab Headers */}
                <div className="h-10 bg-sidebar flex items-center border-b border-white/10">
                    <div className="px-4 h-full flex items-center bg-editor border-r border-white/10 text-sm border-t-2 border-t-accent">
                        index.js
                    </div>
                    <div className="px-4 h-full flex items-center text-sm border-r border-white/10 opacity-50">
                        styles.css
                    </div>
                </div>

                {/* Editor Content */}
                <div className="flex-grow relative">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default MainLayout;