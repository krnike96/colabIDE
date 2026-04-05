import React, { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import { socket } from '../socket';

const ChatPanel = ({ roomId, currentUser, messages, onSendMessage }) => {
    const [inputMessage, setInputMessage] = useState('');
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = (e) => {
        e.preventDefault();
        if (!inputMessage.trim()) return;

        const messageData = {
            roomId,
            message: inputMessage.trim(),
            sender: currentUser,
            timestamp: new Date()
        };
        onSendMessage(messageData);
        setInputMessage('');
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="flex flex-col h-full bg-[#252526]">
            <div className="p-4 border-b border-white/5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Room Chat</span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {messages.length === 0 ? (
                    <div className="text-center text-gray-500 text-sm py-8">
                        No messages yet. Say hello!
                    </div>
                ) : (
                    messages.map(msg => {
                        const isOwn = msg.sender === currentUser;
                        return (
                            <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] rounded-lg px-3 py-2 ${isOwn ? 'bg-accent text-white' : 'bg-[#3c3c3c] text-gray-200'}`}>
                                    {!isOwn && (
                                        <div className="text-xs font-semibold text-accent mb-1">
                                            {msg.sender}
                                        </div>
                                    )}
                                    <p className="text-sm break-words">{msg.text}</p>
                                    <div className="text-[10px] text-right mt-1 opacity-70">
                                        {formatTime(msg.timestamp)}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendMessage} className="p-3 border-t border-white/5 bg-[#1e1e1e]">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 bg-editor border border-white/10 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent"
                    />
                    <button
                        type="submit"
                        disabled={!inputMessage.trim()}
                        className="p-2 bg-accent rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send size={16} />
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ChatPanel;