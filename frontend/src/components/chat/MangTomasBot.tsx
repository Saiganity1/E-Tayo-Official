"use client";

import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, Sparkles, RefreshCw } from "lucide-react";
import { usePermitContext } from "../../context/PermitContext";

interface ChatMessage {
  id: string;
  role: "bot" | "user";
  text: string;
  timestamp: Date;
  source?: "gemini" | "openai" | "local_knowledge" | "error_fallback";
}

const QUICK_PROMPTS = [
  "Ano requirements sa pagpapatayo ng bahay?",
  "Bakit kailangan muna ang Locational Clearance?",
  "Kumusta ang status ng application ko?",
  "Magkano ang permit fees para sa 2-storey?",
  "Ano ang required setbacks sa residential?"
];

interface MangTomasBotProps {
  externalOpen?: boolean;
  setExternalOpen?: (open: boolean) => void;
  hideFab?: boolean;
}

export default function MangTomasBot({
  externalOpen,
  setExternalOpen,
  hideFab = false,
}: MangTomasBotProps = {}) {
  const { applications } = usePermitContext();
  const [internalOpen, setInternalOpen] = useState(false);

  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;
  const setIsOpen = (open: boolean) => {
    setInternalOpen(open);
    if (setExternalOpen) setExternalOpen(open);
  };
  const [inputText, setInputText] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg-0",
      role: "bot",
      text: "Mabuhay! I am **Mang Tomas**, your virtual assistant for Sto. Tomas, Pampanga. Ano po ang plano ninyong ipatayo ngayon? Maaari ninyo akong tanungin tungkol sa mga requirements, zoning, permit fees, o ang status ng inyong application!",
      timestamp: new Date()
    }
  ]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, isThinking]);

  const sendQueryToAi = async (userText: string) => {
    setIsThinking(true);

    try {
      // Send conversation history and live applications context to /api/chat
      const historyPayload = messages.slice(-6).map(m => ({
        role: m.role,
        text: m.text
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          history: historyPayload,
          userApplications: applications || []
        })
      });

      if (res.ok) {
        const data = await res.json();
        const botReply = data.reply || "Mabuhay! Paumanhin po, maaari po bang paki-ulit ang inyong tanong?";
        
        setMessages(prev => [
          ...prev,
          {
            id: `msg-${Date.now() + 1}`,
            role: "bot",
            text: botReply,
            timestamp: new Date(),
            source: data.source
          }
        ]);
      } else {
        throw new Error("Chat API returned non-OK status");
      }
    } catch (err) {
      console.warn("Error calling /api/chat, falling back to local guidance:", err);
      // Local fallback in case network error occurs
      setMessages(prev => [
        ...prev,
        {
          id: `msg-${Date.now() + 1}`,
          role: "bot",
          text: "Mabuhay! Ako po si Mang Tomas. Para sa inyong mga katanungan sa permit, maaari kayong pumunta sa **Permit Types** page o i-check ang inyong **Application Status** sa sidebar menu!",
          timestamp: new Date(),
          source: "error_fallback"
        }
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isThinking) return;

    const userText = inputText.trim();
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      text: userText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText("");

    await sendQueryToAi(userText);
  };

  const handleQuickPrompt = async (prompt: string) => {
    if (isThinking) return;
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      text: prompt,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    await sendQueryToAi(prompt);
  };

  const renderFormattedText = (text: string) => {
    // Replace **bold**
    let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Replace `code`
    formatted = formatted.replace(/`([^`]+)`/g, '<code style="background: rgba(0,0,0,0.06); padding: 1px 5px; border-radius: 4px; font-family: monospace; font-size: 0.88em;">$1</code>');
    // Replace newlines with <br/>
    formatted = formatted.replace(/\n/g, '<br/>');
    return formatted;
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && !hideFab && (
        <button
          onClick={() => setIsOpen(true)}
          className="mang-tomas-fab"
          aria-label="Open Chat with Mang Tomas"
        >
          <div style={{ position: "relative" }}>
            <MessageSquare size={28} color="white" />
            <span style={{ position: "absolute", top: -2, right: -2, width: "10px", height: "10px", background: "#4ade80", borderRadius: "50%", border: "2px solid #1d4ed8" }}></span>
          </div>
          <span className="fab-tooltip">Ask Mang Tomas AI!</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="mang-tomas-window animate-fade-in-up">
          {/* Header */}
          <div className="chat-header">
            <div className="bot-avatar-container">
              <div className="bot-avatar">
                <Bot size={22} color="white" />
              </div>
              <div className="bot-info">
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <h3>Mang Tomas</h3>
                  <span style={{ fontSize: "0.68rem", background: "rgba(255,255,255,0.2)", padding: "1px 6px", borderRadius: "999px", fontWeight: "800", letterSpacing: "0.04em" }}>
                    AI OFFICER
                  </span>
                </div>
                <span className="bot-status">
                  <span className="status-dot"></span> Online • Sto. Tomas OBO
                </span>
              </div>
            </div>
            <button className="close-btn" onClick={() => setIsOpen(false)} aria-label="Close chat">
              <X size={20} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="chat-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`message-bubble-wrapper ${msg.role === "user" ? "user-wrapper" : "bot-wrapper"}`}>
                {msg.role === "bot" && (
                  <div className="bubble-avatar bot-bubble-avatar">
                    <Bot size={16} />
                  </div>
                )}
                <div className={`message-bubble ${msg.role === "user" ? "user-bubble" : "bot-bubble"}`}>
                  <p dangerouslySetInnerHTML={{ __html: renderFormattedText(msg.text) }} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
                    {msg.source && msg.source !== "local_knowledge" && (
                      <span style={{ fontSize: "0.6rem", opacity: 0.6, fontStyle: "italic" }}>
                        Powered by AI
                      </span>
                    )}
                    <span className="msg-time" style={{ marginLeft: "auto" }}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* Thinking / Loading Indicator */}
            {isThinking && (
              <div className="message-bubble-wrapper bot-wrapper">
                <div className="bubble-avatar bot-bubble-avatar">
                  <Bot size={16} />
                </div>
                <div className="message-bubble bot-bubble" style={{ display: "flex", alignItems: "center", gap: "6px", padding: "12px 18px" }}>
                  <span style={{ fontSize: "0.85rem", color: "#64748b" }}>Mang Tomas is thinking</span>
                  <span className="typing-dot dot1"></span>
                  <span className="typing-dot dot2"></span>
                  <span className="typing-dot dot3"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Suggestions */}
          {messages.length <= 3 && !isThinking && (
            <div className="quick-prompts-container">
              <span style={{ fontSize: "0.72rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: "4px" }}>
                <Sparkles size={11} color="#0038A8" /> Suggested Inquiries:
              </span>
              <div className="quick-prompts-scroll">
                {QUICK_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleQuickPrompt(prompt)}
                    className="quick-prompt-btn"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <form className="chat-input-area" onSubmit={handleSend}>
            <input
              type="text"
              placeholder="Ask Mang Tomas (English, Tagalog, Taglish)..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="chat-input"
              disabled={isThinking}
            />
            <button type="submit" className="chat-send-btn" disabled={!inputText.trim() || isThinking}>
              <Send size={18} />
            </button>
          </form>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .mang-tomas-fab {
          position: fixed;
          bottom: 24px;
          right: 24px;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, #0038A8, #021a4f);
          border: none;
          box-shadow: 0 6px 20px rgba(0, 56, 168, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 9999;
          transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.3s;
        }
        .mang-tomas-fab:hover {
          transform: scale(1.08);
          box-shadow: 0 8px 25px rgba(0, 56, 168, 0.6);
        }
        .fab-tooltip {
          position: absolute;
          right: 75px;
          background: #0f172a;
          color: white;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 0.82rem;
          font-weight: 700;
          white-space: nowrap;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.2s, transform 0.2s;
          transform: translateX(10px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .mang-tomas-fab:hover .fab-tooltip {
          opacity: 1;
          transform: translateX(0);
        }
        .fab-tooltip::after {
          content: '';
          position: absolute;
          right: -5px;
          top: 50%;
          transform: translateY(-50%);
          border-width: 5px 0 5px 6px;
          border-style: solid;
          border-color: transparent transparent transparent #0f172a;
        }

        .mang-tomas-window {
          position: fixed;
          bottom: 24px;
          right: 24px;
          width: 380px;
          height: 540px;
          max-height: calc(100vh - 48px);
          background: white;
          border-radius: 20px;
          box-shadow: 0 12px 45px rgba(15, 23, 42, 0.25);
          display: flex;
          flex-direction: column;
          z-index: 10000;
          overflow: hidden;
          border: 1px solid #cbd5e1;
        }

        .chat-header {
          background: linear-gradient(135deg, #021a4f 0%, #0038A8 100%);
          padding: 16px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: white;
        }
        
        .bot-avatar-container {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .bot-avatar {
          width: 40px;
          height: 40px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(4px);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }
        
        .bot-info h3 {
          margin: 0;
          font-size: 1.05rem;
          font-weight: 800;
          letter-spacing: -0.01em;
        }
        
        .bot-status {
          font-size: 0.72rem;
          display: flex;
          align-items: center;
          gap: 6px;
          opacity: 0.9;
          margin-top: 2px;
        }
        
        .status-dot {
          width: 8px;
          height: 8px;
          background: #4ade80;
          border-radius: 50%;
          box-shadow: 0 0 6px #4ade80;
        }

        .close-btn {
          background: transparent;
          border: none;
          color: white;
          cursor: pointer;
          opacity: 0.8;
          transition: opacity 0.2s, transform 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
        }
        .close-btn:hover {
          opacity: 1;
          transform: scale(1.1);
        }

        .chat-messages {
          flex: 1;
          padding: 16px;
          overflow-y: auto;
          background: #f8fafc;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .message-bubble-wrapper {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          max-width: 88%;
        }
        .user-wrapper {
          align-self: flex-end;
          flex-direction: row-reverse;
        }
        .bot-wrapper {
          align-self: flex-start;
        }

        .bubble-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .bot-bubble-avatar {
          background: #0038A8;
          color: white;
        }

        .message-bubble {
          padding: 12px 16px;
          border-radius: 18px;
          position: relative;
          font-size: 0.92rem;
          line-height: 1.45;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }
        
        .message-bubble p {
          margin: 0;
        }
        .message-bubble strong {
          color: inherit;
          font-weight: 700;
        }

        .bot-bubble {
          background: white;
          color: #1e293b;
          border-bottom-left-radius: 4px;
          border: 1px solid #e2e8f0;
        }
        .user-bubble {
          background: #0038A8;
          color: white;
          border-bottom-right-radius: 4px;
        }

        .msg-time {
          display: block;
          font-size: 0.65rem;
          opacity: 0.6;
        }

        .quick-prompts-container {
          padding: 8px 16px;
          background: #f1f5f9;
          border-top: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .quick-prompts-scroll {
          display: flex;
          gap: 6px;
          overflow-x: auto;
          padding-bottom: 4px;
          scrollbar-width: thin;
        }
        .quick-prompt-btn {
          background: white;
          border: 1px solid #cbd5e1;
          color: #0038A8;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 0.75rem;
          font-weight: 700;
          white-space: nowrap;
          cursor: pointer;
          transition: all 0.15s ease;
          flex-shrink: 0;
        }
        .quick-prompt-btn:hover {
          background: #eff6ff;
          border-color: #93c5fd;
        }

        .chat-input-area {
          padding: 12px 16px;
          background: white;
          border-top: 1px solid #e2e8f0;
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .chat-input {
          flex: 1;
          padding: 10px 16px;
          background: #f1f5f9;
          border: 1.5px solid transparent;
          border-radius: 99px;
          font-size: 0.9rem;
          outline: none;
          transition: border-color 0.2s, background 0.2s;
        }
        .chat-input:focus {
          background: white;
          border-color: #0038A8;
        }

        .chat-send-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #0038A8;
          color: white;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
          transition: transform 0.15s, background 0.15s;
        }
        .chat-send-btn:hover:not(:disabled) {
          background: #021a4f;
          transform: scale(1.05);
        }
        .chat-send-btn:disabled {
          background: #cbd5e1;
          cursor: not-allowed;
        }

        .typing-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #3b82f6;
          display: inline-block;
          animation: typingBlink 1.4s infinite both;
        }
        .dot1 { animation-delay: 0s; }
        .dot2 { animation-delay: 0.2s; }
        .dot3 { animation-delay: 0.4s; }

        @keyframes typingBlink {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1.2); }
        }

        @media (max-width: 640px) {
          .mang-tomas-window {
            width: 100vw;
            height: 100vh;
            max-height: 100vh;
            bottom: 0;
            right: 0;
            border-radius: 0;
          }
          .mang-tomas-fab {
            bottom: 80px;
            right: 16px;
          }
        }
      `}} />
    </>
  );
}
