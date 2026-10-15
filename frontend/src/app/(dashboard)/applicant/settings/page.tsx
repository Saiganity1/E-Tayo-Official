"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Camera, User, Mail, Phone, MapPin, Lock, CheckCircle2, 
  AlertCircle, Upload, Trash2, ShieldCheck, BellRing, Save, RefreshCw, Sparkles 
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

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
  const [testEmailLoading, setTestEmailLoading] = useState(false);
  const [testEmailStatus, setTestEmailStatus] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Preset avatar choices
  const PRESET_AVATARS = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80",
    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=250&q=80",
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&q=80",
  ];

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
        if (u.profileImage) {
          setProfileImage(u.profileImage);
          setPreviewImage(u.profileImage);
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
        const res = await fetch("/api/users/me", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.name) setName(data.name);
          if (data.email) setEmail(data.email);
          if (data.phone) setPhone(data.phone);
          if (data.address) setAddress(data.address);
          if (data.profileImage) {
            setProfileImage(data.profileImage);
            setPreviewImage(data.profileImage);
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
        await fetch("/api/users/profile", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            email,
            profileImage: imgUrl
          })
        });
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

  // Handle local file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMsg(language === "fil" ? "Mangyaring pumili ng larawan (PNG, JPG, JPEG, WEBP)." : "Please select a valid image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg(language === "fil" ? "Hindi dapat lalampas sa 5MB ang sukat ng larawan." : "Image size must not exceed 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setPreviewImage(base64);

      // Try uploading to backend /api/upload
      try {
        setUploadingImage(true);
        const formData = new FormData();
        formData.append("files", file);
        formData.append("permitType", "Profile");
        
        const token = localStorage.getItem("token");
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          const uploadedUrl = uploadData.urls?.[0] || base64;
          await saveProfileImage(uploadedUrl);
        } else {
          // Fallback to storing base64
          await saveProfileImage(base64);
        }
      } catch (err) {
        // Fallback to storing base64
        await saveProfileImage(base64);
      }
    };
    reader.readAsDataURL(file);
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
        const res = await fetch("/api/users/profile", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            email,
            name,
            phone,
            address,
            profileImage
          })
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to update profile on server");
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
    if (!newPassword || newPassword.length < 6) {
      setErrorMsg(language === "fil" ? "Dapat hindi bababa sa 6 na karakter ang bagong password." : "New password must be at least 6 characters.");
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

      const res = await fetch("/api/users/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          email,
          currentPassword,
          newPassword
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update password");
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

  // Test Email Notification trigger to verify status alert setup
  const handleSendTestEmail = async () => {
    if (!email) {
      setErrorMsg("No applicant email found");
      return;
    }

    setTestEmailLoading(true);
    setTestEmailStatus(null);
    setErrorMsg(null);

    try {
      const { sendApplicationStatusEmailDirect } = await import("@/app/api/permits/emailHelper");
      const sent = await sendApplicationStatusEmailDirect({
        toEmail: email,
        applicantName: name || "Applicant",
        applicationId: "APP-TEST-2026",
        permitType: "Locational Clearance & Building Permit",
        projectName: "Sample Evaluation Demonstration",
        projectAddress: "Poblacion, Sto. Tomas, Pampanga",
        oldStatus: "Pending",
        newStatus: "Under Evaluation",
        remarks: "This is a real test status email verifying that Paul and other applicants receive specific email notifications upon evaluation.",
        evaluatorName: "Engr. Evaluator (Municipal Building Official)"
      });

      if (sent) {
        setTestEmailStatus(language === "fil" 
          ? `Nagpadala ng test evaluation email sa ${email}! Pakisuri ang inyong Inbox / Spam folder.` 
          : `Test evaluation email sent to ${email}! Please check your Inbox / Spam folder.`);
      } else {
        setTestEmailStatus("Could not dispatch test email. Please ensure your email is valid.");
      }
    } catch (e: any) {
      setTestEmailStatus(e?.message || "Failed to dispatch test email");
    } finally {
      setTestEmailLoading(false);
      setTimeout(() => setTestEmailStatus(null), 7000);
    }
  };

  const avatarChar = (name || "Applicant").charAt(0).toUpperCase();

  return (
    <div style={{ padding: "1.5rem", maxWidth: "960px", margin: "0 auto" }}>
      {/* Page Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <span>{t("Settings", "Account Settings & Profile")}</span>
        </h1>
        <p style={{ color: "#64748b", marginTop: "0.35rem", fontSize: "0.95rem" }}>
          {language === "fil"
            ? "Pamahalaan ang inyong impormasyon, palitan ang inyong Profile Image, at suriin ang inyong automated email status notifications."
            : "Manage your personal information, update your profile image, and review automated email status alerts."}
        </p>
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
                  ? "Pumili ng bagong larawan mula sa inyong device o pumili sa mga available na preset." 
                  : "Upload a custom photo from your device or select from official avatars."}
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

              {/* Quick Preset Avatars */}
              <div style={{ marginTop: "1rem" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  {language === "fil" ? "O Pumili ng Preset Avatar:" : "Or Choose Preset Avatar:"}
                </span>
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
                  {PRESET_AVATARS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => saveProfileImage(preset)}
                      disabled={uploadingImage}
                      style={{
                        width: "38px", height: "38px", borderRadius: "10px", overflow: "hidden",
                        border: previewImage === preset ? "2px solid #0038A8" : "1px solid #cbd5e1",
                        padding: 0, cursor: "pointer", background: "none"
                      }}
                      title={`Pumili ng Preset ${idx + 1}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={preset} alt={`Preset ${idx}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. AUTOMATED EMAIL NOTIFICATIONS STATUS CARD */}
        {/* ========================================================================= */}
        <div style={{
          background: "linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)", borderRadius: "12px",
          border: "1px solid #bbf7d0", padding: "1.75rem", boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <BellRing size={22} color="#16a34a" />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#166534", margin: 0 }}>
                    {language === "fil" ? "Automated Email Status Updates" : "Automated Email Status Updates"}
                  </h3>
                  <span style={{ background: "#22c55e", color: "#ffffff", fontSize: "0.68rem", fontWeight: 800, padding: "2px 8px", borderRadius: "9999px" }}>
                    ACTIVE
                  </span>
                </div>
                <p style={{ fontSize: "0.82rem", color: "#15803d", margin: "0.25rem 0 0 0" }}>
                  {language === "fil"
                    ? `Nakatakdang mag-email sa: ${email || "Inyong Rehistradong Email"}`
                    : `Configured to notify: ${email || "Your Registered Email"}`}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSendTestEmail}
              disabled={testEmailLoading}
              style={{
                background: "#ffffff", border: "1px solid #86efac", color: "#15803d",
                padding: "0.55rem 1rem", borderRadius: "8px", fontWeight: 700, fontSize: "0.82rem",
                display: "flex", alignItems: "center", gap: "0.45rem", cursor: "pointer",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
              }}
              title="Magpadala ng sample evaluation update email"
            >
              {testEmailLoading ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
              <span>{testEmailLoading ? "Ipinapadala..." : (language === "fil" ? "Subukan ang Email Alert" : "Send Test Alert Email")}</span>
            </button>
          </div>

          <div style={{ marginTop: "1rem", background: "#ffffff", padding: "1rem", borderRadius: "8px", border: "1px solid #dcfce7", fontSize: "0.84rem", color: "#334155", lineHeight: 1.55 }}>
            <p style={{ margin: "0 0 0.5rem 0" }}>
              <b>{language === "fil" ? "Paano ito gumagana?" : "How does this work?"}</b>
            </p>
            <p style={{ margin: 0 }}>
              {language === "fil"
                ? "Sa bawat pagkilos ng evaluator o administrator (tulad ng pagbabago mula Pending patungong Under Evaluation, For Payment, o Approved), awtomatikong magpapadala ang e-Tayo ng detalyadong email na naglalaman ng inyong Application ID, Permit Classification, Pangalan ng Proyekto, at Opisyal na Remarks ng Evaluator."
                : "Whenever an evaluator or administrator acts on your permit (e.g. status changes from Pending to Under Evaluation, For Payment, or Approved), e-Tayo immediately dispatches an official email containing your Reference ID, Permit Type, Project Title, and Evaluator Remarks."}
            </p>
          </div>

          {testEmailStatus && (
            <div style={{ marginTop: "0.75rem", padding: "0.6rem 0.9rem", background: "#dcfce7", borderRadius: "6px", color: "#166534", fontSize: "0.85rem", fontWeight: 600 }}>
              {testEmailStatus}
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* 3. PERSONAL INFORMATION FORM */}
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
                placeholder="Minimum 6 characters"
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
