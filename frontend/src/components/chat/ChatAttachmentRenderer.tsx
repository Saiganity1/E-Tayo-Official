"use client";

import React, { useState } from "react";
import { 
  FileText, Image as ImageIcon, ExternalLink, Download, 
  Eye, X, ZoomIn, ZoomOut, Check, Sparkles, Shield, AlertCircle
} from "lucide-react";
import Link from "next/link";

export interface ParsedAttachment {
  fileName: string;
  fileUrl: string;
  isImage: boolean;
  isPdf: boolean;
  isDoc: boolean;
}

export interface ParsedMessage {
  cleanText: string;
  attachments: ParsedAttachment[];
}

export function parseMessageAttachments(rawContent: string): ParsedMessage {
  if (!rawContent) return { cleanText: "", attachments: [] };

  const attachments: ParsedAttachment[] = [];
  // Regex to match: [Attachment: filename.ext] or [Attachment: filename.ext|url] with optional paperclip
  const attachmentRegex = /(?:📎\s*)?\[Attachment:\s*([^\]|]+)(?:\|([^\]]*))?\]/gi;

  let match;
  while ((match = attachmentRegex.exec(rawContent)) !== null) {
    const fileName = match[1].trim();
    let fileUrl = match[2] ? match[2].trim() : "";

    // If no URL in string, check if cached in localStorage
    if (!fileUrl && typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(`att_${fileName}`) || localStorage.getItem(`chat_att_${fileName}`);
        if (cached) {
          fileUrl = cached;
        }
      } catch (e) {}
    }

    const ext = fileName.split('.').pop()?.toLowerCase() || "";
    const isImage = ["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(ext);
    const isPdf = ext === "pdf";
    const isDoc = ["doc", "docx", "txt"].includes(ext);

    attachments.push({
      fileName,
      fileUrl,
      isImage,
      isPdf,
      isDoc
    });
  }

  // Remove the [Attachment: ...] tokens from displayed message text
  const cleanText = rawContent.replace(attachmentRegex, "").trim();

  return { cleanText, attachments };
}

interface MessageBubbleContentProps {
  content: string;
  isMe: boolean;
  onOpenAttachment?: (att: ParsedAttachment) => void;
}

export function MessageBubbleContent({ content, isMe, onOpenAttachment }: MessageBubbleContentProps) {
  const { cleanText, attachments } = parseMessageAttachments(content);

  // Detect tracking IDs like LC-2026-1641 or BP-2026-0005
  const renderTextWithTrackingLinks = (text: string) => {
    if (!text) return null;
    const trackingIdRegex = /(LC-\d{4}-\d{4}|BP-\d{4}-\d{4}|APP-\d{4}-\d{4})/g;
    const parts = text.split(trackingIdRegex);

    return parts.map((part, i) => {
      if (trackingIdRegex.test(part)) {
        return (
          <Link
            key={i}
            href={`/applicant/track/${part}`}
            className="inline-flex items-center gap-1 font-mono font-bold text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded-md transition-all mx-1"
            title="Click to view application details"
          >
            <span>{part}</span>
            <ExternalLink size={10} />
          </Link>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {cleanText && (
        <p style={{ margin: 0, wordBreak: "break-word" }}>
          {renderTextWithTrackingLinks(cleanText)}
        </p>
      )}

      {attachments.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: cleanText ? "8px" : "0" }}>
          {attachments.map((att, idx) => (
            <div
              key={idx}
              className="chat-attachment-card"
              style={{
                background: isMe ? "rgba(255, 255, 255, 0.18)" : "#f8fafc",
                border: isMe ? "1px solid rgba(255, 255, 255, 0.35)" : "1.5px solid #e2e8f0",
                borderRadius: "14px",
                padding: "10px 12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
                maxWidth: "100%"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                <div style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "10px",
                  background: att.isImage 
                    ? "linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)" 
                    : "linear-gradient(135deg, #fee2e2 0%, #fecdd3 100%)",
                  color: att.isImage ? "#4338ca" : "#be123c",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0
                }}>
                  {att.isImage ? <ImageIcon size={20} /> : <FileText size={20} />}
                </div>

                <div style={{ minWidth: 0 }}>
                  <div style={{
                    fontSize: "0.85rem",
                    fontWeight: "700",
                    color: isMe ? "#ffffff" : "#0f172a",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: "220px"
                  }} title={att.fileName}>
                    {att.fileName}
                  </div>
                  <div style={{
                    fontSize: "0.72rem",
                    color: isMe ? "rgba(255,255,255,0.8)" : "#64748b",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px"
                  }}>
                    <span>{att.isImage ? "Image File" : (att.isPdf ? "PDF Document" : "Attachment")}</span>
                    <span>•</span>
                    <span style={{ color: isMe ? "#bfdbfe" : "#2563eb", fontWeight: "600" }}>Click to View</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (onOpenAttachment) {
                    onOpenAttachment(att);
                  } else {
                    // Fallback direct open
                    if (att.fileUrl && att.fileUrl.startsWith("http")) {
                      window.open(att.fileUrl, "_blank");
                    }
                  }
                }}
                style={{
                  background: isMe ? "#ffffff" : "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                  color: isMe ? "#1d4ed8" : "#ffffff",
                  border: "none",
                  borderRadius: "9px",
                  padding: "7px 14px",
                  fontSize: "0.8rem",
                  fontWeight: "700",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
                  transition: "all 0.15s ease",
                  flexShrink: 0
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.03)"}
                onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
              >
                <Eye size={13} />
                <span>Open</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface AttachmentModalProps {
  attachment: ParsedAttachment | null;
  onClose: () => void;
}

export function AttachmentPreviewModal({ attachment, onClose }: AttachmentModalProps) {
  const [zoomLevel, setZoomLevel] = useState(1);

  if (!attachment) return null;

  const handleDownload = () => {
    if (attachment.fileUrl && (attachment.fileUrl.startsWith("http") || attachment.fileUrl.startsWith("data:"))) {
      const a = document.createElement("a");
      a.href = attachment.fileUrl;
      a.download = attachment.fileName;
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      // Create a simulated downloadable text blob if no binary URL exists
      const blob = new Blob([`Official LGU Sto. Tomas Permitting Attachment: ${attachment.fileName}`], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = attachment.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(6px)",
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem"
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "20px",
          width: "100%",
          maxWidth: "820px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 60px rgba(0, 0, 0, 0.3)",
          overflow: "hidden",
          border: "1px solid #e2e8f0"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div style={{
          padding: "1rem 1.5rem",
          borderBottom: "1px solid #e2e8f0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "#f8fafc"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
            <div style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: attachment.isImage ? "#e0e7ff" : "#fee2e2",
              color: attachment.isImage ? "#4f46e5" : "#dc2626",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0
            }}>
              {attachment.isImage ? <ImageIcon size={20} /> : <FileText size={20} />}
            </div>
            <div style={{ minWidth: 0 }}>
              <h3 style={{
                margin: 0,
                fontSize: "1.05rem",
                fontWeight: "800",
                color: "#0f172a",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: "480px"
              }}>
                {attachment.fileName}
              </h3>
              <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                Official Municipal Permit Attachment • Sto. Tomas Permitting Portal
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              type="button"
              onClick={handleDownload}
              style={{
                background: "#ffffff",
                border: "1px solid #cbd5e1",
                color: "#334155",
                padding: "6px 12px",
                borderRadius: "8px",
                fontSize: "0.8rem",
                fontWeight: "700",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px"
              }}
            >
              <Download size={14} />
              <span>Download</span>
            </button>

            {attachment.fileUrl && attachment.fileUrl.startsWith("http") && (
              <button
                type="button"
                onClick={() => window.open(attachment.fileUrl, "_blank")}
                style={{
                  background: "#2563eb",
                  color: "#ffffff",
                  border: "none",
                  padding: "6px 12px",
                  borderRadius: "8px",
                  fontSize: "0.8rem",
                  fontWeight: "700",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px"
                }}
              >
                <ExternalLink size={14} />
                <span>Open in Tab</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              style={{
                background: "#f1f5f9",
                border: "none",
                borderRadius: "8px",
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#64748b",
                cursor: "pointer"
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* MODAL BODY (PREVIEW) */}
        <div style={{
          flex: 1,
          overflow: "auto",
          padding: "1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f172a",
          minHeight: "360px"
        }}>
          {attachment.isImage ? (
            <div style={{ textAlign: "center", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {attachment.fileUrl ? (
                <img
                  src={attachment.fileUrl}
                  alt={attachment.fileName}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "65vh",
                    objectFit: "contain",
                    borderRadius: "8px",
                    transform: `scale(${zoomLevel})`,
                    transition: "transform 0.2s ease"
                  }}
                />
              ) : (
                /* Fallback Image Blueprint Card if binary data is not loaded */
                <div style={{
                  background: "#1e293b",
                  border: "2px dashed #475569",
                  borderRadius: "16px",
                  padding: "2.5rem 2rem",
                  maxWidth: "500px",
                  color: "white"
                }}>
                  <div style={{
                    width: "60px",
                    height: "60px",
                    borderRadius: "14px",
                    background: "rgba(59, 130, 246, 0.2)",
                    color: "#60a5fa",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 1rem auto"
                  }}>
                    <ImageIcon size={32} />
                  </div>
                  <h4 style={{ fontSize: "1.15rem", fontWeight: "800", margin: "0 0 0.5rem 0", color: "#f8fafc" }}>
                    {attachment.fileName}
                  </h4>
                  <p style={{ fontSize: "0.85rem", color: "#94a3b8", lineHeight: "1.5", margin: "0 0 1.25rem 0" }}>
                    Applicant attached file for evaluation by the Office of the Building Official (OBO).
                  </p>
                  <button
                    type="button"
                    onClick={handleDownload}
                    style={{
                      background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                      color: "white",
                      border: "none",
                      padding: "10px 20px",
                      borderRadius: "10px",
                      fontWeight: "700",
                      fontSize: "0.88rem",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                  >
                    <Download size={16} /> Save / Download File
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Document / PDF View */
            <div style={{ textAlign: "center", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {attachment.fileUrl && attachment.fileUrl.startsWith("http") ? (
                <iframe
                  src={attachment.fileUrl}
                  title={attachment.fileName}
                  style={{ width: "100%", height: "65vh", border: "none", borderRadius: "8px", background: "white" }}
                />
              ) : (
                <div style={{
                  background: "#1e293b",
                  border: "2px dashed #475569",
                  borderRadius: "16px",
                  padding: "2.5rem 2rem",
                  maxWidth: "500px",
                  color: "white"
                }}>
                  <div style={{
                    width: "60px",
                    height: "60px",
                    borderRadius: "14px",
                    background: "rgba(239, 68, 68, 0.2)",
                    color: "#f87171",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 1rem auto"
                  }}>
                    <FileText size={32} />
                  </div>
                  <h4 style={{ fontSize: "1.15rem", fontWeight: "800", margin: "0 0 0.5rem 0", color: "#f8fafc" }}>
                    {attachment.fileName}
                  </h4>
                  <p style={{ fontSize: "0.85rem", color: "#94a3b8", lineHeight: "1.5", margin: "0 0 1.25rem 0" }}>
                    Official document submitted for municipal verification and technical compliance.
                  </p>
                  <button
                    type="button"
                    onClick={handleDownload}
                    style={{
                      background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                      color: "white",
                      border: "none",
                      padding: "10px 20px",
                      borderRadius: "10px",
                      fontWeight: "700",
                      fontSize: "0.88rem",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                  >
                    <Download size={16} /> Download Document
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div style={{
          padding: "0.85rem 1.5rem",
          background: "#f8fafc",
          borderTop: "1px solid #e2e8f0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "0.78rem",
          color: "#64748b"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Shield size={14} color="#16a34a" />
            <span>Verified Document Log • Republic Act 11032 Ease of Doing Business</span>
          </div>

          {attachment.isImage && attachment.fileUrl && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.25))}
                style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "6px", padding: "4px 8px", cursor: "pointer" }}
              >
                <ZoomOut size={14} />
              </button>
              <span style={{ fontWeight: "700" }}>{Math.round(zoomLevel * 100)}%</span>
              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.min(3, prev + 0.25))}
                style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "6px", padding: "4px 8px", cursor: "pointer" }}
              >
                <ZoomIn size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
