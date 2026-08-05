"use client";

import React, { useState } from "react";
import { usePermitContext } from "../../../../context/PermitContext";
import { FileText, MapPin, Upload, CheckCircle, ChevronRight, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

const STEPS = [
  { id: 1, title: "Permit Type", icon: FileText },
  { id: 2, title: "Project Details", icon: MapPin },
  { id: 3, title: "Requirements", icon: Upload },
  { id: 4, title: "Review", icon: CheckCircle }
];

export default function ApplyPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const { selectedPermitType, setSelectedPermitType, addApplication } = usePermitContext();
  const router = useRouter();

  const [projectName, setProjectName] = useState("");
  const [projectAddress, setProjectAddress] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadedFileUrl, setUploadedFileUrl] = useState("");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = localStorage.getItem("token");
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/upload`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload file");
      }

      const data = await response.json();
      setUploadedFileUrl(data.url);
    } catch (err: any) {
      setUploadError(err.message || "An error occurred during upload");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitApplication = () => {
    let applicantName = "Juan Dela Cruz";
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const userObj = JSON.parse(userStr);
        if (userObj.name) applicantName = userObj.name;
      }
    } catch (e) {}

    const newApp = {
      id: `APP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      projectName,
      permitType: selectedPermitType,
      status: "pending",
      dateSubmitted: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
      applicantName,
      fileUrl: uploadedFileUrl
    };

    addApplication(newApp);
    router.push("/applicant/dashboard");
  };

  return (
    <div className="wizard-page animate-fade-in-up">
      <header className="page-header">
        <h1 className="page-title">New Permit Application</h1>
        <p className="page-subtitle">Follow the steps below to securely file your application online.</p>
      </header>

      <div className="wizard-container glass-panel">
        <div className="wizard-sidebar">
          <ul className="step-list">
            {STEPS.map((step) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isPassed = currentStep > step.id;
              return (
                <li key={step.id} className={`step-item ${isActive ? "active" : ""} ${isPassed ? "passed" : ""}`}>
                  <div className="step-indicator">
                    {isPassed ? <CheckCircle size={16} /> : <span>{step.id}</span>}
                  </div>
                  <div className="step-content">
                    <span className="step-title">{step.title}</span>
                    {isActive && <span className="step-desc">In Progress</span>}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="wizard-content">
          {currentStep === 1 && (
            <div className="step-pane animate-fade-in-up">
              <h2>Select Permit Type</h2>
              <p>What type of permit are you applying for?</p>
              
              <div className="permit-options">
                {["building_permit", "locational_clearance", "occupancy_permit"].map(type => (
                  <label key={type} className={`permit-card ${selectedPermitType === type ? "selected" : ""}`}>
                    <input 
                      type="radio" 
                      name="permit_type" 
                      value={type} 
                      checked={selectedPermitType === type}
                      onChange={() => setSelectedPermitType(type as any)}
                    />
                    <div className="card-content">
                      <div className="card-icon"><FileText size={24} /></div>
                      <h3>{type.replace("_", " ")}</h3>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="step-pane animate-fade-in-up">
              <h2>Project Details</h2>
              <div className="form-grid">
                <div className="form-group">
                  <label>Project Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 2-Storey Residential" 
                    className="form-input" 
                    value={projectName}
                    onChange={e => setProjectName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Project Address</label>
                  <input 
                    type="text" 
                    placeholder="Lot No, Street, Barangay" 
                    className="form-input" 
                    value={projectAddress}
                    onChange={e => setProjectAddress(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="step-pane animate-fade-in-up">
              <h2>Upload Requirements</h2>
              <p>Please upload your requirements (PDF or Image). Files will be securely stored in the cloud.</p>
              
              <div className="upload-box" style={{ border: "2px dashed #cbd5e1", borderRadius: "12px", padding: "3rem", textAlign: "center", marginTop: "1.5rem", backgroundColor: "#f8fafc" }}>
                {uploading ? (
                  <div className="uploading-state">
                    <div className="spinner" style={{ width: "40px", height: "40px", border: "4px solid rgba(29, 78, 216, 0.2)", borderTopColor: "#1d4ed8", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 1rem auto" }}></div>
                    <p style={{ fontWeight: "600", color: "#475569" }}>Uploading securely to Google Drive...</p>
                  </div>
                ) : uploadedFileUrl ? (
                  <div className="success-state">
                    <CheckCircle size={48} color="#10b981" style={{ margin: "0 auto 1rem auto" }} />
                    <h3 style={{ color: "#0f172a", marginBottom: "0.5rem" }}>File Uploaded Successfully!</h3>
                    <a href={uploadedFileUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#2563eb", textDecoration: "underline" }}>View File in Google Drive</a>
                  </div>
                ) : (
                  <>
                    <Upload size={48} color="#94a3b8" style={{ margin: "0 auto 1rem auto" }} />
                    <h3 style={{ color: "#334155", marginBottom: "1rem" }}>Select a file to upload</h3>
                    <input 
                      type="file" 
                      id="file-upload" 
                      style={{ display: "none" }}
                      onChange={handleFileUpload}
                      accept=".pdf,.png,.jpg,.jpeg"
                    />
                    <label htmlFor="file-upload" className="btn-primary" style={{ cursor: "pointer", display: "inline-block" }}>
                      Choose File
                    </label>
                  </>
                )}
                {uploadError && <p style={{ color: "#ef4444", marginTop: "1rem" }}>{uploadError}</p>}
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="step-pane animate-fade-in-up">
              <h2>Review Your Application</h2>
              <div className="review-summary" style={{ background: "#f8fafc", padding: "2rem", borderRadius: "16px", marginTop: "1.5rem", border: "1px solid #e2e8f0" }}>
                <div style={{ marginBottom: "1rem", display: "flex", justifyContent: "space-between", borderBottom: "1px solid #e2e8f0", paddingBottom: "1rem" }}>
                  <span style={{ color: "#64748b", fontWeight: "600" }}>Permit Type:</span>
                  <span style={{ color: "#0f172a", fontWeight: "700", textTransform: "capitalize" }}>{selectedPermitType.replace("_", " ")}</span>
                </div>
                <div style={{ marginBottom: "1rem", display: "flex", justifyContent: "space-between", borderBottom: "1px solid #e2e8f0", paddingBottom: "1rem" }}>
                  <span style={{ color: "#64748b", fontWeight: "600" }}>Project Name:</span>
                  <span style={{ color: "#0f172a", fontWeight: "700" }}>{projectName || "Not provided"}</span>
                </div>
                <div style={{ marginBottom: "1rem", display: "flex", justifyContent: "space-between", borderBottom: "1px solid #e2e8f0", paddingBottom: "1rem" }}>
                  <span style={{ color: "#64748b", fontWeight: "600" }}>Project Address:</span>
                  <span style={{ color: "#0f172a", fontWeight: "700" }}>{projectAddress || "Not provided"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748b", fontWeight: "600" }}>Requirement:</span>
                  <span style={{ color: uploadedFileUrl ? "#10b981" : "#ef4444", fontWeight: "700" }}>
                    {uploadedFileUrl ? "Uploaded successfully" : "Missing file"}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="wizard-actions">
            {currentStep > 1 && (
              <button className="btn-outline" onClick={() => setCurrentStep(prev => prev - 1)} disabled={uploading}>
                <ChevronLeft size={18} /> Back
              </button>
            )}
            
            <div className="flex-spacer"></div>

            {currentStep < 4 ? (
              <button className="btn-primary" onClick={() => setCurrentStep(prev => prev + 1)} disabled={uploading || (currentStep === 2 && !projectName) || (currentStep === 3 && !uploadedFileUrl)}>
                Next Step <ChevronRight size={18} />
              </button>
            ) : (
              <button className="btn-primary" onClick={handleSubmitApplication}>
                Submit Application <CheckCircle size={18} />
              </button>
            )}
          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}} />

    </div>
  );
}
