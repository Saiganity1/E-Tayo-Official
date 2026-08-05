"use client";

import React, { useState, useEffect, useRef } from "react";
import { Send, User, Clock, Inbox } from "lucide-react";
import { Client } from "@stomp/stompjs";
import { format } from "date-fns";

export default function StaffMessagesPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [currentUserEmail, setCurrentUserEmail] = useState("");
  const [connected, setConnected] = useState(false);
  const [applicantEmail, setApplicantEmail] = useState<string | null>(null);
  
  const stompClient = useRef<Client | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Get current user from localStorage
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setCurrentUserEmail(parsedUser.email);
      
      // 2. Connect to WebSocket
      const client = new Client({
        brokerURL: process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080/ws",
        reconnectDelay: 5000,
        onConnect: () => {
          console.log("Connected to WebSocket");
          setConnected(true);
          // Subscribe to ALL incoming messages
          client.subscribe(`/topic/messages/${parsedUser.email}`, (message) => {
            const receivedMessage = JSON.parse(message.body);
            // Automatically open the chat of the person who messaged us
            setApplicantEmail(receivedMessage.senderEmail);
            // Add the new message to the UI
            setMessages(prev => {
              // Ensure we don't duplicate if it was already fetched by the history API
              const exists = prev.find(m => m.id === receivedMessage.id);
              if (exists) return prev;
              return [...prev, receivedMessage];
            });
          });
        },
        onStompError: (frame) => {
          console.error("Broker reported error: " + frame.headers["message"]);
          console.error("Additional details: " + frame.body);
        },
        onWebSocketClose: () => {
          setConnected(false);
        }
      });

      client.activate();
      stompClient.current = client;
    }

    return () => {
      if (stompClient.current) {
        stompClient.current.deactivate();
      }
    };
  }, []);

  // Fetch history only when an applicant is selected/messages us
  useEffect(() => {
    if (currentUserEmail && applicantEmail) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/messages/history?user1=${currentUserEmail}&user2=${applicantEmail}`)
        .then(res => res.json())
        .then(data => setMessages(data))
        .catch(err => console.error("Failed to load history", err));
    }
  }, [currentUserEmail, applicantEmail]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim() && stompClient.current && connected && applicantEmail) {
      const chatMessage = {
        senderEmail: currentUserEmail,
        recipientEmail: applicantEmail,
        content: inputMessage.trim(),
      };
      stompClient.current.publish({
        destination: "/app/chat.sendMessage",
        body: JSON.stringify(chatMessage),
      });
      setInputMessage("");
      
      // Optimistically add our own message to the UI so it feels instant
      setMessages(prev => [...prev, { ...chatMessage, timestamp: new Date().toISOString() }]);
    }
  };

  // If no applicant has messaged yet, show a blank waiting screen
  if (!applicantEmail) {
    return (
      <div className="chat-container" style={{ justifyContent: 'center', alignItems: 'center', background: '#f9fafb' }}>
        <div className="empty-state">
           <Inbox size={48} style={{ color: '#9ca3af', marginBottom: '1rem' }} />
           <h2 style={{ fontSize: '1.25rem', color: '#374151', fontWeight: 600 }}>Waiting for Messages</h2>
           <p style={{ color: '#6b7280', maxWidth: '300px', textAlign: 'center', marginTop: '0.5rem' }}>
             When an applicant sends you a message, their chat will automatically appear here.
           </p>
           <p className="status-text" style={{ marginTop: '2rem' }}>
              <span className={`status-dot ${connected ? 'online' : 'offline'}`}></span>
              {connected ? 'Connected to messaging server' : 'Reconnecting...'}
            </p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-container">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-info">
          <div className="chat-avatar staff-avatar">
            <User size={20} />
          </div>
          <div>
            <h2>{applicantEmail} (Applicant)</h2>
            <p className="status-text">
              <span className={`status-dot ${connected ? 'online' : 'offline'}`}></span>
              {connected ? 'Online' : 'Reconnecting...'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="empty-state">
            <Clock size={32} />
            <p>No messages yet. Say hello!</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.senderEmail === currentUserEmail;
            return (
              <div key={idx} className={`message-row ${isMe ? 'me' : 'them'}`}>
                <div className={`message-bubble ${isMe ? 'me' : 'them'}`}>
                  <p>{msg.content}</p>
                  <span className="timestamp">
                    {msg.timestamp ? format(new Date(msg.timestamp), "h:mm a") : format(new Date(), "h:mm a")}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="chat-input-area">
        <form onSubmit={sendMessage} className="chat-form">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your message..."
            className="chat-input"
            disabled={!connected}
          />
          <button
            type="submit"
            disabled={!connected || !inputMessage.trim()}
            className="chat-send-btn staff-btn"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
