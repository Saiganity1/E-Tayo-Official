"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { 
  FileText, Download, Eye, Search, Layers, ShieldCheck, 
  CheckCircle2, Building2, Wrench, Zap, Trash2, Shield, 
  Droplets, Radio, Flame, ExternalLink, X, Filter, Sparkles, 
  ArrowRight, Check, BookOpen, AlertCircle
} from "lucide-react";
import { ALL_OFFICIAL_TEMPLATES, OfficialTemplateFile } from "../../data/projectTypeMatrix";
import { usePermitContext } from "../../context/PermitContext";

interface TemplatesDirectoryProps {
  role?: "applicant" | "staff" | "admin";
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string; badgeBg: string }> = {
  "Primary Permit": { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe", badgeBg: "#dbeafe" },
  "Zoning & Land Use": { bg: "#ecfdf5", text: "#047857", border: "#a7f3d0", badgeBg: "#d1fae5" },
  "Ancillary Permit": { bg: "#f5f3ff", text: "#6d28d9", border: "#ddd6fe", badgeBg: "#ede9fe" },
  "Special Permit": { bg: "#fff7ed", text: "#c2410c", border: "#fed7aa", badgeBg: "#ffedd5" },
  "Utilities & Services": { bg: "#fefce8", text: "#a16207", border: "#fef08a", badgeBg: "#fef9c3" },
  "Completion & Occupancy": { bg: "#f0fdf4", text: "#15803d", border: "#bbf7d0", badgeBg: "#dcfce7" },
};

const CODE_ICONS: Record<string, any> = {
  BP: Building2,
  LC: ShieldCheck,
  AP: Layers,
  SP: Shield,
  EP: Zap,
  PL: Droplets,
  MP: Wrench,
  EL: Radio,
  DP: Trash2,
  FP: ShieldCheck,
  EXP: Wrench,
  SGP: FileText,
  TSC: Zap,
  CO: CheckCircle2,
  CC: CheckCircle2,
  CFEI: Zap,
};

export default function TemplatesDirectory({ role = "applicant" }: TemplatesDirectoryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [previewTemplate, setPreviewTemplate] = useState<OfficialTemplateFile | null>(null);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(ALL_OFFICIAL_TEMPLATES.map(t => t.category)));
    return ["All", ...cats];
  }, []);

  const filteredTemplates = useMemo(() => {
    return ALL_OFFICIAL_TEMPLATES.filter(tmpl => {
      const matchesCat = selectedCategory === "All" || tmpl.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = 
        !q ||
        tmpl.name.toLowerCase().includes(q) ||
        tmpl.code.toLowerCase().includes(q) ||
        tmpl.filename.toLowerCase().includes(q) ||
        tmpl.description.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  const { userRole } = usePermitContext();
  const isAdmin = role === "admin" || userRole === "admin";

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "1.5rem 1rem 3rem" }}>
      {/* Admin Clean Header (Hero Banner Removed on Admin side) */}
      {isAdmin ? (
        <div style={{
          background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
          border: "1.5px solid #e2e8f0",
          borderRadius: "18px",
          padding: "1.25rem 1.75rem",
          marginBottom: "1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
          boxShadow: "0 4px 20px rgba(0,0,0,0.02)"
        }}>
          <div>
            <h2 style={{ fontSize: "1.35rem", fontWeight: "800", color: "#0f172a", margin: "0 0 0.25rem 0" }}>
              Official Permitting Forms Library
            </h2>
            <p style={{ margin: 0, fontSize: "0.88rem", color: "#64748b" }}>
              Inspect and download official blank templates, or test interactive form field mappings.
            </p>
          </div>
          <Link
            href="/admin/form-tester"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
              color: "white",
              padding: "9px 18px",
              borderRadius: "12px",
              fontWeight: "700",
              fontSize: "0.88rem",
              textDecoration: "none",
              boxShadow: "0 4px 14px rgba(37, 99, 235, 0.3)",
              transition: "all 0.2s ease"
            }}
          >
            <Sparkles size={16} />
            <span>Open Form Testing Studio</span>
          </Link>
        </div>
      ) : (
        /* Header Banner for non-admin */
        <div style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #094067 100%)",
          borderRadius: "20px",
          padding: "2.25rem 2rem",
          color: "white",
          boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.3)",
          position: "relative",
          overflow: "hidden",
          marginBottom: "2rem"
        }}>
          <div style={{ position: "relative", zIndex: 2 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "6px 14px", borderRadius: "9999px", background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", fontSize: "0.82rem", fontWeight: "600", marginBottom: "1rem" }}>
              <Sparkles size={15} style={{ color: "#38bdf8" }} />
              <span>Official Sto. Tomas Permitting Forms Library</span>
            </div>

            <h1 style={{ fontSize: "2rem", fontWeight: "900", margin: "0 0 0.5rem", letterSpacing: "-0.025em" }}>
              Official Municipal Permitting Templates
            </h1>
            <p style={{ fontSize: "1rem", color: "#cbd5e1", margin: 0, maxWidth: "780px", lineHeight: "1.6" }}>
              All 16 statutory permit forms, technical ancillary schedules, and completion certificates adopted by the Office of the Building Official (OBO), Municipality of Sto. Tomas, Batangas. Directly inspect, download blank copies, or apply online.
            </p>

            {/* Quick Metrics */}
            <div style={{ display: "flex", gap: "1.25rem", marginTop: "1.5rem", flexWrap: "wrap" }}>
              <div style={{ background: "rgba(255,255,255,0.08)", padding: "8px 16px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.12)" }}>
                <div style={{ fontSize: "1.25rem", fontWeight: "800", color: "#38bdf8" }}>16</div>
                <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Verified Forms Available</div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.08)", padding: "8px 16px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.12)" }}>
                <div style={{ fontSize: "1.25rem", fontWeight: "800", color: "#34d399" }}>100%</div>
                <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>NBCP Compliant</div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.08)", padding: "8px 16px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.12)" }}>
                <div style={{ fontSize: "1.25rem", fontWeight: "800", color: "#f472b6" }}>Digital</div>
                <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Auto-Stamping Ready</div>
              </div>
            </div>
          </div>

          {/* Decorative background grid */}
          <div style={{
            position: "absolute",
            top: "-50px",
            right: "-50px",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(56, 189, 248, 0.15) 0%, rgba(0,0,0,0) 70%)",
            zIndex: 1,
            pointerEvents: "none"
          }} />
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div style={{
        background: "white",
        borderRadius: "16px",
        padding: "1.25rem",
        border: "1px solid #e2e8f0",
        boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
        marginBottom: "1.75rem"
      }}>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
          {/* Search Box */}
          <div style={{ position: "relative", flex: "1 1 320px", maxWidth: "500px" }}>
            <Search size={18} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
            <input
              type="text"
              placeholder="Search by form name, code (BP, EP, DP...), or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px 10px 42px",
                borderRadius: "10px",
                border: "1.5px solid #e2e8f0",
                fontSize: "0.9rem",
                outline: "none",
                transition: "border-color 0.2s",
                background: "#f8fafc"
              }}
              onFocus={(e) => e.target.style.borderColor = "#4f46e5"}
              onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: "600" }}>
            Showing {filteredTemplates.length} of {ALL_OFFICIAL_TEMPLATES.length} templates
          </div>
        </div>

        {/* Category Pills */}
        <div style={{ display: "flex", gap: "8px", marginTop: "1rem", overflowX: "auto", paddingBottom: "4px" }}>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            const count = cat === "All" 
              ? ALL_OFFICIAL_TEMPLATES.length 
              : ALL_OFFICIAL_TEMPLATES.filter(t => t.category === cat).length;

            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: "7px 14px",
                  borderRadius: "9999px",
                  fontSize: "0.82rem",
                  fontWeight: isSelected ? "700" : "500",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s ease",
                  border: isSelected ? "1.5px solid #4f46e5" : "1.5px solid #e2e8f0",
                  background: isSelected ? "#4f46e5" : "white",
                  color: isSelected ? "white" : "#475569",
                  boxShadow: isSelected ? "0 2px 8px rgba(79, 70, 229, 0.25)" : "none"
                }}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid of Templates */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
        gap: "1.25rem"
      }}>
        {filteredTemplates.map((tmpl) => {
          const color = CATEGORY_COLORS[tmpl.category] || { bg: "#f8fafc", text: "#334155", border: "#e2e8f0", badgeBg: "#f1f5f9" };
          const IconComponent = CODE_ICONS[tmpl.code] || FileText;

          return (
            <div
              key={tmpl.filename}
              style={{
                background: "white",
                borderRadius: "16px",
                border: "1.5px solid #e2e8f0",
                padding: "1.4rem",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
                transition: "all 0.2s ease",
                position: "relative"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.boxShadow = "0 10px 20px -5px rgba(0,0,0,0.08)";
                e.currentTarget.style.borderColor = "#c7d2fe";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.03)";
                e.currentTarget.style.borderColor = "#e2e8f0";
              }}
            >
              <div>
                {/* Header with Badges */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.85rem" }}>
                  <div style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "4px 10px",
                    borderRadius: "8px",
                    background: color.bg,
                    border: `1px solid ${color.border}`,
                    color: color.text,
                    fontSize: "0.75rem",
                    fontWeight: "700"
                  }}>
                    <IconComponent size={13} />
                    <span>{tmpl.code}</span>
                  </div>

                  <span style={{
                    fontSize: "0.72rem",
                    fontWeight: "600",
                    padding: "3px 8px",
                    borderRadius: "6px",
                    background: "#f1f5f9",
                    color: "#64748b"
                  }}>
                    {tmpl.category}
                  </span>
                </div>

                {/* Title & Description */}
                <h3 style={{ fontSize: "1.08rem", fontWeight: "800", color: "#0f172a", margin: "0 0 0.45rem", lineHeight: "1.35" }}>
                  {tmpl.name}
                </h3>
                <p style={{ fontSize: "0.82rem", color: "#64748b", margin: "0 0 1rem", lineHeight: "1.5" }}>
                  {tmpl.description}
                </p>

                {/* File Details */}
                <div style={{
                  padding: "8px 10px",
                  borderRadius: "8px",
                  background: "#f8fafc",
                  border: "1px solid #f1f5f9",
                  fontSize: "0.72rem",
                  color: "#64748b",
                  wordBreak: "break-all",
                  marginBottom: "1.25rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}>
                  <FileText size={13} style={{ color: "#94a3b8", flexShrink: 0 }} />
                  <span style={{ fontFamily: "monospace" }}>{tmpl.filename}</span>
                </div>
              </div>

              {/* Actions Footer */}
              <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "1rem", display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  {/* Preview Button */}
                  <button
                    onClick={() => setPreviewTemplate(tmpl)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1.5px solid #e2e8f0",
                      background: "white",
                      color: "#334155",
                      fontSize: "0.82rem",
                      fontWeight: "600",
                      cursor: "pointer",
                      transition: "all 0.15s"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#4f46e5";
                      e.currentTarget.style.color = "#4f46e5";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#e2e8f0";
                      e.currentTarget.style.color = "#334155";
                    }}
                  >
                    <Eye size={14} /> Preview
                  </button>

                  {/* Download Blank PDF */}
                  <a
                    href={tmpl.path}
                    download={tmpl.filename}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1.5px solid #cbd5e1",
                      background: "#f8fafc",
                      color: "#0f172a",
                      fontSize: "0.82rem",
                      fontWeight: "600",
                      textDecoration: "none",
                      cursor: "pointer",
                      transition: "all 0.15s"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#e2e8f0";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#f8fafc";
                    }}
                  >
                    <Download size={14} /> Download PDF
                  </a>
                </div>

                {/* Start Application Action */}
                {role === "applicant" && (
                  <Link
                    href={`/applicant/apply?template=${tmpl.code}${tmpl.projectTypeId ? `&type=${tmpl.projectTypeId}` : ""}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      padding: "8px 14px",
                      borderRadius: "8px",
                      background: "#4f46e5",
                      color: "white",
                      fontSize: "0.82rem",
                      fontWeight: "700",
                      textDecoration: "none",
                      transition: "all 0.15s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#4338ca"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "#4f46e5"}
                  >
                    <span>Use Form in Application</span>
                    <ArrowRight size={13} />
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredTemplates.length === 0 && (
        <div style={{
          textAlign: "center",
          padding: "3rem 1rem",
          background: "white",
          borderRadius: "16px",
          border: "1.5px dashed #cbd5e1",
          marginTop: "1.5rem"
        }}>
          <AlertCircle size={40} style={{ color: "#94a3b8", marginBottom: "0.75rem" }} />
          <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#334155", margin: "0 0 0.5rem" }}>
            No templates found matching &ldquo;{searchQuery}&rdquo;
          </h3>
          <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "0 0 1rem" }}>
            Try searching for another keyword or select &ldquo;All&rdquo; categories.
          </p>
          <button
            onClick={() => { setSearchQuery(""); setSelectedCategory("All"); }}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              background: "#4f46e5",
              color: "white",
              fontSize: "0.82rem",
              fontWeight: "600",
              border: "none",
              cursor: "pointer"
            }}
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* PDF PREVIEW MODAL */}
      {previewTemplate && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(4px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem"
          }}
          onClick={() => setPreviewTemplate(null)}
        >
          <div
            style={{
              background: "white",
              borderRadius: "18px",
              width: "100%",
              maxWidth: "1000px",
              height: "90vh",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
              position: "relative"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: "1rem 1.5rem",
              borderBottom: "1.5px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "#f8fafc"
            }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{
                    padding: "2px 8px",
                    borderRadius: "6px",
                    background: "#ede9fe",
                    color: "#6d28d9",
                    fontWeight: "800",
                    fontSize: "0.75rem"
                  }}>
                    {previewTemplate.code}
                  </span>
                  <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "800", color: "#0f172a" }}>
                    {previewTemplate.name}
                  </h3>
                </div>
                <p style={{ margin: "3px 0 0", fontSize: "0.78rem", color: "#64748b" }}>
                  {previewTemplate.filename} — Official Template
                </p>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <a
                  href={previewTemplate.path}
                  download={previewTemplate.filename}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "7px 14px",
                    borderRadius: "8px",
                    background: "#059669",
                    color: "white",
                    fontSize: "0.82rem",
                    fontWeight: "700",
                    textDecoration: "none"
                  }}
                >
                  <Download size={14} /> Download Blank PDF
                </a>
                <button
                  onClick={() => setPreviewTemplate(null)}
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    background: "white",
                    color: "#64748b",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer"
                  }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body: Embedded PDF iframe */}
            <div style={{ flex: 1, background: "#334155", position: "relative" }}>
              <iframe
                src={`${previewTemplate.path}#toolbar=1&navpanes=0`}
                title={previewTemplate.name}
                style={{ width: "100%", height: "100%", border: "none" }}
              />
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: "0.85rem 1.5rem",
              borderTop: "1.5px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "white",
              fontSize: "0.82rem",
              color: "#64748b"
            }}>
              <span>
                Office of the Building Official (OBO) • Municipality of Sto. Tomas, Batangas
              </span>
              {role === "applicant" && (
                <Link
                  href={`/applicant/apply?template=${previewTemplate.code}${previewTemplate.projectTypeId ? `&type=${previewTemplate.projectTypeId}` : ""}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "7px 16px",
                    borderRadius: "8px",
                    background: "#4f46e5",
                    color: "white",
                    fontWeight: "700",
                    textDecoration: "none"
                  }}
                  onClick={() => setPreviewTemplate(null)}
                >
                  <span>Start Application with this Form</span>
                  <ArrowRight size={14} />
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
