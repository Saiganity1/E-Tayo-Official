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
        String cleanEmail = email != null ? email.trim() : "";
        List<EvaluationLog> logs = evaluationLogRepository.findByStaffEmailIgnoreCaseOrderByTimestampDesc(cleanEmail);
        return ResponseEntity.ok(logs);
    }

    @PostMapping
    public ResponseEntity<EvaluationLog> createEvaluation(@RequestBody EvaluationLog evaluationLog) {
        if (evaluationLog.getTimestamp() == null) {
            evaluationLog.setTimestamp(java.time.LocalDateTime.now());
        }
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
            String act = saved.getAction() != null ? saved.getAction().toLowerCase() : "updated";
            String pType = saved.getPermitType() != null 
                ? (saved.getPermitType().toLowerCase().contains("locational") ? "Locational Clearance"
                  : saved.getPermitType().toLowerCase().contains("building") ? "Building Permit"
                  : saved.getPermitType().replace("_", " "))
                : "Permit";

            String title = pType + " " + (act.contains("release") ? "Released" : act.contains("approv") ? "Approved" : act.contains("review") ? "Under Review" : act.substring(0, 1).toUpperCase() + act.substring(1));
            String comments = (saved.getComments() != null && !saved.getComments().trim().isEmpty() && !saved.getComments().equalsIgnoreCase("none"))
                ? saved.getComments().trim()
                : (act.contains("release") ? "Official receipt verified. Your permit is ready for download."
                  : act.contains("approv") ? "Application approved. Order of Payment is ready for settlement."
                  : "Status updated by municipal engineering office.");

            String appId = saved.getApplicationId() != null ? saved.getApplicationId() : "";
            String messagePreview = !appId.isEmpty() ? String.format("[%s] %s", appId, comments) : comments;
            String notifLink = !appId.isEmpty() ? ("/applicant/track/" + appId) : "/applicant/track";
            
            com.etayo.backend.model.Notification notification = new com.etayo.backend.model.Notification(
                saved.getApplicantEmail(),
                title,
                messagePreview,
                "PERMIT_UPDATE",
                notifLink
            );
            notificationRepository.save(notification);
        } catch (Exception e) {
            System.err.println("Could not save notification: " + e.getMessage());
        }

        // Send Specific Email Alert
        try {
            if (saved.getApplicantEmail() != null && !saved.getApplicantEmail().trim().isEmpty()) {
                String staffName = (saved.getStaffEmail() != null && !saved.getStaffEmail().isEmpty()) ? saved.getStaffEmail() : "Municipal Building Official / Evaluator";
                String appId = (saved.getApplicationId() != null && !saved.getApplicationId().isEmpty()) ? saved.getApplicationId() : "Application";
                String applicantName = (saved.getApplicantName() != null && !saved.getApplicantName().isEmpty()) ? saved.getApplicantName() : "Valued Applicant";
                String projectName = (saved.getProjectName() != null && !saved.getProjectName().isEmpty()) ? saved.getProjectName() : (saved.getPermitType() != null ? saved.getPermitType().replace("_", " ") : "Permit");
                emailService.sendApplicationStatusEmail(
                    saved.getApplicantEmail().trim(),
                    applicantName,
                    appId,
                    saved.getPermitType(),
                    projectName,
                    "Sto. Tomas, Pampanga",
                    "Under Review",
                    saved.getAction(),
                    saved.getComments(),
                    staffName
                );
            }
        } catch (Exception e) {
            System.err.println("Could not send email alert: " + e.getMessage());
        }

        return ResponseEntity.ok(saved);
    }
}
