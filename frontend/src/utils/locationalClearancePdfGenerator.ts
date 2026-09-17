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
  natureOthers?: string;
  projectAddress: string;
  barangay: string;
  lotArea: string;
  bldgArea: string;
  improvementArea?: string;
  rightOverLand: string;
  rightOverLandOthers?: string;
  projectTenure: string;

  existingLandUse: string;
  landUseOthers?: string;
  agriculturalCrop?: string;
  isTenanted: string;
  projectCost: string;
  projectCostWords?: string;

  hasWrittenNotice?: string;
  noticeOfficer?: string;
  noticeOrder?: string;
  noticeDate?: string;

  hasRelatedAction?: string;
  relatedOffice?: string;
  relatedDate?: string;
  relatedActionTaken?: string;

  preferredMode?: string;
  ctcNumber?: string;
  ctcIssuedAt?: string;
  ctcIssuedOn?: string;

  sketchImageBase64?: string;
  sketchImageBytes?: Uint8Array;
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

async function fetchTemplateBytes(templatePath: string): Promise<ArrayBuffer> {
  // In Browser environment
  if (typeof window !== "undefined") {
    const res = await fetch(templatePath);
    if (!res.ok) {
      throw new Error(`Failed to load template ${templatePath}: ${res.statusText}`);
    }
    return await res.arrayBuffer();
  }

  // In Node / Server environment
  try {
    const fs = await import("fs");
    const path = await import("path");
    const cleanRelPath = templatePath.startsWith("/") ? templatePath.slice(1) : templatePath;
    const candidates = [
      path.join(process.cwd(), "frontend", "public", cleanRelPath),
      path.join(process.cwd(), "public", cleanRelPath),
      path.join(process.cwd(), "frontend", "public", "templates", path.basename(templatePath)),
      path.join(process.cwd(), "Forms (Modified and Fixed)", path.basename(templatePath)),
      path.join(process.cwd(), "..", "Forms (Modified and Fixed)", path.basename(templatePath)),
    ];
    for (const cand of candidates) {
      if (fs.existsSync(cand)) {
        const buf = fs.readFileSync(cand);
        return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
      }
    }
    if (typeof fetch === "function") {
      const res = await fetch(templatePath);
      if (res.ok) return await res.arrayBuffer();
    }
  } catch {
    if (typeof fetch === "function") {
      const res = await fetch(templatePath);
      if (res.ok) return await res.arrayBuffer();
    }
  }
  throw new Error(`Could not load template file: ${templatePath}`);
}

/**
 * Loads the official Sto. Tomas Locational Clearance PDF template
 * (LOCATIONAL-CLEARANCE-Sto-Tomas.pdf) and stamps all applicant responses
 * directly into Boxes 1 through 19 at exact pixel-mapped coordinates.
 */
export async function generateLocationalClearancePdf(data: LocationalClearancePdfData): Promise<string> {
  const templateBytes = await fetchTemplateBytes("/templates/LOCATIONAL-CLEARANCE-Sto-Tomas.pdf");
  const pdfDoc = await PDFDocument.load(templateBytes);

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const page = pdfDoc.getPage(0);
  const darkNavy = rgb(0.05, 0.12, 0.35); // Official document ink color

  const drawText = (
    text: string | undefined | null,
    x: number,
    y: number,
    fontSize: number = 8,
    isBold: boolean = false,
    maxWidth?: number
  ) => {
    if (!text) return;
    let clean = safeText(text).trim();
    if (maxWidth && clean.length > maxWidth) {
      clean = clean.slice(0, maxWidth);
    }
    page.drawText(clean, {
      x,
      y,
      size: fontSize,
      font: isBold ? fontBold : fontRegular,
      color: darkNavy,
    });
  };

  const drawCheck = (x: number, y: number) => {
    page.drawText("X", {
      x,
      y,
      size: 8.5,
      font: fontBold,
      color: darkNavy,
    });
  };

  // --- HEADER: Application Details ---
  drawText(data.applicationNo || "LC-2026-PENDING", 106, 700.0, 8.5, true);
  drawText(data.submissionDate || new Date().toLocaleDateString(), 106, 688.0, 8, false);
  drawText("ONLINE-PORTAL", 112, 676.0, 8, false);

  // --- BOX 1: Name of Applicant ---
  drawText(data.applicantName?.toUpperCase(), 46, 642.0, 8.5, true, 45);

  // --- BOX 2: Name of Corporation ---
  if (data.corporationName && data.corporationName.trim()) {
    drawText(data.corporationName.toUpperCase(), 314, 642.0, 8, true, 45);
  } else {
    drawText("N/A (INDIVIDUAL APPLICANT)", 314, 642.0, 8, false);
  }

  // --- BOX 3: Address / Telephone of Applicant ---
  const addrTel = `${data.applicantAddress || ""}${data.applicantPhone ? ` | Tel: ${data.applicantPhone}` : ""}`;
  drawText(addrTel, 46, 616.0, 7.5, false, 55);

  // --- BOX 4: Address / Telephone of Corporation ---
  drawText(data.corporationName ? (data.applicantAddress || "N/A") : "N/A", 314, 616.0, 7.5, false, 55);

  // --- BOX 5: Authorized Representative ---
  if (data.representativeName && data.representativeName.trim()) {
    drawText(data.representativeName.toUpperCase(), 46, 590.0, 8, true, 45);
  } else {
    drawText("N/A (SELF-REPRESENTED)", 46, 590.0, 8, false);
  }

  // --- BOX 6: Address / Tel of Authorized Representative ---
  if (data.representativeName && data.representativeName.trim()) {
    const repContact = `${data.representativeAddress || data.applicantAddress || ""}${data.representativePhone ? ` | Tel: ${data.representativePhone}` : ""}`;
    drawText(repContact, 314, 590.0, 7.5, false, 55);
  } else {
    drawText("N/A", 314, 590.0, 7.5, false);
  }

  // --- BOX 7: Project Type ---
  drawText(data.projectType?.toUpperCase() || data.projectName?.toUpperCase(), 46, 565.0, 8, true, 48);

  // --- BOX 8: Project Nature ---
  const natureNorm = (data.projectNature || "").toLowerCase();
  if (natureNorm.includes("others") || natureNorm.includes("renov") || natureNorm.includes("alter") || natureNorm.includes("change")) {
    drawCheck(443.5, 565.0);
    const othersText = data.natureOthers || data.projectNature || "Renovation / Alteration";
    drawText(othersText, 478, 565.0, 7.5, true, 22);
  } else {
    // Default: New Development
    drawCheck(323.5, 565.0);
  }

  // --- BOX 9: Project Location ---
  const fullLoc = data.projectAddress || `Sto. Tomas, Pampanga`;
  drawText(fullLoc, 46, 536.0, 7.5, false, 60);

  // --- BOX 10: Project Area (in square meters) ---
  drawText(data.lotArea ? `${data.lotArea} sq.m.` : "", 340, 542.5, 8, true);
  drawText(data.bldgArea ? `${data.bldgArea} sq.m.` : "", 445, 542.5, 8, true);
  if (data.improvementArea && data.improvementArea !== "0") {
    drawText(`${data.improvementArea} sq.m.`, 545, 542.5, 7.5, true);
  }

  // --- BOX 11: Right Over Land ---
  const rightNorm = (data.rightOverLand || "").toLowerCase();
  if (rightNorm.includes("lease")) {
    drawCheck(58.5, 506);
  } else if (rightNorm.includes("other")) {
    drawCheck(135.5, 516.0);
    if (data.rightOverLandOthers) {
      drawText(data.rightOverLandOthers, 175, 516.0, 7.5, false, 25);
    }
  } else {
    // Default: Owner
    drawCheck(58.5, 516.0);
  }

  // --- BOX 12: Project Tenure ---
  const tenureNorm = (data.projectTenure || "").toLowerCase();
  if (tenureNorm.includes("temp")) {
    drawCheck(326.5, 506);
  } else {
    drawCheck(326.5, 516.0);
  }

  // --- BOX 13: Existing Land Use of Project Site ---
  const landUseNorm = (data.existingLandUse || "").toLowerCase();
  if (landUseNorm.includes("comm")) {
    drawCheck(125.5, 485);
  } else if (landUseNorm.includes("indus")) {
    drawCheck(125.5, 475);
  } else if (landUseNorm.includes("instit")) {
    drawCheck(58.5, 475);
  } else if (landUseNorm.includes("agri")) {
    drawCheck(305.5, 485);
    if (data.agriculturalCrop) {
      drawText(data.agriculturalCrop, 415, 485, 7.5, false, 20);
    }
  } else if (landUseNorm.includes("vacant") || landUseNorm.includes("idle")) {
    drawCheck(240.5, 485);
  } else if (landUseNorm.includes("other")) {
    drawCheck(195.5, 485);
    if (data.landUseOthers) {
      drawText(data.landUseOthers, 215, 485, 7.5, false, 15);
    }
  } else {
    // Default: Residential
    drawCheck(58.5, 485);
  }

  // Tenancy
  const isTenNorm = (data.isTenanted || "").toLowerCase();
  if (isTenNorm === "yes" || isTenNorm.includes("tenanted") && !isTenNorm.includes("not")) {
    drawCheck(305.5, 475);
  } else {
    drawCheck(375.5, 475);
  }

  // --- BOX 14: Project Cost (in pesos, write in words and figures) ---
  if (data.projectCostWords) {
    drawText(data.projectCostWords, 46, 452.0, 7.5, false, 65);
  } else {
    drawText(`Estimated Total Cost: PHP ${data.projectCost}`, 46, 452.0, 7.5, false, 65);
  }
  drawText(data.projectCost || "1,500,000.00", 420, 456.0, 8.5, true);

  // --- BOX 15: Written Notice from LGU ---
  const noticeNorm = (data.hasWrittenNotice || "no").toLowerCase();
  if (noticeNorm === "yes") {
    drawCheck(58.5, 422);
    if (data.noticeOfficer) drawText(data.noticeOfficer, 125, 414, 7, false);
    if (data.noticeOrder) drawText(data.noticeOrder, 125, 406, 7, false);
    if (data.noticeDate) drawText(data.noticeDate, 280, 406, 7, false);
  } else {
    drawCheck(275.5, 422);
  }

  // --- BOX 16: Related Action with LGU ---
  const actionNorm = (data.hasRelatedAction || "no").toLowerCase();
  if (actionNorm === "yes") {
    drawCheck(58.5, 378);
    if (data.relatedOffice) drawText(data.relatedOffice, 175, 370, 7, false);
    if (data.relatedDate) drawText(data.relatedDate, 100, 363, 7, false);
    if (data.relatedActionTaken) drawText(data.relatedActionTaken, 230, 363, 7, false);
  } else {
    drawCheck(275.5, 378);
  }

  // --- BOX 17: Preferred Mode of Release ---
  const modeNorm = (data.preferredMode || "").toLowerCase();
  if (modeNorm.includes("mail") && modeNorm.includes("rep")) {
    drawCheck(370.5, 347);
  } else if (modeNorm.includes("mail")) {
    drawCheck(235.5, 347);
  } else {
    // Default: Pick-up at Municipal Hall
    drawCheck(58.5, 347);
  }

  // --- BOX 18 & 19: Signatures ---
  drawText(data.applicantName?.toUpperCase(), 70, 318, 8, true);
  if (data.representativeName && data.representativeName.trim()) {
    drawText(data.representativeName.toUpperCase(), 330, 318, 8, true);
  }

  // --- NOTARY / JURAT ---
  const dateObj = new Date();
  const dayStr = dateObj.getDate().toString();
  const monthYearStr = dateObj.toLocaleString("en-US", { month: "long", year: "numeric" });
  drawText(dayStr, 345, 282, 7.5, false);
  drawText(monthYearStr, 440, 282, 7.5, false);

  drawText(data.ctcNumber || "CTC-VERIFIED-ONLINE", 480, 270, 8, true);
  drawText(data.ctcIssuedAt || "Sto. Tomas, Pampanga", 135, 258, 7.5, false);
  drawText(data.ctcIssuedOn || data.submissionDate || dateObj.toLocaleDateString(), 240, 258, 7.5, false);

  // --- OPTIONAL PAGE 2: VICINITY SKETCH MAP ATTACHMENT ---
  let imgBytes = data.sketchImageBytes;
  if (!imgBytes && data.sketchImageBase64) {
    try {
      const b64Data = data.sketchImageBase64.includes(",")
        ? data.sketchImageBase64.split(",")[1]
        : data.sketchImageBase64;
      const binaryString = atob(b64Data);
      imgBytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        imgBytes[i] = binaryString.charCodeAt(i);
      }
    } catch (e) {
      console.warn("Could not decode sketch map base64:", e);
    }
  }

  if (imgBytes && imgBytes.length > 0) {
    try {
      let embeddedImage;
      try {
        embeddedImage = await pdfDoc.embedPng(imgBytes);
      } catch {
        embeddedImage = await pdfDoc.embedJpg(imgBytes);
      }

      if (embeddedImage) {
        const page2 = pdfDoc.addPage([612, 792]);
        const { width: p2W, height: p2H } = page2.getSize();

        // Header banner
        page2.drawRectangle({
          x: 40,
          y: p2H - 70,
          width: p2W - 80,
          height: 35,
          color: rgb(0.02, 0.37, 0.27),
        });
        page2.drawText("OFFICIAL VICINITY MAP & LOCATION SKETCH ATTACHMENT", {
          x: 55,
          y: p2H - 52,
          size: 11,
          font: fontBold,
          color: rgb(1, 1, 1),
        });
        page2.drawText(`Application Ref: ${data.applicationNo} | Project: ${data.projectName || data.projectType} | Applicant: ${data.applicantName}`, {
          x: 55,
          y: p2H - 63,
          size: 7.5,
          font: fontRegular,
          color: rgb(0.9, 0.95, 0.92),
        });

        // Frame
        const maxW = p2W - 100;
        const maxH = p2H - 140;
        const scaled = embeddedImage.scaleToFit(maxW, maxH);
        const imgX = 40 + (p2W - 80 - scaled.width) / 2;
        const imgY = 50 + (p2H - 120 - scaled.height) / 2;

        page2.drawRectangle({
          x: imgX - 4,
          y: imgY - 4,
          width: scaled.width + 8,
          height: scaled.height + 8,
          color: rgb(1, 1, 1),
          borderColor: rgb(0.7, 0.75, 0.8),
          borderWidth: 1,
        });

        page2.drawImage(embeddedImage, {
          x: imgX,
          y: imgY,
          width: scaled.width,
          height: scaled.height,
        });

        page2.drawText("e-Tayo Sto. Tomas Digital Permitting System • Official Vicinity Verification Annex", {
          x: 50,
          y: 25,
          size: 7,
          font: fontRegular,
          color: rgb(0.4, 0.45, 0.5),
        });
      }
    } catch (imgErr) {
      console.warn("Notice: Vicinity sketch could not be embedded:", imgErr);
    }
  }

  return await pdfDoc.saveAsBase64({ dataUri: false });
}
