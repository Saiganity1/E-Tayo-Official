import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export interface LocationalClearanceFormData {
  applicantName: string;
  corporationName?: string;
  applicantAddress: string;
  applicantPhone: string;
  corporationAddress?: string;
  projectName: string;
  projectType: string;
  projectLocation: string;
  barangay: string;
  lotArea: string;
  bldgArea: string;
  classification: string;
  siteZoningClass?: string;
  rightOverLand: string;
  othersProject?: string;

  // Section C: Site Inspection & Land Uses
  projectStatus: "Proposed" | "Completed" | "Operational" | "Under Construction" | "Others";
  percentCompleted?: string;
  statusOthers?: string;
  northAbutting?: string;
  southAbutting?: string;
  eastAbutting?: string;
  westAbutting?: string;
  submissionDate?: string;

  // Land uses within lot
  lotUses?: {
    residential?: boolean;
    commercial?: boolean;
    institutional?: boolean;
    industrial?: boolean;
    agricultural?: boolean;
    othersRoad?: boolean;
  };

  // Agricultural & Tenancy
  agriculturalCrops?: string;
  tenancyStatus?: "Tenanted" | "Not tenanted";

  // Surrounding 100m / 500m radius uses
  uses100m?: {
    residential?: boolean;
    commercial?: boolean;
    institutional?: boolean;
    industrial?: boolean;
    agricultural?: boolean;
  };
  uses500m?: {
    residential?: boolean;
    commercial?: boolean;
    institutional?: boolean;
    industrial?: boolean;
    agricultural?: boolean;
  };

  // Section D: Sketch Map Attachment
  sketchImageBase64?: string;
  sketchImageBytes?: Uint8Array;

  // Section E: Legal Bases & Findings
  legalBases?: string;
  recommendedDecision?: string;
  findingFacts?: string;

  // Section F: Conditions Acknowledgment
  additionalConditionsAgreed?: boolean;
}

/**
 * Automatically populates user data into the official clean ANNEX D - TEMPLATE PDF
 * with exact pixel-level alignment matching the official LGU Sto. Tomas format,
 * and embeds the uploaded vicinity map image into Section D.
 */
export async function generateAnnexDPdf(data: LocationalClearanceFormData): Promise<{
  pdfBytes: Uint8Array;
  dataUri: string;
  blob: Blob;
  downloadUrl: string;
}> {
  // Fetch the official clean Annex D template from the public assets directory
  const response = await fetch("/templates/ANNEX_D_TEMPLATE.pdf");
  if (!response.ok) {
    throw new Error("Could not load ANNEX D - TEMPLATE.pdf from public templates.");
  }
  const existingPdfBytes = await response.arrayBuffer();

  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const pages = pdfDoc.getPages();
  const page1 = pages[0];

  const navy = rgb(0.05, 0.12, 0.3); // Official dark navy text color

  // Helper function to safely draw text
  const drawField = (
    text: string | undefined,
    x: number,
    y: number,
    fontSize: number = 8.5,
    isBold: boolean = true,
    maxWidth?: number
  ) => {
    if (!text || !text.trim()) return;
    let str = text.toUpperCase().trim();
    if (maxWidth && str.length > maxWidth) {
      str = str.slice(0, maxWidth);
    }
    page1.drawText(str, {
      x,
      y,
      size: fontSize,
      font: isBold ? boldFont : regFont,
      color: navy,
    });
  };

  // Helper to draw an [ X ] checkbox mark inside brackets
  const drawCheck = (x: number, y: number) => {
    page1.drawText("X", {
      x,
      y,
      size: 9,
      font: boldFont,
      color: navy,
    });
  };

  // ==========================================
  // 1. SECTION A: APPLICANTS INFORMATION
  // ==========================================
  // Row 1: Name of Applicant & Corporation
  drawField(data.applicantName || "N/A", 39, 714, 9.5, true, 42);
  drawField(data.corporationName || "N/A", 308, 714, 9, false, 42);

  // Row 2: Address & Phone of Applicant (Above dividing line y=671)
  drawField(data.applicantAddress, 39, 684, 8, false, 55);
  const contactLine = `TEL / MOB: ${data.applicantPhone || "N/A"}`;
  drawField(contactLine, 39, 673, 7.5, true, 55);

  // Row 2 Right: Address & Phone of Corporation
  drawField(data.corporationAddress || "N/A", 308, 684, 8, false, 55);

  // ==========================================
  // 2. SECTION B: PROJECT INFORMATION
  // ==========================================
  // Name/Type: starts after x=88.8
  const fullProjectType = `${data.projectName ? data.projectName + " - " : ""}${data.projectType || ""}`.trim();
  drawField(fullProjectType, 94, 647.4, 8, true, 38);

  // Classification: starts after x=365.1
  drawField(data.classification || "RESIDENTIAL", 370, 647.4, 8.5, true, 25);

  // Location: starts after x=75.5
  const locLine = `${data.projectLocation || ""}, BRGY. ${data.barangay || ""}, STO. TOMAS`.trim();
  drawField(locLine, 80, 635.9, 7.5, true, 42);

  // Site Zoning Class: starts after x=384.6
  const defaultZoning = data.classification === "COMMERCIAL" ? "GENERAL COMMERCIAL ZONE (GCZ)" : "GENERAL RESIDENTIAL ZONE (GRZ)";
  drawField(data.siteZoningClass || defaultZoning, 389, 635.9, 8, true, 30);

  // Area (sq.m.) : starts after x=95.5 (Clean space so no overlap with ':')
  drawField(`${data.lotArea || "0.00"} SQ.M.`, 100, 624.4, 8.5, true, 20);

  // Right Over Land: starts after x=379.0
  drawField(data.rightOverLand || "TRANSFER CERTIFICATE OF TITLE (TCT)", 384, 624.4, 7.5, true, 30);

  // Area of Bldg. : starts after x=98.3 (Clean space so no overlap with ':')
  drawField(`${data.bldgArea || "0.00"} SQ.M.`, 104, 612.9, 8.5, true, 20);

  // Others: starts after x=67.7
  drawField(data.othersProject || "N/A", 72, 601.4, 8, false, 35);

  // ==========================================
  // 3. SECTION C: SITE INSPECTION FINDINGS
  // ==========================================
  // Date of Inspection: starts after x=118.3
  const fileDate = data.submissionDate || new Date().toLocaleDateString("en-US", { month: "long", day: "2-digit", year: "numeric" });
  drawField(fileDate, 122, 576.9, 8.5, true, 25);

  // Project Status Checkbox
  if (data.projectStatus === "Completed") {
    drawCheck(154, 553.9);
  } else if (data.projectStatus === "Operational") {
    drawCheck(42, 542.4);
  } else if (data.projectStatus === "Under Construction") {
    drawCheck(154, 542.4);
    if (data.percentCompleted) {
      drawField(data.percentCompleted, 175, 542.4, 8, true);
    }
  } else if (data.projectStatus === "Others") {
    drawCheck(42, 530.9);
    if (data.statusOthers) {
      drawField(data.statusOthers, 135, 530.9, 8, true, 20);
    }
  } else {
    // Default: Proposed
    drawCheck(42, 553.9);
  }

  // Abutting Lot Boundaries (Sit clean on the line without overlapping (a), (b), (c), (d))
  drawField(data.northAbutting || "GRZ", 78, 485.5, 8, true, 8);
  drawField(data.southAbutting || "GRZ", 152, 485.5, 8, true, 8);
  drawField(data.eastAbutting || "ROAD", 75, 474.5, 8, true, 8);
  drawField(data.westAbutting || "GRZ", 148, 474.5, 8, true, 8);

  // Existing land uses within lot boundaries
  const uses = data.lotUses || {};
  if (uses.residential || (!data.classification || data.classification === "RESIDENTIAL")) {
    drawCheck(309, 565.4);
  }
  if (uses.institutional || data.classification === "INSTITUTIONAL") {
    drawCheck(379, 565.4);
  }
  if (uses.commercial || data.classification === "COMMERCIAL") {
    drawCheck(309, 553.9);
  }
  if (uses.industrial || data.classification === "INDUSTRIAL") {
    drawCheck(385, 553.9);
  }
  if (uses.agricultural || data.classification === "AGRICULTURAL") {
    drawCheck(309, 542.4);
  }
  if (uses.othersRoad) {
    drawCheck(413, 542.4);
  }

  // Agricultural details
  if (data.agriculturalCrops) {
    drawField(data.agriculturalCrops, 340, 507.9, 8, false, 25);
  }
  if (data.tenancyStatus === "Tenanted") {
    drawCheck(309, 484.9);
  } else {
    drawCheck(420, 484.9);
  }

  // Surrounding 100m and 500m radius land uses
  const u100 = data.uses100m || {};
  const u500 = data.uses500m || {};
  if (u100.residential ?? true) drawCheck(149, 426.7);
  if (u500.residential ?? true) drawCheck(211, 426.7);
  if (u100.commercial ?? (data.classification === "COMMERCIAL")) drawCheck(150, 415.2);
  if (u500.commercial ?? (data.classification === "COMMERCIAL")) drawCheck(212, 415.2);
  if (u100.institutional) drawCheck(150, 403.7);
  if (u500.institutional) drawCheck(212, 403.7);
  if (u100.industrial) drawCheck(381, 426.7);
  if (u500.industrial) drawCheck(439, 426.7);
  if (u100.agricultural) drawCheck(381, 415.2);
  if (u500.agricultural) drawCheck(439, 415.2);

  // ==========================================
  // 4. SECTION D: SKETCH OF PROJECT LOCATION (Strictly inside table box y=100 to y=365)
  // ==========================================
  let imgBytes = data.sketchImageBytes;
  if (!imgBytes && data.sketchImageBase64) {
    try {
      const b64Data = data.sketchImageBase64.includes(",") ? data.sketchImageBase64.split(",")[1] : data.sketchImageBase64;
      const binaryString = atob(b64Data);
      imgBytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        imgBytes[i] = binaryString.charCodeAt(i);
      }
    } catch (e) {
      console.error("Could not parse image base64 bytes", e);
    }
  }

  // Section D inner bounds: x=34 to 570 (width=536), y=100 to 365 (height=265)
  const boxX = 34;
  const boxY = 100;
  const boxW = 536;
  const boxH = 265;

  if (imgBytes && imgBytes.length > 0) {
    try {
      // Clean white background inside Section D
      page1.drawRectangle({
        x: boxX + 1,
        y: boxY + 1,
        width: boxW - 2,
        height: boxH - 2,
        color: rgb(1, 1, 1),
      });

      // Embed image (try PNG first, then JPG)
      let embeddedImage;
      try {
        embeddedImage = await pdfDoc.embedPng(imgBytes);
      } catch {
        embeddedImage = await pdfDoc.embedJpg(imgBytes);
      }

      if (embeddedImage) {
        // Fit proportionally inside Section D bounds with safe padding (max 520 x 250)
        const scaled = embeddedImage.scaleToFit(520, 250);
        const posX = boxX + (boxW - scaled.width) / 2;
        const posY = boxY + (boxH - scaled.height) / 2;

        page1.drawImage(embeddedImage, {
          x: posX,
          y: posY,
          width: scaled.width,
          height: scaled.height,
        });

        // Add clean border
        page1.drawRectangle({
          x: posX,
          y: posY,
          width: scaled.width,
          height: scaled.height,
          borderWidth: 1,
          borderColor: rgb(0.85, 0.85, 0.85),
          color: rgb(0, 0, 0),
          opacity: 0,
        });
      }
    } catch (err) {
      console.warn("Could not embed user sketch image into PDF:", err);
    }
  }

  // ==========================================
  // 5. SECTION E, F, & G ON PAGE 2
  // ==========================================
  if (pages.length > 1) {
    const page2 = pages[1];

    // Mark CLUP resolution inside the [ ] bracket
    page2.drawText("X", {
      x: 77.5,
      y: 734.7,
      size: 9,
      font: boldFont,
      color: navy,
    });

    // If classification is not Residential, update zone text in findings so it matches the applicant's category
    const zoneName = data.classification === "COMMERCIAL"
      ? "Commercial Zone"
      : data.classification === "INDUSTRIAL"
      ? "Industrial Zone"
      : data.classification === "INSTITUTIONAL"
      ? "Institutional Zone"
      : data.classification === "AGRICULTURAL"
      ? "Agricultural Zone"
      : null;

    if (zoneName) {
      // White-out "Residential Zone" in Recommended Decision
      page2.drawRectangle({ x: 218, y: 611, width: 90, height: 13, color: rgb(1, 1, 1) });
      page2.drawText(zoneName, { x: 218, y: 612.8, size: 9, font: boldFont, color: rgb(0, 0, 0) });

      // White-out "Residential Zone" in Finding of Facts line 1
      page2.drawRectangle({ x: 313, y: 695, width: 90, height: 13, color: rgb(1, 1, 1) });
      page2.drawText(zoneName + ".", { x: 314, y: 696.2, size: 9, font: boldFont, color: rgb(0, 0, 0) });

      // White-out "Residential Zone" in Finding of Facts line 2
      page2.drawRectangle({ x: 378, y: 576, width: 90, height: 13, color: rgb(1, 1, 1) });
      page2.drawText(zoneName + ".", { x: 379.5, y: 577.2, size: 9, font: boldFont, color: rgb(0, 0, 0) });
    }

    // Stamp current date in Section G (Signatories Date)
    const stampDate = new Date().toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }).replace(/\//g, "-");
    
    // Prepared by Date (Cover old 08-12-2026 cleanly)
    page2.drawRectangle({
      x: 138,
      y: 138,
      width: 58,
      height: 14,
      color: rgb(1, 1, 1),
    });
    page2.drawText(stampDate, {
      x: 140,
      y: 140,
      size: 9,
      font: boldFont,
      color: navy,
    });

    // Noted by Date (Cover old 08-12-2026 cleanly)
    page2.drawRectangle({
      x: 410,
      y: 138,
      width: 58,
      height: 14,
      color: rgb(1, 1, 1),
    });
    page2.drawText(stampDate, {
      x: 412,
      y: 140,
      size: 9,
      font: boldFont,
      color: navy,
    });
  }

  // Serialize modified PDF
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
  const downloadUrl = URL.createObjectURL(blob);

  // Fast chunked base64 Data URI for storage/database attachments
  let binary = "";
  const chunkSize = 8192;
  for (let i = 0; i < pdfBytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(
      null,
      pdfBytes.subarray(i, i + chunkSize) as any
    );
  }
  const base64 = btoa(binary);
  const dataUri = `data:application/pdf;base64,${base64}`;

  return {
    pdfBytes,
    dataUri,
    blob,
    downloadUrl,
  };
}
