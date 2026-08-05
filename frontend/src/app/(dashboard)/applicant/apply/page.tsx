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
  const { selectedPermitType, setSelectedPermitType } = usePermitContext();
  const router = useRouter();

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
                  <input type="text" placeholder="e.g. 2-Storey Residential" className="form-input" />
                </div>
                <div className="form-group">
                  <label>Project Address</label>
                  <input type="text" placeholder="Lot No, Street, Barangay" className="form-input" />
                </div>
              </div>
            </div>
          )}

          {currentStep > 2 && (
            <div className="step-pane animate-fade-in-up">
              <h2>Coming Soon</h2>
              <p>The rest of the form wizard is being modernized...</p>
            </div>
          )}

          <div className="wizard-actions">
            {currentStep > 1 && (
              <button className="btn-outline" onClick={() => setCurrentStep(prev => prev - 1)}>
                <ChevronLeft size={18} /> Back
              </button>
            )}
            
            <div className="flex-spacer"></div>

            {currentStep < 4 ? (
              <button className="btn-primary" onClick={() => setCurrentStep(prev => prev + 1)}>
                Next Step <ChevronRight size={18} />
              </button>
            ) : (
              <button className="btn-primary" onClick={() => router.push("/applicant/dashboard")}>
                Submit Application <CheckCircle size={18} />
              </button>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
