"use client";

import React, { useState, useEffect, useRef } from "react";
import { Send, User, Clock, Inbox, MessageSquare, Paperclip, X } from "lucide-react";
import { Client } from "@stomp/stompjs";
import { format } from "date-fns";
import { 
  MessageBubbleContent, 
  AttachmentPreviewModal, 
  ParsedAttachment 
} from "../../../../components/chat/ChatAttachmentRenderer";

export default function StaffMessagesPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [currentUserEmail, setCurrentUserEmail] = useState("");
  const [connected, setConnected] = useState(false);
  const [applicantEmail, setApplicantEmail] = useState<string | null>(null);
  const [contacts, setContacts] = useState<string[]>([]);
  const [previewAttachment, setPreviewAttachment] = useState<ParsedAttachment | null>(null);
  const [staffAttachedFile, setStaffAttachedFile] = useState<{ name: string; url: string } | null>(null);
  const staffFileInputRef = useRef<HTMLInputElement>(null);
  
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

  const handleStaffFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Cache locally as base64 so anyone in this browser can view it
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      try {
        localStorage.setItem(`att_${file.name}`, dataUrl);
      } catch (err) {}
      setStaffAttachedFile({ name: file.name, url: "" });
    };
    reader.readAsDataURL(file);

    // Also attempt server upload
    const formData = new FormData();
    formData.append("files", file);
    formData.append("permitType", "Staff Attachment");
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/upload`, {
      method: "POST",
      body: formData
    })
      .then(res => res.json())
      .then(data => {
        if (data.urls && data.urls[0]) {
          setStaffAttachedFile({ name: file.name, url: data.urls[0] });
        }
      })
      .catch(err => console.error("Upload error", err));
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    let finalContent = inputMessage.trim();
    if (!finalContent && !staffAttachedFile) return;

    if (staffAttachedFile) {
      finalContent = finalContent 
        ? `${finalContent} [Attachment: ${staffAttachedFile.name}|${staffAttachedFile.url}]`
        : `[Attachment: ${staffAttachedFile.name}|${staffAttachedFile.url}]`;
    }

    if (stompClient.current && connected && applicantEmail) {
      const chatMessage = {
        senderEmail: "staff@etayo.gov.ph",
        actualSender: currentUserEmail,
        recipientEmail: applicantEmail,
        content: finalContent,
      };
      stompClient.current.publish({
        destination: "/app/chat.sendMessage",
        body: JSON.stringify(chatMessage),
      });

      // Optimistically append message
      setMessages(prev => [...prev, {
        id: `staff-${Date.now()}`,
        senderEmail: "staff@etayo.gov.ph",
        actualSender: currentUserEmail,
        recipientEmail: applicantEmail,
        content: finalContent,
        timestamp: new Date().toISOString()
      }]);

      setInputMessage("");
      setStaffAttachedFile(null);
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
                        <MessageBubbleContent
                          content={msg.content}
                          isMe={isMe}
                          onOpenAttachment={(att) => setPreviewAttachment(att)}
                        />
                        <span className="timestamp">
                          {format(getValidDate(msg.timestamp), "h:mm a")}
                          {isMe && msg.actualSender && (
                            <span style={{ display: 'block', color: '#bfdbfe', marginTop: '2px' }}>
                              by {msg.actualSender.split('@')[0]}
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Attachment preview pill if staff selected a file to send */}
            {staffAttachedFile && (
              <div style={{
                padding: "6px 1rem",
                background: "#eff6ff",
                borderTop: "1px solid #bfdbfe",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: "0.8rem",
                color: "#1e40af"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Paperclip size={14} />
                  <span>Ready to attach: <strong>{staffAttachedFile.name}</strong></span>
                </div>
                <button
                  type="button"
                  onClick={() => setStaffAttachedFile(null)}
                  style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer" }}
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Input Area */}
            <div className="chat-input-area">
              <form onSubmit={sendMessage} className="chat-form" style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <input
                  type="file"
                  ref={staffFileInputRef}
                  style={{ display: "none" }}
                  onChange={handleStaffFileSelect}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                <button
                  type="button"
                  onClick={() => staffFileInputRef.current?.click()}
                  title="Attach file (PDF/Image)"
                  style={{
                    background: "#f1f5f9",
                    border: "1px solid #cbd5e1",
                    color: "#64748b",
                    width: "40px",
                    height: "40px",
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    flexShrink: 0
                  }}
                >
                  <Paperclip size={18} />
                </button>

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
                  disabled={!connected || (!inputMessage.trim() && !staffAttachedFile)}
                  className="chat-send-btn staff-btn"
                >
                  <Send size={18} />
                </button>
              </form>
            </div>
          </>
        )}
      </div>

      {/* ATTACHMENT PREVIEW MODAL */}
      <AttachmentPreviewModal 
        attachment={previewAttachment} 
        onClose={() => setPreviewAttachment(null)} 
      />
    </div>
  );
}
