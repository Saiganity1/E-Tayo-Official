import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, Users, ChevronDown, ChevronUp, Radio, Check } from 'lucide-react';
import { MOCK_STAFF } from '../data';

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
}

export default function StaffChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeStaff, setActiveStaff] = useState<string[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedSender, setSelectedSender] = useState<string>(MOCK_STAFF[0]);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const socketRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll chat to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setUnreadCount(0);
    }
  }, [messages, isOpen]);

  // Connect to WebSocket server
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    
    const connect = () => {
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        setIsConnected(true);
        // Send initial presence update
        socket.send(JSON.stringify({ type: 'presence', sender: selectedSender }));
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'init') {
            setMessages(data.messages || []);
            if (data.activeStaff) {
              setActiveStaff(data.activeStaff);
            }
          } else if (data.type === 'message') {
            setMessages((prev) => {
              // Ensure we don't add duplicate messages by ID
              if (prev.some(m => m.id === data.message.id)) return prev;
              return [...prev, data.message];
            });
            if (!isOpen) {
              setUnreadCount((prev) => prev + 1);
            }
          } else if (data.type === 'presence') {
            setActiveStaff(data.activeStaff || []);
          }
        } catch (err) {
          console.error('Error parsing socket message:', err);
        }
      };

      socket.onclose = () => {
        setIsConnected(false);
        // Attempt reconnect after 3 seconds
        setTimeout(connect, 3000);
      };

      socket.onerror = (err) => {
        console.error('WebSocket error:', err);
        socket.close();
      };
    };

    connect();

    return () => {
      if (socketRef.current) {
        // Send leave message if possible
        if (socketRef.current.readyState === WebSocket.OPEN) {
          socketRef.current.send(JSON.stringify({ type: 'leave', sender: selectedSender }));
        }
        socketRef.current.close();
      }
    };
  }, []);

  // Update presence when user switches staff profiles
  const handleSenderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const oldSender = selectedSender;
    const newSender = e.target.value;
    setSelectedSender(newSender);

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      // Notify server of leave and join
      socketRef.current.send(JSON.stringify({ type: 'leave', sender: oldSender }));
      socketRef.current.send(JSON.stringify({ type: 'presence', sender: newSender }));
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: 'message',
          sender: selectedSender,
          text: inputText
        })
      );
      setInputText('');
    } else {
      alert('WebSocket is currently disconnected. Reconnecting...');
    }
  };

  return (
    <div id="staff-chat-widget" className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen ? (
        <div 
          id="staff-chat-window" 
          className="w-80 h-[480px] bg-white rounded-2xl border border-blue-100 shadow-2xl flex flex-col overflow-hidden mb-3 animate-in fade-in slide-in-from-bottom-4 duration-250"
        >
          {/* Header */}
          <div className="bg-[#0038A8] text-white p-4 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <div className="relative">
                <MessageSquare className="h-5 w-5 fill-white/10" />
                <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-[#0038A8] ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
              </div>
              <div className="text-left">
                <h4 className="font-display font-extrabold text-xs tracking-tight">OBO Staff Team Chat</h4>
                <div className="flex items-center gap-1">
                  <Radio className="h-2.5 w-2.5 animate-pulse text-emerald-400" />
                  <span className="text-[9px] text-blue-200 font-mono">
                    {isConnected ? 'Real-Time Sync' : 'Connecting...'}
                  </span>
                </div>
              </div>
            </div>

            <button 
              id="close-chat-btn"
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white bg-white/10 hover:bg-white/25 rounded-lg p-1.5 transition-colors cursor-pointer"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>

          {/* Persona selector */}
          <div className="bg-blue-50/50 px-3 py-2 border-b border-blue-100 flex items-center justify-between gap-2 shrink-0">
            <label className="text-[10px] font-mono font-bold text-[#0038A8] uppercase tracking-wider whitespace-nowrap">
              My Profile:
            </label>
            <select
              value={selectedSender}
              onChange={handleSenderChange}
              className="bg-white text-[10px] py-1 px-1.5 rounded-lg border border-blue-200 focus:outline-none max-w-[180px] font-medium text-gray-700 truncate cursor-pointer"
            >
              {MOCK_STAFF.map((staff) => (
                <option key={staff} value={staff}>
                  {staff.split(' (')[0]}
                </option>
              ))}
            </select>
          </div>

          {/* Active staff indicators */}
          <div className="bg-white px-3 py-1.5 border-b border-blue-50 flex items-center gap-1.5 overflow-x-auto shrink-0 max-w-full">
            <Users className="h-3.5 w-3.5 text-blue-500 shrink-0" />
            <span className="text-[9px] font-mono text-gray-500 font-bold uppercase tracking-wider shrink-0">
              Online Staff ({activeStaff.length}):
            </span>
            <div className="flex gap-1 items-center overflow-hidden">
              {activeStaff.length === 0 ? (
                <span className="text-[9px] font-mono text-gray-400">None active</span>
              ) : (
                activeStaff.map((staffName, idx) => (
                  <span 
                    key={idx} 
                    className="text-[9px] bg-blue-50 text-[#0038A8] px-1.5 py-0.5 rounded border border-blue-100 whitespace-nowrap font-medium"
                    title={staffName}
                  >
                    {staffName.split(' ')[1] || staffName.split(' (')[0]}
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Messages area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#F5F8FC]">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <MessageSquare className="h-8 w-8 text-blue-200 mb-2 stroke-[1.5]" />
                <p className="text-[10px] text-gray-400 font-mono">No messages yet. Send a message to start team coordination!</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.sender === selectedSender;
                return (
                  <div 
                    key={msg.id} 
                    className={`flex flex-col max-w-[85%] ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                  >
                    <span className="text-[9px] text-gray-500 font-medium mb-0.5 px-1 truncate max-w-full">
                      {isMe ? 'You' : msg.sender.split(' (')[0]}
                    </span>
                    <div 
                      className={`p-3 rounded-2xl text-xs shadow-3xs leading-relaxed break-words text-left ${
                        isMe 
                          ? 'bg-[#0038A8] text-white rounded-tr-none' 
                          : 'bg-white text-gray-850 rounded-tl-none border border-blue-100/60'
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[8px] text-gray-400 font-mono mt-1 px-1">
                      {msg.timestamp}
                    </span>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Form input */}
          <form 
            onSubmit={handleSendMessage} 
            className="p-3 bg-white border-t border-blue-100 flex gap-2 items-center shrink-0"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type message..."
              className="flex-1 bg-gray-50 text-xs py-2 px-3 rounded-xl border border-blue-150 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-850"
            />
            <button
              type="submit"
              id="send-chat-message-btn"
              className="bg-[#0038A8] hover:bg-[#002D86] text-white p-2 rounded-xl transition-all shadow-xs shrink-0 flex items-center justify-center cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      ) : null}

      {/* Launcher Button */}
      <button
        id="toggle-staff-chat-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="bg-[#0038A8] hover:bg-[#002D86] text-white font-bold p-3.5 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center gap-2 cursor-pointer relative group scale-100 hover:scale-105 active:scale-95 duration-200"
      >
        <MessageSquare className="h-5.5 w-5.5" />
        <span className="text-xs font-display font-bold tracking-tight pr-1 hidden sm:inline">
          Team Coordination Chat
        </span>

        {/* Glow pulsing online status indicator */}
        <span className={`absolute top-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />

        {/* Unread badge count */}
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -left-1.5 bg-red-600 text-white font-mono font-extrabold text-[9px] w-5 h-5 rounded-full border-2 border-white flex items-center justify-center animate-bounce">
            {unreadCount}
          </span>
        )}
      </button>
    </div>
  );
}
