"use client";

import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot } from "lucide-react";

interface ChatMessage {
  id: string;
  role: "bot" | "user";
  text: string;
  timestamp: Date;
}

export default function MangTomasBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg-0",
      role: "bot",
      text: "Mabuhay! I am Mang Tomas, your virtual assistant for Sto. Tomas. What are you planning to build today?",
      timestamp: new Date()
    }
  ]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const generateResponse = (text: string): string => {
    const lower = text.toLowerCase();
    
    if (lower.match(/(house|home|residential|apartment|bahay|tirahan)/)) {
      return "For a residential house, you will primarily need a **Building Permit** and a **Locational Clearance**. Please make sure you have your land title and blueprints ready!";
    }
    if (lower.match(/(store|business|commercial|shop|sari-sari|tindahan|negosyo)/)) {
      return "If you're building a commercial space like a store, you'll need a **Building Permit**, **Locational Clearance**, and eventually a **Business Permit**. Would you like to start an application now?";
    }
    if (lower.match(/(fee|cost|price|magkano|bayad)/)) {
      return "Permit fees depend on your Total Floor Area and the type of building. You can find detailed estimates on the Fees section of your dashboard.";
    }
    if (lower.match(/(track|status|nasaan|where)/)) {
      return "You can check the real-time status of your application by clicking on 'Track Application' in the sidebar menu.";
    }
    if (lower.match(/(hello|hi|mabuhay|hey)/)) {
      return "Hello there! I'm Mang Tomas. How can I assist you with your permits today?";
    }
    if (lower.match(/(thanks|thank you|salamat)/)) {
      return "You're very welcome! If you have any more questions, just ask.";
    }
    
    return "I'm still learning! For complex inquiries, please check the 'Permit Types' page or visit the Municipal Engineer's Office in person.";
  };

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      text: inputText.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText("");

    // Simulate thinking delay
    setTimeout(() => {
      const botResponse: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: "bot",
        text: generateResponse(userMsg.text),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botResponse]);
    }, 600);
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="mang-tomas-fab"
          aria-label="Open Chat"
        >
          <MessageSquare size={28} color="white" />
          <span className="fab-tooltip">Ask Mang Tomas!</span>
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
                <h3>Mang Tomas</h3>
                <span className="bot-status">
                  <span className="status-dot"></span> Online
                </span>
              </div>
            </div>
            <button className="close-btn" onClick={() => setIsOpen(false)}>
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
                  <p dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                  <span className="msg-time">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form className="chat-input-area" onSubmit={handleSend}>
            <input
              type="text"
              placeholder="Type your question here..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="chat-input"
            />
            <button type="submit" className="chat-send-btn" disabled={!inputText.trim()}>
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
          background: linear-gradient(135deg, #1d4ed8, #3b82f6);
          border: none;
          box-shadow: 0 4px 15px rgba(29, 78, 216, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 9999;
          transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.3s;
        }
        .mang-tomas-fab:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 20px rgba(29, 78, 216, 0.6);
        }
        .fab-tooltip {
          position: absolute;
          right: 75px;
          background: #1e293b;
          color: white;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 600;
          white-space: nowrap;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.2s, transform 0.2s;
          transform: translateX(10px);
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
          border-color: transparent transparent transparent #1e293b;
        }

        .mang-tomas-window {
          position: fixed;
          bottom: 24px;
          right: 24px;
          width: 350px;
          height: 500px;
          max-height: calc(100vh - 48px);
          background: white;
          border-radius: 16px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
          display: flex;
          flex-direction: column;
          z-index: 10000;
          overflow: hidden;
          border: 1px solid #e2e8f0;
        }

        .chat-header {
          background: linear-gradient(135deg, #1e3a8a, #1d4ed8);
          padding: 16px;
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
        }
        
        .bot-info h3 {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 700;
        }
        
        .bot-status {
          font-size: 0.75rem;
          display: flex;
          align-items: center;
          gap: 6px;
          opacity: 0.9;
        }
        
        .status-dot {
          width: 8px;
          height: 8px;
          background: #4ade80;
          border-radius: 50%;
          box-shadow: 0 0 5px #4ade80;
        }

        .close-btn {
          background: transparent;
          border: none;
          color: white;
          cursor: pointer;
          opacity: 0.7;
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
          gap: 16px;
        }

        .message-bubble-wrapper {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          max-width: 85%;
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
          background: #1d4ed8;
          color: white;
        }

        .message-bubble {
          padding: 12px 16px;
          border-radius: 18px;
          position: relative;
          font-size: 0.95rem;
          line-height: 1.4;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
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
          color: #334155;
          border-bottom-left-radius: 4px;
          border: 1px solid #e2e8f0;
        }
        .user-bubble {
          background: #1d4ed8;
          color: white;
          border-bottom-right-radius: 4px;
        }

        .msg-time {
          display: block;
          font-size: 0.65rem;
          margin-top: 6px;
          opacity: 0.7;
          text-align: right;
        }

        .chat-input-area {
          padding: 16px;
          background: white;
          border-top: 1px solid #e2e8f0;
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .chat-input {
          flex: 1;
          padding: 12px 16px;
          background: #f1f5f9;
          border: 1px solid transparent;
          border-radius: 99px;
          font-size: 0.95rem;
          outline: none;
          transition: border-color 0.2s, background 0.2s;
        }
        .chat-input:focus {
          background: white;
          border-color: #3b82f6;
        }

        .chat-send-btn {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #1d4ed8;
          color: white;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
          transition: transform 0.2s, background 0.2s;
        }
        .chat-send-btn:hover:not(:disabled) {
          background: #1e3a8a;
          transform: scale(1.05);
        }
        .chat-send-btn:disabled {
          background: #94a3b8;
          cursor: not-allowed;
          opacity: 0.7;
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
