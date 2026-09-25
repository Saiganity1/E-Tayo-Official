/**
 * Utility to dispatch and synchronize automated permit notifications and messages
 * between municipal staff/evaluators and applicants.
 */

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
  }

  // 3. Attempt POST to backend /api/messages/send
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    await fetch(`${apiUrl}/api/messages/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newMsg)
    });
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

  (applications || []).forEach(app => {
    if (!app || !app.id) return;
    const isApprovedOrPast = app.status === "approved" || app.status === "released" || Boolean(app.orderOfPaymentNo) || Boolean(app.assessedFees);
    if (!isApprovedOrPast) return;

    const appId = app.id;
    const assessedAmt = ((app as any).assessedFees || 3795).toLocaleString();
    const opNo = (app as any).orderOfPaymentNo || "OP-2026";
    const projName = app.projectName || (app.permitType === "locational_clearance" ? "Locational Clearance" : "Building Permit");
    const applicantName = app.applicantName || "Applicant";

    // 1. Ensure Official Approval & Order of Payment Message exists
    const hasApprovalMsg = result.some(m => {
      const tid = m.applicationId || (m.content && m.content.includes(appId));
      return (tid === appId || (m.content && m.content.includes(appId))) && 
        (m.content.includes("ORDER OF PAYMENT") || m.content.includes("APPLICATION APPROVED") || m.content.includes(opNo));
    });

    if (!hasApprovalMsg) {
      const approvalMsg: SystemPermitMessage = {
        id: `auto-op-${appId}`,
        senderEmail: "staff@etayo.gov.ph",
        actualSender: "Engr. Gilbert Cruz, Municipal Building Official",
        recipientEmail: userEmail || app.applicantEmail || "applicant@etayo.gov.ph",
        applicationId: appId,
        timestamp: app.dateApproved ? new Date(app.dateApproved).toISOString() : (app.dateSubmitted ? new Date(app.dateSubmitted).toISOString() : new Date(Date.now() - 3600000).toISOString()),
        content: `[Ref: ${appId} - ${projName}]
🏛️ OFFICIAL NOTICE: APPLICATION APPROVED & ORDER OF PAYMENT ISSUED

Dear ${applicantName},

Your application for ${projName} (${appId}) has been formally reviewed and APPROVED by the Municipal Building Official.

💰 Assessed Regulatory Fee: PHP ${assessedAmt}
📄 Order of Payment Reference: ${opNo}

Payment Office:
Municipal Treasury Office (Ground Floor, Sto. Tomas Municipal Hall, Pampanga)

Action Required:
Please settle the assessed regulatory fee of PHP ${assessedAmt} and reply directly in this conversation with a photo or screenshot of your Official Receipt (OR) or payment confirmation.

Once we inspect your receipt picture in this conversation, we will click "Confirmed Payment" to officially release your permits.`
      };
      result.unshift(approvalMsg);
      updated = true;
    }

    // 2. If user confirmed payment or receipt photo exists, ensure user payment receipt message exists
    const cachedReceipt = (app as any).paymentProofUrl || (typeof window !== "undefined" ? localStorage.getItem("etayo_receipt_" + appId) : null);
    const hasConfirmedPayment = Boolean((app as any).userConfirmedPayment || cachedReceipt);

    if (hasConfirmedPayment) {
      const hasReceiptMsg = result.some(m => {
        const tid = m.applicationId || (m.content && m.content.includes(appId));
        return (tid === appId || (m.content && m.content.includes(appId))) && 
          (m.content.includes("Payment Receipt") || m.content.includes("PAYMENT CONFIRMATION") || m.content.includes("payment receipt"));
      });

      if (!hasReceiptMsg) {
        const orRef = (app as any).paymentReference || "OR-2026-94812";
        const channel = (app as any).paymentMethod || "Municipal Treasury Cashier (On-site)";
        const receiptMsg: SystemPermitMessage = {
          id: `auto-receipt-${appId}`,
          senderEmail: userEmail || app.applicantEmail || "applicant@etayo.gov.ph",
          actualSender: applicantName,
          recipientEmail: "staff@etayo.gov.ph",
          applicationId: appId,
          timestamp: (app as any).datePaymentSubmitted ? new Date((app as any).datePaymentSubmitted).toISOString() : new Date(Date.now() - 1800000).toISOString(),
          content: `[Ref: ${appId} - Payment Receipt] Official payment settled for ${appId} (Order of Payment: ${opNo}, Amount: PHP ${assessedAmt}).
Official Receipt / Reference: ${orRef}
Payment Channel: ${channel}
Attached is the photo of my payment receipt for municipal cashier verification.
${cachedReceipt ? `\n[Attachment: payment-receipt.jpg|${cachedReceipt}]` : ""}`
        };
        result.push(receiptMsg);
        updated = true;
      }
    }

    // 3. If application is released, ensure Release Notice message exists
    if (app.status === "released") {
      const hasReleaseMsg = result.some(m => {
        const tid = m.applicationId || (m.content && m.content.includes(appId));
        return (tid === appId || (m.content && m.content.includes(appId))) && 
          (m.content.includes("PERMITS RELEASED") || m.content.includes("Payment Verified"));
      });

      if (!hasReleaseMsg) {
        const orNo = (app as any).officialReceiptNo || "OR-2026-94812";
        const releaseMsg: SystemPermitMessage = {
          id: `auto-release-${appId}`,
          senderEmail: "staff@etayo.gov.ph",
          actualSender: "Engr. Gilbert Cruz, Municipal Building Official",
          recipientEmail: userEmail || app.applicantEmail || "applicant@etayo.gov.ph",
          applicationId: appId,
          timestamp: (app as any).dateReleased ? new Date((app as any).dateReleased).toISOString() : new Date().toISOString(),
          content: `[Ref: ${appId} - Permit Released]
🎉 PAYMENT VERIFIED & OFFICIAL PERMITS RELEASED!

Official Receipt No: ${orNo}
Payment of PHP ${assessedAmt} has been verified and confirmed by the Building Official.
All official permit papers, ancillary clearances, and approved plans for ${appId} have been officially RELEASED and are now available for download on your tracking dashboard. Step 4 (Released) is marked complete (Green).`
        };
        result.push(releaseMsg);
        updated = true;
      }
    }
  });

  if (updated && typeof window !== "undefined") {
    try {
      localStorage.setItem("etayo_messages_history", JSON.stringify(result));
    } catch (e) {}
  }

  result.sort((a, b) => new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime());
  return result;
};
