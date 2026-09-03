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
  projectStatus: "Proposed" | "Completed" | "Operational" | "Under Construction";
  northAbutting?: string;
  southAbutting?: string;
  eastAbutting?: string;
  westAbutting?: string;
  submissionDate?: string;
  
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
 * Automatically populates user data into the official ANNEX D - TEMPLATE PDF
 * with exact pixel-level alignment matching the official LGU Sto. Tomas format,
 * and embeds the uploaded vicinity map image into Section D.
 */
export async function generateAnnexDPdf(data: LocationalClearanceFormData): Promise<{
  pdfBytes: Uint8Array;
  dataUri: string;
  blob: Blob;
  downloadUrl: string;
}> {
  // Fetch the official Annex D template from the public assets directory
  const response = await fetch("/templates/ANNEX_D_TEMPLATE.pdf");
  if (!response.ok) {
    throw new Error("Could not load ANNEX D - TEMPLATE.pdf from public templates.");
  }
  const existingPdfBytes = await response.arrayBuffer();

  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const pages = pdfDoc.getPages();
  const page1 = pages[0];

  // Helper to blank out template placeholder area and write new user text
  const replaceText = (
    text: string,
    x: number,
    y: number,
    coverWidth: number,
    coverHeight: number = 13,
    fontSize: number = 8.5,
    isBold: boolean = true,
    fontColor = rgb(0.05, 0.12, 0.3) // Official dark navy
  ) => {
    page1.drawRectangle({
      x: x - 1,
      y: y - 2,
      width: coverWidth + 2,
      height: coverHeight,
      color: rgb(1, 1, 1),
    });

    if (text && text.trim()) {
      page1.drawText(text.toUpperCase(), {
        x: x + 1,
        y: y + 1,
        size: fontSize,
        font: isBold ? boldFont : regularFont,
        color: fontColor,
      });
    }
  };

  // ==========================================
  // 1. SECTION A: APPLICANTS INFORMATION
  // ==========================================
  // Name of Applicant (Row 1 Left: x=38, y=712, w=262, h=16)
  replaceText(data.applicantName || "N/A", 38, 712, 262, 16, 9.5, true);

  // Name of Corporation (Row 1 Right: x=306, y=712, w=262, h=16)
  replaceText(data.corporationName || "N/A", 306, 712, 262, 16, 9, false);

  // Address & Telephone of Applicant (Row 2 Left: x=38, y=662-680, w=262, h=28)
  page1.drawRectangle({
    x: 37,
    y: 660,
    width: 264,
    height: 32,
    color: rgb(1, 1, 1),
  });
  if (data.applicantAddress) {
    page1.drawText(data.applicantAddress.toUpperCase(), {
      x: 39,
      y: 678,
      size: 8,
      font: regularFont,
      color: rgb(0.05, 0.12, 0.3),
    });
  }
  if (data.applicantPhone) {
    page1.drawText(`TEL / MOB: ${data.applicantPhone}`.toUpperCase(), {
      x: 39,
      y: 666,
      size: 8,
      font: boldFont,
      color: rgb(0.05, 0.12, 0.3),
    });
  }

  // Address & Telephone of Corporation (Row 2 Right: x=306, y=662-680, w=262, h=28)
  page1.drawRectangle({
    x: 305,
    y: 660,
    width: 264,
    height: 32,
    color: rgb(1, 1, 1),
  });
  if (data.corporationAddress) {
    page1.drawText(data.corporationAddress.toUpperCase(), {
      x: 307,
      y: 678,
      size: 8,
      font: regularFont,
      color: rgb(0.05, 0.12, 0.3),
    });
  } else {
    page1.drawText("N/A", {
      x: 307,
      y: 678,
      size: 8,
      font: regularFont,
      color: rgb(0.05, 0.12, 0.3),
    });
  }

  // ==========================================
  // 2. SECTION B: PROJECT INFORMATION
  // ==========================================
  // Name/Type of Project (x=92, y=646.5, w=208; line 2 x=36, y=634.5, w=264)
  const fullProjectType = `${data.projectName ? data.projectName + " - " : ""}${data.projectType || ""}`.trim();
  replaceText(fullProjectType.slice(0, 36), 92, 646.5, 208, 13, 8, true);
  replaceText(fullProjectType.length > 36 ? fullProjectType.slice(36, 76) : "", 36, 634.5, 264, 12, 8, true);

  // Classification (x=369, y=646.5, w=195)
  replaceText(data.classification || "RESIDENTIAL", 369, 646.5, 195, 13, 8.5, true);

  // Site Zoning Class (x=389, y=634.5, w=178)
  const defaultZoning = data.classification === "COMMERCIAL" ? "GENERAL COMMERCIAL ZONE (GCZ)" : "GENERAL RESIDENTIAL ZONE (GRZ)";
  replaceText(data.siteZoningClass || defaultZoning, 389, 634.5, 178, 13, 8, true);

  // Location (Line 1 x=80, y=623, w=220; Line 2 x=38, y=611.5, w=262)
  const locLine1 = `${data.projectLocation || ""}, BRGY. ${data.barangay || ""}`.trim();
  replaceText(locLine1.slice(0, 38), 80, 623, 220, 13, 7.5, true);
  const locLine2 = locLine1.length > 38 ? `${locLine1.slice(38)}, STO. TOMAS, PAMPANGA` : "STO. TOMAS, PAMPANGA";
  replaceText(locLine2, 38, 611.5, 262, 12, 7.5, true);

  // Right Over Land (x=383, y=623, w=184)
  replaceText(data.rightOverLand || "TRANSFER CERTIFICATE OF TITLE (TCT)", 383, 623, 184, 13, 8, true);

  // Lot Area (sq.m.) (x=94, y=600, w=206)
  replaceText(`${data.lotArea || "0.00"} SQ.M.`, 94, 600, 206, 13, 8.5, true);

  // Area of Bldg. (sq.m.) (x=102, y=588.5, w=198)
  replaceText(`${data.bldgArea || "0.00"} SQ.M.`, 102, 588.5, 198, 13, 8.5, true);

  // ==========================================
  // 3. SECTION C: SITE INSPECTION FINDINGS
  // ==========================================
  // Date of Inspection / Filing (x=121, y=553.5, w=175)
  const fileDate = data.submissionDate || new Date().toLocaleDateString("en-US", { month: "long", day: "2-digit", year: "numeric" });
  replaceText(fileDate.toUpperCase(), 121, 553.5, 175, 13, 8.5, true);

  // Project Status checkboxes
  // White-out the default Proposed [X] mark if not Proposed
  if (data.projectStatus && data.projectStatus !== "Proposed") {
    page1.drawRectangle({
      x: 41,
      y: 541,
      width: 14,
      height: 12,
      color: rgb(1, 1, 1),
    });
    page1.drawText("[   ]", {
      x: 40,
      y: 542,
      size: 8.5,
      font: regularFont,
      color: rgb(0.2, 0.2, 0.2),
    });

    if (data.projectStatus === "Completed") {
      page1.drawText("[ X ]", {
        x: 176,
        y: 542,
        size: 8.5,
        font: boldFont,
        color: rgb(0.05, 0.12, 0.3),
      });
    } else if (data.projectStatus === "Operational") {
      page1.drawText("[ X ]", {
        x: 40,
        y: 530.5,
        size: 8.5,
        font: boldFont,
        color: rgb(0.05, 0.12, 0.3),
      });
    }
  }

  // Abutting Lot Boundaries (North, South, East, West)
  replaceText(data.northAbutting || "GRZ", 76, 460.5, 45, 12, 8.5, false);
  replaceText(data.southAbutting || "GRZ", 152, 460.5, 45, 12, 8.5, false);
  replaceText(data.eastAbutting || "ROAD", 71, 449, 45, 12, 8.5, false);
  replaceText(data.westAbutting || "GRZ", 152, 449, 45, 12, 8.5, false);

  // ==========================================
  // 4. SECTION D: SKETCH OF PROJECT LOCATION
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

  if (imgBytes && imgBytes.length > 0) {
    try {
      // Clean white cover over the placeholder map in Section D
      page1.drawRectangle({
        x: 35.5,
        y: 35.5,
        width: 534,
        height: 307,
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
        // Fit proportionally inside Section D bounding box
        const scaled = embeddedImage.scaleToFit(520, 295);
        const posX = 35.5 + (534 - scaled.width) / 2;
        const posY = 35.5 + (307 - scaled.height) / 2;

        page1.drawImage(embeddedImage, {
          x: posX,
          y: posY,
          width: scaled.width,
          height: scaled.height,
        });

        // Add subtle border
        page1.drawRectangle({
          x: posX,
          y: posY,
          width: scaled.width,
          height: scaled.height,
          borderWidth: 1,
          borderColor: rgb(0.8, 0.8, 0.8),
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

    // Stamp current date in Section G (Signatories Date)
    const stampDate = new Date().toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }).replace(/\//g, "-");
    
    // Prepared by Date (Y ≈ 163, X ≈ 172)
    page2.drawRectangle({
      x: 168,
      y: 160,
      width: 85,
      height: 14,
      color: rgb(1, 1, 1),
    });
    page2.drawText(stampDate, {
      x: 172,
      y: 163,
      size: 9,
      font: boldFont,
      color: rgb(0.08, 0.15, 0.3),
    });

    // Noted by Date (Y ≈ 163, X ≈ 442)
    page2.drawRectangle({
      x: 438,
      y: 160,
      width: 85,
      height: 14,
      color: rgb(1, 1, 1),
    });
    page2.drawText(stampDate, {
      x: 442,
      y: 163,
      size: 9,
      font: boldFont,
      color: rgb(0.08, 0.15, 0.3),
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
