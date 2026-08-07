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
  const [streetAddress, setStreetAddress] = useState("");
  const [barangay, setBarangay] = useState("San Bartolome");
  const [lotArea, setLotArea] = useState("");
  const [floorArea, setFloorArea] = useState("");
  const [projectCost, setProjectCost] = useState("");
  
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadedFileUrl, setUploadedFileUrl] = useState("");

  const projectAddress = `${streetAddress}, Brgy. ${barangay}, Sto. Tomas, Pampanga`;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadError("");

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }
    
    // Format "building_permit" to "Building Permit"
    const formattedPermitType = selectedPermitType.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    formData.append("permitType", formattedPermitType);

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
        throw new Error("Failed to upload files");
      }

      const data = await response.json();
      setUploadedFileUrl(data.urls.join(','));
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
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", marginTop: "1.5rem" }}>
                
                {/* Left Column: Basic Details & Location */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                  <div className="form-group">
                    <label style={{ fontWeight: "600", color: "#334155", marginBottom: "0.5rem", display: "block" }}>Project Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 2-Storey Residential" 
                      className="form-input" 
                      value={projectName}
                      onChange={e => setProjectName(e.target.value)}
                      style={{ width: "100%", padding: "0.75rem", borderRadius: "10px", border: "1px solid #cbd5e1" }}
                    />
                  </div>

                  <div>
                    <h3 style={{ fontSize: "1.1rem", color: "#0f172a", marginBottom: "1rem", borderBottom: "1px solid #e2e8f0", paddingBottom: "0.5rem" }}>Location (Sto. Tomas Only)</h3>
                    
                    <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label style={{ fontWeight: "600", color: "#334155", marginBottom: "0.5rem", display: "block", fontSize: "0.9rem" }}>Barangay</label>
                        <select 
                          className="form-input" 
                          value={barangay}
                          onChange={e => setBarangay(e.target.value)}
                          style={{ width: "100%", padding: "0.75rem", borderRadius: "10px", border: "1px solid #cbd5e1", background: "white" }}
                        >
                          <option value="San Bartolome">San Bartolome</option>
                          <option value="San Vicente">San Vicente</option>
                          <option value="San Matias">San Matias</option>
                          <option value="Poblacion">Poblacion</option>
                          <option value="Santo Rosario">Santo Rosario</option>
                          <option value="Sapa (Santo Niño)">Sapa (Santo Niño)</option>
                          <option value="Moras De La Paz">Moras De La Paz</option>
                        </select>
                      </div>
                      
                      <div className="form-group" style={{ flex: 1 }}>
                        <label style={{ fontWeight: "600", color: "#334155", marginBottom: "0.5rem", display: "block", fontSize: "0.9rem" }}>Street / Lot No.</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Lot 12, Block 3" 
                          className="form-input" 
                          value={streetAddress}
                          onChange={e => setStreetAddress(e.target.value)}
                          style={{ width: "100%", padding: "0.75rem", borderRadius: "10px", border: "1px solid #cbd5e1" }}
                        />
                      </div>
                    </div>

                    <div style={{ position: "relative", borderRadius: "12px", overflow: "hidden", border: "1px solid #cbd5e1", height: "200px", background: "#f8fafc" }}>
                      <iframe 
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=120.67%2C14.98%2C120.73%2C15.02&layer=mapnik&marker=14.995,120.705`} 
                        width="100%" 
                        height="100%" 
                        style={{ border: "none" }}
                      ></iframe>
                      <div style={{ position: "absolute", bottom: "10px", left: "50%", transform: "translateX(-50%)", background: "white", padding: "6px 16px", borderRadius: "99px", fontSize: "0.85rem", fontWeight: "700", color: "#0f172a", boxShadow: "0 4px 10px rgba(0,0,0,0.1)", display: "flex", alignItems: "center", gap: "6px", border: "1px solid #e2e8f0", pointerEvents: "none" }}>
                        <MapPin size={14} color="#1d4ed8" /> Drag map to pin exact location
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Advanced Details */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                  <div>
                    <h3 style={{ fontSize: "1.1rem", color: "#0f172a", marginBottom: "1rem", borderBottom: "1px solid #e2e8f0", paddingBottom: "0.5rem" }}>Advanced Project Details</h3>
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                      <div className="form-group">
                        <label style={{ fontWeight: "600", color: "#334155", marginBottom: "0.5rem", display: "block", fontSize: "0.9rem" }}>Total Lot Area (sq.m)</label>
                        <input 
                          type="number" 
                          placeholder="e.g. 150" 
                          className="form-input" 
                          value={lotArea}
                          onChange={e => setLotArea(e.target.value)}
                          style={{ width: "100%", padding: "0.75rem", borderRadius: "10px", border: "1px solid #cbd5e1" }}
                        />
                      </div>
                      
                      <div className="form-group">
                        <label style={{ fontWeight: "600", color: "#334155", marginBottom: "0.5rem", display: "block", fontSize: "0.9rem" }}>Total Floor Area (sq.m)</label>
                        <input 
                          type="number" 
                          placeholder="e.g. 200" 
                          className="form-input" 
                          value={floorArea}
                          onChange={e => setFloorArea(e.target.value)}
                          style={{ width: "100%", padding: "0.75rem", borderRadius: "10px", border: "1px solid #cbd5e1" }}
                        />
                      </div>

                      <div className="form-group">
                        <label style={{ fontWeight: "600", color: "#334155", marginBottom: "0.5rem", display: "block", fontSize: "0.9rem" }}>Estimated Project Cost (₱)</label>
                        <input 
                          type="number" 
                          placeholder="e.g. 2500000" 
                          className="form-input" 
                          value={projectCost}
                          onChange={e => setProjectCost(e.target.value)}
                          style={{ width: "100%", padding: "0.75rem", borderRadius: "10px", border: "1px solid #cbd5e1" }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "1rem", borderRadius: "12px", marginTop: "auto" }}>
                    <p style={{ margin: 0, fontSize: "0.85rem", color: "#166534", lineHeight: "1.5", display: "flex", gap: "8px" }}>
                      <CheckCircle size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
                      These details help the OBO automatically calculate your accurate fee multipliers in the next stages.
                    </p>
                  </div>
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
                    <h3 style={{ color: "#0f172a", marginBottom: "0.5rem" }}>Files Uploaded Successfully!</h3>
                    <p style={{ color: "#64748b", marginBottom: "1rem" }}>{uploadedFileUrl.split(',').length} file(s) securely attached.</p>
                  </div>
                ) : (
                  <>
                    <Upload size={48} color="#94a3b8" style={{ margin: "0 auto 1rem auto" }} />
                    <h3 style={{ color: "#334155", marginBottom: "1rem" }}>Select files to upload</h3>
                    <input 
                      type="file" 
                      id="file-upload" 
                      style={{ display: "none" }}
                      onChange={handleFileUpload}
                      accept=".pdf,.png,.jpg,.jpeg"
                      multiple
                    />
                    <label htmlFor="file-upload" className="btn-primary" style={{ cursor: "pointer", display: "inline-block" }}>
                      Choose Files
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
