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
}

/**
 * Automatically populates user data into the official ANNEX D - TEMPLATE PDF
 * and outputs the modified PDF as a base64 data URI and downloadable Blob.
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
    // Whiteout mask
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
  // Name of Applicant (Row underneath label at Y=754)
  replaceText(data.applicantName || "N/A", 35, 738, 250, 13, 9.5, true);

  // Name of Corporation
  replaceText(data.corporationName || "N/A", 305, 738, 250, 13, 9.5, false);

  // Address & Telephone of Applicant
  const applicantContactStr = `${data.applicantAddress || ""} ${data.applicantPhone ? `| Tel: ${data.applicantPhone}` : ""}`;
  replaceText(applicantContactStr.trim() || "N/A", 35, 703, 250, 13, 8.5, false);

  // Address & Telephone of Corporation
  replaceText(data.corporationAddress || "N/A", 305, 703, 250, 13, 8.5, false);

  // 2. PROJECT INFORMATION
  // Project Name/Type (covers original "A PROPOSED TWO STOREY, THREE (3) BEDROOM RESIDENCE")
  const fullProjectType = `${data.projectName || ""} - ${data.projectType || ""}`.trim();
  replaceText(fullProjectType.slice(0, 42), 110, 670, 185, 12, 8.5, true);
  if (fullProjectType.length > 42) {
    replaceText(fullProjectType.slice(42, 85), 35, 658, 260, 12, 8.5, true);
  }

  // Classification (Right column)
  replaceText(data.classification || "RESIDENTIAL", 389, 670, 190, 12, 9, true);

  // Site Zoning Class
  const zoningClass = data.siteZoningClass || (data.classification === "COMMERCIAL" ? "GENERAL COMMERCIAL ZONE (GCZ)" : "GENERAL RESIDENTIAL ZONE (GRZ)");
  replaceText(zoningClass, 415, 658, 165, 12, 8.5, true);

  // Project Location (Street, Brgy, Sto. Tomas, Pampanga)
  const locStr = `${data.projectLocation || ""}, BRGY. ${data.barangay || ""}, STO. TOMAS, PAMPANGA`;
  replaceText(locStr.slice(0, 38), 92, 647, 205, 12, 8, true);
  replaceText(locStr.slice(38, 80), 35, 635, 255, 12, 8, true);

  // Right Over Land
  replaceText(data.rightOverLand || "TRANSFER CERTIFICATE OF TITLE (TCT)", 407, 647, 175, 12, 8, true);

  // Area (sq.m.) - Lot Area
  replaceText(`${data.lotArea || "0.00"} SQ.M.`, 112, 624, 150, 12, 9, true);

  // Area of Bldg. : - Building Footprint
  replaceText(`${data.bldgArea || "0.00"} SQ.M.`, 123, 612, 140, 12, 9, true);

  // Date of Inspection / Filing
  const fileDate = data.submissionDate || new Date().toLocaleDateString("en-US", { month: "long", day: "2-digit", year: "numeric" });
  replaceText(fileDate.toUpperCase(), 149, 576, 140, 12, 8.5, true);

  // Abutting Lot Boundaries (North, South, East, West)
  if (data.northAbutting) replaceText(data.northAbutting, 91, 484, 40, 12, 8.5, false);
  if (data.southAbutting) replaceText(data.southAbutting, 192, 484, 40, 12, 8.5, false);
  if (data.eastAbutting) replaceText(data.eastAbutting, 84, 473, 50, 12, 8.5, false);
  if (data.westAbutting) replaceText(data.westAbutting, 192, 473, 40, 12, 8.5, false);

  // Project Status checkbox marks
  // Uncheck proposed if not proposed
  if (data.projectStatus && data.projectStatus !== "Proposed") {
    replaceText(" ", 42, 554, 13, 11, 8.5, false);
    if (data.projectStatus === "Completed") {
      replaceText("X", 204, 554, 8, 11, 8.5, true);
    } else if (data.projectStatus === "Operational") {
      replaceText("X", 53, 543, 8, 11, 8.5, true);
    }
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
