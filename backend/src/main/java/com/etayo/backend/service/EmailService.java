package com.etayo.backend.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @org.springframework.beans.factory.annotation.Value("${spring.mail.username:}")
    private String fromEmail;

    public void sendEmail(String to, String subject, String htmlBody) {
        if (mailSender == null) {
            System.out.println("Email ignored (mailSender not configured). To: " + to + " Subject: " + subject);
            return;
        }

        java.util.concurrent.CompletableFuture.runAsync(() -> {
            try {
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
                
                if (fromEmail != null && !fromEmail.isEmpty()) {
                    helper.setFrom(fromEmail);
                }
                helper.setTo(to);
                helper.setSubject(subject);
                helper.setText(htmlBody, true); // true indicates HTML content
                
                mailSender.send(message);
                System.out.println("Email sent successfully to " + to);
            } catch (MessagingException e) {
                System.err.println("Failed to send email to " + to + ": " + e.getMessage());
            } catch (Exception e) {
                System.err.println("Error sending email: " + e.getMessage());
            }
        });
    }
}
