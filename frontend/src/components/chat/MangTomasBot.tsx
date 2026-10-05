"use client";

import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, Sparkles, RefreshCw, Layers, ExternalLink } from "lucide-react";
import { formatPhilippineTime } from "@/utils/philippineTime";
import { usePermitContext } from "../../context/PermitContext";
import { useLanguage } from "../../context/LanguageContext";

interface ChatMessage {
  id: string;
  role: "bot" | "user";
  text: string;
  timestamp: Date;
  source?: "gemini" | "openai" | "local_ml" | "local_ml_calculator" | "error_fallback";
}

interface QuickPromptCategory {
  category: string;
  prompts: string[];
}

const CATEGORIZED_PROMPTS_FIL: QuickPromptCategory[] = [
  {
    category: "🔥 Sikat",
    prompts: [
      "Ano requirements sa pagpapatayo ng bahay?",
      "Magkano ang permit fees para sa 100 sqm?",
      "Bakit kailangan muna ang Locational Clearance?",
      "Ano ang required setbacks sa residential?",
      "Kumusta ang status ng application ko?"
    ]
  },
  {
    category: "📋 Mga Rekisito",
    prompts: [
      "Ano requirements sa pagpapatayo ng bahay?",
      "Bakit kailangan muna ang Locational Clearance?",
      "Ano ang requirements sa Fencing Permit?",
      "Ano ang requirements sa Demolition Permit?",
      "Paano kung walang titulo, Tax Declaration lang?"
    ]
  },
  {
    category: "💰 Kwentada ng Bayad",
    prompts: [
      "Magkano ang permit fees para sa 80 sqm?",
      "Magkano ang permit fees para sa 120 sqm?",
      "Magkano para sa 150 sqm 2-storey house?",
      "Magkano para sa 200 sqm commercial building?"
    ]
  },
  {
    category: "📐 Setbacks at Zoning",
    prompts: [
      "Ano ang required setbacks sa residential?",
      "Pwede ba firewall sa tabi ng boundary?",
      "Ano ang zoning rules sa San Matias?",
      "Gaano kalayo kapag malapit sa ilog o sapa?",
      "Ano ang minimum ceiling height at bintana?"
    ]
  },
  {
    category: "🔍 Katayuan at OBO",
    prompts: [
      "Kumusta ang status ng application ko?",
      "Ano ang parusa kapag walang building permit?",
      "Sino-sino ang kailangang pumirma sa plano?",
      "Gaano katagal bago maaprubahan ang permit?",
      "Saan ang opisina ng OBO at kailan bukas?"
    ]
  }
];

const CATEGORIZED_PROMPTS_EN: QuickPromptCategory[] = [
  {
    category: "🔥 Popular",
    prompts: [
      "What are the requirements for building a house?",
      "How much are the permit fees for 100 sqm?",
      "Why is Locational Clearance required first?",
      "What are the required setbacks in residential?",
      "What is the status of my application?"
    ]
  },
  {
    category: "📋 Requirements",
    prompts: [
      "What are the requirements for building a house?",
      "Why is Locational Clearance required first?",
      "What are the requirements for a Fencing Permit?",
      "What are the requirements for a Demolition Permit?",
      "What if I only have a Tax Declaration and no title?"
    ]
  },
  {
    category: "💰 Fee Estimator",
    prompts: [
      "How much are the permit fees for 80 sqm?",
      "How much are the permit fees for 120 sqm?",
      "How much for a 150 sqm 2-storey house?",
      "How much for a 200 sqm commercial building?"
    ]
  },
  {
    category: "📐 Setbacks & Zoning",
    prompts: [
      "What are the required setbacks in residential?",
      "Can I build a firewall on the boundary line?",
      "What are the zoning rules in San Matias?",
      "What is the required setback from rivers or creeks?",
      "What is the minimum ceiling height and window size?"
    ]
  },
  {
    category: "🔍 Tracking & Legal",
    prompts: [
      "What is the status of my application?",
      "What are the penalties for building without a permit?",
      "Who are the licensed professionals required to sign plans?",
      "How long does the permit approval take?",
      "Where is the OBO office located and what are the hours?"
    ]
  }
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
  const { language } = useLanguage();
  const [internalOpen, setInternalOpen] = useState(false);

  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;
  const setIsOpen = (open: boolean) => {
    setInternalOpen(open);
    if (setExternalOpen) setExternalOpen(open);
  };

  const categorizedPrompts = language === "fil" ? CATEGORIZED_PROMPTS_FIL : CATEGORIZED_PROMPTS_EN;
  const [activeCategory, setActiveCategory] = useState<string>(language === "fil" ? "🔥 Sikat" : "🔥 Popular");
  const [inputText, setInputText] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  const getGreetingText = (lang: string) => {
    return lang === "fil"
      ? "Mabuhay! Ako po si **Mang Tomas**, ang inyong AI Virtual Permitting Officer para sa Sto. Tomas, Pampanga. May katanungan ba kayo tungkol sa **Requirements**, **Kwentada ng Permit Fees**, **Zoning at Setbacks**, o ang **Status** ng inyong aplikasyon? Handa po akong tumulong 100%!"
      : "Welcome! I am **Mang Tomas**, your AI Virtual Permitting Officer for Sto. Tomas, Pampanga. May I assist you with **Requirements**, **Permit Fee Calculations**, **Zoning & Setbacks**, or your **Application Status** today? I am here to help 100%!";
  };

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg-0",
      role: "bot",
      text: getGreetingText("fil"),
      timestamp: new Date(),
      source: "local_ml"
    }
  ]);

  // Sync greeting when language changes if no conversation yet
  useEffect(() => {
    setActiveCategory(language === "fil" ? "🔥 Sikat" : "🔥 Popular");
    setMessages(prev => {
      if (prev.length === 1 && prev[0].id === "msg-0") {
        return [{
          ...prev[0],
          text: getGreetingText(language)
        }];
      }
      return prev;
    });
  }, [language]);
  
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
        const botReply = data.reply || "Mabuhay! Paumanhin po, maaari po bang paki-ulit ang inyong katanungan?";
        
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
      setMessages(prev => [
        ...prev,
        {
          id: `msg-${Date.now() + 1}`,
          role: "bot",
          text: "Mabuhay! Ako po si Mang Tomas. Maaari ninyong tingnan ang inyong [Application Status](/applicant/track) o mag-apply para sa bagong permit sa aming [Permits Application Page](/applicant/apply).",
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

  const handleResetChat = () => {
    setMessages([
      {
        id: `msg-${Date.now()}`,
        role: "bot",
        text: "Mabuhay muli! Naka-reset na po ang ating usapan. Ano po ang maitutulong ko sa inyong plano o permit sa Sto. Tomas ngayon?",
        timestamp: new Date(),
        source: "local_ml"
      }
    ]);
  };

  const renderFormattedText = (text: string) => {
    // 1. Replace markdown links [label](url)
    let formatted = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="chat-markdown-link" target="_self">$1 <span style="font-size:0.75em">↗</span></a>');
    // 2. Replace **bold**
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // 3. Replace `code`
    formatted = formatted.replace(/`([^`]+)`/g, '<code class="chat-code-badge">$1</code>');
    // 4. Replace bullet points • 
    formatted = formatted.replace(/^• (.*?)$/gm, '<li class="chat-bullet-item">$1</li>');
    // 5. Replace newlines with <br/>
    formatted = formatted.replace(/\n/g, '<br/>');
    return formatted;
  };

  const getSourceBadge = (source?: string) => {
    switch (source) {
      case "local_ml_calculator":
        return "🧮 ML Fee Estimator";
      case "gemini":
        return "✨ Gemini AI";
      case "openai":
        return "🧠 OpenAI";
      case "local_ml":
        return "🤖 Sto. Tomas ML Engine";
      case "error_fallback":
        return "ℹ️ OBO Helpdesk";
      default:
        return null;
    }
  };

  const currentCategoryPrompts = categorizedPrompts.find(c => c.category === activeCategory)?.prompts || categorizedPrompts[0].prompts;

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
          <span className="fab-tooltip">Ask Mang Tomas (AI Officer)!</span>
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
                  <span className="header-ai-badge">
                    AI OFFICER
                  </span>
                </div>
                <span className="bot-status">
                  <span className="status-dot"></span> Online • Sto. Tomas OBO (ML-Powered)
                </span>
              </div>
            </div>
            
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <button 
                className="header-action-btn" 
                onClick={handleResetChat} 
                title="Bagong Usapan / Reset Chat"
                aria-label="Reset Chat"
              >
                <RefreshCw size={16} />
              </button>
              <button 
                className="header-action-btn" 
                onClick={() => setIsOpen(false)} 
                title="Isara ang Chat"
                aria-label="Close chat"
              >
                <X size={20} />
              </button>
            </div>
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
                  <div 
                    className="bubble-content-text" 
                    dangerouslySetInnerHTML={{ __html: renderFormattedText(msg.text) }} 
                  />
                  
                  <div className="bubble-footer">
                    {msg.source && getSourceBadge(msg.source) && (
                      <span className="ml-source-badge">
                        {getSourceBadge(msg.source)}
                      </span>
                    )}
                    <span className="msg-time">
                      {formatPhilippineTime(msg.timestamp)}
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
                <div className="message-bubble bot-bubble" style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 18px" }}>
                  <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: "600" }}>Kino-compute at sinusuri ni Mang Tomas</span>
                  <span className="typing-dot dot1"></span>
                  <span className="typing-dot dot2"></span>
                  <span className="typing-dot dot3"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Suggestions */}
          {!isThinking && (
            <div className="quick-prompts-container">
              {/* Category Filter Tabs */}
              <div className="quick-categories-bar">
                {categorizedPrompts.map((c) => (
                  <button
                    key={c.category}
                    type="button"
                    onClick={() => setActiveCategory(c.category)}
                    className={`category-pill ${activeCategory === c.category ? 'active' : ''}`}
                  >
                    {c.category}
                  </button>
                ))}
              </div>

              {/* Prompts Scroll */}
              <div className="quick-prompts-scroll">
                {currentCategoryPrompts.map((prompt, idx) => (
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
              placeholder={language === "fil" ? "Magtanong kay Mang Tomas (Tagalog, English, Taglish)..." : "Ask Mang Tomas (English, Tagalog, Taglish)..."}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="chat-input"
              disabled={isThinking}
            />
            <button type="submit" className="chat-send-btn" disabled={!inputText.trim() || isThinking} title={language === "fil" ? "Ipadala" : "Send"}>
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
          width: 410px;
          height: 580px;
          max-height: calc(100vh - 48px);
          background: white;
          border-radius: 20px;
          box-shadow: 0 14px 45px rgba(15, 23, 42, 0.28);
          display: flex;
          flex-direction: column;
          z-index: 10000;
          overflow: hidden;
          border: 1px solid #cbd5e1;
        }

        .chat-header {
          background: linear-gradient(135deg, #021a4f 0%, #0038A8 100%);
          padding: 14px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: white;
          box-shadow: 0 2px 10px rgba(0,0,0,0.12);
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

        .header-ai-badge {
          font-size: 0.65rem;
          background: rgba(255,255,255,0.22);
          padding: 2px 7px;
          border-radius: 999px;
          font-weight: 800;
          letter-spacing: 0.05em;
          border: 1px solid rgba(255,255,255,0.3);
        }
        
        .bot-status {
          font-size: 0.72rem;
          display: flex;
          align-items: center;
          gap: 6px;
          opacity: 0.92;
          margin-top: 2px;
          font-weight: 500;
        }
        
        .status-dot {
          width: 8px;
          height: 8px;
          background: #4ade80;
          border-radius: 50%;
          box-shadow: 0 0 6px #4ade80;
        }

        .header-action-btn {
          background: rgba(255,255,255,0.12);
          border: 1px solid rgba(255,255,255,0.2);
          color: white;
          cursor: pointer;
          border-radius: 8px;
          padding: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s, transform 0.15s;
        }
        .header-action-btn:hover {
          background: rgba(255,255,255,0.25);
          transform: scale(1.05);
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
          max-width: 90%;
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
          font-size: 0.90rem;
          line-height: 1.5;
          box-shadow: 0 2px 6px rgba(0,0,0,0.04);
        }
        
        .bubble-content-text {
          margin: 0;
          word-break: break-word;
        }
        .bubble-content-text strong {
          color: inherit;
          font-weight: 750;
        }

        .chat-code-badge {
          background: rgba(0, 56, 168, 0.08);
          color: #0038A8;
          padding: 1px 6px;
          border-radius: 4px;
          font-family: monospace;
          font-size: 0.88em;
          font-weight: 700;
        }

        .chat-bullet-item {
          margin-left: 14px;
          list-style-type: disc;
        }

        .chat-markdown-link {
          display: inline-block;
          margin-top: 6px;
          background: #eff6ff;
          color: #0038A8;
          padding: 5px 12px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 700;
          border: 1px solid #bfdbfe;
          transition: background 0.15s, border-color 0.15s;
        }
        .chat-markdown-link:hover {
          background: #dbeafe;
          border-color: #93c5fd;
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

        .bubble-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 6px;
          gap: 8px;
        }

        .ml-source-badge {
          font-size: 0.62rem;
          background: rgba(0, 56, 168, 0.06);
          color: #0038A8;
          font-weight: 700;
          padding: 1px 6px;
          border-radius: 4px;
          border: 1px solid rgba(0, 56, 168, 0.15);
        }

        .msg-time {
          display: block;
          font-size: 0.65rem;
          opacity: 0.65;
          margin-left: auto;
        }

        .quick-prompts-container {
          padding: 10px 14px;
          background: #f1f5f9;
          border-top: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .quick-categories-bar {
          display: flex;
          gap: 6px;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .quick-categories-bar::-webkit-scrollbar {
          display: none;
        }

        .category-pill {
          background: white;
          border: 1px solid #cbd5e1;
          color: #475569;
          padding: 3px 9px;
          border-radius: 999px;
          font-size: 0.70rem;
          font-weight: 700;
          white-space: nowrap;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .category-pill.active {
          background: #0038A8;
          color: white;
          border-color: #0038A8;
        }

        .quick-prompts-scroll {
          display: flex;
          gap: 6px;
          overflow-x: auto;
          padding-bottom: 2px;
          scrollbar-width: thin;
        }
        .quick-prompt-btn {
          background: white;
          border: 1px solid #cbd5e1;
          color: #0038A8;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 0.74rem;
          font-weight: 650;
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
          font-size: 0.88rem;
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
            position: fixed;
            width: 100vw;
            height: 100vh;
            height: 100dvh;
            max-height: 100dvh;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            border-radius: 0;
            border: none;
          }
          .chat-header {
            padding-top: max(16px, calc(12px + env(safe-area-inset-top)));
            padding-left: max(16px, calc(16px + env(safe-area-inset-left)));
            padding-right: max(16px, calc(16px + env(safe-area-inset-right)));
          }
          .chat-input-area {
            padding-bottom: max(12px, calc(8px + env(safe-area-inset-bottom)));
            padding-left: max(16px, calc(16px + env(safe-area-inset-left)));
            padding-right: max(16px, calc(16px + env(safe-area-inset-right)));
          }
          .chat-input {
            font-size: 16px !important;
          }
          .mang-tomas-fab {
            bottom: calc(80px + env(safe-area-inset-bottom, 0px));
            right: calc(16px + env(safe-area-inset-right, 0px));
          }
        }
      `}} />
    </>
  );
}
