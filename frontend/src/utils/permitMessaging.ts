/**
 * Utility to dispatch and synchronize automated permit notifications and messages
 * between municipal staff/evaluators and applicants.
 */

import { formatPhilippineDate, formatPhilippineTime } from "./philippineTime";

export const safeISODate = (val: any, fallback = new Date().toISOString()): string => {
  if (!val) return fallback;
  try {
    const d = new Date(val);
    const ms = d.getTime();
    if (!isNaN(ms)) {
      return d.toISOString();
    }
  } catch (e) {}
  return fallback;
};

export interface SystemPermitMessage {
  id: string;
  senderEmail: string;
  actualSender?: string;
  recipientEmail: string;
  content: string;
  applicationId: string;
  timestamp: string;
}

export const dispatchPermitMessage = async ({
  applicationId,
  recipientEmail,
  senderEmail = "staff@etayo.gov.ph",
  actualSender = "Engr. Gilbert Cruz, Municipal Building Official",
  content,
}: {
  applicationId: string;
  recipientEmail: string;
  senderEmail?: string;
  actualSender?: string;
  content: string;
}): Promise<SystemPermitMessage> => {
  const newMsg: SystemPermitMessage = {
    id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    senderEmail,
    actualSender,
    recipientEmail,
    content,
    applicationId,
    timestamp: new Date().toISOString()
  };

  // 1. Persist locally to localStorage so it is always present offline / in browser
  try {
    const raw = localStorage.getItem("etayo_messages_history");
    const currentList: SystemPermitMessage[] = raw ? JSON.parse(raw) : [];
    const updatedList = [...currentList, newMsg];
    localStorage.setItem("etayo_messages_history", JSON.stringify(updatedList));

    // Also register user thread if not present
    const userThreadsKey = `etayo_threads_${recipientEmail}`;
    const rawThreads = localStorage.getItem(userThreadsKey);
    const threads: string[] = rawThreads ? JSON.parse(rawThreads) : [];
    if (!threads.includes(applicationId)) {
      localStorage.setItem(userThreadsKey, JSON.stringify([...threads, applicationId]));
    }
  } catch (e) {
    console.warn("Could not cache message to localStorage", e);
  }

  // 2. Dispatch custom event for real-time reactive UI update in open windows
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("etayo_new_message", { detail: newMsg }));
    try {
      if (typeof BroadcastChannel !== "undefined") {
        const bc = new BroadcastChannel("etayo_chat_channel");
        bc.postMessage(newMsg);
        bc.close();
      }
    } catch (e) {}
  }

  // 3. Attempt POST to backend /api/messages/send
  try {
    const backendPayload: any = { ...newMsg };
    if (typeof backendPayload.id === "string" && !/^\d+$/.test(backendPayload.id)) {
      delete backendPayload.id;
    }

    let res = await fetch("/api/messages/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newMsg)
    }).catch(() => null);

    if (!res || !res.ok) {
      const rawApi = (process.env.NEXT_PUBLIC_API_URL || "https://e-tayo-official-by0b.onrender.com").replace(/\/+$/, "");
      const backendUrl = rawApi.endsWith("/api") ? `${rawApi}/messages/send` : `${rawApi}/api/messages/send`;
      await fetch(backendUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(backendPayload)
      }).catch(() => null);
    }
  } catch (e) {
    // Non-blocking: will fall back to local storage cache
  }

  return newMsg;
};

export const getCachedMessages = (userEmail?: string, appId?: string): SystemPermitMessage[] => {
  try {
    const raw = localStorage.getItem("etayo_messages_history");
    if (!raw) return [];
    const list: SystemPermitMessage[] = JSON.parse(raw);
    return list.filter(m => {
      const matchApp = !appId || m.applicationId === appId || m.content.includes(appId);
      const matchUser = !userEmail || m.recipientEmail === userEmail || m.senderEmail === userEmail;
      return matchApp && matchUser;
    });
  } catch (e) {
    return [];
  }
};

export const getAuthoritativePermitFee = (app?: any, rawAppId?: string): number => {
  const id = String(app?.id || rawAppId || "").trim();
  const lowerId = id.toLowerCase();
  const upperId = id.toUpperCase();
  const isLC = (app?.permitType || "").toLowerCase().includes("locational") || upperId.startsWith("LC-");

  // 1. Highest Priority: Explicitly saved fee by admin/staff in localStorage
  if (typeof window !== "undefined" && id) {
    const stored = localStorage.getItem(`etayo_fees_${id}`) || 
                   localStorage.getItem(`etayo_fees_${lowerId}`) || 
                   localStorage.getItem(`etayo_fees_${upperId}`);
    if (stored && !isNaN(Number(stored)) && Number(stored) > 0) {
      return Number(stored);
    }
  }

  // 2. Application object assessedFees
  if (app && (app as any).assessedFees && !isNaN(Number((app as any).assessedFees)) && Number((app as any).assessedFees) > 0) {
    return Number((app as any).assessedFees);
  }

  // 3. Lookup from localStorage cached applications if app not passed or missing fees
  if (typeof window !== "undefined" && id) {
    try {
      const rawApps = localStorage.getItem("etayo_cached_applications");
      if (rawApps) {
        const apps = JSON.parse(rawApps);
        const found = apps.find((a: any) => 
          String(a?.id || "").trim().toLowerCase() === lowerId ||
          String(a?.applicationId || "").trim().toLowerCase() === lowerId
        );
        if (found) {
          if (found.assessedFees && !isNaN(Number(found.assessedFees)) && Number(found.assessedFees) > 0) {
            return Number(found.assessedFees);
          }
        }
      }
    } catch (e) {}
  }

  // 4. Return 0 if not yet assessed by staff or admin
  return 0;
};

/**
 * Ensures that any approved, under-payment, or released applications have their official
 * system/admin messages generated in the conversation thread if not already present.
 */
export const ensureApplicationConversationMessages = (
  applications: any[],
  userEmail: string = "applicant@etayo.gov.ph",
  existingMessages: any[] = []
): any[] => {
  const result = [...existingMessages];
  let updated = false;

  const cleanUserEmail = userEmail ? userEmail.toLowerCase().trim() : "";

  (applications || []).forEach(app => {
    if (!app || !app.id) return;

    // Strict guard: Only synthesize messages for applications belonging to this applicant
    if (cleanUserEmail && cleanUserEmail !== "staff@etayo.gov.ph" && cleanUserEmail !== "admin@etayo.gov.ph") {
      const appEmail = (app.applicantEmail || "").toLowerCase().trim();
      if (appEmail && appEmail !== cleanUserEmail) {
        return;
      }
    }

    const isApprovedOrPast = app.status === "approved" || app.status === "released" || Boolean(app.orderOfPaymentNo) || Boolean(app.assessedFees);
    if (!isApprovedOrPast) return;

    const appId = String(app.id || "").trim();
    const isLC = app.permitType === "locational_clearance" || appId.toUpperCase().startsWith("LC-");

    // 1. Resolve accurate authoritative assessed fee (localStorage -> app.assessedFees -> app.estimatedFees -> LC 500 / BP 6200)
    const assessedNum = getAuthoritativePermitFee(app, appId);
    const assessedAmt = assessedNum.toLocaleString();

    // 2. Resolve accurate Order of Payment Reference (never standalone "OP-2026")
    const cleanSeq = appId.replace(/^[A-Za-z]+-/i, "");
    let opNo = (app as any).orderOfPaymentNo;
    if (!opNo || opNo === "OP-2026") {
      if (typeof window !== "undefined") {
        const storedOp = localStorage.getItem(`etayo_op_${appId}`) || 
                         localStorage.getItem(`etayo_op_${appId.toLowerCase()}`) || 
                         localStorage.getItem(`etayo_op_${appId.toUpperCase()}`);
        if (storedOp && storedOp !== "OP-2026") {
          opNo = storedOp;
        }
      }
    }
    if (!opNo || opNo === "OP-2026") {
      opNo = `OP-${cleanSeq || "2026"}`;
    }

    const projName = app.projectName || (isLC ? "Locational Clearance" : "Building Permit");
    const applicantName = app.applicantName || "Applicant";

    // Compute realistic chronological timestamps: Approval / Order of Payment -> Payment Receipt -> Permit Release
    const now = Date.now();
    const parseTime = (val: any, fallback: number): number => {
      if (!val) return fallback;
      try {
        const ms = new Date(val).getTime();
        return isNaN(ms) ? fallback : ms;
      } catch (e) {
        return fallback;
      }
    };

    let approvalTime = app.dateApproved 
      ? parseTime(app.dateApproved, parseTime(app.dateSubmitted, now - 7200000))
      : parseTime(app.dateSubmitted, now - 7200000);
    if (isNaN(approvalTime) || approvalTime <= 0) approvalTime = now - 7200000;

    const approvalDateObj = new Date(approvalTime);
    if (!isNaN(approvalDateObj.getTime()) && approvalDateObj.getHours() === 0 && approvalDateObj.getMinutes() === 0) {
      // If parsed as midnight (00:00:00)
      const isToday = new Date().toDateString() === approvalDateObj.toDateString();
      if (isToday) {
        approvalTime = Math.max(now - 7200000, approvalDateObj.getTime());
        if (approvalTime >= now) {
          approvalTime = now - 1800000;
        }
      } else {
        approvalDateObj.setHours(9, 0, 0, 0);
        approvalTime = approvalDateObj.getTime();
      }
    } else if (approvalTime > now) {
      approvalTime = now - 3600000;
    }

    let receiptTime = (app as any).datePaymentSubmitted 
      ? parseTime((app as any).datePaymentSubmitted, approvalTime + 1800000)
      : (approvalTime + 1800000); // 30 mins after approval
    if (isNaN(receiptTime) || receiptTime <= approvalTime) {
      receiptTime = approvalTime + 900000;
    }
    if (receiptTime > now) {
      receiptTime = Math.max(approvalTime + 60000, now - 1200000);
      if (approvalTime >= receiptTime) {
        approvalTime = receiptTime - 600000;
      }
    }

    let releaseTime = (app as any).dateReleased 
      ? parseTime((app as any).dateReleased, receiptTime + 1800000)
      : (receiptTime + 1800000);
    if (isNaN(releaseTime) || releaseTime <= receiptTime) {
      releaseTime = receiptTime + 900000;
    }
    if (releaseTime > now) {
      releaseTime = Math.max(receiptTime + 60000, now - 300000);
      if (receiptTime >= releaseTime) {
        releaseTime = releaseTime - 300000;
        if (approvalTime >= receiptTime) {
          approvalTime = receiptTime - 600000;
        }
      }
    }
    // 1. Ensure Official Approval & Order of Payment Message exists & has correct fee
    const existingMsgIndex = result.findIndex(m => {
      const tid = m.applicationId || (m.content && m.content.includes(appId));
      return (tid === appId || (m.content && m.content.includes(appId))) && 
        (m.content.includes("ORDER OF PAYMENT") || m.content.includes("APPLICATION APPROVED") || m.content.includes("Official Order of Payment"));
    });

    if (existingMsgIndex !== -1) {
      // Message exists! Check if its fee or OP ref is outdated and synchronize it
      const existing = result[existingMsgIndex];
      let content = existing.content || "";
      let contentChanged = false;

      // Ensure timestamp is before receipt
      if (new Date(existing.timestamp).getTime() >= receiptTime) {
        result[existingMsgIndex] = { ...existing, timestamp: safeISODate(approvalTime) };
        updated = true;
      }

      // Correct outdated fee
      if (!content.includes(`PHP ${assessedAmt}`) || content.includes("PHP 3,795") || (isLC && assessedAmt !== "500" && content.includes("PHP 500"))) {
        content = content
          .replace(/(?:Assessed Regulatory Fee|Total Assessed Regulatory Amount):\s*PHP\s*[\d,]+/gi, `Assessed Regulatory Fee: PHP ${assessedAmt}`)
          .replace(/(?:Locational Clearance & Zoning Assessment Fee):\s*PHP\s*[\d,]+/gi, `Locational Clearance & Zoning Assessment Fee: PHP ${assessedAmt}`)
          .replace(/fee of\s*PHP\s*[\d,]+/gi, `fee of PHP ${assessedAmt}`)
          .replace(/Amount:\s*PHP\s*[\d,]+/gi, `Amount: PHP ${assessedAmt}`)
          .replace(/PHP\s*3,795/gi, `PHP ${assessedAmt}`);
        if (isLC && assessedAmt !== "500") {
          content = content.replace(/PHP\s*500/gi, `PHP ${assessedAmt}`);
        }
        contentChanged = true;
      }

      // Ensure Date & Time of Order of Payment are explicitly included in message text
      const approvalDateStr = formatPhilippineDate(approvalTime);
      const approvalTimeStr = formatPhilippineTime(approvalTime);
      if (!content.includes("Date Approved / Issued:") && !content.includes("Order Date & Time:")) {
        content = content.replace(
          /(📄 Official Order of Payment Reference:[^\n\r]+)/i,
          `$1\n📅 Order Date & Time: ${approvalDateStr} at ${approvalTimeStr}`
        );
        contentChanged = true;
      }

      // Correct outdated OP number
      if (content.includes("OP-2026\n") || content.includes("OP-2026\r") || content.includes("OP-2026 ") || content.endsWith("OP-2026")) {
        content = content
          .replace(/Order of Payment Reference:\s*OP-2026\b/gi, `Order of Payment Reference: ${opNo}`)
          .replace(/Order of Payment Ref:\s*OP-2026\b/gi, `Order of Payment Ref: ${opNo}`)
          .replace(/Order of Payment:\s*OP-2026\b/gi, `Order of Payment: ${opNo}`);
        contentChanged = true;
      } else if (!content.includes(opNo)) {
        content = content
          .replace(/(?:Order of Payment Reference|Order of Payment Ref|Order of Payment No\.?):\s*[^\n\r]+/gi, `Order of Payment Reference: ${opNo}`);
        contentChanged = true;
      }

      if (contentChanged) {
        result[existingMsgIndex] = {
          ...result[existingMsgIndex],
          content
        };
        updated = true;
      }
    } else {
      const approvalNoticeTitle = isLC
        ? "OFFICIAL NOTICE: LOCATIONAL CLEARANCE ORDER OF PAYMENT (ZONING CLUP)"
        : "OFFICIAL NOTICE: BUILDING PERMIT ORDER OF PAYMENT (PD 1096 NBCP)";
      const issuingOffice = isLC
        ? "Municipal Planning and Development Office (MPDO) / Zoning Administration"
        : "Office of the Building Official (OBO) - Technical Permitting Division";
      const permitCategory = isLC
        ? "Stage 1: Locational Clearance / Land Use & Zoning Compliance"
        : "Stage 2: Building Permit & Unified Technical Ancillaries (Architectural, Structural, Electrical, Sanitary, Mechanical)";
      const legalBasis = isLC
        ? "Comprehensive Land Use Plan (CLUP) & Zoning Ordinance (Res. No. 4810, Series of 2017)"
        : "Presidential Decree No. 1096 (National Building Code of the Philippines)";

      const feeBreakdownText = isLC
        ? `• Locational Clearance & Zoning Assessment Fee: PHP ${assessedAmt}`
        : (assessedNum === 6200
            ? `• Building Construction Permit Fee: PHP 3,250.00\n• Electrical Installation Inspection Fee: PHP 1,150.00\n• Plumbing & Sanitary Inspection Fee: PHP 850.00\n• Mechanical / Ventilation Fee: PHP 450.00\n• Zoning & Municipal Filing Fee: PHP 500.00\n• Total Assessed Regulatory Fees: PHP ${assessedAmt}`
            : `• Total Assessed Technical Regulatory Fees: PHP ${assessedAmt}`);

      const approvalDateStr = formatPhilippineDate(approvalTime);
      const approvalTimeStr = formatPhilippineTime(approvalTime);

      const approvalMsg: SystemPermitMessage = {
        id: `auto-op-${appId}`,
        senderEmail: "staff@etayo.gov.ph",
        actualSender: isLC ? "Zoning Administrator, MPDO" : "Engr. Gilbert Cruz, Municipal Building Official",
        recipientEmail: userEmail || app.applicantEmail || "applicant@etayo.gov.ph",
        applicationId: appId,
        timestamp: safeISODate(approvalTime),
        content: `[Ref: ${appId} - ${projName}]
${approvalNoticeTitle}

Dear ${applicantName},

Your application for ${projName} (${appId}) has been formally reviewed and APPROVED.

Application Assessment:
• Permit Classification: ${permitCategory}
• Issuing Office: ${issuingOffice}
• Legal Basis: ${legalBasis}
• Reference Application ID: ${appId}
• Date Approved / Issued: ${approvalDateStr}
• Time Issued: ${approvalTimeStr} (PST)

Regulatory Assessment & Fee Schedule:
${feeBreakdownText}
Official Order of Payment Reference: ${opNo}
Order Date & Time: ${approvalDateStr} at ${approvalTimeStr}

Payment Office:
Municipal Treasury Office (Ground Floor, Sto. Tomas Municipal Hall, Pampanga)

Action Required:
Please settle the assessed regulatory fee of PHP ${assessedAmt} (Order of Payment Ref: ${opNo}) and reply directly in this conversation with a clear photo or screenshot of your Official Receipt (OR) or payment confirmation.

Once we inspect your receipt picture in this conversation, we will click "Confirmed Payment" to officially release your ${isLC ? "Locational Clearance" : "Building Permit & Technical Ancillaries"}.`
      };
      result.unshift(approvalMsg);
      updated = true;
    }

    // 2. If user confirmed payment or receipt photo exists, ensure user payment receipt message exists & has correct fee
    const cachedReceipt = (app as any).paymentProofUrl || (typeof window !== "undefined" ? localStorage.getItem("etayo_receipt_" + appId) : null);
    const hasConfirmedPayment = Boolean((app as any).userConfirmedPayment || cachedReceipt);

    if (hasConfirmedPayment) {
      // Check if user already has a manual message with attachment or receipt in chat
      const hasManualUserReceipt = result.some(m => {
        const tid = m.applicationId || (m.content && m.content.includes(appId));
        const isMatch = tid === appId || (m.content && m.content.includes(appId));
        const isNotAuto = !String(m?.id || "").startsWith("auto-receipt-");
        const hasAttachmentOrPayment = m.content?.includes("[Attachment:") || 
                                       m.content?.includes("payment-receipt") || 
                                       m.content?.includes("Payment Receipt") || 
                                       m.content?.includes("payment receipt");
        return isMatch && isNotAuto && hasAttachmentOrPayment;
      });

      if (hasManualUserReceipt) {
        // User already sent their receipt directly in conversation! Purge any duplicate auto-receipt
        const autoReceiptIdx = result.findIndex(m => m.id === `auto-receipt-${appId}`);
        if (autoReceiptIdx !== -1) {
          result.splice(autoReceiptIdx, 1);
          updated = true;
        }
      } else {
        const existingReceiptIdx = result.findIndex(m => {
          const tid = m.applicationId || (m.content && m.content.includes(appId));
          return (m.id === `auto-receipt-${appId}`) || ((tid === appId || (m.content && m.content.includes(appId))) && 
            (m.content.includes("Payment Receipt") || m.content.includes("PAYMENT CONFIRMATION") || m.content.includes("payment receipt")));
        });

        if (existingReceiptIdx === -1) {
          const orRef = (app as any).paymentReference || "OR-2026-94812";
          const channel = (app as any).paymentMethod || "Municipal Treasury Cashier (On-site)";
          const receiptMsg: SystemPermitMessage = {
            id: `auto-receipt-${appId}`,
            senderEmail: userEmail || app.applicantEmail || "applicant@etayo.gov.ph",
            actualSender: applicantName,
            recipientEmail: "staff@etayo.gov.ph",
            applicationId: appId,
            timestamp: safeISODate(receiptTime),
            content: `[Ref: ${appId} - Payment Receipt] Official payment settled for ${appId} (Order of Payment: ${opNo}, Amount: PHP ${assessedAmt}).
Official Receipt / Reference: ${orRef}
Payment Channel: ${channel}
Attached is the photo of my payment receipt for municipal cashier verification.
${cachedReceipt ? `\n[Attachment: payment-receipt.jpg|${cachedReceipt}]` : ""}`
          };
          result.push(receiptMsg);
          updated = true;
        } else {
          const exReceipt = result[existingReceiptIdx];
          let rContent = exReceipt.content || "";
          if (!rContent.includes(`PHP ${assessedAmt}`) || rContent.includes("PHP 3,795")) {
            rContent = rContent
              .replace(/Amount:\s*PHP\s*[\d,]+/gi, `Amount: PHP ${assessedAmt}`)
              .replace(/PHP\s*3,795/gi, `PHP ${assessedAmt}`);
            result[existingReceiptIdx] = { ...exReceipt, content: rContent };
            updated = true;
          }
        }
      }
    }

    // 3. If application is released, ensure Release Notice message exists & has correct fee
    if (app.status === "released") {
      const existingReleaseIdx = result.findIndex(m => {
        const tid = m.applicationId || (m.content && m.content.includes(appId));
        return (tid === appId || (m.content && m.content.includes(appId))) && 
          (m.content.includes("PERMITS RELEASED") || m.content.includes("Payment Verified"));
      });

      if (existingReleaseIdx === -1) {
        const orNo = (app as any).officialReceiptNo || "OR-2026-94812";
        const releaseMsg: SystemPermitMessage = {
          id: `auto-release-${appId}`,
          senderEmail: "staff@etayo.gov.ph",
          actualSender: "Engr. Gilbert Cruz, Municipal Building Official",
          recipientEmail: userEmail || app.applicantEmail || "applicant@etayo.gov.ph",
          applicationId: appId,
          timestamp: safeISODate(releaseTime),
          content: `[Ref: ${appId} - Permit Released]
PAYMENT VERIFIED & OFFICIAL PERMITS RELEASED

Official Receipt No: ${orNo}
Payment of PHP ${assessedAmt} has been verified and confirmed by the Building Official.
All official permit papers, ancillary clearances, and approved plans for ${appId} have been officially RELEASED and are now available for download on your tracking dashboard.`
        };
        result.push(releaseMsg);
        updated = true;
      } else {
        const exRel = result[existingReleaseIdx];
        let relContent = exRel.content || "";
        if (!relContent.includes(`PHP ${assessedAmt}`) || relContent.includes("PHP 3,795")) {
          relContent = relContent
            .replace(/Payment of\s*PHP\s*[\d,]+/gi, `Payment of PHP ${assessedAmt}`)
            .replace(/PHP\s*3,795/gi, `PHP ${assessedAmt}`);
          result[existingReleaseIdx] = { ...exRel, content: relContent };
          updated = true;
        }
      }
    }
  });

  if (updated && typeof window !== "undefined") {
    try {
      localStorage.setItem("etayo_messages_history", JSON.stringify(result));
    } catch (e) {}
  }

  // Strictly chronological sorting with logical hierarchy tie-breaker
  result.sort((a, b) => {
    const timeA = new Date(a.timestamp || 0).getTime();
    const timeB = new Date(b.timestamp || 0).getTime();
    if (timeA !== timeB) return timeA - timeB;
    const getOrder = (m: any) => {
      if (m.content?.includes("ORDER OF PAYMENT") || m.content?.includes("APPLICATION APPROVED")) return 1;
      if (m.content?.includes("Payment Receipt") || m.content?.includes("[Attachment:")) return 2;
      if (m.content?.includes("PERMITS RELEASED") || m.content?.includes("PAYMENT VERIFIED")) return 3;
      return 2;
    };
    return getOrder(a) - getOrder(b);
  });
  return result;
};
