"use client";

import { useState, useRef, useEffect } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type ChatInterfaceProps = {
  sessionStatus?: string;
  focusRatio?: number | null;
  distractionScore?: number | null;
};

export default function ChatInterface({
  sessionStatus,
  focusRatio,
  distractionScore,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("http://127.0.0.1:8000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage.content,
          context: {
            sessionStatus,
            focusRatio,
            distractionScore,
          },
        }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "⚠️ Unable to connect to AI service.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">

      {/* Header */}
      <div className="p-4 border-b bg-gray-50 font-semibold flex items-center justify-between">
        <span>Study Assistant</span>
        {sessionStatus === "studying" && (
          <span className="text-xs text-green-600">
            Session Active
          </span>
        )}
      </div>

     {/* Messages */}
<div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col">

  {messages.map((msg, index) => (

    <div
      key={index}
      className={`max-w-[88%] rounded-xl p-4 shadow-sm ${
        msg.role === "user"
          ? "bg-black text-white self-end ml-auto"
          : "bg-blue-50 border border-blue-100 text-gray-800"
      }`}
    >

      {msg.role === "assistant" ? (

        <div className="whitespace-pre-wrap text-[15px] leading-7">

          {msg.content
            .replace("Definition:", "📘 Definition\n")
            .replace("Explanation:", "\n\n💡 Explanation\n")
            .replace("Key Points:", "\n\n✅ Key Points\n")
            .replace("📄 Source:", "\n\n──────────────\n📄 Relevant Pages\n")}

        </div>

      ) : (

        msg.content

      )}

    </div>

  ))}

  {isLoading && (
    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 animate-pulse">
      🤖 Thinking...
    </div>
  )}

  <div ref={messagesEndRef} />

</div>

      {/* Input */}
      <div className="p-3 border-t flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
          placeholder="Ask something about your study..."
          className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
        />
        <button
          onClick={handleSend}
          disabled={isLoading}
          className="bg-black text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}


