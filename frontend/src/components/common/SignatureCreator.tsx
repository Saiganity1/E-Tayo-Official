"use client";

import React, { useRef, useState, useEffect } from "react";
import { PenTool, Eraser, Upload, Check, Trash2, RotateCcw, Sparkles } from "lucide-react";

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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize canvas context
  useEffect(() => {
    if (mode === "draw" && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.strokeStyle = "#041c72"; // Official signature navy
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
      }
    }
  }, [mode, value]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = (e?: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    if (e) e.preventDefault();
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleSaveDrawn = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) return;
    const dataUrl = canvas.toDataURL("image/png");
    onChange(dataUrl);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = event => {
      const result = event.target?.result as string;
      if (result) {
        onChange(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreateSample = () => {
    // Generate an authentic sample signature onto the canvas
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#041c72";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

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
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <label style={{ fontSize: "0.78rem", fontWeight: "700", color: "#334155" }}>
          {label} {required && <span style={{ color: "#ef4444" }}>*</span>}
        </label>
        {value && (
          <span style={{ fontSize: "0.72rem", color: "#059669", fontWeight: "700", display: "flex", alignItems: "center", gap: "4px" }}>
            <Check size={13} /> Signature Affixed
          </span>
        )}
      </div>

      {/* If signature already affixed, show preview with option to change */}
      {value ? (
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
                This signature will be embedded directly onto the official permit documents.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onChange("")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "6px 12px",
              borderRadius: "6px",
              border: "1px solid #fca5a5",
              background: "#fef2f2",
              color: "#dc2626",
              fontSize: "0.75rem",
              fontWeight: "700",
              cursor: "pointer"
            }}
          >
            <Trash2 size={13} /> Re-Sign / Clear
          </button>
        </div>
      ) : (
        /* E-Signature Creator: Drawing Board / Uploader */
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
                color: mode === "draw" ? "#2563eb" : "#64748b",
                borderBottom: mode === "draw" ? "2px solid #2563eb" : "none",
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
                color: mode === "upload" ? "#2563eb" : "#64748b",
                borderBottom: mode === "upload" ? "2px solid #2563eb" : "none",
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
                    style={{ width: "100%", height: "100%" }}
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
                    <span style={{ fontSize: "0.65rem", color: "#94a3b8", userSelect: "none" }}>Sign above this line (Mouse / Touch / Stylus)</span>
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

                  <button
                    type="button"
                    onClick={handleSaveDrawn}
                    disabled={!hasDrawn}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      padding: "6px 14px",
                      borderRadius: "6px",
                      border: "none",
                      background: hasDrawn ? "#2563eb" : "#94a3b8",
                      color: "#ffffff",
                      fontSize: "0.75rem",
                      fontWeight: "700",
                      cursor: hasDrawn ? "pointer" : "not-allowed"
                    }}
                  >
                    <Check size={13} /> Save E-Signature
                  </button>
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
                    background: "#2563eb",
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
