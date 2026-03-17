import React, { useState } from 'react';
import { Files, MessageSquare, Users, Settings } from 'lucide-react';

const MainLayout = ({ children, sidebarContent }) => {
    const [activeTab, setActiveTab] = useState('files');

    return (
        <div className="flex h-screen w-screen bg-editor text-gray-300 font-sans">
            {/* 1. Activity Bar (Slim Left) */}
            <div className="w-12 bg-activity flex flex-col items-center py-4 space-y-6 border-r border-white/10">
                <Files 
                    className={`cursor-pointer ${activeTab === 'files' ? 'text-white' : 'text-gray-500'}`} 
                    onClick={() => setActiveTab('files')} 
                />
                <MessageSquare 
                    className={`cursor-pointer ${activeTab === 'chat' ? 'text-white' : 'text-gray-500'}`} 
                    onClick={() => setActiveTab('chat')} 
                />
                <Users className="text-gray-500 cursor-pointer" />
                <div className="flex-grow"></div>
                <Settings className="text-gray-500 cursor-pointer mb-2" />
            </div>

            {/* 2. Side Pane (Now receives content from EditorPage) */}
            <div className="w-64 bg-sidebar border-r border-white/10 flex flex-col">
                <div className="p-3 uppercase text-xs font-bold tracking-widest text-gray-500 border-b border-white/5">
                    {activeTab}
                </div>
                <div className="flex-grow">
                    {activeTab === 'files' ? sidebarContent : (
                        <div className="p-4 text-sm text-gray-500">Chat coming soon...</div>
                    )}
                </div>
            </div>

            {/* 3. Main Editor Area */}
            <div className="flex-grow flex flex-col overflow-hidden">
                {children}
            </div>
        </div>
    );
};

export default MainLayout;