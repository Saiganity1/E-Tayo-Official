import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { ProjectTypeItem, PERMIT_FORM_METADATA, PermitFormMatrix } from "../data/projectTypeMatrix";

export interface UnifiedPermitFormData {
  applicationNo: string;
  locationalClearanceRef: string;
  projectType: ProjectTypeItem;
  
  // Applicant details
  applicantName: string;
  applicantPhone: string;
  applicantEmail: string;
  applicantAddress: string;
  applicantTIN?: string;

  // Project details
  projectName: string;
  projectAddress: string;
  barangay: string;
  lotNo?: string;
  blockNo?: string;
  tctNo?: string;
  lotArea: string;
  floorArea: string;
  projectCost: string;
  scopeOfWork: string;
  occupancyClass: string;
  proposedStoreys: string;

  // Professional details
  architectName?: string;
  architectPRC?: string;
  civilEngineerName?: string;
  civilEngineerPRC?: string;
  electricalEngineerName?: string;
  electricalEngineerPRC?: string;
  masterPlumberName?: string;
  masterPlumberPRC?: string;
  mechanicalEngineerName?: string;
  mechanicalEngineerPRC?: string;
  electronicsEngineerName?: string;
  electronicsEngineerPRC?: string;

  // Active form checkboxes selected
  activePermitForms: (keyof PermitFormMatrix)[];
  submissionDate?: string;
}

export async function generateUnifiedPermitPdf(data: UnifiedPermitFormData): Promise<string> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 Size: 595 x 842 pt
  const { width, height } = page.getSize();

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const primaryColor = rgb(0.08, 0.22, 0.54); // Deep official navy
  const textDark = rgb(0.09, 0.13, 0.24);
  const textMuted = rgb(0.35, 0.42, 0.53);
  const borderLight = rgb(0.8, 0.84, 0.9);
  const fillLight = rgb(0.96, 0.97, 0.99);
  const accentGreen = rgb(0.08, 0.6, 0.32);

  // --- 1. OFFICIAL MUNICIPAL HEADER ---
  page.drawText("REPUBLIC OF THE PHILIPPINES", {
    x: 50,
    y: height - 40,
    size: 8.5,
    font: fontRegular,
    color: textMuted
  });
  page.drawText("PROVINCE OF PAMPANGA | MUNICIPALITY OF STO. TOMAS", {
    x: 50,
    y: height - 51,
    size: 9.5,
    font: fontBold,
    color: textDark
  });
  page.drawText("OFFICE OF THE LOCAL BUILDING OFFICIAL", {
    x: 50,
    y: height - 63,
    size: 11,
    font: fontBold,
    color: primaryColor
  });

  // Header badges (Application No & Locational Clearance Ref)
  const appDate = data.submissionDate || new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
  page.drawRectangle({
    x: width - 210,
    y: height - 68,
    width: 160,
    height: 38,
    color: fillLight,
    borderColor: borderLight,
    borderWidth: 1
  });
  page.drawText("APPLICATION NO.", {
    x: width - 202,
    y: height - 42,
    size: 7,
    font: fontBold,
    color: textMuted
  });
  page.drawText(data.applicationNo || "APP-2026-UNIFIED", {
    x: width - 202,
    y: height - 53,
    size: 9,
    font: fontBold,
    color: primaryColor
  });
  page.drawText(`DATE: ${appDate}`, {
    x: width - 202,
    y: height - 64,
    size: 7,
    font: fontRegular,
    color: textDark
  });

  // Title Banner
  page.drawRectangle({
    x: 50,
    y: height - 100,
    width: width - 100,
    height: 24,
    color: primaryColor
  });
  page.drawText("UNIFIED APPLICATION FOR BUILDING PERMIT & ANCILLARY CLEARANCES", {
    x: 65,
    y: height - 93,
    size: 9.5,
    font: fontBold,
    color: rgb(1, 1, 1)
  });

  // --- 2. SECTION 1: APPLICANT & PREREQUISITE ZONING CLEARANCE ---
  let curY = height - 115;
  page.drawRectangle({
    x: 50,
    y: curY - 50,
    width: width - 100,
    height: 50,
    color: rgb(1, 1, 1),
    borderColor: borderLight,
    borderWidth: 1
  });

  page.drawText("STAGE 1 PREREQUISITE CLEARANCE VERIFIED:", {
    x: 60,
    y: curY - 14,
    size: 7.5,
    font: fontBold,
    color: accentGreen
  });
  page.drawText(`✓ Locational Clearance Ref No: ${data.locationalClearanceRef || "LC-APPROVED"}`, {
    x: 60,
    y: curY - 26,
    size: 8.5,
    font: fontBold,
    color: primaryColor
  });
  page.drawText(`Applicant Name: ${data.applicantName} | Contact: ${data.applicantPhone}`, {
    x: 60,
    y: curY - 37,
    size: 8,
    font: fontRegular,
    color: textDark
  });
  page.drawText(`Address: ${data.applicantAddress}`, {
    x: 60,
    y: curY - 47,
    size: 7.5,
    font: fontRegular,
    color: textDark
  });

  // --- 3. SECTION 2: PROJECT CLASSIFICATION & DETAILS ---
  curY -= 65;
  page.drawRectangle({
    x: 50,
    y: curY - 75,
    width: width - 100,
    height: 75,
    color: fillLight,
    borderColor: borderLight,
    borderWidth: 1
  });

  page.drawText("PROJECT DESCRIPTION & SITE SPECIFICATIONS", {
    x: 60,
    y: curY - 12,
    size: 8,
    font: fontBold,
    color: primaryColor
  });

  page.drawText(`Project Type: ${data.projectType.name} (${data.projectType.category})`, {
    x: 60,
    y: curY - 25,
    size: 8.5,
    font: fontBold,
    color: textDark
  });
  page.drawText(`Project Name: ${data.projectName}`, {
    x: 60,
    y: curY - 37,
    size: 8,
    font: fontRegular,
    color: textDark
  });
  page.drawText(`Location: ${data.projectAddress || `Brgy. ${data.barangay}, Sto. Tomas, Pampanga`}`, {
    x: 60,
    y: curY - 49,
    size: 8,
    font: fontRegular,
    color: textDark
  });

  page.drawText(`Lot Area: ${data.lotArea || "N/A"} sq.m | Floor Area: ${data.floorArea || "N/A"} sq.m | Storeys: ${data.proposedStoreys || "1"}`, {
    x: 60,
    y: curY - 61,
    size: 7.5,
    font: fontRegular,
    color: textDark
  });
  page.drawText(`Est. Project Cost: PHP ${data.projectCost || "0.00"} | Scope of Work: ${data.scopeOfWork || "New Construction"}`, {
    x: 60,
    y: curY - 71,
    size: 7.5,
    font: fontBold,
    color: textDark
  });

  // --- 4. SECTION 3: MUNICIPAL PERMIT FORM CHECKLIST MATRIX ---
  curY -= 90;
  page.drawRectangle({
    x: 50,
    y: curY - 170,
    width: width - 100,
    height: 170,
    color: rgb(1, 1, 1),
    borderColor: borderLight,
    borderWidth: 1
  });

  page.drawText("PROJECT TYPE × REQUIRED PERMIT FORM EVALUATION MATRIX", {
    x: 60,
    y: curY - 14,
    size: 8,
    font: fontBold,
    color: primaryColor
  });

  // Table header
  page.drawRectangle({
    x: 55,
    y: curY - 32,
    width: width - 110,
    height: 16,
    color: rgb(0.92, 0.94, 0.98)
  });
  page.drawText("CODE", { x: 62, y: curY - 27, size: 7, font: fontBold, color: primaryColor });
  page.drawText("PERMIT / CLEARANCE FORM", { x: 105, y: curY - 27, size: 7, font: fontBold, color: primaryColor });
  page.drawText("MATRIX STATUS", { x: 330, y: curY - 27, size: 7, font: fontBold, color: primaryColor });
  page.drawText("APPLICATION STATUS", { x: 440, y: curY - 27, size: 7, font: fontBold, color: primaryColor });

  const permitKeys = Object.keys(PERMIT_FORM_METADATA) as (keyof PermitFormMatrix)[];
  let rowY = curY - 46;

  for (const key of permitKeys) {
    const meta = PERMIT_FORM_METADATA[key];
    const matrixLevel = data.projectType.matrix[key];
    const isChecked = data.activePermitForms.includes(key);

    page.drawText(meta.code, { x: 62, y: rowY, size: 7.5, font: fontBold, color: textDark });
    page.drawText(meta.label, { x: 105, y: rowY, size: 7.5, font: fontRegular, color: textDark });

    // Matrix status pill
    let matrixText = "Generally Not Required (—)";
    let matrixColor = textMuted;
    if (matrixLevel === "required") {
      matrixText = "MANDATORY (✓)";
      matrixColor = primaryColor;
    } else if (matrixLevel === "conditional") {
      matrixText = "CONDITIONAL (C)";
      matrixColor = rgb(0.8, 0.45, 0.05);
    }
    page.drawText(matrixText, { x: 330, y: rowY, size: 7, font: fontBold, color: matrixColor });

    // Application checkbox status
    if (key === "zoningPermit") {
      page.drawText("PASSED & LINKED", { x: 440, y: rowY, size: 7, font: fontBold, color: accentGreen });
    } else if (isChecked) {
      page.drawText("[✓] INCLUDED IN DOSSIER", { x: 440, y: rowY, size: 7, font: fontBold, color: primaryColor });
    } else {
      page.drawText("[  ] Not Selected", { x: 440, y: rowY, size: 7, font: fontRegular, color: textMuted });
    }

    rowY -= 14;
  }

  // --- 5. SECTION 4: DESIGN PROFESSIONALS & SIGN-OFFS ---
  curY -= 185;
  page.drawRectangle({
    x: 50,
    y: curY - 105,
    width: width - 100,
    height: 105,
    color: fillLight,
    borderColor: borderLight,
    borderWidth: 1
  });

  page.drawText("DESIGN PROFESSIONALS IN CHARGE & ACCREDITATION", {
    x: 60,
    y: curY - 13,
    size: 8,
    font: fontBold,
    color: primaryColor
  });

  page.drawText(`Architect: ${data.architectName || "Pending Appointment"} (PRC Reg: ${data.architectPRC || "N/A"})`, {
    x: 60,
    y: curY - 28,
    size: 7.5,
    font: fontRegular,
    color: textDark
  });
  page.drawText(`Civil/Structural Engineer: ${data.civilEngineerName || "Pending Appointment"} (PRC Reg: ${data.civilEngineerPRC || "N/A"})`, {
    x: 60,
    y: curY - 42,
    size: 7.5,
    font: fontRegular,
    color: textDark
  });
  page.drawText(`Professional Electrical Engineer: ${data.electricalEngineerName || "Pending Appointment"} (PRC Reg: ${data.electricalEngineerPRC || "N/A"})`, {
    x: 60,
    y: curY - 56,
    size: 7.5,
    font: fontRegular,
    color: textDark
  });
  page.drawText(`Master Plumber / Sanitary Engineer: ${data.masterPlumberName || "Pending Appointment"} (PRC Reg: ${data.masterPlumberPRC || "N/A"})`, {
    x: 60,
    y: curY - 70,
    size: 7.5,
    font: fontRegular,
    color: textDark
  });
  page.drawText(`Mechanical / Electronics Engineer: ${data.mechanicalEngineerName || data.electronicsEngineerName || "N/A"}`, {
    x: 60,
    y: curY - 84,
    size: 7.5,
    font: fontRegular,
    color: textDark
  });

  // --- 6. SECTION 5: APPLICANT ATTESTATION & OFFICIAL MUNICIPAL SEAL ---
  curY -= 120;
  page.drawRectangle({
    x: 50,
    y: curY - 75,
    width: width - 100,
    height: 75,
    color: rgb(1, 1, 1),
    borderColor: borderLight,
    borderWidth: 1
  });

  page.drawText("APPLICANT ATTESTATION & DIGITAL VERIFICATION", {
    x: 60,
    y: curY - 12,
    size: 8,
    font: fontBold,
    color: primaryColor
  });

  page.drawText("I hereby certify that all statements made herein are true and correct to the best of my knowledge and belief.", {
    x: 60,
    y: curY - 24,
    size: 7,
    font: fontRegular,
    color: textDark
  });
  page.drawText("All construction will conform to the National Building Code of the Philippines (PD 1096) and local ordinances.", {
    x: 60,
    y: curY - 34,
    size: 7,
    font: fontRegular,
    color: textDark
  });

  page.drawLine({
    start: { x: 60, y: curY - 60 },
    end: { x: 240, y: curY - 60 },
    thickness: 1,
    color: borderLight
  });
  page.drawText(data.applicantName.toUpperCase(), {
    x: 60,
    y: curY - 55,
    size: 8,
    font: fontBold,
    color: textDark
  });
  page.drawText("Signature of Applicant / Owner", {
    x: 60,
    y: curY - 68,
    size: 6.5,
    font: fontRegular,
    color: textMuted
  });

  // Municipal evaluation stamp box
  page.drawRectangle({
    x: width - 230,
    y: curY - 70,
    width: 170,
    height: 55,
    borderColor: primaryColor,
    borderWidth: 1,
    color: fillLight
  });
  page.drawText("OFFICIAL EVALUATION DESK", {
    x: width - 215,
    y: curY - 24,
    size: 7.5,
    font: fontBold,
    color: primaryColor
  });
  page.drawText("Status: RECEIVED FOR EVALUATION", {
    x: width - 215,
    y: curY - 36,
    size: 7,
    font: fontBold,
    color: accentGreen
  });
  page.drawText(`Date Received: ${appDate}`, {
    x: width - 215,
    y: curY - 48,
    size: 7,
    font: fontRegular,
    color: textDark
  });
  page.drawText("Municipal Building Official / Staff", {
    x: width - 215,
    y: curY - 60,
    size: 6.5,
    font: fontRegular,
    color: textMuted
  });

  // Footer
  page.drawText("E-Tayo Unified Permit Portal | Municipality of Sto. Tomas, Pampanga | Generated automatically via NBCP Form 1 Engine", {
    x: 50,
    y: 20,
    size: 6.5,
    font: fontRegular,
    color: textMuted
  });

  const pdfBytes = await pdfDoc.save();

  // Convert to Base64 in safe chunks
  let binary = "";
  const len = pdfBytes.byteLength;
  const CHUNK_SIZE = 8192;
  for (let i = 0; i < len; i += CHUNK_SIZE) {
    const chunk = pdfBytes.subarray(i, Math.min(i + CHUNK_SIZE, len));
    binary += String.fromCharCode.apply(null, chunk as any);
  }

  return btoa(binary);
}
