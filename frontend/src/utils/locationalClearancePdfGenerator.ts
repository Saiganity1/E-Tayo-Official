import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export interface LocationalClearancePdfData {
  applicationNo: string;
  submissionDate: string;
  applicantName: string;
  applicantAddress: string;
  applicantPhone: string;
  applicantEmail?: string;
  corporationName?: string;
  representativeName?: string;
  representativeAddress?: string;
  representativePhone?: string;

  projectName: string;
  projectType: string;
  projectNature: string;
  projectAddress: string;
  barangay: string;
  lotArea: string;
  bldgArea: string;
  improvementArea?: string;
  rightOverLand: string;
  projectTenure: string;

  existingLandUse: string;
  isTenanted: string;
  projectCost: string;
  projectCostWords?: string;

  preferredMode?: string;
  ctcNumber?: string;
  ctcIssuedAt?: string;
  ctcIssuedOn?: string;
}

function safeText(str: string | undefined | null): string {
  if (!str) return "";
  return String(str)
    .replace(/[✓✔]/g, "[X]")
    .replace(/[—–]/g, "-")
    .replace(/[•●]/g, "*")
    .replace(/[₱]/g, "PHP ")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[^\x20-\x7E\t\n\r]/g, "");
}

export async function generateLocationalClearancePdf(data: LocationalClearancePdfData): Promise<string> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 Size
  const { width, height } = page.getSize();

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const primaryColor = rgb(0.02, 0.37, 0.27); // Sto. Tomas Zoning Green
  const textDark = rgb(0.09, 0.13, 0.24);
  const textMuted = rgb(0.35, 0.42, 0.53);
  const borderLight = rgb(0.8, 0.84, 0.9);
  const fillLight = rgb(0.95, 0.98, 0.96);

  const drawText = (text: string, options: any) => {
    page.drawText(safeText(text), options);
  };

  // --- 1. OFFICIAL MUNICIPAL HEADER ---
  drawText("REPUBLIC OF THE PHILIPPINES", {
    x: 50,
    y: height - 40,
    size: 8.5,
    font: fontRegular,
    color: textMuted
  });
  drawText("PROVINCE OF PAMPANGA | MUNICIPALITY OF STO. TOMAS", {
    x: 50,
    y: height - 51,
    size: 9.5,
    font: fontBold,
    color: textDark
  });
  drawText("OFFICE OF THE ZONING ADMINISTRATOR / MPDO", {
    x: 50,
    y: height - 63,
    size: 11,
    font: fontBold,
    color: primaryColor
  });

  // Application Reference Badge
  page.drawRectangle({
    x: width - 210,
    y: height - 68,
    width: 160,
    height: 38,
    color: fillLight,
    borderColor: rgb(0.65, 0.85, 0.75),
    borderWidth: 1
  });
  drawText("CLEARANCE REF NO.", {
    x: width - 202,
    y: height - 42,
    size: 7,
    font: fontBold,
    color: primaryColor
  });
  drawText(data.applicationNo || "LC-2026-0001", {
    x: width - 202,
    y: height - 53,
    size: 9,
    font: fontBold,
    color: primaryColor
  });
  drawText(`FILED: ${data.submissionDate}`, {
    x: width - 202,
    y: height - 64,
    size: 7,
    font: fontRegular,
    color: textDark
  });

  // Title Banner
  page.drawRectangle({
    x: 50,
    y: height - 98,
    width: width - 100,
    height: 22,
    color: primaryColor
  });
  drawText("OFFICIAL APPLICATION FOR LOCATIONAL CLEARANCE / ZONING COMPLIANCE", {
    x: 65,
    y: height - 92,
    size: 9.5,
    font: fontBold,
    color: rgb(1, 1, 1)
  });

  let curY = height - 110;

  // --- SECTION 1: APPLICANT & OWNER INFORMATION ---
  page.drawRectangle({
    x: 50,
    y: curY - 78,
    width: width - 100,
    height: 78,
    color: rgb(1, 1, 1),
    borderColor: borderLight,
    borderWidth: 1
  });
  drawText("1. APPLICANT & ENTERPRISE INFORMATION", {
    x: 60,
    y: curY - 14,
    size: 8,
    font: fontBold,
    color: primaryColor
  });
  drawText(`Applicant Full Name: ${data.applicantName}`, {
    x: 60,
    y: curY - 26,
    size: 8,
    font: fontBold,
    color: textDark
  });
  drawText(`Postal Address: ${data.applicantAddress}`, {
    x: 60,
    y: curY - 38,
    size: 8,
    font: fontRegular,
    color: textDark
  });
  drawText(`Contact Phone: ${data.applicantPhone || "N/A"} | Email: ${data.applicantEmail || "N/A"}`, {
    x: 60,
    y: curY - 50,
    size: 8,
    font: fontRegular,
    color: textDark
  });
  drawText(`Corporation/Trade Name: ${data.corporationName || "None (Individual Applicant)"}`, {
    x: 60,
    y: curY - 62,
    size: 8,
    font: fontRegular,
    color: textDark
  });
  drawText(`Authorized Representative: ${data.representativeName || "None (Self-Represented)"}`, {
    x: 60,
    y: curY - 74,
    size: 7.5,
    font: fontRegular,
    color: textMuted
  });

  curY -= 88;

  // --- SECTION 2: PROJECT NATURE & LOCATION ---
  page.drawRectangle({
    x: 50,
    y: curY - 115,
    width: width - 100,
    height: 115,
    color: rgb(1, 1, 1),
    borderColor: borderLight,
    borderWidth: 1
  });
  drawText("2. PROJECT DETAILS & MUNICIPAL SITE LOCATION", {
    x: 60,
    y: curY - 14,
    size: 8,
    font: fontBold,
    color: primaryColor
  });
  drawText(`Project Name: ${data.projectName}`, {
    x: 60,
    y: curY - 28,
    size: 8.5,
    font: fontBold,
    color: textDark
  });
  drawText(`Project Type / Classification: ${data.projectType}`, {
    x: 60,
    y: curY - 40,
    size: 8,
    font: fontBold,
    color: primaryColor
  });
  drawText(`Nature of Project: ${data.projectNature} | Tenure: ${data.projectTenure}`, {
    x: 60,
    y: curY - 52,
    size: 8,
    font: fontRegular,
    color: textDark
  });
  drawText(`Project Address: ${data.projectAddress}`, {
    x: 60,
    y: curY - 64,
    size: 8,
    font: fontRegular,
    color: textDark
  });
  drawText(`Barangay: Brgy. ${data.barangay}, Sto. Tomas, Pampanga`, {
    x: 60,
    y: curY - 76,
    size: 8,
    font: fontBold,
    color: textDark
  });
  drawText(`Right over Land: ${data.rightOverLand} | Lot Area: ${data.lotArea} sq.m | Building Area: ${data.bldgArea} sq.m`, {
    x: 60,
    y: curY - 88,
    size: 8,
    font: fontRegular,
    color: textDark
  });
  drawText(`Existing Land Use: ${data.existingLandUse} | Tenancy Status: ${data.isTenanted}`, {
    x: 60,
    y: curY - 100,
    size: 8,
    font: fontRegular,
    color: textDark
  });

  curY -= 125;

  // --- SECTION 3: PROJECT COST & ORDINANCE FEES ---
  page.drawRectangle({
    x: 50,
    y: curY - 55,
    width: width - 100,
    height: 55,
    color: fillLight,
    borderColor: borderLight,
    borderWidth: 1
  });
  drawText("3. ESTIMATED PROJECT COST & ASSESSMENT BASIS", {
    x: 60,
    y: curY - 14,
    size: 8,
    font: fontBold,
    color: primaryColor
  });
  drawText(`Project Cost (PHP): Php ${data.projectCost}`, {
    x: 60,
    y: curY - 28,
    size: 9,
    font: fontBold,
    color: textDark
  });
  if (data.projectCostWords) {
    drawText(`In Words: ${data.projectCostWords}`, {
      x: 60,
      y: curY - 40,
      size: 7.5,
      font: fontRegular,
      color: textMuted
    });
  }
  drawText(`Preferred Release Mode: ${data.preferredMode || "Pick-up at Municipal Hall"}`, {
    x: 60,
    y: curY - 50,
    size: 7.5,
    font: fontRegular,
    color: textDark
  });

  curY -= 65;

  // --- SECTION 4: OATH & CERTIFICATION ---
  page.drawRectangle({
    x: 50,
    y: curY - 75,
    width: width - 100,
    height: 75,
    color: rgb(1, 1, 1),
    borderColor: borderLight,
    borderWidth: 1
  });
  drawText("4. APPLICANT'S SWORN OATH & VERIFICATION", {
    x: 60,
    y: curY - 14,
    size: 8,
    font: fontBold,
    color: primaryColor
  });
  drawText("I hereby certify that all information contained herein is true, correct, and complete to the best", {
    x: 60,
    y: curY - 26,
    size: 7.5,
    font: fontRegular,
    color: textMuted
  });
  drawText("of my knowledge and belief under the penalties of perjury and Sto. Tomas Municipal Zoning Ordinances.", {
    x: 60,
    y: curY - 36,
    size: 7.5,
    font: fontRegular,
    color: textMuted
  });
  drawText(`Community Tax Certificate (CTC): ${data.ctcNumber || "CTC-VERIFIED"}`, {
    x: 60,
    y: curY - 50,
    size: 8,
    font: fontBold,
    color: textDark
  });
  drawText(`Issued At: ${data.ctcIssuedAt || "Sto. Tomas, Pampanga"} | Issued On: ${data.ctcIssuedOn || data.submissionDate}`, {
    x: 60,
    y: curY - 62,
    size: 8,
    font: fontRegular,
    color: textDark
  });

  curY -= 85;

  // --- FOOTER NOTICE ---
  page.drawRectangle({
    x: 50,
    y: 35,
    width: width - 100,
    height: 30,
    color: fillLight,
    borderColor: rgb(0.65, 0.85, 0.75),
    borderWidth: 1
  });
  drawText("e-Tayo Sto. Tomas Municipal e-Governance & Permitting System", {
    x: width / 2 - 130,
    y: 52,
    size: 7.5,
    font: fontBold,
    color: primaryColor
  });
  drawText("Official Digital Copy Automatically Synced to Municipal Google Drive Records", {
    x: width / 2 - 145,
    y: 42,
    size: 7,
    font: fontRegular,
    color: textMuted
  });

  return await pdfDoc.saveAsBase64({ dataUri: false });
}
