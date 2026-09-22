"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { PenTool, Eraser, Upload, Check, Trash2, Sparkles, CheckCircle2 } from "lucide-react";

interface SignatureCreatorProps {
  value?: string;
  onChange: (dataUrl: string) => void;
  label?: string;
  required?: boolean;
}

export default function SignatureCreator({
  value,
  onChange,
  label = "Applicant E-Signature",
  required = false,
}: SignatureCreatorProps) {
  const [mode, setMode] = useState<"draw" | "upload">("draw");
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [isSavedRecently, setIsSavedRecently] = useState(false);
  // If a value is passed in initially, start in preview mode; otherwise, in drawing mode
  const [isEditing, setIsEditing] = useState<boolean>(!value);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Re-sync editing state if value becomes empty from outside
  useEffect(() => {
    if (!value) {
      setIsEditing(true);
      setHasDrawn(false);
    }
  }, [value]);

  // Set up canvas stroke styling
  const setupContext = useCallback(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.strokeStyle = "#041c72"; // Official signature navy
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
      }
    }
  }, []);

  useEffect(() => {
    if (mode === "draw" && isEditing) {
      setupContext();
    }
  }, [mode, isEditing, setupContext]);

  // Helper to accurately scale client coordinates to internal canvas resolution
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e && e.touches.length > 0 ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = "touches" in e && e.touches.length > 0 ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (e.cancelable) e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setupContext();
    const { x, y } = getCanvasCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    if (e.cancelable) e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCanvasCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = (e?: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    if (e && e.cancelable) e.preventDefault();
    setIsDrawing(false);

    // Auto-save to parent onChange immediately so signature is NEVER lost
    const canvas = canvasRef.current;
    if (canvas && hasDrawn) {
      try {
        const dataUrl = canvas.toDataURL("image/png");
        onChange(dataUrl);
      } catch (err) {
        console.error("Failed to auto-save drawn signature:", err);
      }
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    setIsSavedRecently(false);
    onChange("");
  };

  const handleManualSave = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) return;
    const dataUrl = canvas.toDataURL("image/png");
    onChange(dataUrl);
    setIsSavedRecently(true);
    setTimeout(() => setIsSavedRecently(false), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = event => {
      const result = event.target?.result as string;
      if (result) {
        onChange(result);
        setIsEditing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreateSample = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setupContext();

    // Draw realistic cursive strokes for sample
    ctx.beginPath();
    ctx.moveTo(40, 95);
    ctx.bezierCurveTo(70, 40, 80, 130, 90, 80);
    ctx.bezierCurveTo(100, 70, 110, 100, 130, 85);
    ctx.bezierCurveTo(145, 75, 160, 110, 180, 80);
    ctx.bezierCurveTo(200, 60, 210, 120, 230, 80);
    ctx.bezierCurveTo(250, 70, 270, 100, 310, 75);
    ctx.stroke();

    // Flourish / underline loop
    ctx.beginPath();
    ctx.moveTo(35, 110);
    ctx.bezierCurveTo(120, 125, 240, 120, 330, 105);
    ctx.stroke();

    setHasDrawn(true);
    const dataUrl = canvas.toDataURL("image/png");
    onChange(dataUrl);
    setIsSavedRecently(true);
    setTimeout(() => setIsSavedRecently(false), 2000);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <label style={{ fontSize: "0.78rem", fontWeight: "700", color: "#334155" }}>
          {label} {required && <span style={{ color: "#ef4444" }}>*</span>}
        </label>
        {value ? (
          <span style={{ fontSize: "0.72rem", color: "#059669", fontWeight: "700", display: "flex", alignItems: "center", gap: "4px" }}>
            <Check size={13} /> Signature Affixed
          </span>
        ) : (
          <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px" }}>
            <PenTool size={12} /> Draw or Upload
          </span>
        )}
      </div>

      {/* When collapsed with an existing signature, show clean preview card */}
      {!isEditing && value ? (
        <div
          style={{
            border: "1.5px solid #cbd5e1",
            borderRadius: "10px",
            background: "#ffffff",
            padding: "0.75rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div
              style={{
                width: "160px",
                height: "60px",
                border: "1px dashed #94a3b8",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#f8fafc",
                overflow: "hidden"
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={value} alt="E-Signature Preview" style={{ maxHeight: "55px", maxWidth: "150px", objectFit: "contain" }} />
            </div>
            <div>
              <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "#1e293b", display: "block" }}>
                Valid E-Signature Active
              </span>
              <span style={{ fontSize: "0.7rem", color: "#64748b" }}>
                Embedded directly onto official municipal documents.
              </span>
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              type="button"
              onClick={() => {
                setIsEditing(true);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "6px 12px",
                borderRadius: "6px",
                border: "1px solid #bfdbfe",
                background: "#eff6ff",
                color: "#1d4ed8",
                fontSize: "0.75rem",
                fontWeight: "700",
                cursor: "pointer"
              }}
            >
              <PenTool size={13} /> Edit / Re-Sign
            </button>
            <button
              type="button"
              onClick={() => {
                onChange("");
                setIsEditing(true);
                setHasDrawn(false);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "6px 10px",
                borderRadius: "6px",
                border: "1px solid #fca5a5",
                background: "#fef2f2",
                color: "#dc2626",
                fontSize: "0.75rem",
                fontWeight: "700",
                cursor: "pointer"
              }}
            >
              <Trash2 size={13} /> Clear
            </button>
          </div>
        </div>
      ) : (
        /* E-Signature Creator: Interactive Drawing Board / Uploader */
        <div
          style={{
            border: "1.5px solid #cbd5e1",
            borderRadius: "10px",
            background: "#f8fafc",
            overflow: "hidden"
          }}
        >
          {/* Header tabs: Draw vs Upload */}
          <div style={{ display: "flex", borderBottom: "1px solid #e2e8f0", background: "#f1f5f9" }}>
            <button
              type="button"
              onClick={() => setMode("draw")}
              style={{
                flex: 1,
                padding: "8px 12px",
                fontSize: "0.75rem",
                fontWeight: "700",
                border: "none",
                background: mode === "draw" ? "#ffffff" : "transparent",
                color: mode === "draw" ? "#0038A8" : "#64748b",
                borderBottom: mode === "draw" ? "2px solid #0038A8" : "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px"
              }}
            >
              <PenTool size={13} /> Draw E-Signature
            </button>
            <button
              type="button"
              onClick={() => setMode("upload")}
              style={{
                flex: 1,
                padding: "8px 12px",
                fontSize: "0.75rem",
                fontWeight: "700",
                border: "none",
                background: mode === "upload" ? "#ffffff" : "transparent",
                color: mode === "upload" ? "#0038A8" : "#64748b",
                borderBottom: mode === "upload" ? "2px solid #0038A8" : "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px"
              }}
            >
              <Upload size={13} /> Upload Image
            </button>
          </div>

          <div style={{ padding: "0.75rem" }}>
            {mode === "draw" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {/* Drawing Board Canvas */}
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    height: "140px",
                    background: "#ffffff",
                    borderRadius: "8px",
                    border: "1.5px solid #94a3b8",
                    overflow: "hidden",
                    cursor: "crosshair",
                    touchAction: "none"
                  }}
                >
                  <canvas
                    ref={canvasRef}
                    width={450}
                    height={140}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    style={{ width: "100%", height: "100%", display: "block" }}
                  />

                  {/* Sign here baseline indicator */}
                  <div
                    style={{
                      position: "absolute",
                      bottom: "22px",
                      left: "25px",
                      right: "25px",
                      borderBottom: "1px dashed #cbd5e1",
                      pointerEvents: "none",
                      display: "flex",
                      justifyContent: "space-between"
                    }}
                  >
                    <span style={{ fontSize: "0.65rem", color: "#94a3b8", userSelect: "none" }}>
                      Sign above this line (Mouse / Touch / Stylus)
                    </span>
                    <span style={{ fontSize: "0.65rem", color: "#94a3b8", userSelect: "none" }}>X</span>
                  </div>
                </div>

                {/* Canvas Control Buttons */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", gap: "0.4rem" }}>
                    <button
                      type="button"
                      onClick={handleClear}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "5px 10px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        background: "#ffffff",
                        color: "#475569",
                        fontSize: "0.72rem",
                        fontWeight: "600",
                        cursor: "pointer"
                      }}
                    >
                      <Eraser size={12} /> Clear
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateSample}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "5px 10px",
                        borderRadius: "6px",
                        border: "1px solid #bfdbfe",
                        background: "#eff6ff",
                        color: "#1d4ed8",
                        fontSize: "0.72rem",
                        fontWeight: "600",
                        cursor: "pointer"
                      }}
                    >
                      <Sparkles size={12} /> Sample Signature
                    </button>
                  </div>

                  <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                    <button
                      type="button"
                      onClick={handleManualSave}
                      disabled={!hasDrawn && !value}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        padding: "6px 14px",
                        borderRadius: "6px",
                        border: "none",
                        background: isSavedRecently ? "#059669" : (hasDrawn || value) ? "#0038A8" : "#94a3b8",
                        color: "#ffffff",
                        fontSize: "0.75rem",
                        fontWeight: "700",
                        cursor: (hasDrawn || value) ? "pointer" : "not-allowed",
                        transition: "background 0.2s"
                      }}
                    >
                      {isSavedRecently ? (
                        <>
                          <CheckCircle2 size={13} /> Saved!
                        </>
                      ) : (
                        <>
                          <Check size={13} /> Save E-Signature
                        </>
                      )}
                    </button>
                    {value && (
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        style={{
                          padding: "6px 12px",
                          borderRadius: "6px",
                          border: "1px solid #cbd5e1",
                          background: "#ffffff",
                          color: "#334155",
                          fontSize: "0.75rem",
                          fontWeight: "600",
                          cursor: "pointer"
                        }}
                      >
                        Done
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Upload Mode */
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "1.5rem 1rem",
                  border: "1.5px dashed #cbd5e1",
                  borderRadius: "8px",
                  background: "#ffffff",
                  textAlign: "center"
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  onChange={handleFileUpload}
                  style={{ display: "none" }}
                />
                <Upload size={28} color="#64748b" style={{ marginBottom: "0.5rem" }} />
                <span style={{ fontSize: "0.78rem", fontWeight: "700", color: "#1e293b" }}>
                  Upload Scanned Signature
                </span>
                <span style={{ fontSize: "0.7rem", color: "#64748b", margin: "0.25rem 0 0.75rem 0" }}>
                  PNG with transparent background is recommended (Max 2MB)
                </span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    background: "#0038A8",
                    color: "#ffffff",
                    fontSize: "0.75rem",
                    fontWeight: "700",
                    cursor: "pointer"
                  }}
                >
                  Choose Image File
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

