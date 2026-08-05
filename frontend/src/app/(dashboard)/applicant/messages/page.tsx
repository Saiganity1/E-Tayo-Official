"use client";

import React, { useState, useEffect, useRef } from "react";
import { Send, User, Clock } from "lucide-react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import { format } from "date-fns";

export default function ApplicantMessagesPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [currentUserEmail, setCurrentUserEmail] = useState("");
  const [connected, setConnected] = useState(false);
  const stompClient = useRef<Client | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const staffEmail = "staff@etayo.gov.ph"; // The person they are talking to

  useEffect(() => {
    // 1. Get current user from localStorage
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setCurrentUserEmail(parsedUser.email);
      
      // 2. Fetch Chat History
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/messages/history?user1=${parsedUser.email}&user2=${staffEmail}`)
        .then(res => res.json())
        .then(data => setMessages(data))
        .catch(err => console.error("Failed to load history", err));

      // 3. Connect to WebSocket
      const client = new Client({
        brokerURL: process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080/ws",
        reconnectDelay: 5000,
        onConnect: () => {
          console.log("Connected to WebSocket");
          setConnected(true);
          // Subscribe to ALL incoming messages
          client.subscribe(`/topic/messages/${parsedUser.email}`, (message) => {
            const receivedMessage = JSON.parse(message.body);
            setMessages(prev => [...prev, receivedMessage]);
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

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim() && stompClient.current && connected) {
      const chatMessage = {
        senderEmail: currentUserEmail,
        recipientEmail: staffEmail,
        content: inputMessage.trim(),
      };
      stompClient.current.publish({
        destination: "/app/chat.sendMessage",
        body: JSON.stringify(chatMessage),
      });
      setInputMessage("");
    }
  };

  return (
    <div className="chat-container">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-info">
          <div className="chat-avatar applicant-avatar">
            <User size={20} />
          </div>
          <div>
            <h2>City Planning Staff</h2>
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
            className="chat-send-btn"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
