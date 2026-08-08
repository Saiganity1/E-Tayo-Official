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
}
