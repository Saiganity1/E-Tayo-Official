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

  // ==========================================
  // 1. SECTION A: APPLICANTS INFORMATION
  // ==========================================
  drawField(data.applicantName || "N/A", 39, 714, 9.5, true, 40);
  drawField(data.corporationName || "N/A", 308, 714, 9, false, 40);

  // Address & Phone of Applicant
  drawField(data.applicantAddress, 39, 678, 8, false, 55);
  const contactLine = `${data.applicantPhone ? `TEL / MOB: ${data.applicantPhone}` : ""}`;
  drawField(contactLine, 39, 666, 8, true, 55);

  // Address & Phone of Corporation
  drawField(data.corporationAddress || "N/A", 308, 678, 8, false, 55);

  // ==========================================
  // 2. SECTION B: PROJECT INFORMATION
  // ==========================================
  const fullProjectType = `${data.projectName ? data.projectName + " - " : ""}${data.projectType || ""}`.trim();
  drawField(fullProjectType, 92, 647.4, 8, true, 38);

  drawField(data.classification || "RESIDENTIAL", 369, 647.4, 8.5, true, 25);

  const locLine = `${data.projectLocation || ""}, BRGY. ${data.barangay || ""}, STO. TOMAS, PAMPANGA`.trim();
  drawField(locLine, 80, 635.9, 7.5, true, 42);

  const defaultZoning = data.classification === "COMMERCIAL" ? "GENERAL COMMERCIAL ZONE (GCZ)" : "GENERAL RESIDENTIAL ZONE (GRZ)";
  drawField(data.siteZoningClass || defaultZoning, 389, 635.9, 8, true, 30);

  drawField(`${data.lotArea || "0.00"} SQ.M.`, 94, 624.4, 8.5, true, 20);

  drawField(data.rightOverLand || "TRANSFER CERTIFICATE OF TITLE (TCT)", 383, 624.4, 7.5, true, 30);

  drawField(`${data.bldgArea || "0.00"} SQ.M.`, 102, 612.9, 8.5, true, 20);

  // ==========================================
  // 3. SECTION C: SITE INSPECTION FINDINGS
  // ==========================================
  const fileDate = data.submissionDate || new Date().toLocaleDateString("en-US", { month: "long", day: "2-digit", year: "numeric" });
  drawField(fileDate, 121, 576.9, 8.5, true, 25);

  // Project Status checkboxes
  if (data.projectStatus === "Completed") {
    drawField("X", 182, 565.4, 9, true);
  } else if (data.projectStatus === "Operational") {
    drawField("X", 45, 553.9, 9, true);
  } else {
    // Default: Proposed
    drawField("X", 45, 565.4, 9, true);
  }

  // Abutting Lot Boundaries
  drawField(data.northAbutting || "GRZ", 67, 484.9, 8, true, 10);
  drawField(data.southAbutting || "GRZ", 142, 484.9, 8, true, 10);
  drawField(data.eastAbutting || "ROAD", 62, 473.4, 8, true, 10);
  drawField(data.westAbutting || "GRZ", 137, 473.4, 8, true, 10);

  // Mark land use checkbox matching classification
  if (data.classification === "COMMERCIAL") {
    drawField("X", 311, 553.9, 8.5, true);
  } else {
    drawField("X", 311, 565.4, 8.5, true);
  }

  // ==========================================
  // 4. SECTION D: SKETCH OF PROJECT LOCATION & SIGNIFICANT FINDINGS
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
        height: 325,
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
        const scaled = embeddedImage.scaleToFit(520, 310);
        const posX = 35.5 + (534 - scaled.width) / 2;
        const posY = 35.5 + (325 - scaled.height) / 2;

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

    // Mark CLUP resolution
    page2.drawText("X", {
      x: 45,
      y: 735,
      size: 9,
      font: boldFont,
      color: navy,
    });

    // Stamp current date in Section G (Signatories Date)
    const stampDate = new Date().toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }).replace(/\//g, "-");
    
    // Prepared by Date (Y ≈ 148, X ≈ 142)
    page2.drawText(stampDate, {
      x: 142,
      y: 148,
      size: 9,
      font: boldFont,
      color: navy,
    });

    // Noted by Date (Y ≈ 148, X ≈ 414)
    page2.drawText(stampDate, {
      x: 414,
      y: 148,
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
