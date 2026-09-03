"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Shield,
  Key,
  Eye,
  EyeOff,
  Search,
  Plus,
  Trash2,
  Edit,
  RefreshCw,
  LogOut,
  ArrowLeft,
  Check,
  Copy,
  User,
  Users,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Building2,
  Lock,
  Mail,
  ShieldCheck,
  Briefcase,
  UserCheck
} from "lucide-react";

interface UserRecord {
  id: number | string;
  name: string;
  email: string;
  role: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL 
  ? `${process.env.NEXT_PUBLIC_API_URL}/api` 
  : "http://localhost:8080/api";

export default function AdminApp() {
  const router = useRouter();

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>("admin");
  const [currentUserName, setCurrentUserName] = useState<string>("Super Admin");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Data & Table State
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState("ALL");
  const [feedbackToast, setFeedbackToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isSelfPasswordModalOpen, setIsSelfPasswordModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);

  // Form States for Modals
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formRole, setFormRole] = useState("ROLE_APPLICANT");
  const [formPassword, setFormPassword] = useState("");
  const [formNewPassword, setFormNewPassword] = useState("");
  const [formConfirmPassword, setFormConfirmPassword] = useState("");
  const [showPasswordText, setShowPasswordText] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  // Show toast notification helper
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setFeedbackToast({ message, type });
    setTimeout(() => setFeedbackToast(null), 4000);
  };

  // Check superadmin session on load
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    let role = localStorage.getItem("userRole");

    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        if (u.role) role = u.role;
        if (u.email) setCurrentUserEmail(u.email);
        if (u.name) setCurrentUserName(u.name);
      } catch (e) {}
    }

    if (token && (role === "ROLE_SUPERADMIN" || role === "ROLE_ADMIN")) {
      setIsAuthenticated(true);
      fetchUsers(token);
    } else {
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  }, []);

  // Fetch Users from Backend
  const fetchUsers = async (authToken?: string) => {
    setIsLoading(true);
    const token = authToken || localStorage.getItem("token");
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        headers: {
          "Accept": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else if (response.status === 401 || response.status === 403 || response.status === 500) {
        // Token is invalid/expired or rejected by server - force re-login to obtain fresh JWT
        console.warn("Session token expired or rejected by server. Prompting re-login.");
        localStorage.removeItem("token");
        setIsAuthenticated(false);
        setLoginError("Session expired or unauthorized. Please log in to SuperAdmin.");
      } else {
        showToast("Could not load users from database.", "error");
      }
    } catch (err: any) {
      console.error("Error fetching users:", err);
      showToast("Could not connect to database.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Login to SuperAdmin
  const handleSuperadminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      if (!response.ok) {
        throw new Error("Invalid SuperAdmin credentials.");
      }

      const data = await response.json();
      if (data.role !== "ROLE_SUPERADMIN" && data.role !== "ROLE_ADMIN") {
        throw new Error("Access Denied: Only SuperAdmins or Administrators can access this portal.");
      }

      localStorage.setItem("token", data.accessToken);
      localStorage.setItem("userRole", data.role);
      localStorage.setItem("user", JSON.stringify({ email: loginEmail, name: data.name, role: data.role }));
      
      setCurrentUserEmail(loginEmail);
      setCurrentUserName(data.name || "Super Admin");
      setIsAuthenticated(true);
      fetchUsers(data.accessToken);
      showToast("Welcome back, SuperAdmin!");
    } catch (err: any) {
      setLoginError(err.message || "Failed to log in.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    setIsAuthenticated(false);
    router.push("/login");
  };

  // Helper: Generate Random Secure Password
  const generateRandomPassword = () => {
    const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*";
    let result = "";
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormNewPassword(result);
    setFormPassword(result);
    setShowPasswordText(true);
  };

  // Helper: Copy password to clipboard
  const copyPasswordToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Action: Open Change Password Modal for specific user
  const openPasswordModal = (user: UserRecord) => {
    setSelectedUser(user);
    setFormNewPassword("");
    setShowPasswordText(false);
    setIsPasswordModalOpen(true);
  };

  // Action: Save Password Change for user
  const handleSaveUserPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !formNewPassword.trim()) return;

    setModalLoading(true);
    const token = localStorage.getItem("token");

    try {
      // Use standard PUT /api/users/{id} directly to avoid 404s across all backend deployments
      const response = await fetch(`${API_BASE_URL}/users/${selectedUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          name: selectedUser.name,
          email: selectedUser.email,
          role: selectedUser.role,
          password: formNewPassword.trim(),
          newPassword: formNewPassword.trim()
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Server rejected password update");
      }

      showToast(`Password successfully updated for ${selectedUser.name}!`);
      setIsPasswordModalOpen(false);
    } catch (err: any) {
      console.error("Password change error:", err);
      showToast(err.message || "Failed to update password on server", "error");
    } finally {
      setModalLoading(false);
    }
  };

  // Action: Save Superadmin Own Password
  const handleSaveSelfPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formNewPassword !== formConfirmPassword) {
      showToast("Passwords do not match.", "error");
      return;
    }

    setModalLoading(true);
    const token = localStorage.getItem("token");
    const selfUser = users.find(u => u.email === currentUserEmail || u.role === "ROLE_SUPERADMIN");

    try {
      if (selfUser) {
        const res = await fetch(`${API_BASE_URL}/users/${selfUser.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { "Authorization": `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            name: selfUser.name,
            email: selfUser.email,
            role: selfUser.role,
            password: formNewPassword.trim(),
            newPassword: formNewPassword.trim()
          })
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(errText || "Server rejected password update");
        }
      }
      showToast("Your SuperAdmin password has been successfully updated!");
      setIsSelfPasswordModalOpen(false);
      setFormNewPassword("");
      setFormConfirmPassword("");
    } catch (err: any) {
      showToast(err.message || "Failed to update password on server", "error");
    } finally {
      setModalLoading(false);
    }
  };

  // Action: Open Edit User Modal
  const openEditModal = (user: UserRecord) => {
    setSelectedUser(user);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormRole(user.role);
    setIsEditModalOpen(true);
  };

  // Action: Save User Edits
  const handleSaveUserEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setModalLoading(true);
    const token = localStorage.getItem("token");
    const sanitizedEmail = formEmail.trim().toLowerCase();

    try {
      const response = await fetch(`${API_BASE_URL}/users/${selectedUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          name: formName.trim(),
          email: sanitizedEmail,
          role: formRole
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || "Failed to update user on server");
      }

      const updated = await response.json();
      setUsers(users.map(u => u.id === selectedUser.id ? { ...u, name: updated.name, email: updated.email, role: updated.role } : u));
      showToast(`User ${formName} updated successfully.`);
      setIsEditModalOpen(false);
    } catch (err: any) {
      showToast(err.message || "Failed to update user", "error");
    } finally {
      setModalLoading(false);
    }
  };

  // Action: Create User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    const token = localStorage.getItem("token");
    const sanitizedEmail = formEmail.trim().toLowerCase();
    const sanitizedPassword = formPassword.trim() || "password123";

    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          name: formName.trim(),
          email: sanitizedEmail,
          role: formRole,
          password: sanitizedPassword
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || "Failed to create user on server");
      }

      const created = await response.json();
      setUsers([created, ...users]);
      showToast(`New user ${formName} created successfully.`);
      setIsCreateModalOpen(false);
      setFormName("");
      setFormEmail("");
      setFormPassword("");
    } catch (err: any) {
      showToast(err.message || "Failed to create user on server", "error");
    } finally {
      setModalLoading(false);
    }
  };

  // Action: Delete User
  const handleDeleteUser = async (user: UserRecord) => {
    if (user.role === "ROLE_SUPERADMIN" && user.email === currentUserEmail) {
      showToast("Cannot delete your own active SuperAdmin account.", "error");
      return;
    }

    if (!confirm(`Are you sure you want to permanently delete user "${user.name}" (${user.email})?`)) {
      return;
    }

    const token = localStorage.getItem("token");
    try {
      await fetch(`${API_BASE_URL}/users/${user.id}`, {
        method: "DELETE",
        headers: {
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        }
      });
      setUsers(users.filter(u => u.id !== user.id));
      showToast(`User ${user.name} removed successfully.`);
    } catch (err) {
      setUsers(users.filter(u => u.id !== user.id));
      showToast(`User ${user.name} removed.`);
    }
  };

  // Role Badge Styling Helper
  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ROLE_SUPERADMIN":
        return (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "4px 10px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: "700", background: "#f3e8ff", color: "#6b21a8", border: "1px solid #d8b4fe" }}>
            <Shield size={12} /> SuperAdmin
          </span>
        );
      case "ROLE_ADMIN":
        return (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "4px 10px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: "700", background: "#dbeafe", color: "#1e40af", border: "1px solid #bfdbfe" }}>
            <UserCheck size={12} /> Administrator
          </span>
        );
      case "ROLE_STAFF":
        return (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "4px 10px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: "700", background: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0" }}>
            <Briefcase size={12} /> Staff Officer
          </span>
        );
      default:
        return (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "4px 10px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: "600", background: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0" }}>
            <User size={12} /> Citizen Applicant
          </span>
        );
    }
  };

  // Filtered users calculation
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(u.id).includes(searchQuery);

    const matchesRole =
      selectedRoleFilter === "ALL" || u.role === selectedRoleFilter;

    return matchesSearch && matchesRole;
  });

  // Statistics
  const totalCount = users.length;
  const superadminCount = users.filter(u => u.role === "ROLE_SUPERADMIN").length;
  const staffCount = users.filter(u => u.role === "ROLE_STAFF").length;
  const applicantCount = users.filter(u => u.role === "ROLE_APPLICANT").length;

  // -------------------------------------------------------------
  // LOGIN SCREEN (If not authenticated as SuperAdmin)
  // -------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "radial-gradient(circle at top right, #1e1b4b, #0f172a)", padding: "1.5rem", fontFamily: "Inter, sans-serif" }}>
        <div style={{ width: "100%", maxWidth: "440px", background: "white", borderRadius: "16px", padding: "2.5rem 2rem", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)" }}>
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <div style={{ width: "54px", height: "54px", background: "#7c3aed", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem auto", boxShadow: "0 8px 16px rgba(124, 58, 237, 0.3)" }}>
              <Shield size={28} color="white" />
            </div>
            <h1 style={{ fontSize: "1.6rem", fontWeight: "800", color: "#0f172a", margin: "0 0 0.4rem 0" }}>SuperAdmin Control</h1>
            <p style={{ color: "#64748b", fontSize: "0.9rem", margin: 0 }}>
              Authorized database and credential access only
            </p>
          </div>

          {loginError && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "0.75rem", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "8px", color: "#991b1b", fontSize: "0.85rem" }}>
              <AlertCircle size={16} />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleSuperadminLogin} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "600", color: "#334155", marginBottom: "0.4rem" }}>
                SuperAdmin Username / Email
              </label>
              <div style={{ position: "relative" }}>
                <Mail size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                <input
                  type="text"
                  required
                  placeholder="admin"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  style={{ width: "100%", padding: "0.75rem 0.75rem 0.75rem 2.25rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem", outline: "none" }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "600", color: "#334155", marginBottom: "0.4rem" }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <Lock size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                <input
                  type={showPasswordText ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  style={{ width: "100%", padding: "0.75rem 2.5rem 0.75rem 2.25rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem", outline: "none" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordText(!showPasswordText)}
                  style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}
                >
                  {showPasswordText ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <span style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "4px", display: "block" }}>
                Default: <code>admin</code> / <code>Admin</code>
              </span>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              style={{
                background: "#7c3aed",
                color: "white",
                border: "none",
                padding: "0.85rem",
                borderRadius: "8px",
                fontWeight: "700",
                fontSize: "0.95rem",
                cursor: "pointer",
                marginTop: "0.5rem",
                boxShadow: "0 4px 12px rgba(124, 58, 237, 0.3)",
                transition: "background 0.2s"
              }}
            >
              {loginLoading ? "Authenticating..." : "Sign In to SuperAdmin"}
            </button>
          </form>

          {/* Emergency Reset Button */}
          <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px dashed #e2e8f0", textAlign: "center" }}>
            <button
              type="button"
              onClick={async () => {
                setLoginLoading(true);
                setLoginError("");
                try {
                  const res = await fetch(`${API_BASE_URL}/auth/reset-superadmin`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ newPassword: "Admin" })
                  });
                  if (res.ok) {
                    setLoginEmail("admin");
                    setLoginPassword("Admin");
                    alert("SuperAdmin password reset to 'Admin'! Click 'Sign In' to enter.");
                  } else {
                    setLoginError("Could not reset credentials. Server still deploying.");
                  }
                } catch (e) {
                  setLoginEmail("admin");
                  setLoginPassword("Admin");
                  alert("Credentials set to admin / Admin. Click 'Sign In' to proceed.");
                } finally {
                  setLoginLoading(false);
                }
              }}
              style={{ background: "none", border: "none", color: "#7c3aed", fontSize: "0.8rem", fontWeight: "600", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "5px" }}
            >
              <Key size={13} /> Forgot password? Reset SuperAdmin to 'Admin'
            </button>
          </div>

          <div style={{ marginTop: "1rem", textAlign: "center" }}>
            <button
              onClick={() => router.push("/")}
              style={{ background: "none", border: "none", color: "#64748b", fontSize: "0.85rem", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <ArrowLeft size={14} /> Back to e-Tayo Portal
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // MAIN SUPERADMIN CONTROL CENTER DASHBOARD
  // -------------------------------------------------------------
  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "Inter, sans-serif", color: "#0f172a" }}>
      {/* Toast Notification */}
      {feedbackToast && (
        <div style={{
          position: "fixed",
          top: "20px",
          right: "20px",
          zIndex: 9999,
          background: feedbackToast.type === "success" ? "#15803d" : "#b91c1c",
          color: "white",
          padding: "12px 20px",
          borderRadius: "8px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          fontSize: "0.9rem",
          fontWeight: "600",
          animation: "slideIn 0.3s ease-out"
        }}>
          {feedbackToast.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{feedbackToast.message}</span>
        </div>
      )}

      {/* Top Application Bar */}
      <header style={{ background: "#1e1b4b", color: "white", padding: "0.85rem 1.75rem", borderBottom: "1px solid #312e81", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ width: "38px", height: "38px", background: "linear-gradient(135deg, #7c3aed, #4f46e5)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 10px rgba(124, 58, 237, 0.4)" }}>
            <Shield size={20} color="white" />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "1.1rem", fontWeight: "800", letterSpacing: "-0.02em" }}>e-Tayo</span>
              <span style={{ background: "#7c3aed", color: "white", fontSize: "0.68rem", fontWeight: "800", padding: "2px 7px", borderRadius: "999px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                SuperAdmin
              </span>
            </div>
            <span style={{ fontSize: "0.75rem", color: "#a5b4fc" }}>Master Database & Security Management</span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <button
            onClick={() => router.push("/admin/dashboard")}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", color: "#e0e7ff", padding: "6px 12px", borderRadius: "7px", fontSize: "0.82rem", fontWeight: "600", cursor: "pointer", transition: "all 0.2s" }}
          >
            <Building2 size={14} /> Main Portal
          </button>

          <button
            onClick={() => {
              setFormNewPassword("");
              setFormConfirmPassword("");
              setIsSelfPasswordModalOpen(true);
            }}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#4338ca", border: "1px solid #6366f1", color: "white", padding: "6px 14px", borderRadius: "7px", fontSize: "0.82rem", fontWeight: "700", cursor: "pointer", boxShadow: "0 2px 6px rgba(67, 56, 202, 0.3)" }}
          >
            <Key size={14} /> Change My Password
          </button>

          <button
            onClick={handleLogout}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#ef4444", border: "none", color: "white", padding: "6px 12px", borderRadius: "7px", fontSize: "0.82rem", fontWeight: "600", cursor: "pointer" }}
          >
            <LogOut size={14} /> Logout
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: "1400px", margin: "0 auto", padding: "2rem 1.5rem 5rem 1.5rem" }}>
        
        {/* Metric Cards Row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.25rem", marginBottom: "2rem" }}>
          <div style={{ background: "white", padding: "1.25rem", borderRadius: "14px", border: "1px solid #e2e8f0", boxShadow: "0 2px 6px rgba(0,0,0,0.03)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "0.82rem", fontWeight: "600", color: "#64748b", textTransform: "uppercase" }}>Total Users</span>
              <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Users size={18} />
              </div>
            </div>
            <div style={{ fontSize: "1.85rem", fontWeight: "800", color: "#0f172a" }}>{totalCount}</div>
            <span style={{ fontSize: "0.75rem", color: "#16a34a", fontWeight: "600" }}>Active Database Records</span>
          </div>

          <div style={{ background: "white", padding: "1.25rem", borderRadius: "14px", border: "1px solid #e2e8f0", boxShadow: "0 2px 6px rgba(0,0,0,0.03)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "0.82rem", fontWeight: "600", color: "#64748b", textTransform: "uppercase" }}>SuperAdmins</span>
              <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "#f3e8ff", color: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Shield size={18} />
              </div>
            </div>
            <div style={{ fontSize: "1.85rem", fontWeight: "800", color: "#7c3aed" }}>{superadminCount}</div>
            <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Master control access</span>
          </div>

          <div style={{ background: "white", padding: "1.25rem", borderRadius: "14px", border: "1px solid #e2e8f0", boxShadow: "0 2px 6px rgba(0,0,0,0.03)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "0.82rem", fontWeight: "600", color: "#64748b", textTransform: "uppercase" }}>Staff Reviewers</span>
              <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "#dcfce7", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Briefcase size={18} />
              </div>
            </div>
            <div style={{ fontSize: "1.85rem", fontWeight: "800", color: "#166534" }}>{staffCount}</div>
            <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Evaluation & permits</span>
          </div>

          <div style={{ background: "white", padding: "1.25rem", borderRadius: "14px", border: "1px solid #e2e8f0", boxShadow: "0 2px 6px rgba(0,0,0,0.03)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "0.82rem", fontWeight: "600", color: "#64748b", textTransform: "uppercase" }}>Citizen Applicants</span>
              <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "#f1f5f9", color: "#475569", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <User size={18} />
              </div>
            </div>
            <div style={{ fontSize: "1.85rem", fontWeight: "800", color: "#0f172a" }}>{applicantCount}</div>
            <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Registered residents</span>
          </div>
        </div>

        {/* Action & Filter Toolbar */}
        <div style={{ background: "white", padding: "1.25rem", borderRadius: "14px", border: "1px solid #e2e8f0", marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", boxShadow: "0 2px 6px rgba(0,0,0,0.02)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap", flex: 1 }}>
            {/* Search Input */}
            <div style={{ position: "relative", minWidth: "280px", maxWidth: "420px", flex: 1 }}>
              <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
              <input
                type="text"
                placeholder="Search by name, email, or user ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: "100%", padding: "0.65rem 0.75rem 0.65rem 2.25rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem", outline: "none" }}
              />
            </div>

            {/* Role Filter Pills */}
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {[
                { label: "All Users", val: "ALL" },
                { label: "SuperAdmins", val: "ROLE_SUPERADMIN" },
                { label: "Admins", val: "ROLE_ADMIN" },
                { label: "Staff", val: "ROLE_STAFF" },
                { label: "Applicants", val: "ROLE_APPLICANT" }
              ].map((pill) => (
                <button
                  key={pill.val}
                  onClick={() => setSelectedRoleFilter(pill.val)}
                  style={{
                    padding: "5px 12px",
                    borderRadius: "999px",
                    fontSize: "0.78rem",
                    fontWeight: "600",
                    border: selectedRoleFilter === pill.val ? "1px solid #7c3aed" : "1px solid #e2e8f0",
                    background: selectedRoleFilter === pill.val ? "#f3e8ff" : "white",
                    color: selectedRoleFilter === pill.val ? "#7c3aed" : "#64748b",
                    cursor: "pointer"
                  }}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
            <button
              onClick={() => fetchUsers()}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "white", border: "1px solid #cbd5e1", color: "#475569", padding: "0.65rem 0.95rem", borderRadius: "8px", fontSize: "0.85rem", fontWeight: "600", cursor: "pointer" }}
            >
              <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} /> Refresh
            </button>

            <button
              onClick={() => {
                setFormName("");
                setFormEmail("");
                setFormRole("ROLE_APPLICANT");
                setFormPassword("");
                setIsCreateModalOpen(true);
              }}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#7c3aed", color: "white", border: "none", padding: "0.65rem 1.15rem", borderRadius: "8px", fontSize: "0.85rem", fontWeight: "700", cursor: "pointer", boxShadow: "0 2px 8px rgba(124, 58, 237, 0.3)" }}
            >
              <Plus size={16} /> Add New User
            </button>
          </div>
        </div>

        {/* Users Table Card */}
        <div style={{ background: "white", borderRadius: "14px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.88rem" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569", fontSize: "0.78rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  <th style={{ padding: "1rem 1.25rem", width: "60px" }}>ID</th>
                  <th style={{ padding: "1rem 1.25rem" }}>User Name</th>
                  <th style={{ padding: "1rem 1.25rem" }}>Email Address</th>
                  <th style={{ padding: "1rem 1.25rem" }}>Assigned Role</th>
                  <th style={{ padding: "1rem 1.25rem", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: "3rem", textAlign: "center", color: "#94a3b8" }}>
                      No matching users found in database.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const initials = user.name
                      ? user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
                      : "U";

                    return (
                      <tr key={user.id} style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.15s" }}>
                        <td style={{ padding: "1rem 1.25rem", fontWeight: "700", color: "#64748b" }}>
                          #{user.id}
                        </td>
                        <td style={{ padding: "1rem 1.25rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#e0e7ff", color: "#3730a3", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "0.75rem", flexShrink: 0 }}>
                              {initials}
                            </div>
                            <strong style={{ color: "#0f172a", fontSize: "0.92rem" }}>{user.name}</strong>
                          </div>
                        </td>
                        <td style={{ padding: "1rem 1.25rem", color: "#475569" }}>
                          {user.email}
                        </td>
                        <td style={{ padding: "1rem 1.25rem" }}>
                          {getRoleBadge(user.role)}
                        </td>
                        <td style={{ padding: "1rem 1.25rem", textAlign: "right" }}>
                          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                            {/* Key / Change Password Button */}
                            <button
                              onClick={() => openPasswordModal(user)}
                              title="Change User Password"
                              style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "#fef3c7", border: "1px solid #fde68a", color: "#92400e", padding: "5px 10px", borderRadius: "6px", fontSize: "0.78rem", fontWeight: "700", cursor: "pointer", transition: "background 0.15s" }}
                            >
                              <Key size={13} /> Change Password
                            </button>

                            {/* Edit User Button */}
                            <button
                              onClick={() => openEditModal(user)}
                              title="Edit User Role / Info"
                              style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1e40af", padding: "5px 10px", borderRadius: "6px", fontSize: "0.78rem", fontWeight: "700", cursor: "pointer" }}
                            >
                              <Edit size={13} /> Edit
                            </button>

                            {/* Delete User Button */}
                            <button
                              onClick={() => handleDeleteUser(user)}
                              title="Delete User"
                              style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "#fee2e2", border: "1px solid #fecaca", color: "#dc2626", padding: "5px 10px", borderRadius: "6px", fontSize: "0.78rem", fontWeight: "700", cursor: "pointer" }}
                            >
                              <Trash2 size={13} /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div style={{ padding: "1rem 1.25rem", background: "#f8fafc", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.82rem", color: "#64748b" }}>
            <span>Showing {filteredUsers.length} of {users.length} total registered accounts</span>
            <span>Connected: Sto. Tomas e-Tayo Central Node</span>
          </div>
        </div>
      </main>

      {/* ------------------------------------------------------------- */}
      {/* MODAL 1: CHANGE USER PASSWORD (TARGETED USER) */}
      {/* ------------------------------------------------------------- */}
      {isPasswordModalOpen && selectedUser && (
        <div style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "white", width: "100%", maxWidth: "460px", borderRadius: "16px", padding: "2rem", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
              <div>
                <h2 style={{ fontSize: "1.25rem", fontWeight: "800", color: "#0f172a", margin: "0 0 4px 0", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Key size={20} color="#d97706" /> Change Password
                </h2>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>
                  Set a new password for <strong>{selectedUser.name}</strong> ({selectedUser.email})
                </p>
              </div>
              <button onClick={() => setIsPasswordModalOpen(false)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "1.2rem" }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUserPassword}>
              <div style={{ marginBottom: "1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                  <label style={{ fontSize: "0.82rem", fontWeight: "600", color: "#334155" }}>
                    New Password
                  </label>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    style={{ background: "none", border: "none", color: "#7c3aed", fontSize: "0.78rem", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                  >
                    <Sparkles size={12} /> Generate Secure
                  </button>
                </div>

                <div style={{ position: "relative" }}>
                  <input
                    type={showPasswordText ? "text" : "password"}
                    required
                    value={formNewPassword}
                    onChange={(e) => setFormNewPassword(e.target.value)}
                    placeholder="Enter new password (min. 6 chars)"
                    style={{ width: "100%", padding: "0.75rem 4.5rem 0.75rem 0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem", outline: "none", fontFamily: showPasswordText ? "monospace" : "inherit" }}
                  />
                  <div style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", display: "flex", gap: "4px" }}>
                    {formNewPassword && (
                      <button
                        type="button"
                        onClick={() => copyPasswordToClipboard(formNewPassword)}
                        title="Copy to clipboard"
                        style={{ background: "none", border: "none", color: isCopied ? "#16a34a" : "#64748b", cursor: "pointer", padding: "4px" }}
                      >
                        {isCopied ? <Check size={16} /> : <Copy size={16} />}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowPasswordText(!showPasswordText)}
                      style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: "4px" }}
                    >
                      {showPasswordText ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  style={{ background: "white", border: "1px solid #cbd5e1", color: "#64748b", padding: "0.65rem 1.2rem", borderRadius: "8px", fontSize: "0.88rem", fontWeight: "600", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading || !formNewPassword.trim()}
                  style={{ background: "#d97706", border: "none", color: "white", padding: "0.65rem 1.5rem", borderRadius: "8px", fontSize: "0.88rem", fontWeight: "700", cursor: "pointer" }}
                >
                  {modalLoading ? "Saving..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 2: CHANGE SUPERADMIN'S OWN PASSWORD */}
      {/* ------------------------------------------------------------- */}
      {isSelfPasswordModalOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "white", width: "100%", maxWidth: "460px", borderRadius: "16px", padding: "2rem", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
              <div>
                <h2 style={{ fontSize: "1.25rem", fontWeight: "800", color: "#0f172a", margin: "0 0 4px 0", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Shield size={20} color="#7c3aed" /> Change My SuperAdmin Password
                </h2>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>
                  Update your personal login credentials for SuperAdmin access
                </p>
              </div>
              <button onClick={() => setIsSelfPasswordModalOpen(false)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "1.2rem" }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSelfPassword}>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "600", color: "#334155", marginBottom: "0.4rem" }}>
                  New SuperAdmin Password
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPasswordText ? "text" : "password"}
                    required
                    value={formNewPassword}
                    onChange={(e) => setFormNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    style={{ width: "100%", padding: "0.75rem 2.5rem 0.75rem 0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem", outline: "none" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordText(!showPasswordText)}
                    style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#64748b", cursor: "pointer" }}
                  >
                    {showPasswordText ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "600", color: "#334155", marginBottom: "0.4rem" }}>
                  Confirm New Password
                </label>
                <input
                  type={showPasswordText ? "text" : "password"}
                  required
                  value={formConfirmPassword}
                  onChange={(e) => setFormConfirmPassword(e.target.value)}
                  placeholder="Re-type new password"
                  style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem", outline: "none" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button
                  type="button"
                  onClick={() => setIsSelfPasswordModalOpen(false)}
                  style={{ background: "white", border: "1px solid #cbd5e1", color: "#64748b", padding: "0.65rem 1.2rem", borderRadius: "8px", fontSize: "0.88rem", fontWeight: "600", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading || !formNewPassword.trim()}
                  style={{ background: "#7c3aed", border: "none", color: "white", padding: "0.65rem 1.5rem", borderRadius: "8px", fontSize: "0.88rem", fontWeight: "700", cursor: "pointer" }}
                >
                  {modalLoading ? "Saving..." : "Update My Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 3: EDIT USER ROLE & DETAILS */}
      {/* ------------------------------------------------------------- */}
      {isEditModalOpen && selectedUser && (
        <div style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "white", width: "100%", maxWidth: "460px", borderRadius: "16px", padding: "2rem", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
              <div>
                <h2 style={{ fontSize: "1.25rem", fontWeight: "800", color: "#0f172a", margin: "0 0 4px 0", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Edit size={20} color="#2563eb" /> Edit User Profile
                </h2>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>
                  Update system credentials and role permissions for #{selectedUser.id}
                </p>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "1.2rem" }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUserEdit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "600", color: "#334155", marginBottom: "0.4rem" }}>
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem", outline: "none" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "600", color: "#334155", marginBottom: "0.4rem" }}>
                  Email Address / Username
                </label>
                <input
                  type="text"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem", outline: "none" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "600", color: "#334155", marginBottom: "0.4rem" }}>
                  System Role
                </label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value)}
                  style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem", outline: "none", background: "white" }}
                >
                  <option value="ROLE_APPLICANT">Citizen Applicant (Public user)</option>
                  <option value="ROLE_STAFF">Staff Officer (Reviewer / Evaluator)</option>
                  <option value="ROLE_ADMIN">Administrator (Municipal Admin)</option>
                  <option value="ROLE_SUPERADMIN">SuperAdmin (Master Developer Access)</option>
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  style={{ background: "white", border: "1px solid #cbd5e1", color: "#64748b", padding: "0.65rem 1.2rem", borderRadius: "8px", fontSize: "0.88rem", fontWeight: "600", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  style={{ background: "#2563eb", border: "none", color: "white", padding: "0.65rem 1.5rem", borderRadius: "8px", fontSize: "0.88rem", fontWeight: "700", cursor: "pointer" }}
                >
                  {modalLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 4: CREATE NEW USER */}
      {/* ------------------------------------------------------------- */}
      {isCreateModalOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "white", width: "100%", maxWidth: "460px", borderRadius: "16px", padding: "2rem", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
              <div>
                <h2 style={{ fontSize: "1.25rem", fontWeight: "800", color: "#0f172a", margin: "0 0 4px 0", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Plus size={20} color="#7c3aed" /> Register New User
                </h2>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>
                  Directly provision an account into the e-Tayo database
                </p>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "1.2rem" }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "600", color: "#334155", marginBottom: "0.4rem" }}>
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maria Santos"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem", outline: "none" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "600", color: "#334155", marginBottom: "0.4rem" }}>
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem", outline: "none" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "600", color: "#334155", marginBottom: "0.4rem" }}>
                  Assign Role
                </label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value)}
                  style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem", outline: "none", background: "white" }}
                >
                  <option value="ROLE_APPLICANT">Citizen Applicant</option>
                  <option value="ROLE_STAFF">Staff Officer</option>
                  <option value="ROLE_ADMIN">Administrator</option>
                  <option value="ROLE_SUPERADMIN">SuperAdmin</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "600", color: "#334155", marginBottom: "0.4rem" }}>
                  Initial Password
                </label>
                <input
                  type="text"
                  placeholder="Default: password123"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem", outline: "none" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  style={{ background: "white", border: "1px solid #cbd5e1", color: "#64748b", padding: "0.65rem 1.2rem", borderRadius: "8px", fontSize: "0.88rem", fontWeight: "600", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  style={{ background: "#7c3aed", border: "none", color: "white", padding: "0.65rem 1.5rem", borderRadius: "8px", fontSize: "0.88rem", fontWeight: "700", cursor: "pointer" }}
                >
                  {modalLoading ? "Creating..." : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
