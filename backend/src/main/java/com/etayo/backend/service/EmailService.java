package com.etayo.backend.service;

import org.springframework.stereotype.Service;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

@Service
public class EmailService {

    // The Web App URL you deployed
    private static final String APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzAy1lKPyiGEONoGPJtVJeLwCVtwT_oSayzG0-pCpdecIqatAo8OAvcufV_36VBxYAO/exec";
    private static final String PASSKEY = "eTayoSecureAdminKey2026";

    public void sendEmail(String to, String subject, String htmlBody) {
        if (to == null || to.trim().isEmpty() || !to.contains("@")) {
            System.err.println("Notice: Skipping email send because recipient is invalid or empty: " + to);
            return;
        }

        java.util.concurrent.CompletableFuture.runAsync(() -> {
            try {
                // Escape JSON safely
                String escapedTo = to.replace("\"", "\\\"");
                String escapedSubject = subject.replace("\"", "\\\"");
                // Also escape newlines and quotes in the HTML body
                String escapedBody = htmlBody.replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "");
                
                String jsonPayload = String.format(
                    "{\"to\": \"%s\", \"subject\": \"%s\", \"body\": \"%s\", \"passkey\": \"%s\"}",
                    escapedTo, escapedSubject, escapedBody, PASSKEY
                );

                HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(10))
                    .build();

                HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(APPS_SCRIPT_URL))
                    .timeout(Duration.ofSeconds(15))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                    .build();

                HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

                if (response.statusCode() == 200 || response.statusCode() == 302) {
                    System.out.println("Google Apps Script email trigger sent for: " + to + " | Response: " + response.body());
                } else {
                    System.err.println("Failed to trigger email script for " + to + " | Status: " + response.statusCode() + " | Body: " + response.body());
                }
            } catch (Exception e) {
                System.err.println("Exception while triggering Google Apps Script email: " + e.getMessage());
                e.printStackTrace();
            }
        });
    }

    /**
     * Sends a specific, official email to the applicant whenever their permit application status changes.
     */
    public void sendApplicationStatusEmail(
            String toEmail,
            String applicantName,
            String applicationId,
            String permitType,
            String projectName,
            String projectAddress,
            String oldStatus,
            String newStatus,
            String remarks,
            String evaluatorName
    ) {
        if (toEmail == null || toEmail.trim().isEmpty() || !toEmail.contains("@")) {
            return;
        }

        String name = (applicantName != null && !applicantName.trim().isEmpty()) ? applicantName.trim() : "Valued Applicant";
        String cleanId = (applicationId != null && !applicationId.trim().isEmpty()) ? applicationId.trim() : "Permit Application";
        String cleanPermit = (permitType != null && !permitType.trim().isEmpty()) ? permitType.replace("_", " ").toUpperCase() : "Permit";
        String cleanProject = (projectName != null && !projectName.trim().isEmpty()) ? projectName.trim() : "Permit Project";
        String cleanAddress = (projectAddress != null && !projectAddress.trim().isEmpty()) ? projectAddress.trim() : "Sto. Tomas, Pampanga";
        String cleanEvaluator = (evaluatorName != null && !evaluatorName.trim().isEmpty()) ? evaluatorName.trim() : "Municipal Building Official / Evaluator";
        String cleanRemarks = (remarks != null && !remarks.trim().isEmpty()) ? remarks.trim() : "Evaluation in progress according to National Building Code requirements.";

        String statusKey = (newStatus != null) ? newStatus.trim().toLowerCase() : "pending";
        String displayStatus = statusKey.replace("_", " ");
        displayStatus = Character.toUpperCase(displayStatus.charAt(0)) + displayStatus.substring(1);

        String badgeBg = "#f1f5f9";
        String badgeColor = "#334155";
        String statusExplanation = "";

        if (statusKey.contains("eval") || statusKey.contains("progress") || statusKey.contains("review")) {
            badgeBg = "#dbeafe";
            badgeColor = "#1e40af";
            statusExplanation = "Ipinapaalam po namin na ang inyong aplikasyon para sa <b>" + cleanPermit + "</b> (" + cleanProject + ") na may Reference No. <b>" + cleanId + "</b> ay <b>KASALUKUYANG INEEVALUATE</b> ng ating mga Municipal Evaluators at Building Officials.";
        } else if (statusKey.contains("approv")) {
            badgeBg = "#dcfce7";
            badgeColor = "#166534";
            statusExplanation = "Magandang balita! Ang inyong aplikasyon para sa <b>" + cleanPermit + "</b> (" + cleanProject + ") na may Reference No. <b>" + cleanId + "</b> ay <b>OPISYAL NANG NA-APRUBAHAN</b> ng Municipal Building Official.";
        } else if (statusKey.contains("pay")) {
            badgeBg = "#fef3c7";
            badgeColor = "#92400e";
            statusExplanation = "Ang inyong aplikasyon para sa <b>" + cleanPermit + "</b> (" + cleanProject + ") ay nasuri na at handa na para sa <b>PAGBABAYAD (For Payment)</b>. Maaari na po kayong kumuha ng Order of Payment sa dashboard.";
        } else if (statusKey.contains("release")) {
            badgeBg = "#e0e7ff";
            badgeColor = "#3730a3";
            statusExplanation = "Ang inyong opisyal na permit para sa <b>" + cleanPermit + "</b> na may Reference No. <b>" + cleanId + "</b> ay <b>OPISYAL NANG NA-RELEASE</b>. Maaari niyo na itong i-download at i-print.";
        } else if (statusKey.contains("reject") || statusKey.contains("disapprov")) {
            badgeBg = "#fee2e2";
            badgeColor = "#991b1b";
            statusExplanation = "Ang inyong aplikasyon para sa <b>" + cleanPermit + "</b> (" + cleanId + ") ay sumailalim sa pagsusuri at nangangailangan ng karagdagang pagsasaayos o dokumento.";
        } else {
            badgeBg = "#e2e8f0";
            badgeColor = "#1e293b";
            statusExplanation = "Nais po naming ipaalam na ang katayuan ng inyong aplikasyon para sa <b>" + cleanPermit + "</b> (" + cleanId + ") ay na-update patungong <b>" + displayStatus.toUpperCase() + "</b>.";
        }

        String subject = "e-Tayo Permit Application " + cleanId + " (" + cleanPermit + "): Status is now " + displayStatus;

        String htmlBody = "<div style=\"font-family: Arial, sans-serif; background-color: #f1f5f9; padding: 24px; color: #1e293b;\">" +
                "<div style=\"max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.06);\">" +
                "<div style=\"background: linear-gradient(135deg, #0038A8 0%, #001f5c 100%); padding: 24px; text-align: center; color: white;\">" +
                "<h1 style=\"margin: 0 0 6px 0; font-size: 20px; font-weight: 800; letter-spacing: 0.5px;\">MUNICIPALITY OF STO. TOMAS, PAMPANGA</h1>" +
                "<p style=\"margin: 0; font-size: 13px; opacity: 0.9; letter-spacing: 0.5px;\">Office of the Building Official (OBO) &middot; e-Tayo Permitting System</p>" +
                "</div>" +
                "<div style=\"padding: 24px;\">" +
                "<h2 style=\"font-size: 17px; color: #0f172a; margin-top: 0;\">Magandang araw, " + name + "!</h2>" +
                "<p style=\"font-size: 14px; line-height: 1.6; color: #334155;\">" + statusExplanation + "</p>" +
                "<div style=\"background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin: 20px 0;\">" +
                "<h3 style=\"margin: 0 0 12px 0; font-size: 13px; text-transform: uppercase; color: #64748b; letter-spacing: 0.8px;\">Application Details &middot; Detalye ng Aplikasyon</h3>" +
                "<table style=\"width: 100%; border-collapse: collapse; font-size: 13.5px;\">" +
                "<tr><td style=\"padding: 6px 0; color: #64748b; width: 42%;\">Application Ref ID:</td><td style=\"padding: 6px 0; font-weight: 700; color: #0038A8;\">" + cleanId + "</td></tr>" +
                "<tr><td style=\"padding: 6px 0; color: #64748b;\">Permit Classification:</td><td style=\"padding: 6px 0; font-weight: 600; color: #0f172a;\">" + cleanPermit + "</td></tr>" +
                "<tr><td style=\"padding: 6px 0; color: #64748b;\">Project Title:</td><td style=\"padding: 6px 0; font-weight: 600; color: #0f172a;\">" + cleanProject + "</td></tr>" +
                "<tr><td style=\"padding: 6px 0; color: #64748b;\">Project Location:</td><td style=\"padding: 6px 0; color: #334155;\">" + cleanAddress + "</td></tr>" +
                "<tr><td style=\"padding: 6px 0; color: #64748b;\">Current Status:</td><td style=\"padding: 6px 0;\"><span style=\"display: inline-block; padding: 4px 10px; border-radius: 9999px; font-weight: 700; font-size: 12px; background: " + badgeBg + "; color: " + badgeColor + ";\">" + displayStatus.toUpperCase() + "</span></td></tr>" +
                "<tr><td style=\"padding: 6px 0; color: #64748b;\">Evaluated By:</td><td style=\"padding: 6px 0; color: #334155;\">" + cleanEvaluator + "</td></tr>" +
                "<tr><td style=\"padding: 6px 0; color: #64748b;\">Evaluator Remarks:</td><td style=\"padding: 6px 0; color: #334155; font-style: italic;\">" + cleanRemarks + "</td></tr>" +
                "</table>" +
                "</div>" +
                "<div style=\"text-align: center; margin: 26px 0;\">" +
                "<a href=\"https://e-tayo-official.vercel.app/applicant/track\" style=\"background: #0038A8; color: #ffffff; text-decoration: none; padding: 12px 26px; border-radius: 6px; font-weight: 700; font-size: 14px; display: inline-block;\">View Application Status &rarr;</a>" +
                "</div>" +
                "<p style=\"font-size: 12.5px; color: #64748b; line-height: 1.5; margin-bottom: 0;\">Maaari rin kayong mag-log in sa inyong e-Tayo account upang i-download ang mga opisyal na dokumento o sumagot sa mensahe ng evaluator.</p>" +
                "</div>" +
                "<div style=\"background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 24px; text-align: center; font-size: 11.5px; color: #94a3b8;\">" +
                "<p style=\"margin: 0 0 4px 0;\">Office of the Building Official (OBO) &middot; Municipal Hall of Sto. Tomas, Pampanga</p>" +
                "<p style=\"margin: 0;\">This is an automated notification from the e-Tayo Permitting and Monitoring System.</p>" +
                "</div>" +
                "</div>" +
                "</div>";

        sendEmail(toEmail.trim(), subject, htmlBody);
    }
}
