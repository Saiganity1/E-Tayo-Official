"use client";

import React, { useState, useEffect, useRef } from "react";
import { Send, User, Clock, Inbox, MessageSquare } from "lucide-react";
import { Client } from "@stomp/stompjs";
import { format } from "date-fns";

export default function StaffMessagesPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [currentUserEmail, setCurrentUserEmail] = useState("");
  const [connected, setConnected] = useState(false);
  const [applicantEmail, setApplicantEmail] = useState<string | null>(null);
  const [contacts, setContacts] = useState<string[]>([]);
  
  const stompClient = useRef<Client | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch unique conversations on load
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/messages/conversations?user=staff@etayo.gov.ph`)
      .then(res => res.json())
      .then(data => {
        // Filter out the staff inbox itself if it's in the list
        setContacts(data.filter((c: string) => c !== "staff@etayo.gov.ph"));
      })
      .catch(err => console.error("Failed to load conversations", err));
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setCurrentUserEmail(parsedUser.email);
      
      let wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080/ws";
      if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
        wsUrl = wsUrl.replace('ws://', 'wss://');
      }
      
      if (!wsUrl.endsWith('/ws')) {
        wsUrl = wsUrl.replace(/\/$/, '') + '/ws';
      }

      const client = new Client({
        brokerURL: wsUrl,
        reconnectDelay: 5000,
        onConnect: () => {
          console.log("Connected to WebSocket");
          setConnected(true);
          
          const handleIncomingMessage = (message: any) => {
            const receivedMessage = JSON.parse(message.body);
            const sender = receivedMessage.senderEmail;
            const recipient = receivedMessage.recipientEmail;
            
            // If message is from someone not in contacts, add them
            if (sender !== "staff@etayo.gov.ph") {
              setContacts(prev => prev.includes(sender) ? prev : [sender, ...prev]);
            } else if (recipient !== "staff@etayo.gov.ph") {
               // We sent it, add recipient to contacts
              setContacts(prev => prev.includes(recipient) ? prev : [recipient, ...prev]);
            }

            // Only append to chat window if we are actively chatting with them
            setApplicantEmail(currentApplicant => {
              if (sender === currentApplicant || (sender === "staff@etayo.gov.ph" && recipient === currentApplicant)) {
                 setMessages(prev => {
                   const exists = prev.find(m => m.id === receivedMessage.id);
                   if (exists) return prev;
                   return [...prev, receivedMessage];
                 });
              }
              return currentApplicant;
            });
          };

          client.subscribe(`/topic/messages/${parsedUser.email}`, handleIncomingMessage);
          
          if (parsedUser.email !== "staff@etayo.gov.ph") {
             client.subscribe(`/topic/messages/staff@etayo.gov.ph`, handleIncomingMessage);
          }
        },
        onStompError: (frame) => {
          console.error("Broker reported error: " + frame.headers["message"]);
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

  useEffect(() => {
    if (applicantEmail) {
      const staffInbox = "staff@etayo.gov.ph";
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/messages/history?user1=${staffInbox}&user2=${applicantEmail}`)
        .then(res => res.json())
        .then(data => setMessages(data))
        .catch(err => console.error("Failed to load history", err));
    }
  }, [applicantEmail]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim() && stompClient.current && connected && applicantEmail) {
      const chatMessage = {
        senderEmail: "staff@etayo.gov.ph",
        actualSender: currentUserEmail,
        recipientEmail: applicantEmail,
        content: inputMessage.trim(),
      };
      stompClient.current.publish({
        destination: "/app/chat.sendMessage",
        body: JSON.stringify(chatMessage),
      });
      setInputMessage("");
    }
  };

  const getValidDate = (ts: any) => {
    if (!ts) return new Date();
    if (typeof ts === 'string' && !ts.endsWith('Z')) {
      return new Date(ts + 'Z');
    }
    return new Date(ts);
  };

  return (
    <div className="messenger-layout">
      {/* Sidebar Contacts */}
      <div className="messenger-sidebar">
        <div className="messenger-sidebar-header">
          <h2><MessageSquare size={18} /> Active Chats</h2>
        </div>
        <div className="messenger-contacts-list">
          {contacts.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>
              <p>No conversations yet.</p>
            </div>
          ) : (
            contacts.map((email, idx) => (
              <div 
                key={idx} 
                className={`contact-item ${applicantEmail === email ? 'active' : ''}`}
                onClick={() => setApplicantEmail(email)}
              >
                <div className="contact-avatar">
                  {email.charAt(0).toUpperCase()}
                </div>
                <div className="contact-info">
                  <p className="contact-email">{email}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="messenger-main">
        {!applicantEmail ? (
          <div className="messenger-empty">
             <Inbox size={48} />
             <h2>Select a Conversation</h2>
             <p>Choose an applicant from the sidebar to view their messages.</p>
             <p className="status-text" style={{ marginTop: '1rem' }}>
                <span className={`status-dot ${connected ? 'online' : 'offline'}`}></span>
                {connected ? 'Connected to messaging server' : 'Reconnecting...'}
              </p>
          </div>
        ) : (
          <>
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
                  const isMe = msg.senderEmail === currentUserEmail || msg.senderEmail === "staff@etayo.gov.ph";
                  return (
                    <div key={idx} className={`message-row ${isMe ? 'me' : 'them'}`}>
                      <div 
                        className={`message-bubble ${isMe ? 'me' : 'them'}`}
                        title={isMe && msg.actualSender ? `Sent by ${msg.actualSender}` : undefined}
                      >
                        <p>{msg.content}</p>
                        <span className="timestamp">
                          {format(getValidDate(msg.timestamp), "h:mm a")}
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
          </>
        )}
      </div>
    </div>
  );
}
