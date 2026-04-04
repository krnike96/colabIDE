import React, { useState } from 'react';
import { Files, MessageSquare, Users, Settings } from 'lucide-react';

const MainLayout = ({ children, sidebarPanels = {} }) => {
    const [activeTab, setActiveTab] = useState('files');

    return (
        <div className="flex h-screen w-screen bg-editor text-gray-300 font-sans">
            {/* 1. Activity Bar (Slim Left) */}
            <div className="w-12 bg-activity flex flex-col items-center py-4 space-y-6 border-r border-white/10">
                <button onClick={() => setActiveTab('files')} title="Files" className="w-full flex justify-center">
                    <Files className={`cursor-pointer transition-colors ${activeTab === 'files' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`} />
                </button>
                <button onClick={() => setActiveTab('users')} title="Active Users" className="w-full flex justify-center">
                    <Users className={`cursor-pointer transition-colors ${activeTab === 'users' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`} />
                </button>
                <button onClick={() => setActiveTab('chat')} title="Chat" className="w-full flex justify-center">
                    <MessageSquare className={`cursor-pointer transition-colors ${activeTab === 'chat' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`} />
                </button>
                <div className="flex-grow"></div>
                <button title="Settings" className="w-full flex justify-center">
                    <Settings className="text-gray-500 cursor-pointer mb-2 hover:text-gray-300 transition-colors" />
                </button>
            </div>

            {/* 2. Side Pane (Dynamic Content) */}
            <div className="w-64 bg-sidebar border-r border-white/10 flex flex-col">
                <div className="flex-grow overflow-hidden">
                    {sidebarPanels[activeTab] || (
                        <div className="p-4 text-sm text-gray-500 italic">
                            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} coming soon...
                        </div>
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