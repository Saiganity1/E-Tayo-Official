const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzAy1lKPyiGEONoGPJtVJeLwCVtwT_oSayzG0-pCpdecIqatAo8OAvcufV_36VBxYAO/exec";
const PASSKEY = "eTayoSecureAdminKey2026";

export interface StatusEmailParams {
  toEmail: string;
  applicantName?: string;
  applicationId: string;
  permitType?: string;
  projectName?: string;
  projectAddress?: string;
  oldStatus?: string;
  newStatus: string;
  remarks?: string;
  evaluatorName?: string;
}

export async function sendApplicationStatusEmailDirect(params: StatusEmailParams): Promise<boolean> {
  const {
    toEmail,
    applicantName = "Valued Applicant",
    applicationId,
    permitType = "Permit Application",
    projectName = "Permit Project",
    projectAddress = "Sto. Tomas, Pampanga",
    newStatus,
    remarks,
    evaluatorName = "Municipal Building Official / Evaluator"
  } = params;

  if (!toEmail || !toEmail.includes("@")) {
    return false;
  }

  const cleanPermit = (permitType || "Permit").replace(/_/g, " ").toUpperCase();
  const cleanRemarks = remarks && remarks.trim() ? remarks.trim() : "Evaluation in progress according to National Building Code requirements.";
  const statusKey = (newStatus || "pending").toLowerCase().trim();
  const displayStatus = (statusKey.replace(/_/g, " ").charAt(0).toUpperCase() + statusKey.replace(/_/g, " ").slice(1));

  let badgeBg = "#f1f5f9";
  let badgeColor = "#334155";
  let statusExplanation = "";

  if (statusKey.includes("eval") || statusKey.includes("progress") || statusKey.includes("review")) {
    badgeBg = "#dbeafe";
    badgeColor = "#1e40af";
    statusExplanation = `Ipinapaalam po namin na ang inyong aplikasyon para sa <b>${cleanPermit}</b> (${projectName}) na may Reference No. <b>${applicationId}</b> ay <b>KASALUKUYANG INEEVALUATE</b> ng ating mga Municipal Evaluators at Building Officials.`;
  } else if (statusKey.includes("approv")) {
    badgeBg = "#dcfce7";
    badgeColor = "#166534";
    statusExplanation = `Magandang balita! Ang inyong aplikasyon para sa <b>${cleanPermit}</b> (${projectName}) na may Reference No. <b>${applicationId}</b> ay <b>OPISYAL NANG NA-APRUBAHAN</b> ng Municipal Building Official.`;
  } else if (statusKey.includes("pay")) {
    badgeBg = "#fef3c7";
    badgeColor = "#92400e";
    statusExplanation = `Ang inyong aplikasyon para sa <b>${cleanPermit}</b> (${projectName}) ay nasuri na at handa na para sa <b>PAGBABAYAD (For Payment)</b>. Maaari na po kayong kumuha ng Order of Payment sa dashboard.`;
  } else if (statusKey.includes("release")) {
    badgeBg = "#e0e7ff";
    badgeColor = "#3730a3";
    statusExplanation = `Ang inyong opisyal na permit para sa <b>${cleanPermit}</b> na may Reference No. <b>${applicationId}</b> ay <b>OPISYAL NANG NA-RELEASE</b>. Maaari niyo na itong i-download at i-print.`;
  } else if (statusKey.includes("reject") || statusKey.includes("disapprov")) {
    badgeBg = "#fee2e2";
    badgeColor = "#991b1b";
    statusExplanation = `Ang inyong aplikasyon para sa <b>${cleanPermit}</b> (${applicationId}) ay sumailalim sa pagsusuri at nangangailangan ng karagdagang pagsasaayos o dokumento.`;
  } else {
    badgeBg = "#e2e8f0";
    badgeColor = "#1e293b";
    statusExplanation = `Nais po naming ipaalam na ang katayuan ng inyong aplikasyon para sa <b>${cleanPermit}</b> (${applicationId}) ay na-update patungong <b>${displayStatus.toUpperCase()}</b>.`;
  }

  const subject = `e-Tayo Permit Application ${applicationId} (${cleanPermit}): Status is now ${displayStatus}`;

  const htmlBody = `
<div style="font-family: Arial, sans-serif; background-color: #f1f5f9; padding: 24px; color: #1e293b;">
  <div style="max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.06);">
    <div style="background: linear-gradient(135deg, #0038A8 0%, #001f5c 100%); padding: 24px; text-align: center; color: white;">
      <h1 style="margin: 0 0 6px 0; font-size: 20px; font-weight: 800; letter-spacing: 0.5px;">MUNICIPALITY OF STO. TOMAS, PAMPANGA</h1>
      <p style="margin: 0; font-size: 13px; opacity: 0.9; letter-spacing: 0.5px;">Office of the Building Official (OBO) &middot; e-Tayo Permitting System</p>
    </div>
    <div style="padding: 24px;">
      <h2 style="font-size: 17px; color: #0f172a; margin-top: 0;">Magandang araw, ${applicantName}!</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #334155;">${statusExplanation}</p>
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin: 20px 0;">
        <h3 style="margin: 0 0 12px 0; font-size: 13px; text-transform: uppercase; color: #64748b; letter-spacing: 0.8px;">Application Details &middot; Detalye ng Aplikasyon</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 13.5px;">
          <tr><td style="padding: 6px 0; color: #64748b; width: 42%;">Application Ref ID:</td><td style="padding: 6px 0; font-weight: 700; color: #0038A8;">${applicationId}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;">Permit Classification:</td><td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${cleanPermit}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;">Project Title:</td><td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${projectName}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;">Project Location:</td><td style="padding: 6px 0; color: #334155;">${projectAddress}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;">Current Status:</td><td style="padding: 6px 0;"><span style="display: inline-block; padding: 4px 10px; border-radius: 9999px; font-weight: 700; font-size: 12px; background: ${badgeBg}; color: ${badgeColor};">${displayStatus.toUpperCase()}</span></td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;">Evaluated By:</td><td style="padding: 6px 0; color: #334155;">${evaluatorName}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;">Evaluator Remarks:</td><td style="padding: 6px 0; color: #334155; font-style: italic;">${cleanRemarks}</td></tr>
        </table>
      </div>
      <div style="text-align: center; margin: 26px 0;">
        <a href="https://e-tayo-official.vercel.app/applicant/track" style="background: #0038A8; color: #ffffff; text-decoration: none; padding: 12px 26px; border-radius: 6px; font-weight: 700; font-size: 14px; display: inline-block;">View Application Status &rarr;</a>
      </div>
      <p style="font-size: 12.5px; color: #64748b; line-height: 1.5; margin-bottom: 0;">Maaari rin kayong mag-log in sa inyong e-Tayo account upang i-download ang mga opisyal na dokumento o sumagot sa mensahe ng evaluator.</p>
    </div>
    <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 24px; text-align: center; font-size: 11.5px; color: #94a3b8;">
      <p style="margin: 0 0 4px 0;">Office of the Building Official (OBO) &middot; Municipal Hall of Sto. Tomas, Pampanga</p>
      <p style="margin: 0;">This is an automated notification from the e-Tayo Permitting and Monitoring System.</p>
    </div>
  </div>
</div>`;

  try {
    const payload = {
      to: toEmail.trim(),
      subject,
      body: htmlBody,
      passkey: PASSKEY
    };

    fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).catch(err => {
      console.warn("Background email notification error:", err?.message || err);
    });

    return true;
  } catch (e) {
    console.error("Failed to send status update email:", e);
    return false;
  }
}
