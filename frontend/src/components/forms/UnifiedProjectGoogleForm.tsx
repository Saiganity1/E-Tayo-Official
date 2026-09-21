"use client";

import React, { useState } from "react";
import { ProjectTypeItem, PERMIT_FORM_METADATA, PermitFormMatrix, getRequiredPermitForms, getConditionalPermitForms } from "../../data/projectTypeMatrix";
import { generateUnifiedPermitPdf } from "../../utils/unifiedPermitPdfGenerator";
import SignatureCreator from "../common/SignatureCreator";
import { FileText, CheckCircle2, ShieldCheck, User, Building, Wrench, Shield, ArrowRight, X, AlertCircle, Zap } from "lucide-react";

interface UnifiedProjectGoogleFormProps {
  projectType: ProjectTypeItem;
  locationalClearanceRef: string;
  initialApplicantName?: string;
  initialApplicantAddress?: string;
  initialApplicantPhone?: string;
  initialProjectName?: string;
  initialBarangay?: string;
  initialLotArea?: string;
  onSubmitSuccess: (application: any) => void;
  onCancel: () => void;
}

export default function UnifiedProjectGoogleForm({
  projectType,
  locationalClearanceRef,
  initialApplicantName = "Juan Dela Cruz",
  initialApplicantAddress = "Sto. Tomas, Pampanga",
  initialApplicantPhone = "0917-123-4567",
  initialProjectName = "",
  initialBarangay = "San Bartolome",
  initialLotArea = "250",
  onSubmitSuccess,
  onCancel
}: UnifiedProjectGoogleFormProps) {
  // 1. Core applicant details
  const [applicantLastName, setApplicantLastName] = useState("DELA CRUZ");
  const [applicantFirstName, setApplicantFirstName] = useState("JUAN");
  const [applicantMiddleName, setApplicantMiddleName] = useState("S.");
  const [applicantTIN, setApplicantTIN] = useState("123-456-789-000");
  const [constructionOwnedByEnterprise, setConstructionOwnedByEnterprise] = useState("N/A (INDIVIDUAL)");
  const [formOfOwnership, setFormOfOwnership] = useState("INDIVIDUAL / OWNER");
  const [applicantPhone, setApplicantPhone] = useState(initialApplicantPhone);
  const [applicantEmail, setApplicantEmail] = useState("applicant@etayo.gov.ph");
  const [applicantAddress, setApplicantAddress] = useState(initialApplicantAddress);
  const [applicantNoStreet, setApplicantNoStreet] = useState("123 RIZAL ST.");
  const [applicantBarangay, setApplicantBarangay] = useState("POBLACION");
  const [applicantMunicipality, setApplicantMunicipality] = useState("STO. TOMAS");
  const [applicantProvince, setApplicantProvince] = useState("PAMPANGA");
  const [applicantZipCode, setApplicantZipCode] = useState("2020");

  // 2. Project details
  const [projectName, setProjectName] = useState(initialProjectName || `${projectType.name} Construction`);
  const [barangay, setBarangay] = useState(initialBarangay);
  const [streetAddress, setStreetAddress] = useState("Main Highway");
  const [lotNo, setLotNo] = useState("Lot 12");
  const [blockNo, setBlockNo] = useState("Block 4");
  const [tctNo, setTctNo] = useState("TCT-123456");
  const [lotArea, setLotArea] = useState(initialLotArea);
  const [floorArea, setFloorArea] = useState("180");
  const [projectCost, setProjectCost] = useState("2,500,000.00");
  const [proposedStoreys, setProposedStoreys] = useState("2");
  const [scopeOfWork, setScopeOfWork] = useState("New Construction");
  const [scopeOfWorkDetails, setScopeOfWorkDetails] = useState("");
  const [occupancyClass, setOccupancyClass] = useState("RESIDENTIAL");
  const [occupancyClassificationDetail, setOccupancyClassificationDetail] = useState("A. RESIDENTIAL DWELLING");
  const [occupancyOthers, setOccupancyOthers] = useState("");
  const [lightingOutletsCount, setLightingOutletsCount] = useState("28");
  const [convenienceOutletsCount, setConvenienceOutletsCount] = useState("24");
  const [acuOutletsCount, setAcuOutletsCount] = useState("4");
  const [cookingUnitOutletsCount, setCookingUnitOutletsCount] = useState("1");
  const [waterHeaterOutletsCount, setWaterHeaterOutletsCount] = useState("2");
  const [waterPumpOutletsCount, setWaterPumpOutletsCount] = useState("1");
  const [toggleSwitchCount, setToggleSwitchCount] = useState("15");
  const [bellBuzzerCount, setBellBuzzerCount] = useState("1");
  const [pushButtonsCount, setPushButtonsCount] = useState("1");
  const [faDetectorCount, setFaDetectorCount] = useState("2");
  const [otherWiringDevicesCount, setOtherWiringDevicesCount] = useState("1");

  // 2. Percentage of Site Occupancy (NBC Form A-01 • Box 2.2)
  const [percentBuildingFootprint, setPercentBuildingFootprint] = useState("55.00");
  const [percentImperviousSurface, setPercentImperviousSurface] = useState("25.00");
  const [percentUnpavedSurface, setPercentUnpavedSurface] = useState("20.00");
  const [percentSiteOccupancyOthers, setPercentSiteOccupancyOthers] = useState("");

  // Fire Code Conformance (P.D. 1185)
  const [fireCodeExitDoors, setFireCodeExitDoors] = useState(true);
  const [fireCodeCorridors, setFireCodeCorridors] = useState(true);
  const [fireCodeDistanceExits, setFireCodeDistanceExits] = useState(true);
  const [fireCodeAccessStreet, setFireCodeAccessStreet] = useState(true);
  const [fireCodeFireWalls, setFireCodeFireWalls] = useState(true);
  const [fireCodeFireFighting, setFireCodeFireFighting] = useState(false);
  const [fireCodeSmokeDetectors, setFireCodeSmokeDetectors] = useState(true);
  const [fireCodeEmergencyLights, setFireCodeEmergencyLights] = useState(true);
  const [fireCodeOthers, setFireCodeOthers] = useState("");

  // 3. Matrix Permit Selection (Auto-selects all mandatory forms, allows toggling conditionals)
  const mandatoryForms = getRequiredPermitForms(projectType);
  const conditionalForms = getConditionalPermitForms(projectType);
  const [selectedForms, setSelectedForms] = useState<(keyof PermitFormMatrix)[]>([
    ...mandatoryForms,
    ...conditionalForms // Default toggle conditionals for convenience
  ]);

  // 4. Engineering in charge
  const [architectName, setArchitectName] = useState("Arch. Maria Santos");
  const [architectPRC, setArchitectPRC] = useState("PRC-0045211");
  const [civilEngineerName, setCivilEngineerName] = useState("Engr. Roberto Cruz");
  const [civilEngineerPRC, setCivilEngineerPRC] = useState("PRC-0078923");
  const [electricalEngineerName, setElectricalEngineerName] = useState("Engr. Danilo Reyes, PEE");
  const [electricalEngineerPRC, setElectricalEngineerPRC] = useState("PRC-PEE-0033421");
  const [electricalEngineerSignature, setElectricalEngineerSignature] = useState<string>("");
  const [electricalContractorName, setElectricalContractorName] = useState("VOLTMAX ELECTRICAL SERVICES & CONTRACTING INC.");
  const [electricalContractorPcab, setElectricalContractorPcab] = useState("PCAB-EL-2026-9811");
  const [electricalContractorAddress, setElectricalContractorAddress] = useState("San Fernando, Pampanga");
  const [electricalContractorTel, setElectricalContractorTel] = useState("0918-777-8899");

  // Box 4: Person In-Charge of Installation
  const [sameAsDesignElectricalEngineer, setSameAsDesignElectricalEngineer] = useState(false);
  const [installationInChargeRole, setInstallationInChargeRole] = useState<"PEE" | "REE" | "RME">("PEE");
  const [installationInChargeName, setInstallationInChargeName] = useState("Engr. Edgar C. Mendoza, REE");
  const [installationInChargeAddress, setInstallationInChargeAddress] = useState("Sto. Tomas, Pampanga");
  const [installationInChargePRC, setInstallationInChargePRC] = useState("PRC-REE-0045678");
  const [installationInChargePRCValidity, setInstallationInChargePRCValidity] = useState("2028-08-20");
  const [installationInChargeTel, setInstallationInChargeTel] = useState("0917-888-1234");
  const [installationInChargePTR, setInstallationInChargePTR] = useState("PTR-ST-2026-5566");
  const [installationInChargePTRIssued, setInstallationInChargePTRIssued] = useState("Jan 14, 2026");
  const [installationInChargePTRIssuedAt, setInstallationInChargePTRIssuedAt] = useState("Sto. Tomas, Pampanga");
  const [installationInChargeTIN, setInstallationInChargeTIN] = useState("345-678-901-000");
  const [installationInChargeSignedDate, setInstallationInChargeSignedDate] = useState("Jan 15, 2026");
  const [installationInChargeSignature, setInstallationInChargeSignature] = useState<string>("");
  const [masterPlumberName, setMasterPlumberName] = useState("");
  const [masterPlumberPRC, setMasterPlumberPRC] = useState("");
  const [mechanicalEngineerName, setMechanicalEngineerName] = useState("Engr. Antonio Gomez, PME");
  const [mechanicalEngineerPRC, setMechanicalEngineerPRC] = useState("PRC-PME-0021489");
  const [electronicsEngineerName, setElectronicsEngineerName] = useState("Engr. Carlos Lim, PECE");
  const [electronicsEngineerPRC, setElectronicsEngineerPRC] = useState("PRC-PECE-0038912");

  // State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const toggleForm = (key: keyof PermitFormMatrix) => {
    // Cannot uncheck mandatory forms
    if (mandatoryForms.includes(key)) return;
    if (selectedForms.includes(key)) {
      setSelectedForms(selectedForms.filter(f => f !== key));
    } else {
      setSelectedForms([...selectedForms, key]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const applicationNo = `UNIFIED-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const submissionDate = new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });

      const mi = applicantMiddleName ? (applicantMiddleName.endsWith(".") ? applicantMiddleName : `${applicantMiddleName}.`) : "";
      const compiledFullName = [applicantFirstName, mi, applicantLastName].filter(Boolean).join(" ") || "JUAN S. DELA CRUZ";

      // Generate the auto-populated official PDF document
      const base64Pdf = await generateUnifiedPermitPdf({
        applicationNo,
        locationalClearanceRef,
        projectType,
        applicantName: compiledFullName,
        applicantFirstName,
        applicantLastName,
        applicantMiddleName,
        applicantTIN,
        formOfOwnership,
        constructionOwnedByEnterprise: constructionOwnedByEnterprise || (formOfOwnership.includes("INDIVIDUAL") ? "N/A" : ""),
        enterpriseName: constructionOwnedByEnterprise || (formOfOwnership.includes("INDIVIDUAL") ? "N/A" : ""),
        applicantPhone,
        applicantEmail,
        applicantAddress: [applicantNoStreet, applicantBarangay ? `Brgy. ${applicantBarangay}` : "", applicantMunicipality, applicantProvince, applicantZipCode].filter(Boolean).join(", "),
        applicantNoStreet,
        applicantBarangay,
        applicantMunicipality,
        applicantProvince,
        applicantZipCode,
        projectName,
        projectAddress: `${streetAddress}, Brgy. ${barangay}, Sto. Tomas, Pampanga`,
        barangay,
        lotNo,
        blockNo,
        tctNo,
        lotArea,
        floorArea,
        projectCost,
        scopeOfWork,
        scopeOfWorkDetails,
        scopeOthers: scopeOfWorkDetails,
        percentBuildingFootprint,
        percentImperviousSurface,
        percentUnpavedSurface,
        percentSiteOccupancyOthers,
        fireCodeExitDoors,
        fireCodeCorridors,
        fireCodeDistanceExits,
        fireCodeAccessStreet,
        fireCodeFireWalls,
        fireCodeFireFighting,
        fireCodeSmokeDetectors,
        fireCodeEmergencyLights,
        fireCodeOthers,
        occupancyClass,
        occupancyClassificationDetail,
        occupancyOthers,
        proposedStoreys,
        lightingOutletsCount,
        convenienceOutletsCount,
        acuOutletsCount,
        cookingUnitOutletsCount,
        rangeOutletsCount: cookingUnitOutletsCount,
        waterHeaterOutletsCount,
        waterPumpOutletsCount,
        toggleSwitchCount,
        bellBuzzerCount,
        pushButtonsCount,
        faDetectorCount,
        otherWiringDevicesCount,
        architectName,
        architectPRC,
        civilEngineerName,
        civilEngineerPRC,
        electricalEngineerName,
        electricalEngineerPRC,
        electricalEngineerSignature,
        electricalContractorName,
        electricalContractorPcab,
        electricalContractorAddress,
        electricalContractorTel,
        sameAsDesignElectricalEngineer,
        installationInChargeRole,
        installationInChargeName,
        installationInChargeAddress,
        installationInChargePRC,
        installationInChargePRCValidity,
        installationInChargeTel,
        installationInChargePTR,
        installationInChargePTRIssued,
        installationInChargePTRIssuedAt,
        installationInChargeTIN,
        installationInChargeSignedDate,
        installationInChargeSignature,
        masterPlumberName,
        masterPlumberPRC,
        mechanicalEngineerName,
        mechanicalEngineerPRC,
        electronicsEngineerName,
        electronicsEngineerPRC,
        activePermitForms: selectedForms,
        submissionDate
      });

      const fullAddress = `${streetAddress}, Brgy. ${barangay}, Sto. Tomas, Pampanga`;
      const newApplication: any = {
        id: applicationNo,
        projectName,
        projectType: projectType.name,
        permitType: "building_permit", // Main unified dossier
        locationalClearanceRef,
        status: "pending",
        dateSubmitted: submissionDate,
        applicantName: compiledFullName,
        applicantPhone,
        applicantEmail,
        applicantAddress,
        projectAddress: fullAddress,
        projectDescription: `${projectType.name} construction project under unified permit application package.`,
        fileUrl: `data:application/pdf;base64,${base64Pdf}`,
        fileName: `${applicationNo}_${projectType.name.replace(/\s+/g, '_')}_Unified_Permit.pdf`,
        estimatedFees: 3500.0,
        paymentStatus: "unpaid",
        location: {
          lat: 15.0050,
          lng: 120.7100,
          address: fullAddress,
          lotNo,
          blockNo
        },
        requirements: selectedForms.map(formKey => ({
          name: PERMIT_FORM_METADATA[formKey].label,
          required: true,
          status: "approved",
          fileName: `${PERMIT_FORM_METADATA[formKey].code}_auto_generated.pdf`
        })),
        trackingSteps: [
          { title: "Unified Application Filed", status: "completed", date: submissionDate, notes: "Automated NBCP Form 1 dossier compiled and sent to Building Official." },
          { 
            title: "Zoning Prerequisite Checked", 
            status: "completed", 
            date: submissionDate, 
            notes: locationalClearanceRef === "EXEMPT" || locationalClearanceRef === "NOT_REQUIRED"
              ? "Project type is exempt from zoning/locational clearance under municipal code."
              : `Approved under Locational Clearance ${locationalClearanceRef}.` 
          },
          { title: "Engineering & Safety Evaluation", status: "upcoming", notes: "Review by Municipal Building Official, Mechanical, Electrical, and BFP teams." }
        ],
        historyLog: [
          { date: new Date().toLocaleString("en-US", { month: "short", day: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }), action: "Unified Application Submitted", actor: compiledFullName, details: `Applied for ${projectType.name} with ${selectedForms.length} required permits.` }
        ]
      };

      onSubmitSuccess(newApplication);
    } catch (err: any) {
      setSubmitError(err?.message || "An error occurred while generating official permits. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="unified-form-wrapper animate-fade-in-up" style={{ maxWidth: "860px", margin: "0 auto", padding: "1.5rem 1rem 4rem" }}>
      {/* HEADER CARD */}
      <div style={{
        background: "#ffffff",
        borderTop: "10px solid #4f46e5",
        border: "1px solid #e2e8f0",
        borderTopWidth: "10px",
        borderTopColor: "#4f46e5",
        borderRadius: "16px",
        padding: "2rem",
        marginBottom: "1.5rem",
        boxShadow: "0 4px 20px rgba(0,0,0,0.04)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#065f46", padding: "4px 12px", borderRadius: "999px", fontSize: "0.8rem", fontWeight: "700", marginBottom: "0.75rem" }}>
              <ShieldCheck size={16} color="#059669" />
              {locationalClearanceRef === "EXEMPT" || locationalClearanceRef === "NOT_REQUIRED"
                ? "Locational Clearance: Exempt / Not Required"
                : `Locational Clearance Passed: ${locationalClearanceRef}`}
            </div>
            <h1 style={{ fontSize: "1.6rem", fontWeight: "800", color: "#0f172a", margin: "0 0 0.5rem 0" }}>
              Unified Permit Application: {projectType.name}
            </h1>
            <p style={{ color: "#475569", fontSize: "0.95rem", lineHeight: "1.5", margin: 0 }}>
              Official National Building Code application for <strong>{projectType.name}</strong> ({projectType.category}). 
              Data filled below will be automatically populated into the official municipal permit forms and submitted to the Office of the Building Official.
            </p>
          </div>
          <button
            onClick={onCancel}
            style={{ background: "#f1f5f9", border: "none", borderRadius: "8px", padding: "8px", cursor: "pointer", color: "#64748b" }}
            title="Cancel"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* SECTION 1: PERMIT FORMS MATRIX SELECTION */}
        <div style={{
          background: "#ffffff",
          borderRadius: "16px",
          border: "1px solid #e2e8f0",
          padding: "1.75rem",
          marginBottom: "1.5rem",
          boxShadow: "0 2px 10px rgba(0,0,0,0.03)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#e0e7ff", color: "#4f46e5", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FileText size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: "1.15rem", fontWeight: "700", color: "#0f172a", margin: 0 }}>
                Municipal Form Matrix for {projectType.name}
              </h2>
              <p style={{ margin: "2px 0 0 0", fontSize: "0.85rem", color: "#64748b" }}>
                Based on municipal ordinances, the following forms are required for this project type:
              </p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "0.75rem" }}>
            {(Object.keys(PERMIT_FORM_METADATA) as (keyof PermitFormMatrix)[]).map((key) => {
              const meta = PERMIT_FORM_METADATA[key];
              const level = projectType.matrix[key];
              const isMandatory = level === "required";
              const isConditional = level === "conditional";
              const isNotRequired = level === "not_required";
              const isChecked = selectedForms.includes(key);

              if (isNotRequired) return null;

              return (
                <div
                  key={key}
                  onClick={() => !isMandatory && toggleForm(key)}
                  style={{
                    border: isChecked ? "2px solid #4f46e5" : "1px solid #cbd5e1",
                    background: isChecked ? "#f5f3ff" : "#f8fafc",
                    borderRadius: "12px",
                    padding: "0.85rem 1rem",
                    cursor: isMandatory ? "default" : "pointer",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.75rem",
                    transition: "all 0.15s ease"
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    disabled={isMandatory}
                    onChange={() => toggleForm(key)}
                    style={{ marginTop: "3px", width: "16px", height: "16px", accentColor: "#4f46e5" }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontWeight: "700", fontSize: "0.9rem", color: "#0f172a" }}>{meta.label}</span>
                      <span style={{
                        fontSize: "0.7rem",
                        fontWeight: "700",
                        padding: "1px 6px",
                        borderRadius: "4px",
                        background: isMandatory ? "#dbeafe" : "#fef3c7",
                        color: isMandatory ? "#1e40af" : "#92400e"
                      }}>
                        {isMandatory ? "Mandatory" : "Conditional"}
                      </span>
                    </div>
                    <p style={{ margin: "3px 0 0 0", fontSize: "0.78rem", color: "#64748b" }}>{meta.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 2: APPLICANT INFORMATION & BOX 1 */}
        <div style={{
          background: "#ffffff",
          borderRadius: "16px",
          border: "1px solid #e2e8f0",
          padding: "1.75rem",
          marginBottom: "1.5rem",
          boxShadow: "0 2px 10px rgba(0,0,0,0.03)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#fef3c7", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <User size={20} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "0.68rem", fontWeight: "800", color: "#4338ca", background: "#e0e7ff", padding: "2px 6px", borderRadius: "4px" }}>
                  NBC FORM A-01 / S-01 / B-01 • BOX 1
                </span>
                <span style={{ fontSize: "0.74rem", color: "#64748b", fontWeight: "600" }}>
                  Owner & Enterprise Information
                </span>
              </div>
              <h2 style={{ fontSize: "1.15rem", fontWeight: "800", color: "#0f172a", margin: "2px 0 0 0" }}>
                BOX 1: OWNER / APPLICANT & ENTERPRISE DETAILS
              </h2>
            </div>
          </div>

          {/* Row 1: OWNER / APPLICANT Columns: LAST NAME | FIRST NAME | M.I. | TIN */}
          <div style={{
            background: "#f8fafc",
            border: "1.5px solid #e2e8f0",
            borderRadius: "12px",
            padding: "1rem 1.15rem",
            marginBottom: "1rem"
          }}>
            <div style={{
              fontSize: "0.74rem",
              fontWeight: "900",
              color: "#1e293b",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              marginBottom: "0.6rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}>
              <span>OWNER / APPLICANT</span>
              <span style={{ fontSize: "0.68rem", color: "#64748b", fontWeight: "600" }}>
                Official Government Form Grid
              </span>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "1.3fr 1.3fr 0.55fr 1fr",
              gap: "0.75rem"
            }}>
              <div>
                <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "800", color: "#334155", textTransform: "uppercase", marginBottom: "4px" }}>
                  LAST NAME *
                </label>
                <input
                  type="text"
                  required
                  value={applicantLastName}
                  onChange={(e) => setApplicantLastName(e.target.value.toUpperCase())}
                  placeholder="DELA CRUZ"
                  style={{ width: "100%", padding: "8px 10px", borderRadius: "7px", border: "1.5px solid #cbd5e1", fontSize: "0.88rem", fontWeight: "800", textTransform: "uppercase", color: "#0f172a", background: "#ffffff" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "800", color: "#334155", textTransform: "uppercase", marginBottom: "4px" }}>
                  FIRST NAME *
                </label>
                <input
                  type="text"
                  required
                  value={applicantFirstName}
                  onChange={(e) => setApplicantFirstName(e.target.value.toUpperCase())}
                  placeholder="JUAN"
                  style={{ width: "100%", padding: "8px 10px", borderRadius: "7px", border: "1.5px solid #cbd5e1", fontSize: "0.88rem", fontWeight: "800", textTransform: "uppercase", color: "#0f172a", background: "#ffffff" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "800", color: "#334155", textTransform: "uppercase", marginBottom: "4px", textAlign: "center" }}>
                  M.I.
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={applicantMiddleName}
                  onChange={(e) => setApplicantMiddleName(e.target.value.toUpperCase())}
                  placeholder="S."
                  style={{ width: "100%", padding: "8px 8px", borderRadius: "7px", border: "1.5px solid #cbd5e1", fontSize: "0.88rem", fontWeight: "800", textTransform: "uppercase", textAlign: "center", color: "#0f172a", background: "#ffffff" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "800", color: "#334155", textTransform: "uppercase", marginBottom: "4px" }}>
                  TIN *
                </label>
                <input
                  type="text"
                  required
                  value={applicantTIN}
                  onChange={(e) => setApplicantTIN(e.target.value)}
                  placeholder="123-456-789-000"
                  style={{ width: "100%", padding: "8px 10px", borderRadius: "7px", border: "1.5px solid #cbd5e1", fontSize: "0.88rem", fontWeight: "700", color: "#0f172a", background: "#ffffff" }}
                />
              </div>
            </div>

            {/* Compiled Full Name display */}
            <div style={{
              marginTop: "0.65rem",
              padding: "6px 12px",
              borderRadius: "6px",
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}>
              <span style={{ fontSize: "0.72rem", color: "#1e40af", fontWeight: "700" }}>
                Compiled Form Full Name:
              </span>
              <span style={{ fontSize: "0.82rem", color: "#1e3a8a", fontWeight: "800" }}>
                {applicantFirstName} {applicantMiddleName ? (applicantMiddleName.endsWith(".") ? applicantMiddleName : `${applicantMiddleName}.`) : ""} {applicantLastName}
              </span>
            </div>
          </div>

          {/* Row 2: FOR CONSTRUCTION OWNED BY AN ENTERPRISE | FORM OF OWNERSHIP | USE OR CHARACTER OF OCCUPANCY */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1.4fr 1.1fr 1.2fr",
            gap: "0.75rem",
            alignItems: "start",
            background: "#f8fafc",
            border: "1.5px solid #e2e8f0",
            borderRadius: "12px",
            padding: "1rem 1.15rem",
            marginBottom: "1rem"
          }}>
            {/* 1. FOR CONSTRUCTION OWNED BY AN ENTERPRISE */}
            <div>
              <div style={{ marginBottom: "5px" }}>
                <div style={{
                  fontSize: "0.72rem",
                  fontWeight: "900",
                  color: "#0f172a",
                  textTransform: "uppercase",
                  lineHeight: "1.25",
                  letterSpacing: "0.3px"
                }}>
                  <div>FOR CONSTRUCTION OWNED</div>
                  <div style={{ color: "#2563eb" }}>BY AN ENTERPRISE</div>
                </div>
              </div>
              <input
                type="text"
                value={constructionOwnedByEnterprise}
                onChange={(e) => setConstructionOwnedByEnterprise(e.target.value.toUpperCase())}
                placeholder="e.g. SAN MIGUEL CORP. (or N/A)"
                style={{ width: "100%", padding: "8px 10px", borderRadius: "7px", border: "1.5px solid #cbd5e1", fontSize: "0.85rem", fontWeight: "800", color: "#0f172a", background: "#ffffff", textTransform: "uppercase" }}
              />
              <span style={{ display: "block", fontSize: "0.68rem", color: "#64748b", marginTop: "3px" }}>
                Name of enterprise / corporation owning the construction (or N/A)
              </span>
            </div>

            {/* 2. FORM OF OWNERSHIP */}
            <div>
              <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "900", color: "#0f172a", textTransform: "uppercase", marginBottom: "5px", letterSpacing: "0.3px" }}>
                FORM OF OWNERSHIP
              </label>
              <select
                value={["INDIVIDUAL / OWNER", "INDIVIDUAL / SOLE PROPRIETORSHIP", "CORPORATION", "PARTNERSHIP", "GOVERNMENT / INSTITUTIONAL", "NON-PROFIT / NGO", "COOPERATIVE"].includes(formOfOwnership.toUpperCase()) ? formOfOwnership.toUpperCase() : "OTHERS"}
                onChange={(e) => {
                  if (e.target.value !== "OTHERS") {
                    setFormOfOwnership(e.target.value);
                  } else {
                    setFormOfOwnership("");
                  }
                }}
                style={{ width: "100%", padding: "8px 10px", borderRadius: "7px", border: "1.5px solid #cbd5e1", fontSize: "0.85rem", fontWeight: "700", color: "#0f172a", background: "#ffffff", cursor: "pointer" }}
              >
                <option value="INDIVIDUAL / OWNER">INDIVIDUAL / OWNER</option>
                <option value="INDIVIDUAL / SOLE PROPRIETORSHIP">INDIVIDUAL / SOLE PROPRIETORSHIP</option>
                <option value="CORPORATION">CORPORATION</option>
                <option value="PARTNERSHIP">PARTNERSHIP</option>
                <option value="GOVERNMENT / INSTITUTIONAL">GOVERNMENT / INSTITUTIONAL</option>
                <option value="NON-PROFIT / NGO">NON-PROFIT / NGO</option>
                <option value="COOPERATIVE">COOPERATIVE</option>
                <option value="OTHERS">OTHER (CUSTOM)</option>
              </select>
              {!["INDIVIDUAL / OWNER", "INDIVIDUAL / SOLE PROPRIETORSHIP", "CORPORATION", "PARTNERSHIP", "GOVERNMENT / INSTITUTIONAL", "NON-PROFIT / NGO", "COOPERATIVE"].includes(formOfOwnership.toUpperCase()) && (
                <input
                  type="text"
                  placeholder="Specify Form of Ownership..."
                  value={formOfOwnership}
                  onChange={(e) => setFormOfOwnership(e.target.value.toUpperCase())}
                  style={{
                    width: "100%",
                    marginTop: "5px",
                    padding: "6px 9px",
                    borderRadius: "6px",
                    border: "1.5px solid #93c5fd",
                    fontSize: "0.82rem",
                    fontWeight: "700",
                    color: "#0f172a",
                    background: "#f0f9ff"
                  }}
                />
              )}
              <span style={{ display: "block", fontSize: "0.68rem", color: "#64748b", marginTop: "3px" }}>
                Legal ownership entity
              </span>
            </div>

            {/* 3. USE OR CHARACTER OF OCCUPANCY */}
            <div>
              <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "900", color: "#0f172a", textTransform: "uppercase", marginBottom: "5px", letterSpacing: "0.3px" }}>
                USE OR CHARACTER OF OCCUPANCY
              </label>
              <select
                value={(() => {
                  const upper = occupancyClass.toUpperCase();
                  if (upper.includes("RESIDENTIAL")) return "RESIDENTIAL";
                  if (upper.includes("COMMERCIAL")) return "COMMERCIAL";
                  if (upper.includes("INDUSTRIAL")) return "INDUSTRIAL";
                  if (upper.includes("INSTITUTIONAL")) return "INSTITUTIONAL";
                  if (upper.includes("AGRICULTURAL")) return "AGRICULTURAL";
                  if (upper.includes("EDUCATIONAL")) return "EDUCATIONAL & RECREATIONAL";
                  if (upper.includes("ASSEMBLY")) return "ASSEMBLY / RECREATION";
                  return ["RESIDENTIAL", "COMMERCIAL", "INDUSTRIAL", "INSTITUTIONAL", "AGRICULTURAL", "EDUCATIONAL & RECREATIONAL", "ASSEMBLY / RECREATION"].includes(upper) ? upper : "OTHERS";
                })()}
                onChange={(e) => {
                  if (e.target.value !== "OTHERS") {
                    setOccupancyClass(e.target.value);
                  } else {
                    setOccupancyClass("");
                  }
                }}
                style={{ width: "100%", padding: "8px 10px", borderRadius: "7px", border: "1.5px solid #cbd5e1", fontSize: "0.85rem", fontWeight: "700", color: "#0f172a", background: "#ffffff", cursor: "pointer" }}
              >
                <option value="RESIDENTIAL">RESIDENTIAL</option>
                <option value="COMMERCIAL">COMMERCIAL</option>
                <option value="INDUSTRIAL">INDUSTRIAL</option>
                <option value="INSTITUTIONAL">INSTITUTIONAL</option>
                <option value="AGRICULTURAL">AGRICULTURAL</option>
                <option value="EDUCATIONAL & RECREATIONAL">EDUCATIONAL & RECREATIONAL</option>
                <option value="ASSEMBLY / RECREATION">ASSEMBLY / RECREATION</option>
                <option value="OTHERS">OTHER (CUSTOM)</option>
              </select>
              {!["RESIDENTIAL", "COMMERCIAL", "INDUSTRIAL", "INSTITUTIONAL", "AGRICULTURAL", "EDUCATIONAL & RECREATIONAL", "ASSEMBLY / RECREATION"].includes(occupancyClass.toUpperCase()) && !occupancyClass.toUpperCase().includes("RESIDENTIAL") && (
                <input
                  type="text"
                  placeholder="Specify Character of Occupancy..."
                  value={occupancyClass}
                  onChange={(e) => setOccupancyClass(e.target.value.toUpperCase())}
                  style={{
                    width: "100%",
                    marginTop: "5px",
                    padding: "6px 9px",
                    borderRadius: "6px",
                    border: "1.5px solid #93c5fd",
                    fontSize: "0.82rem",
                    fontWeight: "700",
                    color: "#0f172a",
                    background: "#f0f9ff"
                  }}
                />
              )}
              <span style={{ display: "block", fontSize: "0.68rem", color: "#64748b", marginTop: "3px" }}>
                National Building Code classification
              </span>

              {/* OCCUPANCY CLASSIFICATION DETAIL (NBCP / NBC FORM E-01) */}
              <div style={{ marginTop: "8px" }}>
                <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "900", color: "#1e40af", textTransform: "uppercase", marginBottom: "4px", letterSpacing: "0.3px" }}>
                  OCCUPANCY CLASSIFICATION DETAIL (NBCP / NBC FORM E-01)
                </label>
                <select
                  value={occupancyClassificationDetail}
                  onChange={(e) => setOccupancyClassificationDetail(e.target.value)}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: "7px", border: "1.5px solid #93c5fd", fontSize: "0.85rem", fontWeight: "700", color: "#1e3a8a", background: "#f0f9ff", cursor: "pointer" }}
                >
                  <optgroup label="NBC FORM E-01 (ELECTRICAL PERMIT) CLASSIFICATIONS">
                    <option value="A. RESIDENTIAL DWELLING">A. RESIDENTIAL DWELLING</option>
                    <option value="B. RESIDENTIAL, HOTEL, APARTMENT">B. RESIDENTIAL, HOTEL, APARTMENT</option>
                    <option value="C. EDUCATION AND RECREATION">C. EDUCATION AND RECREATION</option>
                    <option value="D. INSTITUTIONAL">D. INSTITUTIONAL</option>
                    <option value="H. BUSINESS AND MERCANTILE">H. BUSINESS AND MERCANTILE</option>
                    <option value="I. INDUSTRIAL">I. INDUSTRIAL</option>
                    <option value="J. STORAGE AND HAZARDOUS">J. STORAGE AND HAZARDOUS</option>
                    <option value="K. ASSEMBLY OTHER THAN GROUP I">K. ASSEMBLY OTHER THAN GROUP I</option>
                    <option value="E. ASSEMBLY OCCUPANT LOAD 1000 OR MORE">E. ASSEMBLY OCCUPANT LOAD 1000 OR MORE</option>
                    <option value="F. ACCESSORY">F. ACCESSORY</option>
                    <option value="G. OTHERS (SPECIFY)">G. OTHERS (SPECIFY)</option>
                  </optgroup>
                  <optgroup label="GROUP A: RESIDENTIAL (DWELLINGS)">
                    <option value="Group A - Single Family Dwelling">Group A - Single Family Dwelling</option>
                    <option value="Group A - Duplex">Group A - Duplex</option>
                    <option value="Group A - Residential R-1, R-2">Group A - Residential R-1, R-2</option>
                    <option value="Group A - Others">Group A - Others</option>
                  </optgroup>
                  <optgroup label="GROUP B: RESIDENTIAL">
                    <option value="Group B - Hotel / Motel">Group B - Hotel / Motel</option>
                    <option value="Group B - Townhouse">Group B - Townhouse</option>
                    <option value="Group B - Dormitory / Boardinghouse">Group B - Dormitory / Boardinghouse</option>
                    <option value="Group B - Residential R-3, R-4, R-5">Group B - Residential R-3, R-4, R-5</option>
                    <option value="Group B - Others">Group B - Others</option>
                  </optgroup>
                  <optgroup label="GROUP C: EDUCATIONAL & RECREATIONAL">
                    <option value="Group C - School Building">Group C - School Building</option>
                    <option value="Group C - School Auditorium / Gymnasium">Group C - School Auditorium / Gymnasium</option>
                    <option value="Group C - Civic Center / Clubhouse">Group C - Civic Center / Clubhouse</option>
                    <option value="Group C - Church, Mosque, Temple, Chapel">Group C - Church, Mosque, Temple, Chapel</option>
                    <option value="Group C - Others">Group C - Others</option>
                  </optgroup>
                  <optgroup label="GROUP D: INSTITUTIONAL">
                    <option value="Group D - Hospital / Medical Facility">Group D - Hospital / Medical Facility</option>
                    <option value="Group D - Home for the Aged">Group D - Home for the Aged</option>
                    <option value="Group D - Government Office">Group D - Government Office</option>
                    <option value="Group D - Others">Group D - Others</option>
                  </optgroup>
                  <optgroup label="GROUP E: COMMERCIAL">
                    <option value="Group E - Bank / Financial">Group E - Bank / Financial</option>
                    <option value="Group E - Store / Retail">Group E - Store / Retail</option>
                    <option value="Group E - Shopping Center / Mall">Group E - Shopping Center / Mall</option>
                    <option value="Group E - Drinking / Dining Establishment">Group E - Drinking / Dining Establishment</option>
                    <option value="Group E - Shop (Tailoring, Salon, etc.)">Group E - Shop (Tailoring, Salon, etc.)</option>
                    <option value="Group E - Others">Group E - Others</option>
                  </optgroup>
                  <optgroup label="GROUP F: LIGHT INDUSTRIAL">
                    <option value="Group F - Factory / Plant (Incombustible)">Group F - Factory / Plant (Incombustible)</option>
                    <option value="Group F - Others">Group F - Others</option>
                  </optgroup>
                  <optgroup label="GROUP G: MEDIUM INDUSTRIAL">
                    <option value="Group G - Storage / Warehouse (Hazardous)">Group G - Storage / Warehouse (Hazardous)</option>
                    <option value="Group G - Factory (Hazardous / Flammable)">Group G - Factory (Hazardous / Flammable)</option>
                    <option value="Group G - Others">Group G - Others</option>
                  </optgroup>
                  <optgroup label="GROUP H: ASSEMBLY (< 1,000)">
                    <option value="Group H - Theater / Auditorium (< 1,000)">Group H - Theater / Auditorium (&lt; 1,000)</option>
                    <option value="Group H - Convention Hall / Bleacher (< 1,000)">Group H - Convention Hall / Bleacher (&lt; 1,000)</option>
                    <option value="Group H - Others (< 1,000)">Group H - Others (&lt; 1,000)</option>
                  </optgroup>
                  <optgroup label="GROUP I: ASSEMBLY (1,000 OR MORE)">
                    <option value="Group I - Coliseum / Sports Complex (1,000+)">Group I - Coliseum / Sports Complex (1,000+)</option>
                    <option value="Group I - Convention Center (1,000+)">Group I - Convention Center (1,000+)</option>
                    <option value="Group I - Others (1,000+)">Group I - Others (1,000+)</option>
                  </optgroup>
                  <optgroup label="GROUP J: (J-1) AGRICULTURAL">
                    <option value="Group J-1 - Barn / Granary / Poultry House">Group J-1 - Barn / Granary / Poultry House</option>
                    <option value="Group J-1 - Piggery / Grain Mill / Silo">Group J-1 - Piggery / Grain Mill / Silo</option>
                    <option value="Group J-1 - Others">Group J-1 - Others</option>
                  </optgroup>
                  <optgroup label="GROUP J: (J-2) ACCESSORIES">
                    <option value="Group J-2 - Private Carport / Garage">Group J-2 - Private Carport / Garage</option>
                    <option value="Group J-2 - Swimming Pool">Group J-2 - Swimming Pool</option>
                    <option value="Group J-2 - Fence over 1.80m">Group J-2 - Fence over 1.80m</option>
                    <option value="Group J-2 - Steel / Concrete Tank">Group J-2 - Steel / Concrete Tank</option>
                    <option value="Group J-2 - Others">Group J-2 - Others</option>
                  </optgroup>
                </select>
                {(occupancyClassificationDetail === "G. OTHERS (SPECIFY)" || (occupancyClassificationDetail || "").toLowerCase().includes("others")) && (
                  <input
                    type="text"
                    placeholder="Specify detailed occupancy..."
                    value={occupancyOthers}
                    onChange={(e) => setOccupancyOthers(e.target.value.toUpperCase())}
                    style={{
                      width: "100%",
                      marginTop: "5px",
                      padding: "6px 9px",
                      borderRadius: "6px",
                      border: "1.5px solid #93c5fd",
                      fontSize: "0.82rem",
                      fontWeight: "700",
                      color: "#0f172a",
                      background: "#f0f9ff"
                    }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Box 1 Row 3: Official Separated Address & Contact Grid */}
          <div style={{ marginTop: "1rem", padding: "1rem", borderRadius: "10px", background: "#f8fafc", border: "1.5px solid #e2e8f0" }}>
            <div style={{ fontSize: "0.74rem", fontWeight: "900", color: "#1e293b", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: "0.6rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>ADDRESS & CONTACT INFORMATION (ROW 3)</span>
              <span style={{ fontSize: "0.68rem", color: "#64748b", fontWeight: "600" }}>
                Official Government Form Grid (Row 3)
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1.1fr 1.1fr 0.7fr 1.1fr 1.4fr", gap: "0.65rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "800", color: "#334155", textTransform: "uppercase", marginBottom: "3px" }}>
                  NO., STREET, SITIO *
                </label>
                <input
                  type="text"
                  required
                  value={applicantNoStreet}
                  onChange={(e) => setApplicantNoStreet(e.target.value.toUpperCase())}
                  placeholder="123 RIZAL ST."
                  style={{ width: "100%", padding: "7px 9px", borderRadius: "6px", border: "1.5px solid #cbd5e1", fontSize: "0.84rem", fontWeight: "700", textTransform: "uppercase" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "800", color: "#334155", textTransform: "uppercase", marginBottom: "3px" }}>
                  BARANGAY *
                </label>
                <select
                  value={applicantBarangay.toUpperCase()}
                  onChange={(e) => setApplicantBarangay(e.target.value)}
                  style={{ width: "100%", padding: "7px 9px", borderRadius: "6px", border: "1.5px solid #cbd5e1", fontSize: "0.84rem", fontWeight: "700", cursor: "pointer", background: "#ffffff" }}
                >
                  {["POBLACION", "SAN BARTOLOME", "SAN MATIAS", "SAN VICENTE", "SANTA ANA", "SANTO ROSARIO", "SAN NICOLAS"].map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                  <option value="OTHERS">OTHER (SPECIFY)</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "800", color: "#334155", textTransform: "uppercase", marginBottom: "3px" }}>
                  MUNICIPALITY *
                </label>
                <input
                  type="text"
                  required
                  value={applicantMunicipality}
                  onChange={(e) => setApplicantMunicipality(e.target.value.toUpperCase())}
                  placeholder="STO. TOMAS"
                  style={{ width: "100%", padding: "7px 9px", borderRadius: "6px", border: "1.5px solid #cbd5e1", fontSize: "0.84rem", fontWeight: "700", textTransform: "uppercase" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "800", color: "#334155", textTransform: "uppercase", marginBottom: "3px", textAlign: "center" }}>
                  ZIP CODE *
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={applicantZipCode}
                  onChange={(e) => setApplicantZipCode(e.target.value)}
                  placeholder="2020"
                  style={{ width: "100%", padding: "7px 7px", borderRadius: "6px", border: "1.5px solid #cbd5e1", fontSize: "0.84rem", fontWeight: "700", textAlign: "center" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "800", color: "#334155", textTransform: "uppercase", marginBottom: "3px" }}>
                  CONTACT NO. *
                </label>
                <input
                  type="text"
                  required
                  value={applicantPhone}
                  onChange={(e) => setApplicantPhone(e.target.value)}
                  placeholder="0917-123-4567"
                  style={{ width: "100%", padding: "7px 9px", borderRadius: "6px", border: "1.5px solid #cbd5e1", fontSize: "0.84rem", fontWeight: "700" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "800", color: "#334155", textTransform: "uppercase", marginBottom: "3px" }}>
                  EMAIL ADDRESS *
                </label>
                <input
                  type="email"
                  required
                  value={applicantEmail}
                  onChange={(e) => setApplicantEmail(e.target.value)}
                  placeholder="juan.delacruz@example.com"
                  style={{ width: "100%", padding: "7px 9px", borderRadius: "6px", border: "1.5px solid #cbd5e1", fontSize: "0.84rem", fontWeight: "700" }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: BUILDING & SITE SPECIFICATIONS */}
        <div style={{
          background: "#ffffff",
          borderRadius: "16px",
          border: "1px solid #e2e8f0",
          padding: "1.75rem",
          marginBottom: "1.5rem",
          boxShadow: "0 2px 10px rgba(0,0,0,0.03)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#dcfce7", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Building size={20} />
            </div>
            <h2 style={{ fontSize: "1.15rem", fontWeight: "700", color: "#0f172a", margin: 0 }}>
              Project Location & Structural Specifications
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                Project Title / Name *
              </label>
              <input
                type="text"
                required
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                Barangay *
              </label>
              <select
                value={barangay}
                onChange={(e) => setBarangay(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem", background: "white" }}
              >
                {["San Bartolome", "San Matias", "San Vicente", "Santa Ana", "Santo Rosario", "Poblacion", "San Nicolas"].map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                Lot No.
              </label>
              <input
                type="text"
                value={lotNo}
                onChange={(e) => setLotNo(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                Block No.
              </label>
              <input
                type="text"
                value={blockNo}
                onChange={(e) => setBlockNo(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                TCT / OCT No.
              </label>
              <input
                type="text"
                value={tctNo}
                onChange={(e) => setTctNo(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                Lot Area (sq. m) *
              </label>
              <input
                type="number"
                required
                value={lotArea}
                onChange={(e) => setLotArea(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                Total Floor Area (sq. m) *
              </label>
              <input
                type="number"
                required
                value={floorArea}
                onChange={(e) => setFloorArea(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                Proposed Number of Storeys *
              </label>
              <input
                type="number"
                required
                value={proposedStoreys}
                onChange={(e) => setProposedStoreys(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                Estimated Project Cost (PHP) *
              </label>
              <input
                type="text"
                required
                value={projectCost}
                onChange={(e) => setProjectCost(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                Scope of Work *
              </label>
              <select
                value={scopeOfWork}
                onChange={(e) => setScopeOfWork(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem", background: "white" }}
              >
                <option value="New Construction">New Construction</option>
                <option value="New Installation">New Installation</option>
                <option value="Annual Inspection">Annual Inspection</option>
                <option value="Addition">Addition</option>
                <option value="Repair">Repair</option>
                <option value="Removal">Removal</option>
                <option value="Erection">Erection</option>
                <option value="Alteration">Alteration</option>
                <option value="Renovation">Renovation</option>
                <option value="Conversion">Conversion</option>
                <option value="Moving">Moving</option>
                <option value="Raising">Raising</option>
                <option value="Demolition">Demolition</option>
                <option value="Accessory Building / Structure">Accessory Building / Structure</option>
                <option value="Others">Others (Specify)</option>
              </select>
              {(scopeOfWork || "").toLowerCase().includes("other") && (
                <div style={{ marginTop: "8px" }}>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>
                    Specify Other Scope of Work (Prints on Form Underline) *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Details for other scope of work"
                    value={scopeOfWorkDetails}
                    onChange={(e) => setScopeOfWorkDetails(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Sub-section: 2. Percentage of Site Occupancy */}
          <div style={{ marginTop: "1.25rem", padding: "1rem", background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontSize: "0.82rem", fontWeight: "700", color: "#1e293b", textTransform: "uppercase" }}>
                2. PERCENTAGE OF SITE OCCUPANCY
              </span>
              <span style={{ fontSize: "0.7rem", background: "#ede9fe", color: "#6d28d9", padding: "1px 6px", borderRadius: "4px", fontWeight: "700" }}>
                NBC Form A-01 • Box 2.2
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.75rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "600", color: "#475569", marginBottom: "2px" }}>PERCENTAGE OF BUILDING FOOTPRINT</label>
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    value={percentBuildingFootprint}
                    onChange={(e) => setPercentBuildingFootprint(e.target.value)}
                    style={{ width: "100%", padding: "7px 22px 7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "white" }}
                  />
                  <span style={{ position: "absolute", right: "8px", top: "7px", fontSize: "0.78rem", color: "#94a3b8" }}>%</span>
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "600", color: "#475569", marginBottom: "2px" }}>PERCENTAGE OF IMPERVIOUS SURFACE AREA</label>
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    value={percentImperviousSurface}
                    onChange={(e) => setPercentImperviousSurface(e.target.value)}
                    style={{ width: "100%", padding: "7px 22px 7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "white" }}
                  />
                  <span style={{ position: "absolute", right: "8px", top: "7px", fontSize: "0.78rem", color: "#94a3b8" }}>%</span>
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "600", color: "#475569", marginBottom: "2px" }}>PERCENTAGE OF UNPAVED SURFACE AREA</label>
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    value={percentUnpavedSurface}
                    onChange={(e) => setPercentUnpavedSurface(e.target.value)}
                    style={{ width: "100%", padding: "7px 22px 7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "white" }}
                  />
                  <span style={{ position: "absolute", right: "8px", top: "7px", fontSize: "0.78rem", color: "#94a3b8" }}>%</span>
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "600", color: "#475569", marginBottom: "2px" }}>OTHERS (Specify)</label>
                <input
                  type="text"
                  placeholder="e.g. Lawn / Landscaping"
                  value={percentSiteOccupancyOthers}
                  onChange={(e) => setPercentSiteOccupancyOthers(e.target.value)}
                  style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "white" }}
                />
              </div>
            </div>
          </div>

          {/* Sub-section: Conformance to Fire Code of the Philippines (P.D. 1185) */}
          <div style={{ marginTop: "1.25rem", padding: "1rem", background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontSize: "0.82rem", fontWeight: "700", color: "#1e293b", textTransform: "uppercase" }}>
                3. CONFORMANCE TO FIRE CODE OF THE PHILIPPINES (P.D. 1185)
              </span>
              <span style={{ fontSize: "0.7rem", background: "#fee2e2", color: "#b91c1c", padding: "1px 6px", borderRadius: "4px", fontWeight: "700" }}>
                P.D. 1185
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.3fr 1.1fr", gap: "1rem", alignItems: "start" }}>
              {/* Column 1 */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.74rem", fontWeight: "600", color: "#334155", cursor: "pointer" }}>
                  <input type="checkbox" checked={fireCodeExitDoors} onChange={(e) => setFireCodeExitDoors(e.target.checked)} style={{ accentColor: "#7c3aed" }} />
                  NUMBER AND WIDTH OF EXIT DOORS
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.74rem", fontWeight: "600", color: "#334155", cursor: "pointer" }}>
                  <input type="checkbox" checked={fireCodeCorridors} onChange={(e) => setFireCodeCorridors(e.target.checked)} style={{ accentColor: "#7c3aed" }} />
                  WIDTH OF CORRIDORS
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.74rem", fontWeight: "600", color: "#334155", cursor: "pointer" }}>
                  <input type="checkbox" checked={fireCodeDistanceExits} onChange={(e) => setFireCodeDistanceExits(e.target.checked)} style={{ accentColor: "#7c3aed" }} />
                  DISTANCE TO FIRE EXITS
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.74rem", fontWeight: "600", color: "#334155", cursor: "pointer" }}>
                  <input type="checkbox" checked={fireCodeAccessStreet} onChange={(e) => setFireCodeAccessStreet(e.target.checked)} style={{ accentColor: "#7c3aed" }} />
                  ACCESS TO PUBLIC STREET
                </label>
              </div>

              {/* Column 2 */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.74rem", fontWeight: "600", color: "#334155", cursor: "pointer" }}>
                  <input type="checkbox" checked={fireCodeFireWalls} onChange={(e) => setFireCodeFireWalls(e.target.checked)} style={{ accentColor: "#7c3aed" }} />
                  FIRE WALLS
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.74rem", fontWeight: "600", color: "#334155", cursor: "pointer" }}>
                  <input type="checkbox" checked={fireCodeFireFighting} onChange={(e) => setFireCodeFireFighting(e.target.checked)} style={{ accentColor: "#7c3aed" }} />
                  FIRE FIGHTING AND SAFETY FACILITIES
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.74rem", fontWeight: "600", color: "#334155", cursor: "pointer" }}>
                  <input type="checkbox" checked={fireCodeSmokeDetectors} onChange={(e) => setFireCodeSmokeDetectors(e.target.checked)} style={{ accentColor: "#7c3aed" }} />
                  SMOKE DETECTORS
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.74rem", fontWeight: "600", color: "#334155", cursor: "pointer" }}>
                  <input type="checkbox" checked={fireCodeEmergencyLights} onChange={(e) => setFireCodeEmergencyLights(e.target.checked)} style={{ accentColor: "#7c3aed" }} />
                  EMERGENCY LIGHTS
                </label>
              </div>

              {/* Column 3 */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.74rem", fontWeight: "600", color: "#334155", cursor: "pointer" }}>
                  <input type="checkbox" checked={Boolean(fireCodeOthers)} onChange={(e) => { if (!e.target.checked) setFireCodeOthers(""); else setFireCodeOthers("Fire escape & alarm system"); }} style={{ accentColor: "#7c3aed" }} />
                  OTHERS (Specify)
                </label>
                <input
                  type="text"
                  placeholder="Specify other fire safety compliance..."
                  value={fireCodeOthers}
                  onChange={(e) => setFireCodeOthers(e.target.value)}
                  style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem", background: "white" }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3.5: ELECTRICAL SPECIFICATIONS & OUTLETS (NBC FORM E-01) */}
        <div style={{
          background: "#ffffff",
          borderRadius: "16px",
          border: "1px solid #e2e8f0",
          padding: "1.75rem",
          marginBottom: "1.5rem",
          boxShadow: "0 2px 10px rgba(0,0,0,0.03)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#e0e7ff", color: "#4338ca", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Zap size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: "1.15rem", fontWeight: "700", color: "#0f172a", margin: 0 }}>
                Schedule of Electrical Outlets (NBC Form E-01)
              </h2>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b" }}>
                Number of Outlets for Electrical Permit computation and official form filing
              </p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                Lighting Outlets (LIGHT) *
              </label>
              <input
                type="number"
                required
                value={lightingOutletsCount}
                onChange={(e) => setLightingOutletsCount(e.target.value)}
                style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                Convenience (CONVENIENCE) *
              </label>
              <input
                type="number"
                required
                value={convenienceOutletsCount}
                onChange={(e) => setConvenienceOutletsCount(e.target.value)}
                style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                Aircon Outlets (SPO, AIRCON) *
              </label>
              <input
                type="number"
                required
                value={acuOutletsCount}
                onChange={(e) => setAcuOutletsCount(e.target.value)}
                style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                Cooking Unit (SPO, COOKING UNIT) *
              </label>
              <input
                type="number"
                required
                value={cookingUnitOutletsCount}
                onChange={(e) => setCookingUnitOutletsCount(e.target.value)}
                style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                Water Heater (SPO, WATER HEATER) *
              </label>
              <input
                type="number"
                required
                value={waterHeaterOutletsCount}
                onChange={(e) => setWaterHeaterOutletsCount(e.target.value)}
                style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                Water Pump (SPO, WATER PUMP) *
              </label>
              <input
                type="number"
                required
                value={waterPumpOutletsCount}
                onChange={(e) => setWaterPumpOutletsCount(e.target.value)}
                style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
              />
            </div>
          </div>

          <div style={{ marginTop: "1.5rem", paddingTop: "1.25rem", borderTop: "1px dashed #e2e8f0" }}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: "700", color: "#1e293b", marginBottom: "0.35rem" }}>
              Number of Equipment / Wiring Devices (Box 1)
            </h3>
            <p style={{ margin: "0 0 1rem 0", fontSize: "0.78rem", color: "#64748b" }}>
              Switches, signaling, and detection devices for NBC Form E-01
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                  Toggle Switch (TOGGGLE SWITCH) *
                </label>
                <input
                  type="number"
                  required
                  value={toggleSwitchCount}
                  onChange={(e) => setToggleSwitchCount(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                  Bell / Buzzer (BELL/BUZZER) *
                </label>
                <input
                  type="number"
                  required
                  value={bellBuzzerCount}
                  onChange={(e) => setBellBuzzerCount(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                  Push Buttons (PUSH BUTTONS) *
                </label>
                <input
                  type="number"
                  required
                  value={pushButtonsCount}
                  onChange={(e) => setPushButtonsCount(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                  FA Detector (FA DETECTOR) *
                </label>
                <input
                  type="number"
                  required
                  value={faDetectorCount}
                  onChange={(e) => setFaDetectorCount(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                  Others (SEE ATTACHED LIST) *
                </label>
                <input
                  type="number"
                  required
                  value={otherWiringDevicesCount}
                  onChange={(e) => setOtherWiringDevicesCount(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 4: DESIGN PROFESSIONALS IN CHARGE */}
        <div style={{
          background: "#ffffff",
          borderRadius: "16px",
          border: "1px solid #e2e8f0",
          padding: "1.75rem",
          marginBottom: "1.5rem",
          boxShadow: "0 2px 10px rgba(0,0,0,0.03)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#ede9fe", color: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Wrench size={20} />
            </div>
            <h2 style={{ fontSize: "1.15rem", fontWeight: "700", color: "#0f172a", margin: 0 }}>
              Design Professionals in Charge (PRC Registered)
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                Architect
              </label>
              <input
                type="text"
                value={architectName}
                onChange={(e) => setArchitectName(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                Architect PRC No.
              </label>
              <input
                type="text"
                value={architectPRC}
                onChange={(e) => setArchitectPRC(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                Civil / Structural Engineer
              </label>
              <input
                type="text"
                value={civilEngineerName}
                onChange={(e) => setCivilEngineerName(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                Civil Engineer PRC No.
              </label>
              <input
                type="text"
                value={civilEngineerPRC}
                onChange={(e) => setCivilEngineerPRC(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                Professional Electrical Engineer
              </label>
              <input
                type="text"
                value={electricalEngineerName}
                onChange={(e) => setElectricalEngineerName(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                Electrical Engineer PRC No.
              </label>
              <input
                type="text"
                value={electricalEngineerPRC}
                onChange={(e) => setElectricalEngineerPRC(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
              />
            </div>
          </div>

          <div style={{ marginBottom: "1.25rem", padding: "1rem", borderRadius: "10px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
            <SignatureCreator
              value={electricalEngineerSignature}
              onChange={setElectricalEngineerSignature}
              label={`Professional Electrical Engineer E-Signature (${electricalEngineerName || "PEE"})`}
            />
          </div>

          {/* Box 3: Electrical Contractor (200 Ampere Main and Above) */}
          <div style={{ marginBottom: "1.25rem", padding: "1rem", borderRadius: "10px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "#1e293b" }}>
                Electrical Contractor (NBC Form E-01 • Box 3)
              </span>
              <span style={{ fontSize: "0.68rem", fontWeight: "600", color: "#64748b", background: "#f1f5f9", padding: "2px 8px", borderRadius: "4px" }}>
                200A Main & Above • PCAB Special Electrical
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1.5fr", gap: "1rem", marginBottom: "0.75rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                  Contractor Name / Firm
                </label>
                <input
                  type="text"
                  value={electricalContractorName}
                  onChange={(e) => setElectricalContractorName(e.target.value)}
                  placeholder="VOLTMAX ELECTRICAL SERVICES & CONTRACTING INC."
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                  PCAB Lic. No. (Special Electrical)
                </label>
                <input
                  type="text"
                  value={electricalContractorPcab}
                  onChange={(e) => setElectricalContractorPcab(e.target.value)}
                  placeholder="PCAB-EL-2026-9811"
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1.5fr", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                  Contractor Business Address
                </label>
                <input
                  type="text"
                  value={electricalContractorAddress}
                  onChange={(e) => setElectricalContractorAddress(e.target.value)}
                  placeholder="San Fernando, Pampanga"
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                  Tel. / Fax No.
                </label>
                <input
                  type="text"
                  value={electricalContractorTel}
                  onChange={(e) => setElectricalContractorTel(e.target.value)}
                  placeholder="0918-777-8899"
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                />
              </div>
            </div>
          </div>

          {/* Box 4: Person In-Charge of Installation */}
          <div style={{ marginBottom: "1.25rem", padding: "1rem", borderRadius: "10px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <div>
                <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "#1e293b" }}>
                  Person In-Charge of Installation (NBC Form E-01 • Box 4)
                </span>
                <p style={{ margin: "2px 0 0 0", fontSize: "0.72rem", color: "#64748b" }}>
                  Professional in-charge of electrical installation works (PEE, REE, or RME)
                </p>
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.78rem", fontWeight: "700", color: "#2563eb", cursor: "pointer" }}>
                <input 
                  type="checkbox" 
                  checked={sameAsDesignElectricalEngineer} 
                  onChange={(e) => setSameAsDesignElectricalEngineer(e.target.checked)} 
                  style={{ width: "16px", height: "16px", accentColor: "#2563eb", cursor: "pointer" }}
                />
                Same as Design Professional (Box 2)
              </label>
            </div>

            {!sameAsDesignElectricalEngineer ? (
              <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid #e2e8f0" }}>
                {/* Classification Radio Buttons */}
                <div style={{ marginBottom: "0.85rem", padding: "8px 10px", borderRadius: "6px", background: "#f1f5f9" }}>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "700", color: "#1e293b", marginBottom: "6px" }}>
                    Professional Classification
                  </label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
                    <label style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "0.78rem", fontWeight: "600", color: "#334155", cursor: "pointer" }}>
                      <input
                        type="radio"
                        name="installationInChargeRoleGoogle"
                        value="PEE"
                        checked={installationInChargeRole === "PEE"}
                        onChange={() => setInstallationInChargeRole("PEE")}
                        style={{ accentColor: "#2563eb" }}
                      />
                      <span>PEE</span>
                    </label>
                    <label style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "0.78rem", fontWeight: "600", color: "#334155", cursor: "pointer" }}>
                      <input
                        type="radio"
                        name="installationInChargeRoleGoogle"
                        value="REE"
                        checked={installationInChargeRole === "REE"}
                        onChange={() => setInstallationInChargeRole("REE")}
                        style={{ accentColor: "#2563eb" }}
                      />
                      <span>REE</span>
                    </label>
                    <label style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "0.78rem", fontWeight: "600", color: "#334155", cursor: "pointer" }}>
                      <input
                        type="radio"
                        name="installationInChargeRoleGoogle"
                        value="RME"
                        checked={installationInChargeRole === "RME"}
                        onChange={() => setInstallationInChargeRole("RME")}
                        style={{ accentColor: "#2563eb" }}
                      />
                      <span>RME (&lt;600V &amp; 500kVA)</span>
                    </label>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", gap: "0.85rem", marginBottom: "0.75rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={installationInChargeName}
                      onChange={(e) => setInstallationInChargeName(e.target.value)}
                      placeholder="e.g. ENGR. EDGAR C. MENDOZA, REE"
                      style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                      PRC Reg No. *
                    </label>
                    <input
                      type="text"
                      value={installationInChargePRC}
                      onChange={(e) => setInstallationInChargePRC(e.target.value)}
                      placeholder="e.g. 0045678"
                      style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                      Validity *
                    </label>
                    <input
                      type="date"
                      value={installationInChargePRCValidity}
                      onChange={(e) => setInstallationInChargePRCValidity(e.target.value)}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1.2fr", gap: "0.85rem", marginBottom: "0.75rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                      Address *
                    </label>
                    <input
                      type="text"
                      value={installationInChargeAddress}
                      onChange={(e) => setInstallationInChargeAddress(e.target.value)}
                      placeholder="Sto. Tomas, Pampanga"
                      style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                      Tel / Fax No. *
                    </label>
                    <input
                      type="text"
                      value={installationInChargeTel}
                      onChange={(e) => setInstallationInChargeTel(e.target.value)}
                      placeholder="0917-888-1234"
                      style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.85rem", marginBottom: "0.75rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                      P.T.R No. *
                    </label>
                    <input
                      type="text"
                      value={installationInChargePTR}
                      onChange={(e) => setInstallationInChargePTR(e.target.value)}
                      placeholder="PTR-ST-2026-5566"
                      style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                      Date Issued *
                    </label>
                    <input
                      type="text"
                      value={installationInChargePTRIssued}
                      onChange={(e) => setInstallationInChargePTRIssued(e.target.value)}
                      placeholder="Jan 14, 2026"
                      style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                      Place Issued *
                    </label>
                    <input
                      type="text"
                      value={installationInChargePTRIssuedAt}
                      onChange={(e) => setInstallationInChargePTRIssuedAt(e.target.value)}
                      placeholder="Sto. Tomas"
                      style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                      Date Signed *
                    </label>
                    <input
                      type="text"
                      value={installationInChargeSignedDate}
                      onChange={(e) => setInstallationInChargeSignedDate(e.target.value)}
                      placeholder="Jan 15, 2026"
                      style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: "0.75rem" }}>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                    T.I.N *
                  </label>
                  <input
                    type="text"
                    value={installationInChargeTIN}
                    onChange={(e) => setInstallationInChargeTIN(e.target.value)}
                    placeholder="345-678-901-000"
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                  />
                </div>

                <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px dashed #cbd5e1" }}>
                  <SignatureCreator
                    value={installationInChargeSignature}
                    onChange={setInstallationInChargeSignature}
                    label={`Person In-Charge of Installation E-Signature (Box 4 - ${installationInChargeName || "Person In-Charge"})`}
                  />
                </div>
              </div>
            ) : (
              <div style={{ marginTop: "0.5rem", padding: "8px 12px", borderRadius: "6px", background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534", fontSize: "0.8rem" }}>
                Using identical credentials and signature from Box 2 (Design Professional: {electricalEngineerName || "Professional Electrical Engineer"}).
              </div>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                Professional Mechanical Engineer (PME)
              </label>
              <input
                type="text"
                value={mechanicalEngineerName}
                onChange={(e) => setMechanicalEngineerName(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                Mechanical Engineer PRC No.
              </label>
              <input
                type="text"
                value={mechanicalEngineerPRC}
                onChange={(e) => setMechanicalEngineerPRC(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                Master Plumber / Sanitary Engineer
              </label>
              <input
                type="text"
                value={masterPlumberName}
                onChange={(e) => setMasterPlumberName(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                Master Plumber PRC No.
              </label>
              <input
                type="text"
                value={masterPlumberPRC}
                onChange={(e) => setMasterPlumberPRC(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                Professional Electronics Engineer (PECE)
              </label>
              <input
                type="text"
                value={electronicsEngineerName}
                onChange={(e) => setElectronicsEngineerName(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                Electronics Engineer PRC No.
              </label>
              <input
                type="text"
                value={electronicsEngineerPRC}
                onChange={(e) => setElectronicsEngineerPRC(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
              />
            </div>
          </div>
        </div>

        {/* SUBMISSION & ERROR ALERT */}
        {submitError && (
          <div style={{ background: "#fef2f2", border: "1px solid #f87171", borderRadius: "12px", padding: "1rem", marginBottom: "1.5rem", color: "#991b1b", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <AlertCircle size={20} />
            <span>{submitError}</span>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "2rem" }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: "12px 24px",
              borderRadius: "10px",
              border: "1px solid #cbd5e1",
              background: "#ffffff",
              color: "#475569",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            ← Back to Project Selection
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              padding: "14px 32px",
              borderRadius: "10px",
              border: "none",
              background: isSubmitting ? "#94a3b8" : "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
              color: "#ffffff",
              fontWeight: "700",
              fontSize: "1rem",
              cursor: isSubmitting ? "not-allowed" : "pointer",
              boxShadow: "0 4px 15px rgba(79, 70, 229, 0.3)",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem"
            }}
          >
            {isSubmitting ? "Generating Official Permit Forms..." : "Submit Unified Permit Application"}
            {!isSubmitting && <ArrowRight size={18} />}
          </button>
        </div>
      </form>
    </div>
  );
}
