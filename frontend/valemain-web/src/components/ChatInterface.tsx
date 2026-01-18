"use client";

import { useState, useRef, useEffect } from "react";
import { api, RoleType } from "@/lib/api";
import { Send, Sparkles, User, Box } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { motion, AnimatePresence } from "framer-motion";

export function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

interface Message {
    id: string;
    sender: 'user' | 'ai';
    text: string;
    role?: RoleType;
    isSystem?: boolean; // For "Handover" messages
}

export default function ChatInterface() {
    // Start with CORE role by default
    const [activeRole, setActiveRole] = useState<RoleType>('core');

    // Initial Greeting from Core
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            sender: 'ai',
            text: "Greetings. I am Core Valemain. Would you like to book a ride today?",
            role: 'core'
        }
    ]);

    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll logic
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, loading]);

    const sendMessage = async () => {
        if (!input.trim() || loading) return;

        const userMsg: Message = { id: Date.now().toString(), sender: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        try {
            // 1. Send message to current active role (Core or Personal)
            const response = await api.chat(activeRole, userMsg.text);

            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                sender: 'ai',
                text: response.reply,
                role: response.role
            };
            setMessages(prev => [...prev, aiMsg]);

            // 2. CHECK FOR HANDOVER LOGIC
            // If we are currently talking to CORE, and it says something about "assigning" or "en route"
            // We switch the user to PERSONAL mode.
            if (activeRole === 'core') {
                const lowerReply = response.reply.toLowerCase();
                if (lowerReply.includes("assign") || lowerReply.includes("deploy") || lowerReply.includes("en route") || lowerReply.includes("dispatch")) {

                    // Trigger Handover
                    setTimeout(() => {
                        setMessages(prev => [...prev, {
                            id: 'sys-' + Date.now(),
                            sender: 'ai',
                            text: "🔄 TRANSFERRING TO VEHICLE NODE...",
                            isSystem: true
                        }]);

                        setActiveRole('personal');

                        // Optional: Personal Valemain introduces themselves immediately
                        setTimeout(() => {
                            setMessages(prev => [...prev, {
                                id: 'pv-' + Date.now(),
                                sender: 'ai',
                                text: "Good day! I am your Personal Valemain. I've received your coordinates. ready to go?",
                                role: 'personal'
                            }]);
                        }, 1500);

                    }, 1000);
                }
            }

        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { id: 'err', sender: 'ai', text: "Connection interruption.", role: activeRole }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full">

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scrollbar-hide" ref={scrollRef}>
                <AnimatePresence mode="popLayout">
                    {messages.map((msg) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={cn("flex flex-col max-w-[90%] md:max-w-[70%]",
                                msg.isSystem ? "mx-auto items-center my-4" :
                                    (msg.sender === 'user' ? "ml-auto items-end" : "items-start")
                            )}
                        >
                            {/* Label */}
                            {!msg.isSystem && (
                                <span className="text-[10px] text-gray-400 mb-1 px-1 uppercase tracking-wider font-bold">
                                    {msg.sender === 'user' ? 'You' : (msg.role === 'core' ? 'Core HQ' : 'Valemain')}
                                </span>
                            )}

                            {/* Bubble */}
                            <div className={cn("px-5 py-3 rounded-2xl text-sm md:text-base leading-relaxed shadow-sm transition-all",
                                msg.isSystem ? "bg-gray-100 text-gray-500 text-xs font-mono py-1 px-3 rounded-full shadow-none tracking-widest" :
                                    (msg.sender === 'user'
                                        ? "bg-black text-white"
                                        : "bg-white border border-gray-200 text-gray-800"
                                    )
                            )}>
                                {msg.text}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {loading && (
                    <div className="flex justify-start">
                        <span className="text-[10px] text-gray-400 mb-1 px-1 uppercase tracking-wider font-bold">
                            {activeRole === 'core' ? 'Core HQ' : 'Valemain'}
                        </span>
                        <div className="ml-2 flex gap-1 items-center h-8">
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-100"></span>
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-200"></span>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area - Fixed Bottom */}
            <div className="p-4 md:p-6 bg-white border-t border-gray-50">
                <div className="max-w-3xl mx-auto flex gap-3 items-center">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder={activeRole === 'core' ? "Speak to Dispatch..." : "Speak to your Driver..."}
                        className="flex-1 bg-gray-100 border-transparent focus:bg-white focus:ring-2 focus:ring-black outline-none text-black px-6 py-4 rounded-full text-base placeholder:text-gray-400 transition-all"
                        autoFocus
                    />
                    <button
                        onClick={sendMessage}
                        disabled={!input.trim()}
                        className="p-4 rounded-full bg-black text-white hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 transition-all shadow-lg"
                    >
                        <Send size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
}
