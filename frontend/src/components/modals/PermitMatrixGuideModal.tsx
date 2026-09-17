"use client";

import React, { useState, useMemo } from "react";
import { 
  X, Search, ShieldCheck, Check, Sparkles, Filter, 
  HelpCircle, Info, ExternalLink, Building, ChevronRight
} from "lucide-react";
import { 
  PROJECT_TYPES_MATRIX, 
  ProjectTypeItem, 
  PermitFormMatrix, 
  RequirementLevel,
  ProjectCategory 
} from "../../data/projectTypeMatrix";

interface PermitMatrixGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProjectId?: string;
  onSelectProjectType?: (project: ProjectTypeItem) => void;
}

const MATRIX_COLUMNS: { key: keyof PermitFormMatrix; label: string; code: string }[] = [
  { key: "buildingPermit", label: "Building Permit", code: "BP" },
  { key: "architecturalPermit", label: "Architectural Permit", code: "AP" },
  { key: "civilStructuralPermit", label: "Civil/Structural Permit", code: "SP" },
  { key: "electricalPermit", label: "Electrical Permit", code: "EP" },
  { key: "sanitaryPermit", label: "Sanitary Permit", code: "PL" },
  { key: "mechanicalPermit", label: "Mechanical Permit", code: "MP" },
  { key: "electronicsPermit", label: "Electronics Permit", code: "EL" },
  { key: "fireBfpPermit", label: "Fire / BFP", code: "FSEC" },
  { key: "zoningPermit", label: "Zoning", code: "LC" },
];

export default function PermitMatrixGuideModal({
  isOpen,
  onClose,
  selectedProjectId,
  onSelectProjectType,
}: PermitMatrixGuideModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // Keep modal scroll locked on background
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const filteredProjects = useMemo(() => {
    return PROJECT_TYPES_MATRIX.filter((item) => {
      const matchesCat = selectedCategory === "All" || item.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  if (!isOpen) return null;

  const renderBadge = (level: RequirementLevel) => {
    if (level === "required") {
      return (
        <span
          title="Required (Mandatory)"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "26px",
            height: "26px",
            borderRadius: "6px",
            background: "#dcfce7",
            color: "#15803d",
            fontWeight: "900",
            fontSize: "0.95rem",
            boxShadow: "0 1px 2px rgba(21, 128, 61, 0.15)",
          }}
        >
          ✓
        </span>
      );
    }
    if (level === "conditional") {
      return (
        <span
          title="Conditional / depending on project specifications"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "26px",
            height: "26px",
            borderRadius: "6px",
            background: "#fef3c7",
            color: "#b45309",
            fontWeight: "800",
            fontSize: "0.85rem",
            border: "1px solid #fde68a",
          }}
        >
          C
        </span>
      );
    }
    return (
      <span
        title="Generally not required"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#94a3b8",
          fontWeight: "600",
          fontSize: "1.1rem",
        }}
      >
        —
      </span>
    );
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(15, 23, 42, 0.78)",
        backdropFilter: "blur(6px)",
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
      onClick={onClose}
    >
      <div
        className="animate-fade-in-up"
        style={{
          background: "#ffffff",
          borderRadius: "20px",
          width: "100%",
          maxWidth: "1180px",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.4)",
          overflow: "hidden",
          border: "1px solid rgba(255, 255, 255, 0.2)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div
          style={{
            background: "linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)",
            color: "#ffffff",
            padding: "1.25rem 1.75rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
            borderBottom: "1px solid rgba(255,255,255,0.15)",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span
                style={{
                  background: "rgba(0,0,0,0.25)",
                  color: "#fef3c7",
                  padding: "3px 9px",
                  borderRadius: "6px",
                  fontSize: "0.72rem",
                  fontWeight: "800",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                }}
              >
                Official LGU Reference
              </span>
              <span style={{ fontSize: "0.8rem", color: "#fef3c7", fontWeight: "600" }}>
                National Building Code of the Philippines (PD 1096)
              </span>
            </div>
            <h3
              style={{
                margin: 0,
                fontSize: "1.35rem",
                fontWeight: "900",
                letterSpacing: "-0.3px",
                color: "#ffffff",
                textShadow: "0 1px 2px rgba(0,0,0,0.2)",
              }}
            >
              PROJECT TYPE × REQUIRED PERMIT FORM MATRIX
            </h3>
            <p style={{ margin: "4px 0 0 0", fontSize: "0.85rem", color: "#fffbeb", opacity: 0.95 }}>
              Official Sto. Tomas municipal permitting matrix indicating mandatory (✓), conditional (C), and exempt (—) permits per project type.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.2)",
              border: "1px solid rgba(255,255,255,0.3)",
              color: "#ffffff",
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* CONTROLS & LEGEND BAR */}
        <div
          style={{
            background: "#fffbeb",
            borderBottom: "1px solid #fde68a",
            padding: "0.9rem 1.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          {/* LEGEND */}
          <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: "800", color: "#92400e", textTransform: "uppercase" }}>
              Legend:
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "20px",
                  height: "20px",
                  borderRadius: "4px",
                  background: "#dcfce7",
                  color: "#15803d",
                  fontWeight: "900",
                  fontSize: "0.8rem",
                }}
              >
                ✓
              </span>
              <span style={{ fontSize: "0.82rem", fontWeight: "700", color: "#166534" }}>Required</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "20px",
                  height: "20px",
                  borderRadius: "4px",
                  background: "#fef3c7",
                  color: "#b45309",
                  fontWeight: "800",
                  fontSize: "0.75rem",
                  border: "1px solid #fde68a",
                }}
              >
                C
              </span>
              <span style={{ fontSize: "0.82rem", fontWeight: "700", color: "#92400e" }}>
                Conditional / depending on project
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ color: "#94a3b8", fontWeight: "700", fontSize: "0.95rem" }}>—</span>
              <span style={{ fontSize: "0.82rem", fontWeight: "600", color: "#64748b" }}>
                Generally not required
              </span>
            </div>
          </div>

          {/* SEARCH */}
          <div style={{ position: "relative", minWidth: "260px" }}>
            <Search
              size={15}
              style={{
                position: "absolute",
                left: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#b45309",
              }}
            />
            <input
              type="text"
              placeholder="Search project type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "6px 12px 6px 32px",
                borderRadius: "8px",
                border: "1px solid #fde68a",
                background: "#ffffff",
                fontSize: "0.84rem",
                color: "#1e293b",
                outline: "none",
              }}
            />
          </div>
        </div>

        {/* CATEGORY TABS */}
        <div
          style={{
            display: "flex",
            gap: "6px",
            padding: "0.6rem 1.5rem",
            background: "#f8fafc",
            borderBottom: "1px solid #e2e8f0",
            overflowX: "auto",
            alignItems: "center",
          }}
        >
          {[
            "All",
            "Residential",
            "Commercial",
            "Industrial",
            "Institutional",
            "Ancillary & Alterations",
            "Utilities & Mechanical",
          ].map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: "5px 12px",
                  borderRadius: "999px",
                  fontSize: "0.78rem",
                  fontWeight: "700",
                  border: isActive ? "1px solid #f59e0b" : "1px solid #e2e8f0",
                  background: isActive ? "#fef3c7" : "#ffffff",
                  color: isActive ? "#92400e" : "#475569",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s ease",
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* TABLE CONTENT */}
        <div style={{ flex: 1, overflowY: "auto", overflowX: "auto", padding: "0" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "center",
              fontSize: "0.84rem",
            }}
          >
            <thead>
              <tr
                style={{
                  background: "#f59e0b",
                  color: "#ffffff",
                  position: "sticky",
                  top: 0,
                  zIndex: 10,
                  boxShadow: "0 2px 4px rgba(0,0,0,0.06)",
                }}
              >
                <th
                  style={{
                    padding: "10px 14px",
                    textAlign: "left",
                    fontWeight: "800",
                    fontSize: "0.82rem",
                    letterSpacing: "0.3px",
                    minWidth: "220px",
                    borderRight: "1px solid #fbbf24",
                  }}
                >
                  Project Type
                </th>
                {MATRIX_COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    style={{
                      padding: "10px 8px",
                      fontWeight: "800",
                      fontSize: "0.78rem",
                      minWidth: "92px",
                      borderRight: "1px solid #fbbf24",
                      lineHeight: "1.25",
                    }}
                  >
                    <div>{col.label}</div>
                    <div style={{ fontSize: "0.68rem", opacity: 0.85, fontWeight: "600" }}>
                      ({col.code})
                    </div>
                  </th>
                ))}
                {onSelectProjectType && (
                  <th
                    style={{
                      padding: "10px 12px",
                      fontWeight: "800",
                      fontSize: "0.78rem",
                      minWidth: "90px",
                    }}
                  >
                    Action
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={MATRIX_COLUMNS.length + 2} style={{ padding: "3rem", color: "#64748b" }}>
                    No project types match your search query "{searchQuery}".
                  </td>
                </tr>
              ) : (
                filteredProjects.map((item, idx) => {
                  const isSelected = selectedProjectId === item.id;
                  const isEven = idx % 2 === 0;

                  return (
                    <tr
                      key={item.id}
                      style={{
                        background: isSelected
                          ? "#fef9c3"
                          : isEven
                          ? "#ffffff"
                          : "#fdf8ee",
                        borderBottom: "1px solid #fed7aa",
                        transition: "background 0.12s ease",
                      }}
                    >
                      {/* PROJECT TYPE NAME */}
                      <td
                        style={{
                          padding: "11px 14px",
                          textAlign: "left",
                          fontWeight: "800",
                          color: isSelected ? "#92400e" : "#0f172a",
                          borderRight: "1px solid #fde68a",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          {isSelected && (
                            <span
                              style={{
                                width: "6px",
                                height: "6px",
                                borderRadius: "50%",
                                background: "#d97706",
                                flexShrink: 0,
                              }}
                            />
                          )}
                          <div>
                            <div>{item.name}</div>
                            <div style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: "500" }}>
                              {item.category}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 9 MATRIX COLUMNS */}
                      {MATRIX_COLUMNS.map((col) => {
                        const level = item.matrix[col.key] || "not_required";
                        return (
                          <td
                            key={col.key}
                            style={{
                              padding: "8px 4px",
                              borderRight: "1px solid #fde68a",
                              verticalAlign: "middle",
                            }}
                          >
                            {renderBadge(level)}
                          </td>
                        );
                      })}

                      {/* ACTION BUTTON */}
                      {onSelectProjectType && (
                        <td style={{ padding: "8px 10px", verticalAlign: "middle" }}>
                          <button
                            type="button"
                            onClick={() => {
                              onSelectProjectType(item);
                              onClose();
                            }}
                            style={{
                              padding: "5px 10px",
                              borderRadius: "6px",
                              border: isSelected ? "1.5px solid #d97706" : "1px solid #cbd5e1",
                              background: isSelected ? "#f59e0b" : "#ffffff",
                              color: isSelected ? "#ffffff" : "#1e293b",
                              fontWeight: "700",
                              fontSize: "0.74rem",
                              cursor: "pointer",
                              whiteSpace: "nowrap",
                              transition: "all 0.15s ease",
                            }}
                          >
                            {isSelected ? "Selected" : "Select"}
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* FOOTER NOTES */}
        <div
          style={{
            background: "#f8fafc",
            borderTop: "1px solid #e2e8f0",
            padding: "0.9rem 1.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
            fontSize: "0.78rem",
            color: "#64748b",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Info size={14} color="#f59e0b" />
            <span>
              <strong>Regulatory Note:</strong> Conditional permits (C) are triggered by specific engineering scopes (e.g. Mechanical for ACU &gt; 20TR or heavy ventilation, Electronics for CCTV/network cabling).
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontWeight: "700", color: "#334155" }}>
              Showing {filteredProjects.length} of {PROJECT_TYPES_MATRIX.length} project types
            </span>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "6px 14px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                color: "#1e293b",
                fontWeight: "700",
                fontSize: "0.8rem",
                cursor: "pointer",
              }}
            >
              Close Guide
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
