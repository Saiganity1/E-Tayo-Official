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
    fontSize: number = 9.5,
    isBold: boolean = true,
    fontColor = rgb(0.08, 0.15, 0.3) // Official dark navy
  ) => {
    page1.drawRectangle({
      x: x - 1,
      y: y - 2,
      width: coverWidth + 2,
      height: coverHeight,
      color: rgb(1, 1, 1),
    });

    if (text) {
      page1.drawText(text.toUpperCase(), {
        x: x + 1,
        y: y + 1,
        size: fontSize,
        font: isBold ? boldFont : regularFont,
        color: fontColor,
      });
    }
  };

  // 1. APPLICANT INFORMATION
  replaceText(data.applicantName || "N/A", 35, 738, 250, 13, 9.5, true);
  replaceText(data.corporationName || "N/A", 305, 738, 250, 13, 9.5, false);

  const applicantContactStr = `${data.applicantAddress || ""} ${data.applicantPhone ? `| Tel: ${data.applicantPhone}` : ""}`;
  replaceText(applicantContactStr.trim() || "N/A", 35, 703, 250, 13, 8.5, false);
  replaceText(data.corporationAddress || "N/A", 305, 703, 250, 13, 8.5, false);

  // 2. PROJECT INFORMATION
  const fullProjectType = `${data.projectName || ""} - ${data.projectType || ""}`.trim();
  replaceText(fullProjectType.slice(0, 42), 110, 670, 185, 12, 8.5, true);
  if (fullProjectType.length > 42) {
    replaceText(fullProjectType.slice(42, 85), 35, 658, 260, 12, 8.5, true);
  }

  replaceText(data.classification || "RESIDENTIAL", 389, 670, 190, 12, 9, true);

  const zoningClass = data.siteZoningClass || (data.classification === "COMMERCIAL" ? "GENERAL COMMERCIAL ZONE (GCZ)" : "GENERAL RESIDENTIAL ZONE (GRZ)");
  replaceText(zoningClass, 415, 658, 165, 12, 8.5, true);

  const locStr = `${data.projectLocation || ""}, BRGY. ${data.barangay || ""}, STO. TOMAS, PAMPANGA`;
  replaceText(locStr.slice(0, 38), 92, 647, 205, 12, 8, true);
  replaceText(locStr.slice(38, 80), 35, 635, 255, 12, 8, true);

  replaceText(data.rightOverLand || "TRANSFER CERTIFICATE OF TITLE (TCT)", 407, 647, 175, 12, 8, true);
  replaceText(`${data.lotArea || "0.00"} SQ.M.`, 112, 624, 150, 12, 9, true);
  replaceText(`${data.bldgArea || "0.00"} SQ.M.`, 123, 612, 140, 12, 9, true);

  const fileDate = data.submissionDate || new Date().toLocaleDateString("en-US", { month: "long", day: "2-digit", year: "numeric" });
  replaceText(fileDate.toUpperCase(), 149, 576, 140, 12, 8.5, true);

  // Abutting Lot Boundaries (North, South, East, West)
  if (data.northAbutting) replaceText(data.northAbutting, 91, 484, 40, 12, 8.5, false);
  if (data.southAbutting) replaceText(data.southAbutting, 192, 484, 40, 12, 8.5, false);
  if (data.eastAbutting) replaceText(data.eastAbutting, 84, 473, 50, 12, 8.5, false);
  if (data.westAbutting) replaceText(data.westAbutting, 192, 473, 40, 12, 8.5, false);

  // Project Status checkbox marks
  if (data.projectStatus && data.projectStatus !== "Proposed") {
    replaceText(" ", 42, 554, 13, 11, 8.5, false);
    if (data.projectStatus === "Completed") {
      replaceText("X", 204, 554, 8, 11, 8.5, true);
    } else if (data.projectStatus === "Operational") {
      replaceText("X", 53, 543, 8, 11, 8.5, true);
    }
  }

  // 3. SECTION D: SKETCH OF PROJECT LOCATION & SIGNIFICANT FINDINGS (IMAGE ATTACHMENT)
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
        x: 35,
        y: 35,
        width: 525,
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
        const scaled = embeddedImage.scaleToFit(510, 310);
        const posX = 35 + (525 - scaled.width) / 2;
        const posY = 35 + (325 - scaled.height) / 2;

        page1.drawImage(embeddedImage, {
          x: posX,
          y: posY,
          width: scaled.width,
          height: scaled.height,
        });

        // Add small caption border
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

  // 4. SECTION E, F, & G ON PAGE 2
  if (pages.length > 1) {
    const page2 = pages[1];

    // Stamp current date in Section G (Signatories Date)
    const stampDate = new Date().toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }).replace(/\//g, "-");
    
    // Prepared by Date (Y ≈ 163.9, X ≈ 176)
    page2.drawRectangle({
      x: 170,
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

    // Noted by Date (Y ≈ 163.9, X ≈ 447)
    page2.drawRectangle({
      x: 440,
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

  // Create base64 Data URI for storage/database attachments
  let binary = "";
  const len = pdfBytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(pdfBytes[i]);
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
