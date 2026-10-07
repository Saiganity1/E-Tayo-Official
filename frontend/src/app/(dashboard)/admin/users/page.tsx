"use client";

import React, { useEffect, useState } from "react";
import { Users, Shield, UserCheck, AlertTriangle, ShieldAlert, RefreshCw } from "lucide-react";

interface UserData {
  id: number;
  name: string;
  email: string;
  role: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [promoting, setPromoting] = useState<number | null>(null);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      let res = await fetch("/api/users?role=ROLE_APPLICANT", {
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      }).catch(() => null);

      if (!res || !res.ok) {
        const rawApi = (process.env.NEXT_PUBLIC_API_URL || "https://e-tayo-official-by0b.onrender.com").replace(/\/+$/, "");
        res = await fetch(`${rawApi}/api/users?role=ROLE_APPLICANT`, {
          headers: token ? { "Authorization": `Bearer ${token}` } : {}
        }).catch(() => null);
      }
      
      if (!res || !res.ok) throw new Error("Failed to fetch users");
      
      const data = await res.json();
      if (Array.isArray(data)) {
        setUsers(data.filter((u: any) => {
          const email = String(u.email || "").toLowerCase().trim();
          return email !== "staff@etayo.gov.ph" && email !== "dave.sicat@etayo.gov.ph";
        }));
      } else {
        setUsers([]);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const promoteToStaff = async (id: number) => {
    if (!window.confirm("Are you sure you want to promote this user to Staff? They will gain access to staff features.")) {
      return;
    }
    
    setPromoting(id);
    try {
      const token = localStorage.getItem("token");
      let res = await fetch(`/api/users/${id}/promote`, {
        method: "PUT",
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      }).catch(() => null);

      if (!res || !res.ok) {
        const rawApi = (process.env.NEXT_PUBLIC_API_URL || "https://e-tayo-official-by0b.onrender.com").replace(/\/+$/, "");
        res = await fetch(`${rawApi}/api/users/${id}/promote`, {
          method: "PUT",
          headers: token ? { "Authorization": `Bearer ${token}` } : {}
        }).catch(() => null);
      }
      
      if (!res || !res.ok) throw new Error("Promotion failed");
      
      alert("User promoted to Staff successfully!");
      fetchUsers();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setPromoting(null);
    }
  };

  const getRoleBadge = (role: string) => {
    switch(role) {
      case "ROLE_ADMIN": 
        return <span style={{ background: "#fef2f2", color: "#b91c1c", padding: "4px 10px", borderRadius: "12px", fontSize: "0.8rem", fontWeight: "700", display: "inline-flex", alignItems: "center", gap: "4px" }}><ShieldAlert size={14} /> Admin</span>;
      case "ROLE_STAFF": 
        return <span style={{ background: "#eff6ff", color: "#1d4ed8", padding: "4px 10px", borderRadius: "12px", fontSize: "0.8rem", fontWeight: "700", display: "inline-flex", alignItems: "center", gap: "4px" }}><Shield size={14} /> Staff</span>;
      default: 
        return <span style={{ background: "#f1f5f9", color: "#475569", padding: "4px 10px", borderRadius: "12px", fontSize: "0.8rem", fontWeight: "700", display: "inline-flex", alignItems: "center", gap: "4px" }}><UserCheck size={14} /> Applicant</span>;
    }
  };

  return (
    <div className="dashboard-page animate-fade-in-up" style={{ maxWidth: "1400px", margin: "0 auto", paddingBottom: "4rem" }}>
      {/* Page Header with White Glass Background Card */}
      <header className="page-header" style={{ 
        background: "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(255,255,255,0.92))",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255, 255, 255, 0.9)",
        boxShadow: "0 10px 35px rgba(0, 0, 0, 0.14)",
        borderRadius: "20px",
        padding: "1.25rem 1.75rem",
        marginBottom: "1.25rem", 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        flexWrap: "wrap", 
        gap: "1rem" 
      }}>
        <div>
          <h1 className="page-title" style={{ fontSize: "2rem", fontWeight: "800", background: "linear-gradient(90deg, #021a4f 0%, #0038A8 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", display: "flex", alignItems: "center", gap: "0.75rem", margin: 0 }}>
            <Users size={30} color="#0038A8" /> Applicants Management
          </h1>
          <p className="page-subtitle" style={{ fontSize: "0.95rem", color: "#475569", margin: "0.35rem 0 0 0" }}>
            View all registered applicants and promote them to Staff if necessary.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={() => { setLoading(true); fetchUsers(); }}
            disabled={loading}
            style={{
              background: "white",
              border: "1px solid #cbd5e1",
              color: "#334155",
              padding: "9px 16px",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontWeight: "600",
              fontSize: "0.9rem",
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
              transition: "all 0.2s"
            }}
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} color="#2563eb" /> Refresh
          </button>
        </div>
      </header>

      <section style={{ 
        background: "#ffffff", 
        padding: "2rem", 
        borderRadius: "24px", 
        border: "1.5px solid #e2e8f0", 
        boxShadow: "0 10px 40px -10px rgba(0,0,0,0.06), 0 0 0 1px rgba(226, 232, 240, 0.8) inset" 
      }}>
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center" }}>
            <div className="spinner" style={{ width: "40px", height: "40px", border: "4px solid rgba(29, 78, 216, 0.2)", borderTopColor: "#1d4ed8", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 1rem auto" }}></div>
            <p style={{ color: "#64748b" }}>Loading users...</p>
          </div>
        ) : error ? (
          <div style={{ padding: "2rem", background: "#fef2f2", color: "#b91c1c", borderRadius: "12px", display: "flex", alignItems: "center", gap: "12px" }}>
            <AlertTriangle size={24} />
            <span style={{ fontWeight: "600" }}>{error}</span>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
                  <th style={{ textAlign: "left", padding: "1rem", color: "#64748b", fontWeight: "700" }}>Name</th>
                  <th style={{ textAlign: "left", padding: "1rem", color: "#64748b", fontWeight: "700" }}>Email</th>
                  <th style={{ textAlign: "left", padding: "1rem", color: "#64748b", fontWeight: "700" }}>Role</th>
                  <th style={{ textAlign: "right", padding: "1rem", color: "#64748b", fontWeight: "700" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "1.25rem 1rem", fontWeight: "700", color: "#0f172a" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#eff6ff", color: "#1d4ed8", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800" }}>
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <span>{user.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: "1.25rem 1rem", color: "#475569" }}>{user.email}</td>
                    <td style={{ padding: "1.25rem 1rem" }}>{getRoleBadge(user.role)}</td>
                    <td style={{ padding: "1.25rem 1rem", textAlign: "right" }}>
                      {user.role === "ROLE_APPLICANT" && (
                        <button 
                          className="btn-primary" 
                          style={{ padding: "8px 16px", fontSize: "0.85rem", opacity: promoting === user.id ? 0.7 : 1 }}
                          onClick={() => promoteToStaff(user.id)}
                          disabled={promoting === user.id}
                        >
                          {promoting === user.id ? "Promoting..." : "Promote to Staff"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>No users found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <style dangerouslySetInnerHTML={{__html: `@keyframes spin { 100% { transform: rotate(360deg); } }`}} />
    </div>
  );
}

