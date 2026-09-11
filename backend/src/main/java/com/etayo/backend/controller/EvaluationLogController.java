package com.etayo.backend.controller;

import com.etayo.backend.model.EvaluationLog;
import com.etayo.backend.repository.EvaluationLogRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/evaluations")
public class EvaluationLogController {

    private final EvaluationLogRepository evaluationLogRepository;
    private final com.etayo.backend.service.EmailService emailService;
    private final com.etayo.backend.repository.NotificationRepository notificationRepository;
    private final com.etayo.backend.service.AuditLoggingService auditLoggingService;

    public EvaluationLogController(EvaluationLogRepository evaluationLogRepository,
                                   com.etayo.backend.service.EmailService emailService,
                                   com.etayo.backend.repository.NotificationRepository notificationRepository,
                                   com.etayo.backend.service.AuditLoggingService auditLoggingService) {
        this.evaluationLogRepository = evaluationLogRepository;
        this.emailService = emailService;
        this.notificationRepository = notificationRepository;
        this.auditLoggingService = auditLoggingService;
    }

    @GetMapping("/staff/{email}")
    public ResponseEntity<List<EvaluationLog>> getStaffEvaluations(@PathVariable String email) {
        List<EvaluationLog> logs = evaluationLogRepository.findByStaffEmailOrderByTimestampDesc(email);
        return ResponseEntity.ok(logs);
    }

    @PostMapping
    public ResponseEntity<EvaluationLog> createEvaluation(@RequestBody EvaluationLog evaluationLog) {
        evaluationLog.setTimestamp(java.time.LocalDateTime.now());
        EvaluationLog saved = evaluationLogRepository.save(evaluationLog);

        // Record in Admin System Audit Logs
        try {
            String act = saved.getAction() != null ? saved.getAction() : "Evaluated";
            String actionCode = "EVALUATION_" + act.toUpperCase().replace(" ", "_");
            String staff = (saved.getStaffEmail() != null && !saved.getStaffEmail().isEmpty()) ? saved.getStaffEmail() : "staff@etayo.gov.ph";
            String applicant = (saved.getApplicantEmail() != null && !saved.getApplicantEmail().isEmpty()) ? saved.getApplicantEmail() : "Applicant";
            String permit = (saved.getPermitType() != null && !saved.getPermitType().isEmpty()) ? saved.getPermitType().replace("_", " ") : "Permit";
            String remarks = (saved.getComments() != null && !saved.getComments().trim().isEmpty()) ? saved.getComments() : "No remarks provided";

            String auditMessage = String.format("Staff %s evaluated %s for applicant %s - Status: %s. Remarks: %s",
                    staff, permit, applicant, act, remarks);

            auditLoggingService.logAction(actionCode, staff, auditMessage);
        } catch (Exception e) {
            System.err.println("Could not log evaluation to audit log: " + e.getMessage());
        }

        // --- Notification Logic ---
        try {
            String title = "Permit Update: " + saved.getAction();
            String messagePreview = "Your application for " + saved.getPermitType() + " was " + saved.getAction() + ". Remarks: " + saved.getComments();
            
            com.etayo.backend.model.Notification notification = new com.etayo.backend.model.Notification(
                saved.getApplicantEmail(),
                title,
                messagePreview,
                "PERMIT_UPDATE",
                "/applicant/track"
            );
            notificationRepository.save(notification);
        } catch (Exception e) {
            System.err.println("Could not save notification: " + e.getMessage());
        }

        // Send Email Alert
        try {
            String htmlBody = "<h2>Update on your e-Tayo Permit Application</h2>" +
                              "<p><b>Permit Type:</b> " + saved.getPermitType() + "</p>" +
                              "<p><b>Status:</b> " + saved.getAction() + "</p>" +
                              "<p><b>Remarks:</b> " + saved.getComments() + "</p>" +
                              "<br><p>Log in to your dashboard to view more details.</p>";
            emailService.sendEmail(saved.getApplicantEmail(), "e-Tayo Permit Update: " + saved.getAction(), htmlBody);
        } catch (Exception e) {
            System.err.println("Could not send email alert: " + e.getMessage());
        }

        return ResponseEntity.ok(saved);
    }
}
