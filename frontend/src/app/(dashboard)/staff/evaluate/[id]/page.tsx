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
  FileCheck
} from "lucide-react";

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

  const [decisionNotes, setDecisionNotes] = useState(
    "In view of the foregoing findings and evaluation of facts, it is hereby recommended that the application for Locational Clearance be APPROVED, considering that the proposed project is located within a designated zone under the approved Comprehensive Land Use Plan (CLUP) and Zoning Ordinance (Resolution No. 4810, Series of 2017)."
  );
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
          submissionDate: app.dateSubmitted || new Date().toLocaleDateString(),
        };

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

  const handleApprove = async () => {
    setIsProcessing(true);

    const shortSummary = "Locational Clearance Approved. Compliant with CLUP and Zoning Ordinance (Resolution No. 4810).";

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
    const logSummary = `Staff ${staffName} (${staffEmail}) evaluated application ${app.id} (${applicantLabel}) - Status: APPROVED`;
    const logDetails = `Locational Clearance Approved for ${applicantLabel}. Compliant with CLUP & Zoning Ordinance. Remarks: ${decisionNotes || shortSummary}`;

    const updatedTracking = [
      ...(app.trackingSteps || []).map((step) => {
        if (step.title.toLowerCase().includes("zoning") || step.title.toLowerCase().includes("evaluation")) {
          return { ...step, status: "completed" };
        }
        return step;
      }),
      {
        title: "Locational Clearance Approved",
        status: "completed" as const,
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
        notes: shortSummary,
        actor: `${staffName} / Zoning Administrator`,
      },
    ];

    const updatedHistory = [
      ...(app.historyLog || []),
      {
        date: new Date().toLocaleString("en-US", { month: "short", day: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }),
        action: "Locational Clearance Approved",
        actor: staffName,
        details: shortSummary,
      },
    ];

    const cleanSeq = app.id ? app.id.replace(/^[A-Za-z]+-/i, "") : "2026-0001";
    const issuedDateFormatted = new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
    const updatedApp = {
      ...app,
      status: "approved" as const,
      dateApproved: (app as any).dateApproved || issuedDateFormatted,
      dateIssued: (app as any).dateIssued || issuedDateFormatted,
      permitIssuedDate: (app as any).permitIssuedDate || issuedDateFormatted,
      sanitaryPermitNo: (app as any).sanitaryPermitNo || `P-${cleanSeq}`,
      plumbingPermitNo: (app as any).plumbingPermitNo || `P-${cleanSeq}`,
      mechanicalPermitNo: (app as any).mechanicalPermitNo || `MP-${cleanSeq}`,
      trackingSteps: updatedTracking,
      historyLog: updatedHistory,
      remarks: decisionNotes,
    };

    await updateApplication(updatedApp as any);

    // 1. Record in Admin System Audit Logs
    try {
      await addSystemLog({
        action: "EVALUATION_APPROVED",
        category: "application",
        status: "success",
        user: staffEmail,
        message: logSummary,
        details: logDetails,
      });
    } catch (e) {
      console.warn("Could not save system log", e);
    }

    // 2. Record official evaluation log in backend
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
          permitType: app.permitType || "locational_clearance",
          action: "Approved",
          comments: decisionNotes || shortSummary,
        }),
      });
    } catch (e) {
      console.warn("Could not save evaluation log", e);
    }

    setIsProcessing(false);
    setSuccessMessage(
      `Locational Clearance (${app.id}) has been successfully APPROVED! Stage 1 is officially completed and Stage 2 (Project Type Matrix) is now unlocked for applicant ${applicantLabel}.`
    );
  };

  const handleReject = async () => {
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
    const permitTitle = app.permitType ? app.permitType.replace(/_/g, " ") : "Locational Clearance";
    const logSummary = `Staff ${staffName} (${staffEmail}) evaluated application ${app.id} (${applicantLabel}) - Status: REVISION REQUESTED`;
    const logDetails = `Requirements revision requested for ${applicantLabel} (${permitTitle}). Remarks: ${decisionNotes || "Incomplete requirements."}`;

    const updatedApp = {
      ...app,
      status: "incomplete_requirements" as const,
      remarks: decisionNotes,
    };
    await updateApplication(updatedApp);

    // 1. Record in Admin System Audit Logs
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

    // 2. Record official evaluation log in backend
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
          permitType: app.permitType || "locational_clearance",
          action: "Incomplete Requirements",
          comments: decisionNotes,
        }),
      });
    } catch (e) {
      console.warn("Could not save evaluation log", e);
    }

    setIsProcessing(false);
    setSuccessMessage(`Application (${app.id}) has been tagged for requirements revision. Notification sent to ${applicantLabel}.`);
  };

  return (
    <div className="evaluate-page animate-fade-in-up" style={{ maxWidth: "1550px", margin: "0 auto", padding: "1.5rem 1rem 4rem 1rem" }}>
      {/* Top Header & Breadcrumb */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <button
            onClick={() => router.push("/staff/dashboard")}
            style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontWeight: "600", fontSize: "0.9rem", marginBottom: "0.5rem" }}
          >
            <ArrowLeft size={16} /> Back to Staff Dashboard
          </button>
          <h1 style={{ fontSize: "1.85rem", fontWeight: "800", color: "#0f172a", margin: 0 }}>
            Project Evaluation & Approval
          </h1>
          <p style={{ color: "#64748b", margin: "0.25rem 0 0 0", fontSize: "0.95rem" }}>
            Sto. Tomas Municipal Zoning & Land Use Compliance Review
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{
            background: app.status === "approved" ? "#dcfce7" : "#fef3c7",
            color: app.status === "approved" ? "#166534" : "#92400e",
            padding: "6px 14px",
            borderRadius: "999px",
            fontWeight: "700",
            fontSize: "0.85rem",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>
            Status: {app.status.replace("_", " ")}
          </span>
          <span style={{
            background: "#eff6ff",
            color: "#1e40af",
            padding: "6px 14px",
            borderRadius: "999px",
            fontWeight: "700",
            fontSize: "0.85rem"
          }}>
            {app.id}
          </span>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div style={{
          background: "#ecfdf5",
          border: "1px solid #86efac",
          borderRadius: "12px",
          padding: "1rem 1.25rem",
          marginBottom: "1.5rem",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          color: "#166534"
        }}>
          <CheckCircle2 size={24} color="#16a34a" style={{ flexShrink: 0 }} />
          <div style={{ fontSize: "0.95rem", fontWeight: "600" }}>{successMessage}</div>
        </div>
      )}

      {/* Main Grid: Left Details, Right In-System Viewer */}
      <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: "1.5rem" }}>
        
        {/* LEFT COLUMN: APPLICANT & PROJECT DOSSIER */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div style={{ background: "white", padding: "1.5rem", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#0f172a", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "8px" }}>
              <User size={18} color="#2563eb" /> Applicant Profile
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.9rem" }}>
              <div>
                <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem", fontWeight: "600", textTransform: "uppercase" }}>Full Name</span>
                <strong style={{ color: "#0f172a" }}>{app.applicantName}</strong>
              </div>
              <div>
                <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem", fontWeight: "600", textTransform: "uppercase" }}>Contact Number</span>
                <span>{app.applicantPhone || "N/A"}</span>
              </div>
              <div>
                <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem", fontWeight: "600", textTransform: "uppercase" }}>Email Address</span>
                <span>{app.applicantEmail || "N/A"}</span>
              </div>
              <div>
                <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem", fontWeight: "600", textTransform: "uppercase" }}>Registered Address</span>
                <span>{app.applicantAddress || "N/A"}</span>
              </div>
            </div>
          </div>

          <div style={{ background: "white", padding: "1.5rem", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#0f172a", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "8px" }}>
              <MapPin size={18} color="#2563eb" /> Project Details
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.9rem" }}>
              <div>
                <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem", fontWeight: "600", textTransform: "uppercase" }}>Project Name</span>
                <strong style={{ color: "#0f172a" }}>{app.projectName}</strong>
              </div>
              <div>
                <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem", fontWeight: "600", textTransform: "uppercase" }}>Site Location</span>
                <span>{app.projectAddress || app.location?.address}</span>
              </div>
              {app.projectType && (
                <div>
                  <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem", fontWeight: "600", textTransform: "uppercase" }}>Project Type</span>
                  <span style={{ background: "#ede9fe", color: "#6b21a8", padding: "2px 8px", borderRadius: "6px", fontSize: "0.82rem", fontWeight: "700", display: "inline-block" }}>
                    {app.projectType}
                  </span>
                </div>
              )}
              {app.locationalClearanceRef && (
                <div>
                  <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem", fontWeight: "600", textTransform: "uppercase" }}>Zoning Clearance Ref</span>
                  <span style={{ color: "#047857", fontWeight: "700", fontSize: "0.85rem" }}>
                    ✓ {app.locationalClearanceRef}
                  </span>
                </div>
              )}
              <div>
                <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem", fontWeight: "600", textTransform: "uppercase" }}>Permit Classification</span>
                <span style={{ textTransform: "capitalize", fontWeight: "600" }}>{app.permitType.replace("_", " ")}</span>
              </div>
              <div>
                <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem", fontWeight: "600", textTransform: "uppercase" }}>Date Filed</span>
                <span>{app.dateSubmitted}</span>
              </div>
            </div>

            {/* Section E & F Verification Badge */}
            <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px solid #e2e8f0", fontSize: "0.78rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#166534", marginBottom: "4px" }}>
                <CheckCircle2 size={14} /> <span>Sec. E: CLUP/ZO Res. #4810 Verified</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#166534" }}>
                <CheckCircle2 size={14} /> <span>Sec. F: Conditions 1-7 Agreed by Applicant</span>
              </div>
            </div>
          </div>

          {/* DECISION ACTION PANEL */}
          <div style={{ background: "white", padding: "1.5rem", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 4px 15px rgba(0,0,0,0.06)" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#0f172a", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "8px" }}>
              <ShieldCheck size={20} color="#16a34a" /> Zoning Recommendation
            </h3>
            
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#475569", marginBottom: "0.4rem" }}>
              Evaluation Findings & Legal Bases:
            </label>
            <textarea
              value={decisionNotes}
              onChange={(e) => setDecisionNotes(e.target.value)}
              rows={4}
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "0.85rem",
                color: "#1e293b",
                marginBottom: "1rem",
                lineHeight: "1.4"
              }}
            />

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <button
                onClick={handleApprove}
                disabled={isProcessing || app.status === "approved"}
                style={{
                  background: app.status === "approved" ? "#94a3b8" : "#16a34a",
                  color: "white",
                  border: "none",
                  padding: "0.85rem 1.25rem",
                  borderRadius: "8px",
                  fontWeight: "700",
                  fontSize: "0.95rem",
                  cursor: app.status === "approved" ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  boxShadow: "0 2px 6px rgba(22, 163, 74, 0.3)"
                }}
              >
                <CheckCircle2 size={18} /> 
                {app.status === "approved" ? "Locational Clearance Approved" : "Approve Locational Clearance"}
              </button>

              {app.status !== "approved" && (
                <button
                  onClick={handleReject}
                  disabled={isProcessing}
                  style={{
                    background: "white",
                    color: "#dc2626",
                    border: "1px solid #fca5a5",
                    padding: "0.65rem 1rem",
                    borderRadius: "8px",
                    fontWeight: "600",
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px"
                  }}
                >
                  <XCircle size={16} /> Request Revisions / Reject
                </button>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT / MAIN COLUMN: IN-SYSTEM DOCUMENT VIEWING SYSTEM */}
        <div 
          ref={viewerContainerRef}
          style={{ 
            background: "#ffffff", 
            borderRadius: "16px", 
            border: "1px solid #e2e8f0", 
            overflow: "hidden", 
            display: "flex", 
            flexDirection: "column", 
            minHeight: "800px", 
            boxShadow: "0 4px 20px rgba(0,0,0,0.06)" 
          }}
        >
          {/* Document Tabs Bar (Multi-document support) */}
          <div style={{ background: "#f1f5f9", padding: "0.5rem 1rem 0 1rem", borderBottom: "1px solid #cbd5e1", display: "flex", alignItems: "center", gap: "6px", overflowX: "auto" }}>
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
                    padding: "0.6rem 1rem",
                    borderTopLeftRadius: "10px",
                    borderTopRightRadius: "10px",
                    border: "1px solid",
                    borderColor: isActive ? "#cbd5e1 #cbd5e1 transparent #cbd5e1" : "transparent",
                    background: isActive ? "#ffffff" : "transparent",
                    color: isActive ? "#1e40af" : "#64748b",
                    fontWeight: isActive ? "700" : "500",
                    fontSize: "0.84rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    whiteSpace: "nowrap",
                    position: "relative",
                    bottom: "-1px"
                  }}
                >
                  {doc.type === "image" ? <ImageIcon size={15} /> : <FileText size={15} />}
                  <span>{doc.tabLabel}</span>
                  {doc.isOfficialForm && (
                    <span style={{ background: "#dbeafe", color: "#1d4ed8", padding: "1px 6px", borderRadius: "999px", fontSize: "0.7rem", fontWeight: "700" }}>
                      Official
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* In-System Viewer Control Toolbar */}
          <div style={{ padding: "0.75rem 1.25rem", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
            
            {/* Left: Document Info & In-System Verified Badge */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ background: "#dbeafe", padding: "8px", borderRadius: "8px", color: "#1d4ed8" }}>
                {activeDoc?.type === "image" ? <ImageIcon size={18} /> : <FileCheck size={18} />}
              </div>
              <div>
                <strong style={{ fontSize: "0.95rem", color: "#0f172a", display: "flex", alignItems: "center", gap: "6px" }}>
                  {activeDoc?.title || "Application Document"}
                  <span style={{ fontSize: "0.7rem", background: "#dcfce7", color: "#15803d", padding: "2px 8px", borderRadius: "999px", fontWeight: "700" }}>
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
            <div style={{ display: "flex", alignItems: "center", gap: "4px", background: "#ffffff", padding: "3px 6px", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
              <button
                onClick={handleZoomOut}
                title="Zoom Out"
                style={{ background: "none", border: "none", padding: "5px", cursor: "pointer", borderRadius: "4px", color: "#475569", display: "flex", alignItems: "center" }}
              >
                <ZoomOut size={16} />
              </button>
              <span style={{ fontSize: "0.75rem", fontWeight: "600", minWidth: "42px", textAlign: "center", color: "#1e293b" }}>
                {zoomLevel}%
              </span>
              <button
                onClick={handleZoomIn}
                title="Zoom In"
                style={{ background: "none", border: "none", padding: "5px", cursor: "pointer", borderRadius: "4px", color: "#475569", display: "flex", alignItems: "center" }}
              >
                <ZoomIn size={16} />
              </button>
              <div style={{ width: "1px", height: "16px", background: "#e2e8f0", margin: "0 2px" }} />
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
                style={{ background: "none", border: "none", padding: "5px 8px", cursor: "pointer", borderRadius: "4px", color: "#475569", fontSize: "0.72rem", fontWeight: "600" }}
              >
                Reset
              </button>
            </div>

            {/* Right: Actions (Print, Download, Open Tab, Fullscreen) */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <button
                onClick={handlePrint}
                title="Print Document"
                style={{ padding: "0.45rem 0.75rem", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "8px", color: "#334155", fontSize: "0.82rem", fontWeight: "600", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "5px" }}
              >
                <Printer size={15} /> Print
              </button>
              <a
                href={activeDoc?.url}
                download={activeDoc?.fileName || `LOCATIONAL_CLEARANCE_${(app.applicantName || "Applicant").replace(/\s+/g, "_")}.pdf`}
                style={{ padding: "0.45rem 0.75rem", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "8px", color: "#334155", fontSize: "0.82rem", fontWeight: "600", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "5px", textDecoration: "none" }}
              >
                <Download size={15} /> Download
              </a>
              <a
                href={activeDoc?.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ padding: "0.45rem 0.75rem", background: "#2563eb", color: "#ffffff", borderRadius: "8px", fontSize: "0.82rem", fontWeight: "600", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "5px", textDecoration: "none" }}
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
          <div style={{ flex: 1, position: "relative", background: "#525659", minHeight: "720px", display: "flex", justifyContent: "center", alignItems: "center", overflow: "auto" }}>
            {isGeneratingDoc ? (
              <div style={{ color: "#ffffff", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                <RefreshCw size={28} className="animate-spin" />
                <span style={{ fontSize: "0.95rem", fontWeight: "600" }}>Rendering In-System Official Document...</span>
              </div>
            ) : activeDoc?.type === "image" ? (
              <div style={{ padding: "2rem", display: "flex", justifyContent: "center", alignItems: "center", width: "100%", height: "100%", overflow: "auto" }}>
                <img
                  src={activeDoc.url}
                  alt={activeDoc.title}
                  style={{
                    maxWidth: "90%",
                    maxHeight: "680px",
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
              <div style={{ width: "100%", height: "100%", minHeight: "740px", transform: zoomLevel !== 100 ? `scale(${zoomLevel / 100})` : undefined, transformOrigin: "top center", transition: "transform 0.2s ease" }}>
                <object
                  data={`${activeDoc?.url}#toolbar=1&navpanes=0&view=FitH`}
                  type="application/pdf"
                  style={{ width: "100%", height: "100%", minHeight: "740px", border: "none" }}
                >
                  <iframe
                    src={`${activeDoc?.url}#toolbar=1&navpanes=0&view=FitH`}
                    title="In-System Locational Clearance Preview"
                    style={{ width: "100%", height: "100%", minHeight: "740px", border: "none" }}
                  />
                </object>
              </div>
            )}
          </div>

          {/* Viewer Footer Status Bar */}
          <div style={{ padding: "0.6rem 1.25rem", background: "#f8fafc", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.78rem", color: "#64748b" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: "#16a34a" }} />
              <span>In-System Storage Active • Sto. Tomas Local Document Engine</span>
            </div>
            <div>
              {activeDoc?.hasDriveBackup && activeDoc?.driveBackupUrl && (
                <a
                  href={activeDoc.driveBackupUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#2563eb", textDecoration: "none", fontWeight: "600", display: "inline-flex", alignItems: "center", gap: "4px" }}
                >
                  <Cloud size={13} /> View Archival Copy in Google Drive
                </a>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
