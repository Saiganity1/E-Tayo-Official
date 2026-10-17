"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Camera, User, Mail, Phone, MapPin, Lock, CheckCircle2, 
  AlertCircle, Upload, Trash2, ShieldCheck, Save, RefreshCw, Settings 
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { getBackendApiUrl } from "@/utils/apiConfig";

function sanitizeProfileImage(url: string | null | undefined): string | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed || trimmed.toLowerCase().endsWith(".pdf") || trimmed.includes("UNIFIED-APPLICATION-FORM") || trimmed === "null" || trimmed === "undefined") {
    return null;
  }
  if (trimmed.startsWith("/api/files/")) {
    const rawApi = (process.env.NEXT_PUBLIC_API_URL || "https://e-tayo-official-by0b.onrender.com").replace(/\/+$/, "");
    return `${rawApi}${trimmed}`;
  }
  return trimmed;
}

const processImageToAvatarDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const rawBase64 = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const maxDim = 320;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(rawBase64);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.88));
      };
      img.onerror = () => resolve(rawBase64);
      img.src = rawBase64;
    };
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
};

export default function ApplicantSettingsPage() {
  const { language, t } = useLanguage();

  // User state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [role, setRole] = useState("ROLE_APPLICANT");

  // Passwords
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI status
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load existing profile from localStorage and backend
  useEffect(() => {
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const u = JSON.parse(userStr);
        setName(u.name || "");
        setEmail(u.email || "");
        setPhone(u.phone || "");
        setAddress(u.address || "");
        setRole(u.role || "ROLE_APPLICANT");
        const cleanImg = sanitizeProfileImage(u.profileImage);
        if (cleanImg) {
          setProfileImage(cleanImg);
          setPreviewImage(cleanImg);
        } else if (u.profileImage) {
          u.profileImage = null;
          localStorage.setItem("user", JSON.stringify(u));
          setProfileImage(null);
          setPreviewImage(null);
        }
      }
    } catch (e) {
      console.error(e);
    }

    // Try fetching latest data from backend /api/users/me
    const fetchLatestProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const apiBase = getBackendApiUrl();
        let res = await fetch(`${apiBase}/users/me`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => null);

        if (!res || !res.ok) {
          res = await fetch("/api/users/me", {
            headers: { Authorization: `Bearer ${token}` }
          }).catch(() => null);
        }

        if (res && res.ok) {
          const data = await res.json().catch(() => null);
          if (data) {
            if (data.name) setName(data.name);
            if (data.email) setEmail(data.email);
            if (data.phone) setPhone(data.phone);
            if (data.address) setAddress(data.address);
            if (data.profileImage) {
              const cleanImg = sanitizeProfileImage(data.profileImage);
              setProfileImage(cleanImg);
              setPreviewImage(cleanImg);
            }
          }
        }
      } catch (err) {
        // Fallback to local storage data silently
      }
    };

    fetchLatestProfile();
  }, []);

  // Update profile image state and persist
  const saveProfileImage = async (imgUrl: string | null) => {
    setUploadingImage(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      // 1. Update localStorage
      const userStr = localStorage.getItem("user");
      let currentUser = userStr ? JSON.parse(userStr) : {};
      currentUser.profileImage = imgUrl;
      localStorage.setItem("user", JSON.stringify(currentUser));

      // 2. Dispatch event so Sidebar avatar updates immediately
      window.dispatchEvent(new CustomEvent("etayo_user_updated"));

      setProfileImage(imgUrl);
      setPreviewImage(imgUrl);

      // 3. Persist to backend if token available
      const token = localStorage.getItem("token");
      if (token) {
        const apiBase = getBackendApiUrl();
        const payload = JSON.stringify({
          email,
          profileImage: imgUrl
        });

        let res = await fetch(`${apiBase}/users/profile`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: payload
        }).catch(() => null);

        if (!res || !res.ok) {
          await fetch("/api/users/profile", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: payload
          }).catch(() => null);
        }
      }

      setSuccessMsg(language === "fil" 
        ? "Matagumpay na napalitan ang inyong Profile Image!" 
        : "Profile image updated successfully!");
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to save profile picture");
    } finally {
      setUploadingImage(false);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  // Handle local file selection with client-side canvas optimization
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMsg(language === "fil" ? "Mangyaring pumili ng larawan (PNG, JPG, JPEG, WEBP)." : "Please select a valid image file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg(language === "fil" ? "Hindi dapat lalampas sa 10MB ang sukat ng larawan." : "Image size must not exceed 10MB.");
      return;
    }

    setUploadingImage(true);
    setErrorMsg(null);

    try {
      const optimizedAvatar = await processImageToAvatarDataUrl(file);
      if (!optimizedAvatar) {
        throw new Error(language === "fil" ? "Hindi ma-proseso ang larawan." : "Could not process selected image.");
      }

      setPreviewImage(optimizedAvatar);
      await saveProfileImage(optimizedAvatar);
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to save profile picture");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Save personal details form
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      // 1. Update localStorage
      const userStr = localStorage.getItem("user");
      let currentUser = userStr ? JSON.parse(userStr) : {};
      currentUser.name = name;
      currentUser.phone = phone;
      currentUser.address = address;
      localStorage.setItem("user", JSON.stringify(currentUser));

      // 2. Dispatch custom event for Sidebar name update
      window.dispatchEvent(new CustomEvent("etayo_user_updated"));

      // 3. Persist to backend
      const token = localStorage.getItem("token");
      if (token) {
        const apiBase = getBackendApiUrl();
        const payload = JSON.stringify({
          email,
          name,
          phone,
          address,
          profileImage
        });

        let res = await fetch(`${apiBase}/users/profile`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: payload
        }).catch(() => null);

        if (!res || !res.ok) {
          res = await fetch("/api/users/profile", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: payload
          }).catch(() => null);
        }
      }

      setSuccessMsg(language === "fil" 
        ? "Matagumpay na na-save ang inyong impormasyon!" 
        : "Profile details saved successfully!");
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to save profile details");
    } finally {
      setLoading(false);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  // Change password form
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      setErrorMsg(language === "fil" ? "Pakilagay ang kasalukuyang password." : "Please enter your current password.");
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      setErrorMsg(language === "fil" ? "Dapat hindi bababa sa 8 na karakter ang bagong password." : "New password must be at least 8 characters.");
      return;
    }
    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasDigit = /[0-9]/.test(newPassword);
    if (!hasUpper || !hasLower || !hasDigit) {
      setErrorMsg(language === "fil" 
        ? "Dapat may malaking titik (A-Z), maliit na titik (a-z), at numero (0-9) ang password." 
        : "Password must contain at least one uppercase letter, one lowercase letter, and one number.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg(language === "fil" ? "Hindi nagtutugma ang bagong password at kumpirmasyon." : "New password and confirmation do not match.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication required");

      const apiBase = getBackendApiUrl();
      const payload = JSON.stringify({
        email,
        currentPassword,
        newPassword
      });

      let res = await fetch(`${apiBase}/users/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: payload
      }).catch(() => null);

      if (!res || !res.ok) {
        res = await fetch("/api/users/profile", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: payload
        }).catch(() => null);
      }

      if (res && !res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to update password");
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccessMsg(language === "fil" ? "Matagumpay na napalitan ang inyong password!" : "Password successfully updated!");
    } catch (err: any) {
      setErrorMsg(err?.message || "Error updating password");
    } finally {
      setLoading(false);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  const avatarChar = (name || "Applicant").charAt(0).toUpperCase();

  return (
    <div style={{ padding: "1.5rem", maxWidth: "960px", margin: "0 auto" }}>
      {/* Page Header Card */}
      <div style={{
        background: "#ffffff",
        borderRadius: "14px",
        padding: "1.5rem 1.75rem",
        marginBottom: "1.75rem",
        border: "1px solid #e2e8f0",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "1rem"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{
            width: "48px",
            height: "48px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, #0038A8 0%, #1e40af 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ffffff",
            boxShadow: "0 4px 12px rgba(0, 56, 168, 0.2)",
            flexShrink: 0
          }}>
            <Settings size={26} />
          </div>
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0f172a", margin: 0, letterSpacing: "-0.01em" }}>
              {t("Settings", "Account Settings & Profile")}
            </h1>
            <p style={{ color: "#64748b", marginTop: "0.25rem", fontSize: "0.9rem", margin: 0 }}>
              {language === "fil"
                ? "Pamahalaan ang inyong impormasyon at palitan ang inyong Profile Image."
                : "Manage your personal information and update your profile image."}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{
            background: "#eff6ff",
            color: "#0038A8",
            fontSize: "0.78rem",
            fontWeight: 700,
            padding: "0.35rem 0.75rem",
            borderRadius: "9999px",
            border: "1px solid #bfdbfe",
            display: "flex",
            alignItems: "center",
            gap: "0.35rem"
          }}>
            <ShieldCheck size={14} />
            <span>{language === "fil" ? "Aplikante" : "Verified Applicant"}</span>
          </span>
        </div>
      </div>

      {/* Global Alerts */}
      {successMsg && (
        <div style={{
          display: "flex", alignItems: "center", gap: "0.75rem", background: "#ecfdf5", border: "1px solid #a7f3d0",
          color: "#065f46", padding: "0.9rem 1.2rem", borderRadius: "8px", marginBottom: "1.5rem", fontWeight: 600, fontSize: "0.95rem"
        }}>
          <CheckCircle2 size={20} color="#059669" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div style={{
          display: "flex", alignItems: "center", gap: "0.75rem", background: "#fef2f2", border: "1px solid #fecaca",
          color: "#991b1b", padding: "0.9rem 1.2rem", borderRadius: "8px", marginBottom: "1.5rem", fontWeight: 600, fontSize: "0.95rem"
        }}>
          <AlertCircle size={20} color="#dc2626" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.75rem" }}>
        
        {/* ========================================================================= */}
        {/* 1. PROFILE IMAGE SECTION (Primary user requirement) */}
        {/* ========================================================================= */}
        <div style={{
          background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0",
          padding: "1.75rem", boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "1rem" }}>
            <div>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Camera size={20} color="#0038A8" />
                <span>{language === "fil" ? "Larawan sa Profile (Profile Image)" : "Profile Image"}</span>
              </h2>
              <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "0.25rem 0 0 0" }}>
                {language === "fil" 
                  ? "Pumili ng bagong larawan mula sa inyong device." 
                  : "Upload a custom photo from your device."}
              </p>
            </div>
            {profileImage && (
              <button
                type="button"
                onClick={() => saveProfileImage(null)}
                style={{
                  background: "#fee2e2", border: "none", color: "#b91c1c", padding: "0.45rem 0.85rem",
                  borderRadius: "6px", fontSize: "0.8rem", fontWeight: 600, display: "flex", alignItems: "center",
                  gap: "0.35rem", cursor: "pointer"
                }}
                title="Tanggalin ang larawan"
              >
                <Trash2 size={14} />
                <span>{language === "fil" ? "Tanggalin" : "Remove"}</span>
              </button>
            )}
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "2rem" }}>
            {/* Avatar Preview */}
            <div style={{ position: "relative" }}>
              <div style={{
                width: "120px", height: "120px", borderRadius: "20px", overflow: "hidden",
                background: "linear-gradient(135deg, #0038A8, #021a4f)", display: "flex",
                alignItems: "center", justifyContent: "center", color: "#ffffff",
                fontSize: "2.75rem", fontWeight: 800, border: "4px solid #ffffff",
                boxShadow: "0 8px 20px rgba(0, 56, 168, 0.25)"
              }}>
                {previewImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={previewImage} 
                    alt="Preview" 
                    style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                    onError={() => {
                      setPreviewImage(null);
                      setProfileImage(null);
                    }}
                  />
                ) : (
                  avatarChar
                )}
              </div>

              {/* Upload badge button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                style={{
                  position: "absolute", bottom: "-6px", right: "-6px", width: "36px", height: "36px",
                  borderRadius: "50%", background: "#0038A8", color: "#ffffff", border: "2px solid #ffffff",
                  display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.2)"
                }}
                title="Pumili ng bagong larawan"
              >
                {uploadingImage ? <RefreshCw size={16} className="animate-spin" /> : <Upload size={16} />}
              </button>

              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/png,image/jpeg,image/jpg,image/webp" 
                style={{ display: "none" }} 
              />
            </div>

            {/* Actions & Instructions */}
            <div style={{ flex: 1, minWidth: "260px" }}>
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1rem" }}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  style={{
                    background: "#0038A8", color: "#ffffff", border: "none", padding: "0.65rem 1.25rem",
                    borderRadius: "8px", fontWeight: 700, fontSize: "0.88rem", display: "flex",
                    alignItems: "center", gap: "0.5rem", cursor: "pointer"
                  }}
                >
                  <Upload size={16} />
                  <span>{uploadingImage ? "Iniu-upload..." : (language === "fil" ? "Mag-upload ng Larawan" : "Upload New Photo")}</span>
                </button>
              </div>

              <p style={{ fontSize: "0.8rem", color: "#64748b", margin: 0, lineHeight: 1.5 }}>
                {language === "fil"
                  ? "Tumatanggap ng PNG, JPG, JPEG, o WEBP. Hanggang 5MB ang maximum na laki. Agad itong lilitaw sa inyong profile at sa sidebar navigation."
                  : "Supports PNG, JPG, JPEG, or WEBP up to 5MB. Automatically syncs with your sidebar and header profile."}
              </p>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. PERSONAL INFORMATION FORM */}
        {/* ========================================================================= */}
        <div style={{
          background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0",
          padding: "1.75rem", boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
        }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#0f172a", margin: "0 0 1.25rem 0", display: "flex", alignItems: "center", gap: "0.5rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "1rem" }}>
            <User size={20} color="#0038A8" />
            <span>{language === "fil" ? "Personal na Impormasyon" : "Personal Information"}</span>
          </h2>

          <form onSubmit={handleSaveProfile} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
            {/* Full Name */}
            <div style={{ gridColumn: "span 2" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: "0.35rem" }}>
                {language === "fil" ? "Buong Pangalan (Full Name)" : "Full Name"}
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  style={{
                    width: "100%", padding: "0.7rem 0.9rem 0.7rem 2.4rem", borderRadius: "8px",
                    border: "1px solid #cbd5e1", fontSize: "0.95rem", color: "#0f172a"
                  }}
                  placeholder="e.g. Paul Dela Cruz"
                />
                <User size={16} color="#94a3b8" style={{ position: "absolute", left: "0.85rem", top: "50%", transform: "translateY(-50%)" }} />
              </div>
            </div>

            {/* Email Address (Read-only reference) */}
            <div style={{ gridColumn: "span 1" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: "0.35rem" }}>
                {language === "fil" ? "Email Address" : "Email Address"}
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="email"
                  value={email}
                  disabled
                  style={{
                    width: "100%", padding: "0.7rem 0.9rem 0.7rem 2.4rem", borderRadius: "8px",
                    border: "1px solid #e2e8f0", fontSize: "0.95rem", color: "#64748b", background: "#f8fafc", cursor: "not-allowed"
                  }}
                />
                <Mail size={16} color="#94a3b8" style={{ position: "absolute", left: "0.85rem", top: "50%", transform: "translateY(-50%)" }} />
              </div>
              <small style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "0.2rem", display: "block" }}>
                {language === "fil" ? "Opisyal na email para sa system notifications." : "Primary email for receiving status notifications."}
              </small>
            </div>

            {/* Phone Number */}
            <div style={{ gridColumn: "span 1" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: "0.35rem" }}>
                {language === "fil" ? "Numero ng Telepono / Mobile" : "Phone / Mobile Number"}
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{
                    width: "100%", padding: "0.7rem 0.9rem 0.7rem 2.4rem", borderRadius: "8px",
                    border: "1px solid #cbd5e1", fontSize: "0.95rem", color: "#0f172a"
                  }}
                  placeholder="e.g. 0917 123 4567"
                />
                <Phone size={16} color="#94a3b8" style={{ position: "absolute", left: "0.85rem", top: "50%", transform: "translateY(-50%)" }} />
              </div>
            </div>

            {/* Address */}
            <div style={{ gridColumn: "span 2" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: "0.35rem" }}>
                {language === "fil" ? "Tirahan / Address sa Sto. Tomas" : "Resident / Project Address"}
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  style={{
                    width: "100%", padding: "0.7rem 0.9rem 0.7rem 2.4rem", borderRadius: "8px",
                    border: "1px solid #cbd5e1", fontSize: "0.95rem", color: "#0f172a"
                  }}
                  placeholder="e.g. Brgy. San Matias, Sto. Tomas, Pampanga"
                />
                <MapPin size={16} color="#94a3b8" style={{ position: "absolute", left: "0.85rem", top: "50%", transform: "translateY(-50%)" }} />
              </div>
            </div>

            {/* Save Button */}
            <div style={{ gridColumn: "span 2", display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  background: "#0038A8", color: "#ffffff", border: "none", padding: "0.75rem 1.75rem",
                  borderRadius: "8px", fontWeight: 700, fontSize: "0.92rem", display: "flex",
                  alignItems: "center", gap: "0.5rem", cursor: "pointer", boxShadow: "0 2px 6px rgba(0,56,168,0.2)"
                }}
              >
                <Save size={16} />
                <span>{loading ? "Inise-save..." : (language === "fil" ? "I-save ang Impormasyon" : "Save Changes")}</span>
              </button>
            </div>
          </form>
        </div>

        {/* ========================================================================= */}
        {/* 4. SECURITY & PASSWORD MANAGEMENT */}
        {/* ========================================================================= */}
        <div style={{
          background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0",
          padding: "1.75rem", boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
        }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#0f172a", margin: "0 0 1.25rem 0", display: "flex", alignItems: "center", gap: "0.5rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "1rem" }}>
            <Lock size={20} color="#0038A8" />
            <span>{language === "fil" ? "Seguridad at Password" : "Password & Security"}</span>
          </h2>

          <form onSubmit={handleChangePassword} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
            <div style={{ gridColumn: "span 2" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: "0.35rem" }}>
                {language === "fil" ? "Kasalukuyang Password" : "Current Password"}
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                style={{
                  width: "100%", padding: "0.7rem 0.9rem", borderRadius: "8px",
                  border: "1px solid #cbd5e1", fontSize: "0.95rem"
                }}
                placeholder="••••••••"
              />
            </div>

            <div style={{ gridColumn: "span 1" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: "0.35rem" }}>
                {language === "fil" ? "Bagong Password" : "New Password"}
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={{
                  width: "100%", padding: "0.7rem 0.9rem", borderRadius: "8px",
                  border: "1px solid #cbd5e1", fontSize: "0.95rem"
                }}
                placeholder="Minimum 8 characters (Upper, Lower, Number)"
              />
            </div>

            <div style={{ gridColumn: "span 1" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: "0.35rem" }}>
                {language === "fil" ? "Kumpirmahin ang Bagong Password" : "Confirm New Password"}
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{
                  width: "100%", padding: "0.7rem 0.9rem", borderRadius: "8px",
                  border: "1px solid #cbd5e1", fontSize: "0.95rem"
                }}
                placeholder="Re-enter new password"
              />
            </div>

            <div style={{ gridColumn: "span 2", display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
              <button
                type="submit"
                disabled={loading || !newPassword}
                style={{
                  background: "#0f172a", color: "#ffffff", border: "none", padding: "0.75rem 1.75rem",
                  borderRadius: "8px", fontWeight: 700, fontSize: "0.92rem", display: "flex",
                  alignItems: "center", gap: "0.5rem", cursor: newPassword ? "pointer" : "not-allowed",
                  opacity: newPassword ? 1 : 0.6
                }}
              >
                <ShieldCheck size={16} />
                <span>{loading ? "Ina-update..." : (language === "fil" ? "I-update ang Password" : "Update Password")}</span>
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
