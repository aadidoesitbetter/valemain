"use client";

import ChatInterface from "@/components/ChatInterface";

export default function Home() {
  return (
    <main className="h-screen w-screen flex flex-col bg-white text-black font-sans">

      {/* Top Header */}
      <header className="p-6 text-center border-b border-gray-100 flex-none z-10 bg-white">
        <h1 className="text-2xl font-bold tracking-widest uppercase">Valemain Corp</h1>
        <p className="text-[10px] text-gray-400 uppercase tracking-[0.3em] mt-1 pl-1">Autonomous Fleet Command</p>
      </header>

      {/* Chat Area - Fills remaining space */}
      <div className="flex-1 overflow-hidden relative max-w-3xl w-full mx-auto">
        <ChatInterface />
      </div>

    </main>
  );
}
