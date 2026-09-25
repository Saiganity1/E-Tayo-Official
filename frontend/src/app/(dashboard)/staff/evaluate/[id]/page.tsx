"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePermitContext } from "../../../../../context/PermitContext";
import { generateLocationalClearancePdf } from "../../../../../utils/locationalClearancePdfGenerator";
import { 
  generateUnifiedPermitPdf, 
  generateBuildingPermitPdf, 
  generateArchitecturalPermitPdf, 
  generateStructuralPermitPdf, 
  generateElectricalPermitPdf, 
  generateSanitaryPermitPdf,
  generateMechanicalPermitPdf,
  generateFencingPermitPdf,
  UnifiedPermitFormData
} from "../../../../../utils/unifiedPermitPdfGenerator";
import { PROJECT_TYPES_MATRIX, ProjectTypeItem, PermitFormMatrix } from "../../../../../data/projectTypeMatrix";
import { 
  ShieldCheck, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  ArrowLeft, 
  Download, 
  User, 
  MapPin, 
  Calendar, 
  ExternalLink,
  Eye,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Printer,
  Maximize2,
  Minimize2,
  Image as ImageIcon,
  Layers,
  Cloud,
  RefreshCw,
  FileCheck,
  Building,
  Building2,
  Calculator,
  ClipboardCheck,
  Check,
  Copy,
  ChevronRight,
  Info,
  DollarSign,
  Send,
  Sparkles,
  Lock,
  X,
  Scale,
  Award,
  BadgeCheck,
  CreditCard,
  Banknote,
  Receipt,
  Clock
} from "lucide-react";
import { dispatchPermitMessage } from "../../../../../utils/permitMessaging";

interface ViewerDoc {
  id: string;
  title: string;
  tabLabel: string;
  type: "pdf" | "image";
  url: string;
  fileName: string;
  isOfficialForm?: boolean;
  hasDriveBackup?: boolean;
  driveBackupUrl?: string;
}

export default function StaffEvaluatePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { applications, updateApplication, addSystemLog } = usePermitContext();

  const app = applications.find((a) => a.id === id);

  const isBuildingPermit = Boolean(
    app?.permitType === "building_permit" ||
    (app?.permitType && !app.permitType.includes("locational") && app.projectType && app.projectType !== "Locational Clearance") ||
    (app?.id && !app.id.startsWith("LC-"))
  );

  const officeInfo = isBuildingPermit
    ? {
        department: "Office of the Building Official (OBO)",
        subDepartment: "Municipal Engineering Office • Technical Permitting Division",
        reviewTitle: "Unified Technical Engineering & Building Evaluation",
        code: "NBCP (PD 1096)",
        legalBasis: "Presidential Decree No. 1096 (National Building Code of the Philippines) and referral codes (Architectural, Structural, Electrical, Plumbing, Sanitary, Mechanical)",
        badgeColor: "#6d28d9",
        badgeBg: "#f5f3ff",
        badgeBorder: "#ddd6fe",
      }
    : {
        department: "Municipal Planning & Development Office (MPDO)",
        subDepartment: "Zoning & Land Use Administration Division",
        reviewTitle: "Locational Clearance & Land Use Zoning Evaluation",
        code: "CLUP (Res. #4810)",
        legalBasis: "Sto. Tomas Comprehensive Land Use Plan (CLUP) and Zoning Ordinance (Resolution No. 4810, Series of 2017)",
        badgeColor: "#1e40af",
        badgeBg: "#eff6ff",
        badgeBorder: "#bfdbfe",
      };

  const [decisionNotes, setDecisionNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // In-System Document Viewer State
  const [documents, setDocuments] = useState<ViewerDoc[]>([]);
  const [activeDocIndex, setActiveDocIndex] = useState<number>(0);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isGeneratingDoc, setIsGeneratingDoc] = useState<boolean>(true);
  const viewerContainerRef = useRef<HTMLDivElement>(null);

  // Enhanced UI & Interactive Functionality State
  const [activeLeftTab, setActiveLeftTab] = useState<"overview" | "checklist" | "fees" | "decision">("overview");
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<boolean>(false);
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [selectedDeficiencies, setSelectedDeficiencies] = useState<string[]>([]);
  const [customDeficiencyNote, setCustomDeficiencyNote] = useState<string>("");

  // Payment Confirmation & Release State
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [officialReceiptInput, setOfficialReceiptInput] = useState<string>("");
  const [certifyingCashierInput, setCertifyingCashierInput] = useState<string>("Engr. Gilbert Cruz, Municipal Building Official");
  const [paymentReleaseNotes, setPaymentReleaseNotes] = useState<string>("Official receipt verified. Permits released.");

  // Engineering Disciplines Checklist State (for Building Permits)
  const [engineeringDisciplines, setEngineeringDisciplines] = useState([
    {
      id: "architectural",
      code: "AP",
      name: "Architectural Plans & Specs",
      standard: "Rule VII/VIII NBCP, BP 344 Accessibility, Room Dimensions, Egress",
      status: "compliant" as "compliant" | "pending" | "deficiency",
    },
    {
      id: "structural",
      code: "SP",
      name: "Civil / Structural Computations",
      standard: "NSCP 2015, Soil Bearing Capacity, Seismic Zone 4 Framing, Foundation",
      status: "compliant" as "compliant" | "pending" | "deficiency",
    },
    {
      id: "electrical",
      code: "EP",
      name: "Electrical Load Schedule",
      standard: "Philippine Electrical Code (PEC), Single-Line Diagram, Load Summary",
      status: "compliant" as "compliant" | "pending" | "deficiency",
    },
    {
      id: "sanitary",
      code: "PL",
      name: "Sanitary & Plumbing Layout",
      standard: "National Plumbing Code (NPC), 3-Chamber Septic Tank / STP Specs",
      status: "compliant" as "compliant" | "pending" | "deficiency",
    },
    {
      id: "mechanical",
      code: "MP",
      name: "Mechanical Equipment",
      standard: "Philippine Mechanical Code, Ventilation & Air-Conditioning Specs",
      status: "compliant" as "compliant" | "pending" | "deficiency",
    },
    {
      id: "fireSafety",
      code: "FSEC",
      name: "Fire Safety & Life Safety",
      standard: "RA 9514 (Fire Code), BFP FSEC Clearance Certificate Verified",
      status: "compliant" as "compliant" | "pending" | "deficiency",
    },
  ]);

  // Zoning Criteria Checklist State (for Locational Clearance)
  const [zoningCriteria, setZoningCriteria] = useState([
    {
      id: "landUse",
      code: "ZO-1",
      name: "Land Use & Zoning District Conformity",
      standard: "Conforms to CLUP Zoning Classification (Res. #4810)",
      status: "compliant" as "compliant" | "pending" | "deficiency",
    },
    {
      id: "setbacks",
      code: "ZO-2",
      name: "Setbacks & Road Right-of-Way (RROW)",
      standard: "Complies with front, rear, and lateral property setbacks",
      status: "compliant" as "compliant" | "pending" | "deficiency",
    },
    {
      id: "title",
      code: "ZO-3",
      name: "Proof of Ownership & Boundary Check",
      standard: "Verified TCT / Tax Declaration & Land Title Authority",
      status: "compliant" as "compliant" | "pending" | "deficiency",
    },
    {
      id: "barangay",
      code: "ZO-4",
      name: "Barangay Clearance & Community Endorsement",
      standard: "Official Barangay Construction & Zoning Endorsement Attached",
      status: "compliant" as "compliant" | "pending" | "deficiency",
    },
  ]);

  // Regulatory Fees Assessment State
  const cleanSeq = app?.id ? app.id.replace(/^[A-Za-z]+-/i, "") : "2026-0001";
  const orderOfPaymentNo = `OP-${cleanSeq}`;
  const [feeSchedule, setFeeSchedule] = useState({
    buildingFee: 3250,
    electricalFee: 1150,
    plumbingFee: 850,
    mechanicalFee: 450,
    zoningFee: 500,
  });
  const totalFees = Object.values(feeSchedule).reduce((a, b) => a + b, 0);

  // Initialize contextual decision notes
  useEffect(() => {
    if (!app) return;
    if (isBuildingPermit) {
      setDecisionNotes(
        "In view of the foregoing technical findings and evaluation of facts, it is hereby recommended that the application for Building Permit and its associated Ancillary Permits be APPROVED. All submitted architectural designs, structural computations, electrical plans, sanitary layouts, and fire safety clearances conform with Presidential Decree No. 1096 (National Building Code of the Philippines) and its implementing referral codes."
      );
    } else {
      setDecisionNotes(
        "In view of the foregoing findings and evaluation of facts, it is hereby recommended that the application for Locational Clearance be APPROVED, considering that the proposed project is located within a designated zone under the approved Comprehensive Land Use Plan (CLUP) and Zoning Ordinance (Resolution No. 4810, Series of 2017) of the Municipality of Sto. Tomas, Pampanga."
      );
    }
  }, [app?.id, isBuildingPermit]);

  useEffect(() => {
    if (!app) return;

    let isMounted = true;
    const createdBlobUrls: string[] = [];

    const resolveDocs = async () => {
      setIsGeneratingDoc(true);
      const docs: ViewerDoc[] = [];
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

      // 1. PRIMARY DOCUMENT (Locational Clearance or Unified Permit Form)
      let primaryUrl = "";
      let isGenerated = false;
      let driveBackupUrl: string | undefined = undefined;

      const rawFileUrl = app.fileUrl || "";

      // Check if rawFileUrl contains a Google Drive backup link
      if (rawFileUrl.includes("drive.google.com")) {
        driveBackupUrl = rawFileUrl.split(",").find((u) => u.includes("drive.google.com"));
      }

      // Check if rawFileUrl has local /api/files/ link
      const localFileMatch = rawFileUrl.split(",").find((u) => u.startsWith("/api/files/"));
      if (localFileMatch) {
        try {
          const fileRes = await fetch(`${apiBase}${localFileMatch}`);
          if (fileRes.ok) {
            const blob = await fileRes.blob();
            const blobUrl = URL.createObjectURL(blob);
            createdBlobUrls.push(blobUrl);
            primaryUrl = blobUrl;
          } else {
            console.warn("Backend file returned status", fileRes.status, "- falling back to in-system generator");
          }
        } catch (fetchErr) {
          console.warn("Failed to fetch backend file, falling back to in-system generator:", fetchErr);
        }
      } else if (rawFileUrl.startsWith("data:application/pdf")) {
        try {
          const parts = rawFileUrl.split(",");
          if (parts.length > 1) {
            const byteCharacters = atob(parts[1]);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: "application/pdf" });
            const blobUrl = URL.createObjectURL(blob);
            createdBlobUrls.push(blobUrl);
            primaryUrl = blobUrl;
          }
        } catch (e) {
          console.warn("Could not decode base64 PDF:", e);
        }
      }

      const isBuildingPermit = app.permitType === "building_permit" || (!app.permitType?.includes("locational") && app.projectType && app.projectType !== "Locational Clearance");

      // If no valid local file or if it was solely a Google Drive link / template, dynamically generate the official filled PDF
      if (!primaryUrl || primaryUrl.includes("drive.google.com")) {
        try {
          if (isBuildingPermit) {
            // Match project type in matrix
            const matchedProj = PROJECT_TYPES_MATRIX.find(
              (p) => p.name.toLowerCase() === (app.projectType || "").toLowerCase() ||
                     p.id.toLowerCase() === (app.projectType || "").toLowerCase()
            ) || PROJECT_TYPES_MATRIX[0];

            const mandatoryKeys = (Object.keys(matchedProj.matrix) as (keyof PermitFormMatrix)[]).filter(
              (k) => matchedProj.matrix[k] === "required"
            );

            const generatedBase64 = await generateUnifiedPermitPdf({
              applicationNo: app.id,
              locationalClearanceRef: app.locationalClearanceRef || "LC-VERIFIED",
              projectType: matchedProj,
              applicantName: app.applicantName || "Applicant",
              applicantPhone: app.applicantPhone || "0917-000-0000",
              applicantEmail: app.applicantEmail || "applicant@etayo.gov.ph",
              applicantAddress: app.applicantAddress || app.projectAddress || "Sto. Tomas, Pampanga",
              projectName: app.projectName || `${app.projectType || "Unified Building"} Construction`,
              projectAddress: app.projectAddress || app.location?.address || "Sto. Tomas, Pampanga",
              barangay: "Sto. Tomas",
              lotArea: "200",
              floorArea: "150",
              projectCost: app.estimatedFees ? `${app.estimatedFees * 500}` : "1,500,000.00",
              scopeOfWork: "New Construction",
              occupancyClass: matchedProj.category,
              proposedStoreys: "2",
              activePermitForms: mandatoryKeys,
              submissionDate: app.dateSubmitted || new Date().toLocaleDateString(),
            });

            if (generatedBase64) {
              const byteCharacters = atob(generatedBase64);
              const byteNumbers = new Array(byteCharacters.length);
              for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
              }
              const byteArray = new Uint8Array(byteNumbers);
              const blob = new Blob([byteArray], { type: "application/pdf" });
              const blobUrl = URL.createObjectURL(blob);
              createdBlobUrls.push(blobUrl);
              primaryUrl = blobUrl;
              isGenerated = true;
            }
          } else {
            const generatedBase64 = await generateLocationalClearancePdf({
              applicationNo: app.id,
              submissionDate: app.dateSubmitted || new Date().toLocaleDateString(),
              applicantName: app.applicantName || "Applicant",
              applicantAddress: app.applicantAddress || app.projectAddress || "Sto. Tomas, Pampanga",
              applicantPhone: app.applicantPhone || "0917-000-0000",
              applicantEmail: app.applicantEmail || "",
              projectName: app.projectName || `${app.projectType || "Locational Clearance"} Project`,
              projectType: app.projectType || "Locational Clearance",
              projectNature: "New Construction",
              projectAddress: app.projectAddress || app.location?.address || "Sto. Tomas, Pampanga",
              barangay: "Sto. Tomas",
              lotArea: "200",
              bldgArea: "120",
              rightOverLand: "Owner",
              projectTenure: "Permanent",
              existingLandUse: "Residential",
              isTenanted: "No",
              projectCost: app.estimatedFees ? `${app.estimatedFees * 500}` : "1,500,000.00",
            });

            if (generatedBase64) {
              const byteCharacters = atob(generatedBase64);
              const byteNumbers = new Array(byteCharacters.length);
              for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
              }
              const byteArray = new Uint8Array(byteNumbers);
              const blob = new Blob([byteArray], { type: "application/pdf" });
              const blobUrl = URL.createObjectURL(blob);
              createdBlobUrls.push(blobUrl);
              primaryUrl = blobUrl;
              isGenerated = true;
            }
          }
        } catch (genErr) {
          console.error("Failed to generate in-system official PDF, using official template:", genErr);
          primaryUrl = isBuildingPermit
            ? "/templates/UNIFIED-APPLICATION-FORM-FOR-BUILDING-PERMIT-Cruz-Final.pdf"
            : "/templates/LOCATIONAL-CLEARANCE-Sto-Tomas.pdf";
        }
      }

      docs.push({
        id: "primary-form",
        title: isBuildingPermit
          ? "Official Unified Building Permit & Ancillary Forms"
          : "Official Locational Clearance Form",
        tabLabel: isBuildingPermit ? "Official Building Permit" : "Official Clearance Form",
        type: "pdf",
        url: primaryUrl || (isBuildingPermit ? "/templates/UNIFIED-APPLICATION-FORM-FOR-BUILDING-PERMIT-Cruz-Final.pdf" : "/templates/LOCATIONAL-CLEARANCE-Sto-Tomas.pdf"),
        fileName: app.fileName || (isBuildingPermit ? `${app.id}_Unified_Permit.pdf` : `${app.id}_Locational_Clearance.pdf`),
        isOfficialForm: true,
        hasDriveBackup: Boolean(driveBackupUrl),
        driveBackupUrl: driveBackupUrl,
      });

      // If this is a building permit with an associated locational clearance reference, add the Locational Clearance tab!
      if (isBuildingPermit && app.locationalClearanceRef && app.locationalClearanceRef !== "EXEMPT") {
        try {
          const lcBase64 = await generateLocationalClearancePdf({
            applicationNo: app.locationalClearanceRef,
            submissionDate: app.dateSubmitted || new Date().toLocaleDateString(),
            applicantName: app.applicantName || "Applicant",
            applicantAddress: app.applicantAddress || app.projectAddress || "Sto. Tomas, Pampanga",
            applicantPhone: app.applicantPhone || "0917-000-0000",
            applicantEmail: app.applicantEmail || "",
            projectName: app.projectName || `${app.projectType || "Building"} Project`,
            projectType: app.projectType || "Building Construction",
            projectNature: "New Construction",
            projectAddress: app.projectAddress || app.location?.address || "Sto. Tomas, Pampanga",
            barangay: "Sto. Tomas",
            lotArea: "200",
            bldgArea: "120",
            rightOverLand: "Owner",
            projectTenure: "Permanent",
            existingLandUse: "Residential",
            isTenanted: "No",
            projectCost: app.estimatedFees ? `${app.estimatedFees * 500}` : "1,500,000.00",
          });
          if (lcBase64) {
            const byteCharacters = atob(lcBase64);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: "application/pdf" });
            const blobUrl = URL.createObjectURL(blob);
            createdBlobUrls.push(blobUrl);

            docs.push({
              id: "locational-clearance-tab",
              title: "Official Locational Clearance Form (Zoning Clearance)",
              tabLabel: "Locational Clearance",
              type: "pdf",
              url: blobUrl,
              fileName: `${app.locationalClearanceRef}_Locational_Clearance.pdf`,
              isOfficialForm: true,
            });
          }
        } catch (lcErr) {
          console.warn("Could not generate linked locational clearance tab:", lcErr);
        }
      }

      // If building permit, add dedicated tabs for all official technical engineering forms with applicant data
      if (isBuildingPermit) {
        const pTypeObj: ProjectTypeItem = (app.projectType && typeof app.projectType === "object")
          ? app.projectType
          : PROJECT_TYPES_MATRIX.find(p => p.name.toLowerCase() === (app.projectType || "").toLowerCase() || p.id === app.projectType)
          || PROJECT_TYPES_MATRIX[0];

        const cleanSeq = app.id ? app.id.replace(/^[A-Za-z]+-/i, "") : "2026-0001";
        const issuedDate = (app as any).permitIssuedDate || (app as any).dateIssued || (app.status === "approved" || app.status === "released" ? ((app as any).dateApproved || app.dateSubmitted || new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })) : undefined);
        const formData: UnifiedPermitFormData = {
          applicationNo: app.id,
          status: app.status,
          isApproved: app.status === "approved" || app.status === "released",
          buildingPermitNo: (app as any).buildingPermitNo || (pTypeObj.matrix?.buildingPermit === 'required' || !pTypeObj ? `BP-${cleanSeq}` : undefined),
          permitNo: (app as any).permitNo || `AP-${cleanSeq}`,
          architecturalPermitNo: (app as any).architecturalPermitNo || `AP-${cleanSeq}`,
          structuralPermitNo: (app as any).structuralPermitNo || `SP-${cleanSeq}`,
          sanitaryPermitNo: (app as any).sanitaryPermitNo || (app.status === "approved" || app.status === "released" ? `P-${cleanSeq}` : undefined),
          plumbingPermitNo: (app as any).plumbingPermitNo || (app.status === "approved" || app.status === "released" ? `P-${cleanSeq}` : undefined),
          mechanicalPermitNo: (app as any).mechanicalPermitNo || (app.status === "approved" || app.status === "released" ? `MP-${cleanSeq}` : undefined),
          permitIssuedDate: issuedDate,
          dateIssued: issuedDate,
          approvalDate: (app as any).approvalDate || (app as any).dateApproved,
          locationalClearanceRef: (app as any).locationalClearanceRef || "LC-2026-9307",
          projectType: pTypeObj,
          applicantName: app.applicantName || "Paul Payumo",
          applicantPhone: app.applicantPhone || "0917-123-4567",
          applicantEmail: app.applicantEmail || "applicant@etayo.gov.ph",
          applicantAddress: app.projectAddress || app.applicantAddress || "Lawasn St., Blue Diamond, Brgy. Sapa, Sto. Tomas, Pampanga",
          applicantTIN: (app as any).applicantTIN || "000-123-456-000",
          formOfOwnership: (app as any).formOfOwnership || "INDIVIDUAL / OWNER",
          projectName: app.projectName || `${pTypeObj.name} Installation & Construction`,
          projectAddress: app.projectAddress || app.location?.address || "Lawasn St., Blue Diamond",
          barangay: (app as any).barangay || "Sapa (Santo Nino)",
          lotNo: (app as any).lotNo || "Lot 12",
          blockNo: (app as any).blockNo || "Blk 4",
          tctNo: (app as any).tctNo || "TCT-123456",
          taxDecNo: (app as any).taxDecNo || "TD-2026-0012",
          lotArea: (app as any).lotArea || "200",
          floorArea: (app as any).floorArea || "120",
          buildingFootprint: (app as any).buildingFootprint || "60",
          projectCost: (app as any).projectCost || (app.estimatedFees ? `${app.estimatedFees * 500}` : "1,500,000.00"),
          scopeOfWork: (app as any).scopeOfWork || "New Construction",
          occupancyClass: (app as any).occupancyClass || "RESIDENTIAL",
          occupancyClassificationDetail: (app as any).occupancyClassificationDetail || (app as any).occupancyRuleVII || "Group A - Single Family Dwelling",
          occupancyOthers: (app as any).occupancyOthers || "",
          proposedStoreys: (app as any).proposedStoreys || "2",
          numberOfUnits: (app as any).numberOfUnits || "1",
          proposedStartDate: app.dateSubmitted || new Date().toLocaleDateString(),
          expectedCompletionDate: "WITHIN 180 DAYS",
          costBuilding: "1,200,000.00",
          costElectrical: "150,000.00",
          costMechanical: "50,000.00",
          costPlumbing: "50,000.00",
          costElectronics: "50,000.00",
          architectName: (app as any).architectName || "Arch. Maria Santos, UAP",
          architectPRC: (app as any).architectPRC || "PRC-0045211",
          civilEngineerName: (app as any).civilEngineerName || "Engr. Roberto Cruz, CE",
          civilEngineerPRC: (app as any).civilEngineerPRC || "PRC-0078923",
          electricalEngineerName: (app as any).electricalEngineerName || "Engr. Danilo Reyes, PEE",
          electricalEngineerPRC: (app as any).electricalEngineerPRC || "PRC-0033421",
          masterPlumberName: (app as any).masterPlumberName || "",
          masterPlumberPRC: (app as any).masterPlumberPRC || "",
          lightingOutletsCount: (app as any).lightingOutletsCount,
          convenienceOutletsCount: (app as any).convenienceOutletsCount,
          acuOutletsCount: (app as any).acuOutletsCount,
          cookingUnitOutletsCount: (app as any).cookingUnitOutletsCount,
          waterHeaterOutletsCount: (app as any).waterHeaterOutletsCount,
          waterPumpOutletsCount: (app as any).waterPumpOutletsCount,
          toggleSwitchCount: (app as any).toggleSwitchCount,
          bellBuzzerCount: (app as any).bellBuzzerCount,
          pushButtonsCount: (app as any).pushButtonsCount,
          faDetectorCount: (app as any).faDetectorCount,
          otherWiringDevicesCount: (app as any).otherWiringDevicesCount,
          electricalEngineerSignature: (app as any).electricalEngineerSignature,
          electricalContractorName: (app as any).electricalContractorName,
          electricalContractorPcab: (app as any).electricalContractorPcab,
          electricalContractorAddress: (app as any).electricalContractorAddress,
          electricalContractorTel: (app as any).electricalContractorTel,
          sameAsDesignElectricalEngineer: (app as any).sameAsDesignElectricalEngineer,
          installationInChargeRole: (app as any).installationInChargeRole,
          installationInChargeName: (app as any).installationInChargeName,
          installationInChargeAddress: (app as any).installationInChargeAddress,
          installationInChargePRC: (app as any).installationInChargePRC,
          installationInChargePRCValidity: (app as any).installationInChargePRCValidity,
          installationInChargeTel: (app as any).installationInChargeTel,
          installationInChargePTR: (app as any).installationInChargePTR,
          installationInChargePTRIssued: (app as any).installationInChargePTRIssued,
          installationInChargePTRIssuedAt: (app as any).installationInChargePTRIssuedAt,
          installationInChargeTIN: (app as any).installationInChargeTIN,
          installationInChargeSignedDate: (app as any).installationInChargeSignedDate,
          installationInChargeSignature: (app as any).installationInChargeSignature,
          mechanicalScopeOfWork: (app as any).mechanicalScopeOfWork || (app as any).scopeOfWork,
          mechanicalScopeDetails: (app as any).mechanicalScopeDetails,
          boiler: (app as any).boiler,
          pressureVessel: (app as any).pressureVessel,
          internalCombustionEngine: (app as any).internalCombustionEngine,
          refrigerationIce: (app as any).refrigerationIce,
          windowTypeAircon: (app as any).windowTypeAircon,
          packagedSplitAircon: (app as any).packagedSplitAircon,
          mechanicalOthers: (app as any).mechanicalOthers,
          mechanicalOthersSpecify: (app as any).mechanicalOthersSpecify,
          centralAircon: (app as any).centralAircon,
          mechanicalVentilation: (app as any).mechanicalVentilation,
          escalator: (app as any).escalator,
          movingSidewalk: (app as any).movingSidewalk,
          freightElevator: (app as any).freightElevator,
          passengerElevator: (app as any).passengerElevator,
          cableCar: (app as any).cableCar,
          dumbwaiter: (app as any).dumbwaiter,
          pumps: (app as any).pumps,
          compressedAirGas: (app as any).compressedAirGas,
          pneumaticTubesConveyors: (app as any).pneumaticTubesConveyors,
          funicular: (app as any).funicular,
          mechanicalPreparedBy: (app as any).mechanicalPreparedBy || (app as any).mechanicalEngineerName,
          machineryType: (app as any).machineryType,
          machineryBrand: (app as any).machineryBrand,
          machineryCapacity: (app as any).machineryCapacity,
          machineryPower: (app as any).machineryPower,
          machinerySpeed: (app as any).machinerySpeed,
          machineryStoreys: (app as any).machineryStoreys,
          mechanicalEngineerName: (app as any).mechanicalEngineerName,
          mechanicalEngineerPRC: (app as any).mechanicalEngineerPRC,
          mechanicalEngineerPRCValidity: (app as any).mechanicalEngineerPRCValidity,
          mechanicalEngineerPSME: (app as any).mechanicalEngineerPSME,
          mechanicalEngineerAddress: (app as any).mechanicalEngineerAddress,
          mechanicalEngineerPTRDate: (app as any).mechanicalEngineerPTRDate,
          mechanicalEngineerPTRIssuedAt: (app as any).mechanicalEngineerPTRIssuedAt,
          mechanicalEngineerSignedDate: (app as any).mechanicalEngineerSignedDate,
          mechanicalEngineerSignature: (app as any).mechanicalEngineerSignature,
          sameAsDesignMechanicalEngineer: (app as any).sameAsDesignMechanicalEngineer,
          mechSupervisorRole: (app as any).mechSupervisorRole,
          mechSupervisorName: (app as any).mechSupervisorName,
          mechSupervisorAddress: (app as any).mechSupervisorAddress,
          mechSupervisorPRC: (app as any).mechSupervisorPRC,
          mechSupervisorPRCValidity: (app as any).mechSupervisorPRCValidity,
          mechSupervisorPTR: (app as any).mechSupervisorPTR,
          mechSupervisorPTRDate: (app as any).mechSupervisorPTRDate,
          mechSupervisorPTRIssued: (app as any).mechSupervisorPTRIssued,
          mechSupervisorPTRIssuedAt: (app as any).mechSupervisorPTRIssuedAt,
          mechSupervisorTIN: (app as any).mechSupervisorTIN,
          mechSupervisorSignedDate: (app as any).mechSupervisorSignedDate,
          mechSupervisorSignature: (app as any).mechSupervisorSignature,
          applicantGovIdDateIssued: (app as any).applicantGovIdDateIssued || (app as any).govIdDateIssued,
          applicantGovIdPlaceIssued: (app as any).applicantGovIdPlaceIssued || (app as any).govIdPlaceIssued,
          applicantCtcNo: (app as any).applicantCtcNo || (app as any).govIdNo,
          lotOwnerSignedDate: (app as any).lotOwnerSignedDate,
          fencingPermitNo: (app as any).fencingPermitNo,
          fencingScopeOfWork: (app as any).fencingScopeOfWork,
          fencingScopeDetails: (app as any).fencingScopeDetails,
          fencingLength: (app as any).fencingLength || (app as any).fenceLength,
          fencingHeight: (app as any).fencingHeight || (app as any).fenceHeight,
          fencingType: (app as any).fencingType || (app as any).fenceType,
          fencingTypes: (app as any).fencingTypes,
          fencingTypeOthers: (app as any).fencingTypeOthers,
          fencingTypeOthersLine2: (app as any).fencingTypeOthersLine2,
          fencingTypeOthersLine3: (app as any).fencingTypeOthersLine3,
          fencingCost: (app as any).fencingCost || (app as any).fenceCost,
          fencingDesignerRole: (app as any).fencingDesignerRole,
          fencingSupervisorRole: (app as any).fencingSupervisorRole,
          submissionDate: app.dateSubmitted || new Date().toLocaleDateString(),
        } as any;

        const createBlobFromBase64 = (b64: string): string => {
          const byteChars = atob(b64);
          const byteNums = new Array(byteChars.length);
          for (let i = 0; i < byteChars.length; i++) {
            byteNums[i] = byteChars.charCodeAt(i);
          }
          const blob = new Blob([new Uint8Array(byteNums)], { type: "application/pdf" });
          const url = URL.createObjectURL(blob);
          createdBlobUrls.push(url);
          return url;
        };

        // 1. Architectural Permit (AP)
        try {
          const archB64 = await generateArchitecturalPermitPdf(formData);
          const archUrl = createBlobFromBase64(archB64);
          docs.push({
            id: "architectural-permit-tab",
            title: "Official Architectural Permit Form (NBC Form A-01)",
            tabLabel: "Architectural (AP)",
            type: "pdf",
            url: archUrl,
            fileName: `${app.id}_Architectural_Permit_AP.pdf`,
            isOfficialForm: true,
          });
        } catch (e) {
          docs.push({
            id: "architectural-permit-tab",
            title: "Official Architectural Permit Form (NBC Form A-01)",
            tabLabel: "Architectural (AP)",
            type: "pdf",
            url: "/templates/ARCHITECTURAL-PERMIT-Sto-Tomas-Gilbert-Cruz.pdf",
            fileName: `${app.id}_Architectural_Permit_AP.pdf`,
            isOfficialForm: true,
          });
        }

        // 2. Civil / Structural Permit (SP)
        try {
          const structB64 = await generateStructuralPermitPdf(formData);
          const structUrl = createBlobFromBase64(structB64);
          docs.push({
            id: "civil-structural-permit-tab",
            title: "Official Civil / Structural Permit Form (NBC Form S-01)",
            tabLabel: "Civil / Structural (SP)",
            type: "pdf",
            url: structUrl,
            fileName: `${app.id}_Civil_Structural_Permit_SP.pdf`,
            isOfficialForm: true,
          });
        } catch (e) {
          docs.push({
            id: "civil-structural-permit-tab",
            title: "Official Civil / Structural Permit Form (NBC Form S-01)",
            tabLabel: "Civil / Structural (SP)",
            type: "pdf",
            url: "/templates/Civil-Structural-Permit-Sto-Tomas-Gilbert-Cruz.pdf",
            fileName: `${app.id}_Civil_Structural_Permit_SP.pdf`,
            isOfficialForm: true,
          });
        }

        // 3. Electrical Permit (EP)
        try {
          const elecB64 = await generateElectricalPermitPdf(formData);
          const elecUrl = createBlobFromBase64(elecB64);
          docs.push({
            id: "electrical-permit-tab",
            title: "Official Electrical Permit Form (NBC Form E-01)",
            tabLabel: "Electrical (EP)",
            type: "pdf",
            url: elecUrl,
            fileName: `${app.id}_Electrical_Permit_EP.pdf`,
            isOfficialForm: true,
          });
        } catch (e) {
          docs.push({
            id: "electrical-permit-tab",
            title: "Official Electrical Permit Form (NBC Form E-01)",
            tabLabel: "Electrical (EP)",
            type: "pdf",
            url: "/templates/ELECTRICAL-PERMIT-FORM-Gilbert-Cruz.pdf",
            fileName: `${app.id}_Electrical_Permit_EP.pdf`,
            isOfficialForm: true,
          });
        }

        // 4. Sanitary / Plumbing Permit (PL)
        try {
          const sanB64 = await generateSanitaryPermitPdf(formData);
          const sanUrl = createBlobFromBase64(sanB64);
          docs.push({
            id: "sanitary-plumbing-permit-tab",
            title: "Official Sanitary & Plumbing Permit Form (NBC Form P-01)",
            tabLabel: "Sanitary / Plumbing (PL)",
            type: "pdf",
            url: sanUrl,
            fileName: `${app.id}_Sanitary_Plumbing_Permit_PL.pdf`,
            isOfficialForm: true,
          });
        } catch (e) {
          docs.push({
            id: "sanitary-plumbing-permit-tab",
            title: "Official Sanitary & Plumbing Permit Form (NBC Form P-01)",
            tabLabel: "Sanitary / Plumbing (PL)",
            type: "pdf",
            url: "/templates/SANITARY-PLUMBING-PERMIT-Sto-Tomas-Fixed.pdf",
            fileName: `${app.id}_Sanitary_Plumbing_Permit_PL.pdf`,
            isOfficialForm: true,
          });
        }

        // 5. Mechanical Permit (MP)
        if (pTypeObj.matrix?.mechanicalPermit === 'required' || pTypeObj.matrix?.mechanicalPermit === 'conditional' || (app as any).mechanicalPermitNo || (app as any).machineryType || (app as any).mechanicalScopeOfWork) {
          try {
            const mechB64 = await generateMechanicalPermitPdf(formData);
            const mechUrl = createBlobFromBase64(mechB64);
            docs.push({
              id: "mechanical-permit-tab",
              title: "Official Mechanical Permit Form (NBC Form M-01)",
              tabLabel: "Mechanical (MP)",
              type: "pdf",
              url: mechUrl,
              fileName: `${app.id}_Mechanical_Permit_MP.pdf`,
              isOfficialForm: true,
            });
          } catch (e) {
            docs.push({
              id: "mechanical-permit-tab",
              title: "Official Mechanical Permit Form (NBC Form M-01)",
              tabLabel: "Mechanical (MP)",
              type: "pdf",
              url: "/templates/MECHANICAL-PERMIT-Sto-Tomas-Gilbert-Cruz.pdf",
              fileName: `${app.id}_Mechanical_Permit_MP.pdf`,
              isOfficialForm: true,
            });
          }
        }

        // 6. Fencing Permit (FP)
        if (pTypeObj.matrix?.fencingPermit === 'required' || pTypeObj.matrix?.fencingPermit === 'conditional' || (app as any).fencingPermitNo || (app as any).fenceLength || (app as any).fencingScopeOfWork) {
          try {
            const fenceB64 = await generateFencingPermitPdf(formData);
            const fenceUrl = createBlobFromBase64(fenceB64);
            docs.push({
              id: "fencing-permit-tab",
              title: "Official Fencing Permit Form (NBC Form B-03)",
              tabLabel: "Fencing (FP)",
              type: "pdf",
              url: fenceUrl,
              fileName: `${app.id}_Fencing_Permit_FP.pdf`,
              isOfficialForm: true,
            });
          } catch (e) {
            docs.push({
              id: "fencing-permit-tab",
              title: "Official Fencing Permit Form (NBC Form B-03)",
              tabLabel: "Fencing (FP)",
              type: "pdf",
              url: "/templates/FENCING-PERMIT-Sto-Tomas-Gilbert-Cruz.pdf",
              fileName: `${app.id}_Fencing_Permit_FP.pdf`,
              isOfficialForm: true,
            });
          }
        }
      }

      // 2. VICINITY SKETCH MAP (if available)
      if (app.sketchImageUrl) {
        let sketchUrl = app.sketchImageUrl;
        if (sketchUrl.startsWith("/api/files/")) {
          sketchUrl = `${apiBase}${sketchUrl}`;
        }
        docs.push({
          id: "vicinity-sketch",
          title: "Section D: Vicinity Sketch Map",
          tabLabel: "Vicinity Sketch Map",
          type: "image",
          url: sketchUrl,
          fileName: `${app.id}_Vicinity_Sketch.png`,
          isOfficialForm: false,
        });
      }

      // 3. ADDITIONAL ATTACHMENTS (if multiple files were submitted)
      if (rawFileUrl && rawFileUrl.includes(",")) {
        const extraParts = rawFileUrl.split(",").filter((p) => p.trim() && !p.includes("drive.google.com"));
        for (let idx = 0; idx < extraParts.length; idx++) {
          if (idx === 0) continue; // skip primary form
          const part = extraParts[idx];
          let attUrl = part.trim();
          const isImg =
            attUrl.includes(".png") ||
            attUrl.includes(".jpg") ||
            attUrl.includes(".jpeg") ||
            attUrl.startsWith("data:image/");

          if (!isImg && attUrl.startsWith("/api/files/")) {
            try {
              const attRes = await fetch(`${apiBase}${attUrl}`);
              if (attRes.ok) {
                const attBlob = await attRes.blob();
                const attBlobUrl = URL.createObjectURL(attBlob);
                createdBlobUrls.push(attBlobUrl);
                attUrl = attBlobUrl;
              } else {
                attUrl = `${apiBase}${attUrl}`;
              }
            } catch {
              attUrl = `${apiBase}${attUrl}`;
            }
          } else if (attUrl.startsWith("/api/files/")) {
            attUrl = `${apiBase}${attUrl}`;
          }

          docs.push({
            id: `attachment-${idx}`,
            title: `Technical Engineering Attachment ${idx}`,
            tabLabel: `Attachment ${idx}`,
            type: isImg ? "image" : "pdf",
            url: attUrl,
            fileName: `${app.id}_Attachment_${idx}.${isImg ? "png" : "pdf"}`,
            isOfficialForm: false,
          });
        }
      }

      if (isMounted) {
        setDocuments(docs);
        setActiveDocIndex(0);
        setIsGeneratingDoc(false);
      }
    };

    resolveDocs();

    return () => {
      isMounted = false;
      createdBlobUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [app?.id, app?.fileUrl, app?.sketchImageUrl]);

  if (!app) {
    return (
      <div style={{ maxWidth: "600px", margin: "4rem auto", textAlign: "center", padding: "3rem", background: "white", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
        <AlertTriangle size={48} color="#f59e0b" style={{ margin: "0 auto 1rem auto" }} />
        <h2 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#0f172a" }}>Application Not Found</h2>
        <p style={{ color: "#64748b", margin: "0.5rem 0 1.5rem 0" }}>
          Could not locate application with ID: <strong>{id}</strong>.
        </p>
        <button onClick={() => router.push("/staff/dashboard")} className="btn-primary">
          <ArrowLeft size={16} /> Return to Staff Dashboard
        </button>
      </div>
    );
  }

  const activeDoc = documents[activeDocIndex] || documents[0];

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 15, 200));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 15, 50));
  const handleResetZoom = () => {
    setZoomLevel(100);
    setRotation(0);
  };
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  const handlePrint = () => {
    if (!activeDoc) return;
    const printWindow = window.open(activeDoc.url, "_blank");
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  const handleToggleFullscreen = () => {
    if (!viewerContainerRef.current) return;
    if (!isFullscreen) {
      if (viewerContainerRef.current.requestFullscreen) {
        viewerContainerRef.current.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  const handleCopyTrackingId = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (app?.id) {
      navigator.clipboard.writeText(app.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2200);
    }
  };

  const handleToggleChecklist = (itemKey: string) => {
    if (isBuildingPermit) {
      setEngineeringDisciplines(prev => prev.map(d => {
        if (d.id === itemKey) {
          const nextStatus = d.status === "compliant" ? "deficiency" : d.status === "deficiency" ? "pending" : "compliant";
          return { ...d, status: nextStatus };
        }
        return d;
      }));
    } else {
      setZoningCriteria(prev => prev.map(z => {
        if (z.id === itemKey) {
          const nextStatus = z.status === "compliant" ? "deficiency" : z.status === "deficiency" ? "pending" : "compliant";
          return { ...z, status: nextStatus };
        }
        return z;
      }));
    }
  };

  const handleMarkAllCompliant = () => {
    if (isBuildingPermit) {
      setEngineeringDisciplines(prev => prev.map(d => ({ ...d, status: "compliant" })));
    } else {
      setZoningCriteria(prev => prev.map(z => ({ ...z, status: "compliant" })));
    }
  };

  const handleApplyPreset = (preset: "standard" | "conditional" | "minor") => {
    if (isBuildingPermit) {
      if (preset === "standard") {
        setDecisionNotes(
          "In view of the foregoing technical findings and evaluation of facts, it is hereby recommended that the application for Building Permit and its associated Ancillary Permits be APPROVED. All submitted architectural designs, structural computations, electrical plans, sanitary layouts, and fire safety clearances conform with Presidential Decree No. 1096 (National Building Code of the Philippines) and its referral codes."
        );
      } else if (preset === "conditional") {
        setDecisionNotes(
          "Technical evaluation passed. Recommended for APPROVAL subject to on-site pre-pour foundation inspection by the Municipal Building Inspector and submission of concrete compressive test results within 28 days of pouring."
        );
      } else {
        setDecisionNotes(
          "Minor residential works evaluation completed. Conforms to Rule VII of NBCP and Municipal zoning clearances. Recommended for immediate permit release and Order of Payment issuance."
        );
      }
    } else {
      if (preset === "standard") {
        setDecisionNotes(
          "In view of the foregoing findings and evaluation of facts, it is hereby recommended that the application for Locational Clearance be APPROVED, considering that the proposed project is located within a designated zone under the approved Comprehensive Land Use Plan (CLUP) and Zoning Ordinance (Resolution No. 4810, Series of 2017) of the Municipality of Sto. Tomas, Pampanga."
        );
      } else if (preset === "conditional") {
        setDecisionNotes(
          "Locational Clearance RECOMMENDED FOR APPROVAL subject to maintenance of standard 3.00m front setback from existing municipal road and non-obstruction of the municipal storm drainage easement."
        );
      } else {
        setDecisionNotes(
          "Expedited zoning evaluation verified. Conforms to municipal residential low-density zone classification. Cleared for Stage 2 Technical Permitting."
        );
      }
    }
  };

  const handleApprove = async () => {
    setIsProcessing(true);

    const userStr = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    let staffName = "Staff Evaluator";
    let staffEmail = "staff@etayo.gov.ph";
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        if (u.name) staffName = u.name;
        if (u.email) staffEmail = u.email;
      } catch (e) {}
    }

    const applicantLabel = app.applicantName ? `${app.applicantName}` : app.applicantEmail || "Applicant";
    const issuedDateFormatted = new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
    const cleanSeq = app.id ? app.id.replace(/^[A-Za-z]+-/i, "") : "2026-0001";

    let shortSummary = "";
    let actionTitle = "";
    let actorLabel = "";
    let updatedTracking = [];

    if (isBuildingPermit) {
      shortSummary = `Building & Technical Permits Approved by OBO. All engineering disciplines verified compliant with PD 1096. Assessed Regulatory Fees: PHP ${totalFees.toLocaleString()}. Order of Payment: ${orderOfPaymentNo}.`;
      actionTitle = "Building & Technical Permits Approved";
      actorLabel = `${staffName} / Office of the Building Official (OBO)`;

      updatedTracking = [
        ...(app.trackingSteps || []).map((step) => {
          if (step.title.toLowerCase().includes("evaluation") || step.title.toLowerCase().includes("technical") || step.title.toLowerCase().includes("endorsement")) {
            return { ...step, status: "completed" as const };
          }
          return step;
        }),
        {
          title: "Technical Engineering Evaluation Passed",
          status: "completed" as const,
          date: issuedDateFormatted,
          notes: "All mandatory engineering permits (Architectural, Structural, Electrical, Sanitary, Fire Clearance) evaluated and verified compliant.",
          actor: actorLabel,
        },
        {
          title: "Order of Payment Issued",
          status: "completed" as const,
          date: issuedDateFormatted,
          notes: `Order of Payment No. ${orderOfPaymentNo} issued for PHP ${totalFees.toLocaleString()}. Ready for municipal cashier collection & release.`,
          actor: `${staffName} / Municipal Engineering Office`,
        },
      ];
    } else {
      shortSummary = "Locational Clearance Approved. Compliant with CLUP and Zoning Ordinance (Resolution No. 4810, Series of 2017).";
      actionTitle = "Locational Clearance Approved";
      actorLabel = `${staffName} / Zoning Administrator (MPDO)`;

      updatedTracking = [
        ...(app.trackingSteps || []).map((step) => {
          if (step.title.toLowerCase().includes("zoning") || step.title.toLowerCase().includes("evaluation")) {
            return { ...step, status: "completed" as const };
          }
          return step;
        }),
        {
          title: "Locational Clearance Approved",
          status: "completed" as const,
          date: issuedDateFormatted,
          notes: shortSummary,
          actor: actorLabel,
        },
      ];
    }

    const updatedHistory = [
      ...(app.historyLog || []),
      {
        date: new Date().toLocaleString("en-US", { month: "short", day: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }),
        action: actionTitle,
        actor: staffName,
        details: decisionNotes || shortSummary,
      },
    ];

    const updatedApp = {
      ...app,
      status: "approved" as const,
      paymentStatus: "awaiting_payment" as const,
      userConfirmedPayment: (app as any).userConfirmedPayment || false,
      dateApproved: (app as any).dateApproved || issuedDateFormatted,
      dateIssued: (app as any).dateIssued || issuedDateFormatted,
      permitIssuedDate: (app as any).permitIssuedDate || issuedDateFormatted,
      orderOfPaymentNo: orderOfPaymentNo,
      assessedFees: totalFees,
      buildingPermitNo: isBuildingPermit ? ((app as any).buildingPermitNo || `BP-${cleanSeq}`) : undefined,
      sanitaryPermitNo: (app as any).sanitaryPermitNo || `P-${cleanSeq}`,
      plumbingPermitNo: (app as any).plumbingPermitNo || `P-${cleanSeq}`,
      mechanicalPermitNo: (app as any).mechanicalPermitNo || `MP-${cleanSeq}`,
      trackingSteps: updatedTracking,
      historyLog: updatedHistory,
      remarks: decisionNotes || shortSummary,
    };

    await updateApplication(updatedApp as any);

    // 1. Automatically dispatch official approval notice & Order of Payment with fee amount to applicant
    try {
      const assessedFormatted = `PHP ${totalFees.toLocaleString()}`;
      await dispatchPermitMessage({
        applicationId: app.id,
        recipientEmail: app.applicantEmail || "applicant@etayo.gov.ph",
        senderEmail: staffEmail,
        content: `[Ref: ${app.id} - ${app.projectName || (isBuildingPermit ? "Building Permit" : "Locational Clearance")}]
🏛️ OFFICIAL NOTICE: APPLICATION APPROVED & ORDER OF PAYMENT ISSUED

Dear ${applicantLabel},

Your application (${app.id}) has been formally APPROVED by the ${isBuildingPermit ? "Office of the Building Official (OBO)" : "Municipal Planning & Development Office (MPDO)"}.

📄 Order of Payment Reference: ${orderOfPaymentNo}
💰 Total Assessed Regulatory Amount: ${assessedFormatted}

Payment Channels:
1. Municipal Treasury Office (Ground Floor, Sto. Tomas Municipal Hall, Pampanga)
2. Landbank Link.BizPortal / GCash (Sto. Tomas Municipal LGU Trust Fund)

Next Step:
Please settle the assessed regulatory fee and click "Confirm Payment Sent" on your Permit Tracking Dashboard.
Once payment is verified by the municipal cashier, your official permit documents will be IMMEDIATELY RELEASED.`,
      });
    } catch (e) {
      console.warn("Could not dispatch approval message", e);
    }

    // 2. Record in Admin System Audit Logs
    try {
      await addSystemLog({
        action: "EVALUATION_APPROVED",
        category: "application",
        status: "success",
        user: staffEmail,
        message: `Staff ${staffName} (${staffEmail}) evaluated application ${app.id} (${applicantLabel}) - Status: APPROVED`,
        details: isBuildingPermit
          ? `Building Permit Approved for ${applicantLabel}. Order of Payment ${orderOfPaymentNo} (PHP ${totalFees.toLocaleString()}) issued. Remarks: ${decisionNotes || shortSummary}`
          : `Locational Clearance Approved for ${applicantLabel}. Compliant with CLUP & Zoning Ordinance. Remarks: ${decisionNotes || shortSummary}`,
      });
    } catch (e) {
      console.warn("Could not save system log", e);
    }

    // 3. Record official evaluation log in backend
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/evaluations`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          staffEmail: staffEmail || "staff@etayo.gov.ph",
          applicantEmail: app.applicantEmail || "applicant@etayo.gov.ph",
          permitType: app.permitType || (isBuildingPermit ? "building_permit" : "locational_clearance"),
          action: "Approved",
          comments: decisionNotes || shortSummary,
        }),
      });
    } catch (e) {
      console.warn("Could not save evaluation log", e);
    }

    setIsProcessing(false);
    setSuccessMessage(
      isBuildingPermit
        ? `Building Permit & Technical Permitting Forms (${app.id}) have been successfully APPROVED! Automated Order of Payment No. ${orderOfPaymentNo} (PHP ${totalFees.toLocaleString()}) messaged to ${applicantLabel}.`
        : `Locational Clearance (${app.id}) has been successfully APPROVED! Automated Order of Payment (PHP ${totalFees.toLocaleString()}) messaged to ${applicantLabel}.`
    );
  };

  const handleConfirmPaymentAndRelease = async () => {
    if (!app) return;
    setIsProcessing(true);
    setShowPaymentModal(false);

    const userStr = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    let staffName = "Engr. Gilbert Cruz";
    let staffEmail = "staff@etayo.gov.ph";
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        if (u.name) staffName = u.name;
        if (u.email) staffEmail = u.email;
      } catch (e) {}
    }

    const applicantLabel = app.applicantName ? `${app.applicantName}` : app.applicantEmail || "Applicant";
    const releaseDateFormatted = new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
    const orNumber = officialReceiptInput.trim() || (app as any).paymentReference || `OR-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const assessedAmountStr = `PHP ${((app as any).assessedFees || totalFees).toLocaleString()}`;

    const updatedTracking = [
      ...(app.trackingSteps || []).map((step) => ({ ...step, status: "completed" as const })),
      {
        title: "Permit Officially Released",
        status: "completed" as const,
        date: releaseDateFormatted,
        notes: `Payment of ${assessedAmountStr} confirmed under Official Receipt No. ${orNumber}. All official permits and clearances have been RELEASED and made available for applicant download.`,
        actor: certifyingCashierInput.trim() || `${staffName} / Municipal Building Official & Cashier`,
      },
    ];

    const updatedHistory = [
      ...(app.historyLog || []),
      {
        date: new Date().toLocaleString("en-US", { month: "short", day: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }),
        action: "Permit Released (Payment Complete)",
        actor: staffName,
        details: `Official Receipt No. ${orNumber} verified for ${assessedAmountStr}. Permits officially released.`,
      },
    ];

    const updatedApp = {
      ...app,
      status: "released" as const,
      paymentStatus: "paid" as const,
      isReleased: true,
      officialReceiptNo: orNumber,
      dateReleased: releaseDateFormatted,
      cashierOfficer: certifyingCashierInput.trim() || staffName,
      trackingSteps: updatedTracking,
      historyLog: updatedHistory,
      remarks: paymentReleaseNotes || `Official permits released under OR #${orNumber}.`,
    };

    await updateApplication(updatedApp as any);

    // Dispatch automated release notification to applicant
    try {
      await dispatchPermitMessage({
        applicationId: app.id,
        recipientEmail: app.applicantEmail || "applicant@etayo.gov.ph",
        senderEmail: staffEmail,
        content: `[Ref: ${app.id} - ${app.projectName || (isBuildingPermit ? "Building Permit" : "Locational Clearance")}]
🎉 OFFICIAL PERMITS RELEASED!

Good day ${applicantLabel},

Your payment of ${assessedAmountStr} has been VERIFIED under Official Receipt No. ${orNumber}.
Your official ${isBuildingPermit ? "Building Permit & Ancillary Permitting Clearances" : "Locational Clearance"} have been officially RELEASED!

You may now download and print your official approved permits directly from your Permit Tracking Dashboard. Step 4 (Released) is now marked complete (Green).

Thank you for building safely and legally with the Municipality of Sto. Tomas, Pampanga.`,
      });
    } catch (e) {
      console.warn("Could not dispatch release message", e);
    }

    // Add system audit log
    try {
      await addSystemLog({
        action: "PERMIT_RELEASED",
        category: "application",
        status: "success",
        user: staffEmail,
        message: `Permit ${app.id} officially RELEASED to ${applicantLabel} (OR #${orNumber})`,
        details: `Payment complete (${assessedAmountStr}) verified by ${staffName}. Permits released.`,
      });
    } catch (e) {}

    setIsProcessing(false);
    setSuccessMessage(`Payment confirmed under OR #${orNumber}! Application ${app.id} has been officially RELEASED. Step 4 (Released) is now active and green on the applicant's portal.`);
  };

  const handleConfirmReject = async () => {
    setIsProcessing(true);
    setShowRejectModal(false);

    const userStr = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    let staffName = "Staff Evaluator";
    let staffEmail = "staff@etayo.gov.ph";
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        if (u.name) staffName = u.name;
        if (u.email) staffEmail = u.email;
      } catch (e) {}
    }

    const applicantLabel = app.applicantName ? `${app.applicantName}` : app.applicantEmail || "Applicant";
    const permitTitle = isBuildingPermit ? "Building Permit & Technical Ancillaries" : "Locational Clearance";

    let combinedRemarks = "";
    if (selectedDeficiencies.length > 0) {
      combinedRemarks += "Specific Deficiencies / Compliance Corrections Requested:\n" + selectedDeficiencies.map((d, i) => `${i + 1}. ${d}`).join("\n");
    }
    if (customDeficiencyNote.trim()) {
      combinedRemarks += (combinedRemarks ? "\n\nEvaluator Instructions:\n" : "") + customDeficiencyNote.trim();
    }
    if (!combinedRemarks.trim()) {
      combinedRemarks = decisionNotes || "Incomplete requirements or technical documentation adjustment requested by municipal evaluators.";
    }

    const logSummary = `Staff ${staffName} (${staffEmail}) evaluated application ${app.id} (${applicantLabel}) - Status: REVISION REQUESTED`;
    const logDetails = `Requirements revision requested for ${applicantLabel} (${permitTitle}). Deficiencies: ${combinedRemarks}`;

    const updatedApp = {
      ...app,
      status: "incomplete_requirements" as const,
      remarks: combinedRemarks,
      historyLog: [
        ...(app.historyLog || []),
        {
          date: new Date().toLocaleString("en-US", { month: "short", day: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }),
          action: "Notice of Deficiencies / Revisions Requested",
          actor: staffName,
          details: combinedRemarks,
        }
      ]
    };
    await updateApplication(updatedApp);

    try {
      await addSystemLog({
        action: "EVALUATION_REVISION_REQUESTED",
        category: "application",
        status: "warning",
        user: staffEmail,
        message: logSummary,
        details: logDetails,
      });
    } catch (e) {
      console.warn("Could not save system log", e);
    }

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/evaluations`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          staffEmail: staffEmail || "staff@etayo.gov.ph",
          applicantEmail: app.applicantEmail || "applicant@etayo.gov.ph",
          permitType: app.permitType || (isBuildingPermit ? "building_permit" : "locational_clearance"),
          action: "Incomplete Requirements",
          comments: combinedRemarks,
        }),
      });
    } catch (e) {
      console.warn("Could not save evaluation log", e);
    }

    setIsProcessing(false);
    setSuccessMessage(`Application (${app.id}) has been tagged for requirements revision. Formal notice sent to ${applicantLabel}.`);
  };

  const commonDeficienciesList = isBuildingPermit
    ? [
        "Missing structural design computations & soil test analysis (signed/sealed by PE)",
        "Incomplete Electrical Load Schedule or single-line diagram (signed/sealed by PEE)",
        "Sanitary & plumbing drainage isometric layout incomplete (signed/sealed by MP)",
        "Expired or unverified PRC License / PTR of Supervising Engineers / Architects",
        "Lack of official BFP Fire Safety Evaluation Clearance (FSEC) or receipt",
        "Lot setback easement infringes upon Municipal Road Right-of-Way (RROW)",
        "Unnotarized Box 1 & 2 application forms or missing lot owner consent",
      ]
    : [
        "Land use does not conform to Municipal Comprehensive Land Use Plan (CLUP)",
        "Incomplete proof of ownership (TCT, Tax Declaration, or Deed of Absolute Sale)",
        "Missing Barangay Clearance for Construction / Zoning Endorsement",
        "Setback from road boundary does not satisfy minimum municipal zoning requirement",
        "Unsigned or unverified lot boundary vicinity sketch plan",
      ];

  const totalCompliantCount = isBuildingPermit
    ? engineeringDisciplines.filter(d => d.status === "compliant").length
    : zoningCriteria.filter(z => z.status === "compliant").length;

  const totalChecklistItems = isBuildingPermit
    ? engineeringDisciplines.length
    : zoningCriteria.length;

  return (
    <div className="evaluate-page animate-fade-in-up" style={{ maxWidth: "1650px", margin: "0 auto", padding: "1.25rem 1rem 4rem 1rem" }}>
      
      {/* TOP EXECUTIVE HEADER */}
      <div style={{
        background: "white",
        borderRadius: "18px",
        border: "1.5px solid #e2e8f0",
        padding: "1.25rem 1.5rem",
        marginBottom: "1.5rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "1.25rem",
        boxShadow: "0 2px 12px rgba(0, 0, 0, 0.03)"
      }}>
        <div>
          <button
            onClick={() => router.push("/staff/dashboard")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "#f1f5f9",
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              padding: "4px 10px",
              color: "#334155",
              cursor: "pointer",
              fontWeight: "700",
              fontSize: "0.82rem",
              marginBottom: "0.5rem",
              transition: "all 0.15s ease"
            }}
          >
            <ArrowLeft size={14} /> Back to Staff Dashboard
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <h1 style={{ fontSize: "1.75rem", fontWeight: "900", color: "#0f172a", margin: 0, letterSpacing: "-0.02em" }}>
              {officeInfo.reviewTitle}
            </h1>
            <span style={{
              background: officeInfo.badgeBg,
              color: officeInfo.badgeColor,
              border: `1px solid ${officeInfo.badgeBorder}`,
              fontSize: "0.75rem",
              fontWeight: "800",
              padding: "3px 10px",
              borderRadius: "999px"
            }}>
              {officeInfo.code}
            </span>
          </div>

          <p style={{ color: "#64748b", margin: "0.25rem 0 0 0", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "8px" }}>
            <strong style={{ color: "#0f172a" }}>{officeInfo.department}</strong>
            <span>•</span>
            <span>{officeInfo.subDepartment}</span>
          </p>
        </div>

        {/* Header Right Actions & Badges */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          
          {/* Tracking ID Badge with Instant Copy */}
          <button
            type="button"
            onClick={handleCopyTrackingId}
            title="Click to copy Tracking ID"
            style={{
              background: copiedId ? "#ecfdf5" : "#f8fafc",
              border: `1.5px solid ${copiedId ? "#86efac" : "#cbd5e1"}`,
              borderRadius: "10px",
              padding: "6px 14px",
              fontSize: "0.88rem",
              fontWeight: "800",
              color: copiedId ? "#166534" : "#0f172a",
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              cursor: "pointer",
              transition: "all 0.15s ease"
            }}
          >
            <code style={{ fontFamily: "monospace", fontSize: "0.92rem" }}>{app.id}</code>
            {copiedId ? <Check size={14} color="#16a34a" /> : <Copy size={14} color="#64748b" />}
            {copiedId && <span style={{ fontSize: "0.75rem" }}>Copied</span>}
          </button>

          {/* Status Badge */}
          <span style={{
            background: app.status === "approved" ? "#dcfce7" : app.status === "incomplete_requirements" ? "#fee2e2" : "#fef3c7",
            color: app.status === "approved" ? "#166534" : app.status === "incomplete_requirements" ? "#b91c1c" : "#92400e",
            border: `1px solid ${app.status === "approved" ? "#86efac" : app.status === "incomplete_requirements" ? "#fca5a5" : "#fde68a"}`,
            padding: "7px 16px",
            borderRadius: "999px",
            fontWeight: "800",
            fontSize: "0.84rem",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px"
          }}>
            <span style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              background: app.status === "approved" ? "#16a34a" : app.status === "incomplete_requirements" ? "#dc2626" : "#d97706"
            }} />
            {app.status === "approved" ? "Approved" : app.status === "incomplete_requirements" ? "Action Required" : "Pending Review"}
          </span>

          {/* Focus Mode View Toggle */}
          <button
            onClick={() => setIsFocusMode(!isFocusMode)}
            style={{
              background: isFocusMode ? "#2563eb" : "#ffffff",
              color: isFocusMode ? "#ffffff" : "#334155",
              border: "1.5px solid #cbd5e1",
              borderRadius: "10px",
              padding: "7px 14px",
              fontSize: "0.84rem",
              fontWeight: "700",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.15s ease"
            }}
            title={isFocusMode ? "Show Evaluation Sidebar" : "Hide Sidebar for Expanded Plan View"}
          >
            {isFocusMode ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            <span>{isFocusMode ? "Split View" : "Focus Plans View"}</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div style={{
          background: "#ecfdf5",
          border: "1.5px solid #86efac",
          borderRadius: "14px",
          padding: "1rem 1.25rem",
          marginBottom: "1.5rem",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          color: "#166534",
          boxShadow: "0 2px 8px rgba(16, 185, 129, 0.1)"
        }}>
          <CheckCircle2 size={24} color="#16a34a" style={{ flexShrink: 0 }} />
          <div style={{ fontSize: "0.92rem", fontWeight: "700" }}>{successMessage}</div>
        </div>
      )}

      {/* MAIN TWO-COLUMN WORKBENCH */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isFocusMode ? "1fr" : "420px 1fr",
        gap: "1.5rem",
        alignItems: "start"
      }}>
        
        {/* LEFT COLUMN: EVALUATION WORKSPACE PANEL */}
        {!isFocusMode && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            
            {/* Segmented Tab Navigation */}
            <div style={{
              background: "#ffffff",
              borderRadius: "14px",
              padding: "5px",
              border: "1.5px solid #e2e8f0",
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "4px",
              boxShadow: "0 2px 6px rgba(0,0,0,0.02)"
            }}>
              {[
                { id: "overview", label: "Dossier", icon: FileText },
                { id: "checklist", label: "Checklist", icon: ClipboardCheck },
                { id: "fees", label: "Fees / OP", icon: Calculator },
                { id: "decision", label: "Decision", icon: ShieldCheck },
              ].map(tab => {
                const TabIcon = tab.icon;
                const isActive = activeLeftTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveLeftTab(tab.id as any)}
                    style={{
                      background: isActive ? "#0f172a" : "transparent",
                      color: isActive ? "#ffffff" : "#64748b",
                      border: "none",
                      borderRadius: "10px",
                      padding: "8px 6px",
                      fontSize: "0.78rem",
                      fontWeight: "800",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "4px",
                      transition: "all 0.15s ease"
                    }}
                  >
                    <TabIcon size={16} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* TAB CONTENT 1: DOSSIER & PROFILE OVERVIEW */}
            {activeLeftTab === "overview" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                
                {/* Applicant Profile */}
                <div style={{ background: "white", padding: "1.4rem", borderRadius: "16px", border: "1.5px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: "800", color: "#0f172a", marginBottom: "0.9rem", display: "flex", alignItems: "center", gap: "8px" }}>
                    <User size={18} color="#2563eb" /> Applicant Profile
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.88rem" }}>
                    <div>
                      <span style={{ color: "#64748b", display: "block", fontSize: "0.72rem", fontWeight: "700", textTransform: "uppercase" }}>Full Name</span>
                      <strong style={{ color: "#0f172a", fontSize: "0.95rem" }}>{app.applicantName || "Paul Payumo"}</strong>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                      <div>
                        <span style={{ color: "#64748b", display: "block", fontSize: "0.72rem", fontWeight: "700", textTransform: "uppercase" }}>Contact Number</span>
                        <span style={{ fontWeight: "600", color: "#1e293b" }}>{app.applicantPhone || "0917-123-4567"}</span>
                      </div>
                      <div>
                        <span style={{ color: "#64748b", display: "block", fontSize: "0.72rem", fontWeight: "700", textTransform: "uppercase" }}>TIN Number</span>
                        <span style={{ fontFamily: "monospace", fontSize: "0.82rem", color: "#334155" }}>{(app as any).applicantTIN || "000-123-456-000"}</span>
                      </div>
                    </div>
                    <div>
                      <span style={{ color: "#64748b", display: "block", fontSize: "0.72rem", fontWeight: "700", textTransform: "uppercase" }}>Email Address</span>
                      <span style={{ color: "#1e293b" }}>{app.applicantEmail || "applicant@etayo.gov.ph"}</span>
                    </div>
                    <div>
                      <span style={{ color: "#64748b", display: "block", fontSize: "0.72rem", fontWeight: "700", textTransform: "uppercase" }}>Registered Address</span>
                      <span style={{ color: "#334155" }}>{app.applicantAddress || app.projectAddress || "Sto. Tomas, Pampanga"}</span>
                    </div>
                  </div>
                </div>

                {/* Project Scope & Details */}
                <div style={{ background: "white", padding: "1.4rem", borderRadius: "16px", border: "1.5px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: "800", color: "#0f172a", marginBottom: "0.9rem", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Building2 size={18} color="#2563eb" /> Project Scope & Specifications
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.88rem" }}>
                    <div>
                      <span style={{ color: "#64748b", display: "block", fontSize: "0.72rem", fontWeight: "700", textTransform: "uppercase" }}>Project Name</span>
                      <strong style={{ color: "#0f172a", fontSize: "0.95rem" }}>{app.projectName}</strong>
                    </div>
                    <div>
                      <span style={{ color: "#64748b", display: "block", fontSize: "0.72rem", fontWeight: "700", textTransform: "uppercase" }}>Site Location</span>
                      <span style={{ color: "#1e293b" }}>{app.projectAddress || app.location?.address || "Sto. Tomas, Pampanga"}</span>
                    </div>
                    
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
                      <div>
                        <span style={{ color: "#64748b", display: "block", fontSize: "0.72rem", fontWeight: "700", textTransform: "uppercase" }}>Project Type</span>
                        <span style={{ background: "#ede9fe", color: "#6b21a8", padding: "3px 8px", borderRadius: "6px", fontSize: "0.8rem", fontWeight: "800", display: "inline-block" }}>
                          {typeof app.projectType === "object" ? (app.projectType as any)?.name : (app.projectType || "Residential")}
                        </span>
                      </div>
                      <div>
                        <span style={{ color: "#64748b", display: "block", fontSize: "0.72rem", fontWeight: "700", textTransform: "uppercase" }}>Occupancy Class</span>
                        <span style={{ fontWeight: "700", color: "#0f172a" }}>
                          {(app as any).occupancyClass || "Group A - Residential"}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.4rem", background: "#f8fafc", padding: "10px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                      <div>
                        <span style={{ color: "#64748b", display: "block", fontSize: "0.68rem", fontWeight: "700" }}>LOT AREA</span>
                        <strong style={{ fontSize: "0.85rem", color: "#0f172a" }}>{(app as any).lotArea || "200"} m²</strong>
                      </div>
                      <div>
                        <span style={{ color: "#64748b", display: "block", fontSize: "0.68rem", fontWeight: "700" }}>FLOOR AREA</span>
                        <strong style={{ fontSize: "0.85rem", color: "#0f172a" }}>{(app as any).floorArea || "120"} m²</strong>
                      </div>
                      <div>
                        <span style={{ color: "#64748b", display: "block", fontSize: "0.68rem", fontWeight: "700" }}>STOREYS</span>
                        <strong style={{ fontSize: "0.85rem", color: "#0f172a" }}>{(app as any).proposedStoreys || "2"} Flrs</strong>
                      </div>
                    </div>

                    {/* Cross-Link: Zoning Clearance Ref */}
                    {app.locationalClearanceRef && (
                      <div style={{
                        background: "#ecfdf5",
                        border: "1px solid #86efac",
                        borderRadius: "10px",
                        padding: "8px 12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between"
                      }}>
                        <div>
                          <span style={{ color: "#166534", fontSize: "0.72rem", fontWeight: "700", display: "block", textTransform: "uppercase" }}>
                            Linked Prerequisite Locational Clearance
                          </span>
                          <strong style={{ color: "#15803d", fontSize: "0.88rem" }}>
                            ✓ {app.locationalClearanceRef} (Approved)
                          </strong>
                        </div>
                        <span style={{ background: "#dcfce7", color: "#166534", fontSize: "0.7rem", fontWeight: "800", padding: "2px 8px", borderRadius: "999px" }}>
                          Verified
                        </span>
                      </div>
                    )}

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                      <div>
                        <span style={{ color: "#64748b", display: "block", fontSize: "0.72rem", fontWeight: "700", textTransform: "uppercase" }}>Date Filed</span>
                        <span style={{ color: "#334155" }}>{app.dateSubmitted}</span>
                      </div>
                      <div>
                        <span style={{ color: "#64748b", display: "block", fontSize: "0.72rem", fontWeight: "700", textTransform: "uppercase" }}>Estimated Cost</span>
                        <span style={{ fontWeight: "700", color: "#0f172a" }}>
                          PHP {(app as any).projectCost || "1,500,000.00"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Legal Verifications */}
                  <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px solid #e2e8f0", fontSize: "0.78rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#166534", marginBottom: "4px" }}>
                      <CheckCircle2 size={14} /> <span>Sec. E: CLUP/ZO Res. #4810 Verified</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#166534" }}>
                      <CheckCircle2 size={14} /> <span>Sec. F: Mandatory National Building Code Conditions Agreed</span>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* TAB CONTENT 2: TECHNICAL DISCIPLINES CHECKLIST */}
            {activeLeftTab === "checklist" && (
              <div style={{ background: "white", padding: "1.4rem", borderRadius: "16px", border: "1.5px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.9rem" }}>
                  <div>
                    <h3 style={{ fontSize: "1.05rem", fontWeight: "800", color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                      <ClipboardCheck size={18} color="#2563eb" /> 
                      {isBuildingPermit ? "Engineering Sign-off Checklist" : "Zoning Compliance Criteria"}
                    </h3>
                    <p style={{ margin: "2px 0 0 0", fontSize: "0.78rem", color: "#64748b" }}>
                      {totalCompliantCount} of {totalChecklistItems} items verified compliant
                    </p>
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleMarkAllCompliant}
                    style={{
                      background: "#ecfdf5",
                      color: "#166534",
                      border: "1px solid #86efac",
                      borderRadius: "8px",
                      padding: "5px 10px",
                      fontSize: "0.74rem",
                      fontWeight: "800",
                      cursor: "pointer"
                    }}
                  >
                    ✓ Mark All Compliant
                  </button>
                </div>

                {/* Progress bar */}
                <div style={{ height: "6px", borderRadius: "999px", background: "#e2e8f0", marginBottom: "1rem", overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    width: `${(totalCompliantCount / totalChecklistItems) * 100}%`,
                    background: totalCompliantCount === totalChecklistItems ? "#16a34a" : "#f59e0b",
                    transition: "all 0.3s ease"
                  }} />
                </div>

                {/* Checklist items */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {(isBuildingPermit ? engineeringDisciplines : zoningCriteria).map((item) => {
                    const isOk = item.status === "compliant";
                    const isDeficient = item.status === "deficiency";
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleToggleChecklist(item.id)}
                        style={{
                          padding: "10px 12px",
                          borderRadius: "10px",
                          border: `1.5px solid ${isOk ? "#bbf7d0" : isDeficient ? "#fca5a5" : "#fed7aa"}`,
                          background: isOk ? "#f0fdf4" : isDeficient ? "#fef2f2" : "#fffbeb",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "10px"
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{
                              fontSize: "0.7rem",
                              fontWeight: "900",
                              padding: "1px 6px",
                              borderRadius: "4px",
                              background: isOk ? "#dcfce7" : isDeficient ? "#fee2e2" : "#fef3c7",
                              color: isOk ? "#166534" : isDeficient ? "#b91c1c" : "#92400e"
                            }}>
                              {item.code}
                            </span>
                            <strong style={{ fontSize: "0.85rem", color: "#0f172a" }}>{item.name}</strong>
                          </div>
                          <div style={{ fontSize: "0.74rem", color: "#64748b", marginTop: "2px" }}>
                            {item.standard}
                          </div>
                        </div>

                        {/* Status Toggle Pill */}
                        <div style={{
                          padding: "4px 8px",
                          borderRadius: "6px",
                          fontSize: "0.72rem",
                          fontWeight: "800",
                          whiteSpace: "nowrap",
                          background: isOk ? "#16a34a" : isDeficient ? "#dc2626" : "#d97706",
                          color: "#ffffff"
                        }}>
                          {isOk ? "Compliant ✓" : isDeficient ? "Deficiency ⚠" : "Pending ⏳"}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ marginTop: "1rem", padding: "8px 12px", background: "#f8fafc", borderRadius: "8px", fontSize: "0.75rem", color: "#64748b" }}>
                  💡 <em>Click any discipline row to toggle its verification status between Compliant, Deficiency, or Pending.</em>
                </div>
              </div>
            )}

            {/* TAB CONTENT 3: REGULATORY FEES & ORDER OF PAYMENT */}
            {activeLeftTab === "fees" && (
              <div style={{ background: "white", padding: "1.4rem", borderRadius: "16px", border: "1.5px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
                <h3 style={{ fontSize: "1.05rem", fontWeight: "800", color: "#0f172a", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Calculator size={18} color="#2563eb" /> Regulatory Fees Assessment
                </h3>
                <p style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "1rem" }}>
                  Official schedule of fees assessed under the National Building Code (PD 1096) and Sto. Tomas Revenue Code.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "1.25rem" }}>
                  {[
                    { key: "buildingFee", label: "Building Construction Permit Fee" },
                    { key: "electricalFee", label: "Electrical Installation Inspection Fee" },
                    { key: "plumbingFee", label: "Plumbing & Sanitary Inspection Fee" },
                    { key: "mechanicalFee", label: "Mechanical / Ventilation Fee" },
                    { key: "zoningFee", label: "Zoning & Municipal Filing Fee" },
                  ].map(fee => (
                    <div key={fee.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem", padding: "6px 0", borderBottom: "1px dashed #e2e8f0" }}>
                      <span style={{ color: "#334155" }}>{fee.label}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <span style={{ color: "#64748b", fontSize: "0.75rem" }}>PHP</span>
                        <input
                          type="number"
                          value={(feeSchedule as any)[fee.key]}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setFeeSchedule(prev => ({ ...prev, [fee.key]: val }));
                          }}
                          style={{
                            width: "90px",
                            textAlign: "right",
                            padding: "4px 6px",
                            borderRadius: "6px",
                            border: "1px solid #cbd5e1",
                            fontSize: "0.85rem",
                            fontWeight: "700"
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total and Order of Payment Card */}
                <div style={{
                  background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
                  border: "1.5px solid #93c5fd",
                  borderRadius: "12px",
                  padding: "1rem",
                  marginBottom: "1rem"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <span style={{ fontSize: "0.78rem", fontWeight: "700", color: "#1e40af", textTransform: "uppercase" }}>Total Assessed Regulatory Fees</span>
                    <strong style={{ fontSize: "1.25rem", fontWeight: "900", color: "#1e3a8a" }}>
                      PHP {totalFees.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.78rem", color: "#1e40af" }}>
                    <span>Official Order of Payment Reference:</span>
                    <strong style={{ fontFamily: "monospace", fontSize: "0.85rem" }}>{orderOfPaymentNo}</strong>
                  </div>
                </div>

                <div style={{ fontSize: "0.75rem", color: "#166534", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "8px 10px", borderRadius: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Check size={14} /> <span>Approving this application will automatically generate Order of Payment {orderOfPaymentNo} for cashier collection.</span>
                </div>
              </div>
            )}

            {/* TAB CONTENT 4: DECISION & OFFICIAL ACTIONS */}
            {activeLeftTab === "decision" && (
              <div style={{ background: "white", padding: "1.4rem", borderRadius: "16px", border: "1.5px solid #e2e8f0", boxShadow: "0 4px 15px rgba(0,0,0,0.06)" }}>
                <h3 style={{ fontSize: "1.05rem", fontWeight: "800", color: "#0f172a", marginBottom: "0.6rem", display: "flex", alignItems: "center", gap: "8px" }}>
                  <ShieldCheck size={20} color="#16a34a" /> 
                  {isBuildingPermit ? "Technical Evaluation & Endorsement" : "Zoning Recommendation"}
                </h3>

                {/* Quick Presets */}
                <div style={{ marginBottom: "0.75rem" }}>
                  <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", color: "#64748b", marginBottom: "4px", textTransform: "uppercase" }}>
                    Quick Preset Findings:
                  </label>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset("standard")}
                      style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "6px", padding: "3px 8px", fontSize: "0.74rem", fontWeight: "700", cursor: "pointer", color: "#334155" }}
                    >
                      Standard Approval
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset("conditional")}
                      style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "6px", padding: "3px 8px", fontSize: "0.74rem", fontWeight: "700", cursor: "pointer", color: "#334155" }}
                    >
                      Conditional Approval
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset("minor")}
                      style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "6px", padding: "3px 8px", fontSize: "0.74rem", fontWeight: "700", cursor: "pointer", color: "#334155" }}
                    >
                      Expedited Minor Works
                    </button>
                  </div>
                </div>

                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "700", color: "#475569", marginBottom: "0.4rem" }}>
                  Official Evaluation Findings & Legal Basis:
                </label>
                <textarea
                  value={decisionNotes}
                  onChange={(e) => setDecisionNotes(e.target.value)}
                  rows={5}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: "10px",
                    border: "1.5px solid #cbd5e1",
                    fontSize: "0.84rem",
                    color: "#1e293b",
                    marginBottom: "1rem",
                    lineHeight: "1.45"
                  }}
                />

                {/* Evaluator Sign-off Signature block */}
                <div style={{ background: "#f8fafc", padding: "8px 12px", borderRadius: "10px", border: "1px solid #e2e8f0", marginBottom: "1.25rem", fontSize: "0.75rem", color: "#64748b" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Evaluator In-Charge:</span>
                    <strong style={{ color: "#0f172a" }}>Engr. Gilbert Cruz, Municipal Building Official</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "2px" }}>
                    <span>Jurisdiction:</span>
                    <span>Municipality of Sto. Tomas, Pampanga</span>
                  </div>
                </div>

                {/* Settlement Notice when Approved */}
                {(app.status as string) === "approved" && (
                  <div style={{
                    background: (app as any).userConfirmedPayment ? "#f0fdf4" : "#fffbeb",
                    border: `1.5px solid ${(app as any).userConfirmedPayment ? "#86efac" : "#fde68a"}`,
                    borderRadius: "12px",
                    padding: "0.85rem 1rem",
                    marginBottom: "1rem"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      {(app as any).userConfirmedPayment ? (
                        <CheckCircle2 size={16} color="#16a34a" />
                      ) : (
                        <Clock size={16} color="#d97706" />
                      )}
                      <strong style={{ fontSize: "0.84rem", color: (app as any).userConfirmedPayment ? "#166534" : "#92400e" }}>
                        {(app as any).userConfirmedPayment ? "Applicant Confirmed Payment" : "Awaiting Fee Settlement"}
                      </strong>
                    </div>
                    <div style={{ fontSize: "0.78rem", color: (app as any).userConfirmedPayment ? "#15803d" : "#78350f", lineHeight: "1.45" }}>
                      {(app as any).userConfirmedPayment ? (
                        <>
                          Payment Reference: <strong>{(app as any).paymentReference || "OR Submitted"}</strong>
                          {(app as any).paymentMethod && ` · ${(app as any).paymentMethod}`}
                          <br />
                          Assessed Amount: <strong>PHP {((app as any).assessedFees || totalFees).toLocaleString()}</strong>
                          <br />
                          <span style={{ color: "#166534", fontWeight: "700" }}>✓ Ready for cashier sign-off and permit paper release.</span>
                          {/* Receipt Photo Preview if available */}
                          {(() => {
                            const rPhoto = (app as any).paymentProofUrl || (typeof window !== "undefined" ? localStorage.getItem("etayo_receipt_" + app.id) : null);
                            if (!rPhoto) return null;
                            return (
                              <div style={{ marginTop: "8px" }}>
                                <span style={{ fontSize: "0.74rem", fontWeight: "700", color: "#166534", display: "block", marginBottom: "4px" }}>
                                  Applicant Submitted Receipt Photo:
                                </span>
                                <div
                                  onClick={() => window.open(rPhoto, "_blank")}
                                  style={{
                                    borderRadius: "10px",
                                    overflow: "hidden",
                                    border: "1.5px solid #86efac",
                                    background: "#0f172a",
                                    maxHeight: "150px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: "pointer",
                                    position: "relative"
                                  }}
                                  title="Click to view full receipt photo"
                                >
                                  <img src={rPhoto} alt="Receipt Proof" style={{ width: "100%", maxHeight: "150px", objectFit: "contain", display: "block" }} />
                                  <div style={{
                                    position: "absolute",
                                    bottom: "4px",
                                    right: "4px",
                                    background: "rgba(0,0,0,0.75)",
                                    color: "white",
                                    padding: "2px 6px",
                                    borderRadius: "4px",
                                    fontSize: "0.68rem",
                                    fontWeight: "700",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "3px"
                                  }}>
                                    <Eye size={10} /> View Photo
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </>
                      ) : (
                        <>
                          Order of Payment <strong>{(app as any).orderOfPaymentNo || orderOfPaymentNo}</strong> for <strong>PHP {((app as any).assessedFees || totalFees).toLocaleString()}</strong> was messaged to the applicant. Click below once settled to release papers.
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Primary & Secondary Action Buttons */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {(app.status as string) === "approved" ? (
                    <button
                      type="button"
                      onClick={() => {
                        setOfficialReceiptInput((app as any).paymentReference || `OR-2026-${Math.floor(10000 + Math.random() * 90000)}`);
                        setShowPaymentModal(true);
                      }}
                      disabled={isProcessing}
                      style={{
                        background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                        color: "white",
                        border: "none",
                        padding: "0.95rem 1.25rem",
                        borderRadius: "10px",
                        fontWeight: "800",
                        fontSize: "0.95rem",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        boxShadow: "0 4px 14px rgba(5, 150, 105, 0.4)",
                        transition: "all 0.2s ease"
                      }}
                    >
                      <CheckCircle2 size={18} />
                      <span>Confirmed Payment &amp; Release Permit</span>
                    </button>
                  ) : app.status === "released" ? (
                    <div style={{
                      background: "#dcfce7",
                      border: "1.5px solid #86efac",
                      borderRadius: "10px",
                      padding: "0.85rem",
                      textAlign: "center"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", color: "#166534", fontWeight: "800", fontSize: "0.9rem" }}>
                        <CheckCircle2 size={18} color="#16a34a" />
                        <span>Permit Officially Released (Done)</span>
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#15803d", marginTop: "4px" }}>
                        Official Receipt No: <strong>{(app as any).officialReceiptNo || "Verified"}</strong> · {(app as any).dateReleased || "Released"}
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={handleApprove}
                      disabled={isProcessing}
                      style={{
                        background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                        color: "white",
                        border: "none",
                        padding: "0.95rem 1.25rem",
                        borderRadius: "10px",
                        fontWeight: "800",
                        fontSize: "0.95rem",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        boxShadow: "0 4px 14px rgba(16, 185, 129, 0.35)",
                        transition: "all 0.2s ease"
                      }}
                    >
                      <CheckCircle2 size={18} /> 
                      {isBuildingPermit ? "Approve & Issue Order of Payment" : "Approve Locational Clearance"}
                    </button>
                  )}

                  {app.status !== "approved" && app.status !== "released" && (
                    <button
                      onClick={() => setShowRejectModal(true)}
                      disabled={isProcessing}
                      style={{
                        background: "white",
                        color: "#dc2626",
                        border: "1.5px solid #fca5a5",
                        padding: "0.75rem 1rem",
                        borderRadius: "10px",
                        fontWeight: "700",
                        fontSize: "0.86rem",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        transition: "all 0.15s ease"
                      }}
                    >
                      <XCircle size={16} /> Request Revisions / Issue Deficiency Notice
                    </button>
                  )}
                </div>
              </div>
            )}

          </div>
        )}

        {/* RIGHT COLUMN: IN-SYSTEM DOCUMENT VIEWER */}
        <div 
          ref={viewerContainerRef}
          style={{ 
            background: "#ffffff", 
            borderRadius: "18px", 
            border: "1.5px solid #e2e8f0", 
            overflow: "hidden", 
            display: "flex", 
            flexDirection: "column", 
            minHeight: "820px", 
            boxShadow: "0 4px 20px rgba(0,0,0,0.05)" 
          }}
        >
          {/* Document Tabs Bar (Multi-document support with official badges) */}
          <div style={{
            background: "#f8fafc",
            padding: "0.5rem 0.75rem 0 0.75rem",
            borderBottom: "1px solid #cbd5e1",
            display: "flex",
            alignItems: "center",
            gap: "5px",
            overflowX: "auto"
          }}>
            {documents.map((doc, idx) => {
              const isActive = idx === activeDocIndex;
              return (
                <button
                  key={doc.id}
                  onClick={() => {
                    setActiveDocIndex(idx);
                    handleResetZoom();
                  }}
                  style={{
                    padding: "0.6rem 0.9rem",
                    borderTopLeftRadius: "10px",
                    borderTopRightRadius: "10px",
                    border: "1px solid",
                    borderColor: isActive ? "#cbd5e1 #cbd5e1 #ffffff #cbd5e1" : "transparent",
                    background: isActive ? "#ffffff" : "transparent",
                    color: isActive ? "#1e40af" : "#64748b",
                    fontWeight: isActive ? "800" : "600",
                    fontSize: "0.82rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    whiteSpace: "nowrap",
                    position: "relative",
                    bottom: "-1px",
                    boxShadow: isActive ? "0 -2px 6px rgba(0,0,0,0.02)" : "none",
                    transition: "all 0.15s ease"
                  }}
                >
                  {doc.type === "image" ? <ImageIcon size={14} /> : <FileText size={14} />}
                  <span>{doc.tabLabel}</span>
                  {doc.isOfficialForm ? (
                    <span style={{ background: "#dbeafe", color: "#1d4ed8", padding: "1px 6px", borderRadius: "999px", fontSize: "0.68rem", fontWeight: "800" }}>
                      Official
                    </span>
                  ) : (
                    <span style={{ background: "#f1f5f9", color: "#475569", padding: "1px 6px", borderRadius: "999px", fontSize: "0.68rem", fontWeight: "700" }}>
                      Upload
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* In-System Viewer Control Toolbar */}
          <div style={{
            padding: "0.75rem 1.25rem",
            background: "#ffffff",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "0.75rem"
          }}>
            
            {/* Left: Document Info & In-System Verified Badge */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ background: "#eff6ff", padding: "8px", borderRadius: "10px", color: "#2563eb", border: "1px solid #dbeafe" }}>
                {activeDoc?.type === "image" ? <ImageIcon size={18} /> : <FileCheck size={18} />}
              </div>
              <div>
                <strong style={{ fontSize: "0.92rem", color: "#0f172a", display: "flex", alignItems: "center", gap: "6px" }}>
                  {activeDoc?.title || "Application Document"}
                  <span style={{ fontSize: "0.68rem", background: "#dcfce7", color: "#15803d", padding: "2px 8px", borderRadius: "999px", fontWeight: "800", border: "1px solid #86efac" }}>
                    In-System Viewer
                  </span>
                </strong>
                <div style={{ fontSize: "0.75rem", color: "#64748b", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span>Sto. Tomas E-Permit Engine</span>
                  {activeDoc?.hasDriveBackup && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "#2563eb" }}>
                      • <Cloud size={12} /> Google Drive Backup Linked
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Center: Viewer Controls (Zoom, Reset, Rotate) */}
            <div style={{ display: "flex", alignItems: "center", gap: "4px", background: "#f8fafc", padding: "3px 6px", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
              <button
                onClick={handleZoomOut}
                title="Zoom Out"
                style={{ background: "none", border: "none", padding: "5px", cursor: "pointer", borderRadius: "4px", color: "#475569", display: "flex", alignItems: "center" }}
              >
                <ZoomOut size={16} />
              </button>
              <span style={{ fontSize: "0.75rem", fontWeight: "700", minWidth: "42px", textAlign: "center", color: "#1e293b" }}>
                {zoomLevel}%
              </span>
              <button
                onClick={handleZoomIn}
                title="Zoom In"
                style={{ background: "none", border: "none", padding: "5px", cursor: "pointer", borderRadius: "4px", color: "#475569", display: "flex", alignItems: "center" }}
              >
                <ZoomIn size={16} />
              </button>
              <div style={{ width: "1px", height: "16px", background: "#cbd5e1", margin: "0 2px" }} />
              {activeDoc?.type === "image" && (
                <button
                  onClick={handleRotate}
                  title="Rotate 90deg"
                  style={{ background: "none", border: "none", padding: "5px", cursor: "pointer", borderRadius: "4px", color: "#475569", display: "flex", alignItems: "center" }}
                >
                  <RotateCw size={15} />
                </button>
              )}
              <button
                onClick={handleResetZoom}
                title="Reset View"
                style={{ background: "none", border: "none", padding: "4px 8px", cursor: "pointer", borderRadius: "4px", color: "#475569", fontSize: "0.72rem", fontWeight: "700" }}
              >
                Reset
              </button>
            </div>

            {/* Right: Actions (Print, Download, Open Tab, Fullscreen) */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <button
                onClick={handlePrint}
                title="Print Document"
                style={{ padding: "0.45rem 0.75rem", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "8px", color: "#334155", fontSize: "0.82rem", fontWeight: "700", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "5px" }}
              >
                <Printer size={15} /> Print
              </button>
              <a
                href={activeDoc?.url}
                download={activeDoc?.fileName || `${app.id}_Document.pdf`}
                style={{ padding: "0.45rem 0.75rem", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "8px", color: "#334155", fontSize: "0.82rem", fontWeight: "700", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "5px", textDecoration: "none" }}
              >
                <Download size={15} /> Download
              </a>
              <a
                href={activeDoc?.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ padding: "0.45rem 0.85rem", background: "#2563eb", color: "#ffffff", borderRadius: "8px", fontSize: "0.82rem", fontWeight: "700", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "5px", textDecoration: "none", boxShadow: "0 2px 6px rgba(37, 99, 235, 0.25)" }}
              >
                <ExternalLink size={15} /> Open in New Tab
              </a>
              <button
                onClick={handleToggleFullscreen}
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                style={{ padding: "0.45rem", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "8px", color: "#475569", cursor: "pointer", display: "inline-flex", alignItems: "center" }}
              >
                {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
            </div>
          </div>

          {/* In-System Document Render Area */}
          <div style={{ flex: 1, position: "relative", background: "#334155", minHeight: "740px", display: "flex", justifyContent: "center", alignItems: "center", overflow: "auto" }}>
            {isGeneratingDoc ? (
              <div style={{ color: "#ffffff", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                <RefreshCw size={32} className="animate-spin" color="#60a5fa" />
                <span style={{ fontSize: "0.95rem", fontWeight: "700" }}>Rendering Official Government Permit Form...</span>
              </div>
            ) : activeDoc?.type === "image" ? (
              <div style={{ padding: "2rem", display: "flex", justifyContent: "center", alignItems: "center", width: "100%", height: "100%", overflow: "auto" }}>
                <img
                  src={activeDoc.url}
                  alt={activeDoc.title}
                  style={{
                    maxWidth: "92%",
                    maxHeight: "720px",
                    objectFit: "contain",
                    transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                    transition: "transform 0.2s ease",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                    borderRadius: "8px",
                    background: "#ffffff"
                  }}
                />
              </div>
            ) : (
              <div style={{ width: "100%", height: "100%", minHeight: "760px", transform: zoomLevel !== 100 ? `scale(${zoomLevel / 100})` : undefined, transformOrigin: "top center", transition: "transform 0.2s ease" }}>
                <object
                  data={`${activeDoc?.url}#toolbar=1&navpanes=0&view=FitH`}
                  type="application/pdf"
                  style={{ width: "100%", height: "100%", minHeight: "760px", border: "none" }}
                >
                  <iframe
                    src={`${activeDoc?.url}#toolbar=1&navpanes=0&view=FitH`}
                    title="In-System Official Permit Form Preview"
                    style={{ width: "100%", height: "100%", minHeight: "760px", border: "none" }}
                  />
                </object>
              </div>
            )}
          </div>

          {/* Viewer Footer Status Bar */}
          <div style={{ padding: "0.6rem 1.25rem", background: "#f8fafc", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.78rem", color: "#64748b" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: "#16a34a" }} />
              <span>In-System Digital Repository • Municipality of Sto. Tomas, Pampanga</span>
            </div>
            <div>
              {activeDoc?.hasDriveBackup && activeDoc?.driveBackupUrl && (
                <a
                  href={activeDoc.driveBackupUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#2563eb", textDecoration: "none", fontWeight: "700", display: "inline-flex", alignItems: "center", gap: "4px" }}
                >
                  <Cloud size={13} /> View Archival Copy in Google Drive
                </a>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* DEFICIENCY PUNCH LIST MODAL */}
      {showRejectModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(15, 23, 42, 0.65)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: "1rem"
        }}>
          <div style={{
            background: "white",
            borderRadius: "20px",
            border: "1.5px solid #e2e8f0",
            padding: "2rem",
            maxWidth: "640px",
            width: "100%",
            boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            maxHeight: "90vh",
            overflowY: "auto"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
              <div>
                <h3 style={{ fontSize: "1.3rem", fontWeight: "800", color: "#b91c1c", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                  <AlertTriangle size={22} color="#dc2626" /> Issue Notice of Deficiencies / Request Revisions
                </h3>
                <p style={{ margin: "4px 0 0 0", fontSize: "0.85rem", color: "#64748b" }}>
                  Select the specific technical deficiencies found in {app.id} to provide the applicant with clear corrective instructions.
                </p>
              </div>
              <button
                onClick={() => setShowRejectModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", color: "#94a3b8" }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "800", color: "#475569", marginBottom: "8px", textTransform: "uppercase" }}>
                Select Common Compliance Deficiencies:
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {commonDeficienciesList.map((item, idx) => {
                  const isChecked = selectedDeficiencies.includes(item);
                  return (
                    <label
                      key={idx}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "10px",
                        padding: "8px 12px",
                        borderRadius: "8px",
                        border: `1.5px solid ${isChecked ? "#fca5a5" : "#e2e8f0"}`,
                        background: isChecked ? "#fef2f2" : "#ffffff",
                        cursor: "pointer",
                        fontSize: "0.84rem",
                        color: isChecked ? "#991b1b" : "#334155",
                        fontWeight: isChecked ? "700" : "500",
                        transition: "all 0.15s ease"
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedDeficiencies(prev => [...prev, item]);
                          } else {
                            setSelectedDeficiencies(prev => prev.filter(d => d !== item));
                          }
                        }}
                        style={{ marginTop: "3px" }}
                      />
                      <span>{item}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "800", color: "#475569", marginBottom: "4px", textTransform: "uppercase" }}>
                Specific Evaluator Remarks / Corrective Directives:
              </label>
              <textarea
                value={customDeficiencyNote}
                onChange={(e) => setCustomDeficiencyNote(e.target.value)}
                placeholder="Enter specific notes or instructions for the applicant..."
                rows={3}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  borderRadius: "10px",
                  border: "1.5px solid #cbd5e1",
                  fontSize: "0.85rem",
                  lineHeight: "1.4"
                }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                style={{
                  background: "#f1f5f9",
                  border: "1px solid #cbd5e1",
                  borderRadius: "10px",
                  padding: "9px 18px",
                  fontSize: "0.88rem",
                  fontWeight: "700",
                  cursor: "pointer",
                  color: "#475569"
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={isProcessing}
                style={{
                  background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  padding: "9px 20px",
                  fontSize: "0.88rem",
                  fontWeight: "800",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(220, 38, 38, 0.35)"
                }}
              >
                {isProcessing ? "Processing..." : "Send Formal Notice of Deficiencies"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAYMENT COMPLETE & PERMIT RELEASE MODAL */}
      {showPaymentModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(15, 23, 42, 0.65)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: "1rem"
        }}>
          <div style={{
            background: "white",
            borderRadius: "20px",
            width: "100%",
            maxWidth: "540px",
            padding: "2rem",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            border: "1px solid #e2e8f0"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "#dcfce7", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Receipt size={24} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: "800", color: "#0f172a" }}>
                    Payment Complete & Release Permit
                  </h3>
                  <div style={{ fontSize: "0.82rem", color: "#64748b" }}>
                    Verify cashier payment settlement and officially release paper documents
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: "4px" }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Fee & Payment Summary Card */}
            <div style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: "14px", padding: "1rem 1.25rem", marginBottom: "1.25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontSize: "0.84rem", color: "#64748b" }}>Application Ref:</span>
                <span style={{ fontWeight: "800", color: "#0f172a", fontSize: "0.9rem" }}>{app.id}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontSize: "0.84rem", color: "#64748b" }}>Order of Payment No:</span>
                <span style={{ fontWeight: "700", color: "#6d28d9", fontSize: "0.88rem" }}>{(app as any).orderOfPaymentNo || orderOfPaymentNo}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "8px", borderTop: "1px dashed #cbd5e1" }}>
                <span style={{ fontSize: "0.88rem", fontWeight: "700", color: "#334155" }}>Total Regulatory Amount:</span>
                <span style={{ fontSize: "1.25rem", fontWeight: "900", color: "#059669" }}>
                  PHP {((app as any).assessedFees || totalFees).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Receipt Photo Preview if available */}
            {(() => {
              const rImg = (app as any).paymentProofUrl || (typeof window !== "undefined" ? localStorage.getItem("etayo_receipt_" + app.id) : null);
              if (!rImg) return null;
              return (
                <div style={{ marginBottom: "1.25rem" }}>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
                    Applicant Submitted Receipt Photo:
                  </label>
                  <div
                    onClick={() => window.open(rImg, "_blank")}
                    style={{
                      borderRadius: "12px",
                      overflow: "hidden",
                      border: "1.5px solid #cbd5e1",
                      background: "#0f172a",
                      maxHeight: "200px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      position: "relative"
                    }}
                    title="Click to view full receipt"
                  >
                    <img src={rImg} alt="Receipt Preview" style={{ width: "100%", maxHeight: "200px", objectFit: "contain", display: "block" }} />
                    <div style={{
                      position: "absolute",
                      bottom: "6px",
                      right: "6px",
                      background: "rgba(0,0,0,0.75)",
                      color: "white",
                      padding: "2px 8px",
                      borderRadius: "6px",
                      fontSize: "0.72rem",
                      fontWeight: "700",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px"
                    }}>
                      <Eye size={12} /> Click to View Full Image
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Form Fields */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "700", color: "#334155", marginBottom: "5px" }}>
                  Official Receipt (OR) Number / Cashier Ref: <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <input
                  type="text"
                  value={officialReceiptInput}
                  onChange={(e) => setOfficialReceiptInput(e.target.value)}
                  placeholder="e.g. OR-2026-94812"
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: "10px",
                    border: "1.5px solid #cbd5e1",
                    fontSize: "0.9rem",
                    fontWeight: "700",
                    color: "#0f172a"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "700", color: "#334155", marginBottom: "5px" }}>
                  Certifying Cashier / Building Official Signatory:
                </label>
                <input
                  type="text"
                  value={certifyingCashierInput}
                  onChange={(e) => setCertifyingCashierInput(e.target.value)}
                  placeholder="Engr. Gilbert Cruz, Municipal Building Official"
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: "10px",
                    border: "1.5px solid #cbd5e1",
                    fontSize: "0.88rem",
                    color: "#0f172a"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "700", color: "#334155", marginBottom: "5px" }}>
                  Release Verification Notes:
                </label>
                <textarea
                  value={paymentReleaseNotes}
                  onChange={(e) => setPaymentReleaseNotes(e.target.value)}
                  rows={2}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: "10px",
                    border: "1.5px solid #cbd5e1",
                    fontSize: "0.84rem",
                    color: "#334155",
                    lineHeight: "1.4"
                  }}
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                style={{
                  background: "#f1f5f9",
                  border: "1px solid #cbd5e1",
                  borderRadius: "10px",
                  padding: "9px 18px",
                  fontSize: "0.88rem",
                  fontWeight: "700",
                  cursor: "pointer",
                  color: "#475569"
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPaymentAndRelease}
                disabled={isProcessing}
                style={{
                  background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  padding: "9px 22px",
                  fontSize: "0.92rem",
                  fontWeight: "800",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: "0 4px 12px rgba(5, 150, 105, 0.35)"
                }}
              >
                <CheckCircle2 size={18} />
                <span>{isProcessing ? "Releasing Permit..." : "Confirm Payment & Release Papers"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
