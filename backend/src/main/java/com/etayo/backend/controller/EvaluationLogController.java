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

    public EvaluationLogController(EvaluationLogRepository evaluationLogRepository,
                                   com.etayo.backend.service.EmailService emailService,
                                   com.etayo.backend.repository.NotificationRepository notificationRepository) {
        this.evaluationLogRepository = evaluationLogRepository;
        this.emailService = emailService;
        this.notificationRepository = notificationRepository;
    }

    @GetMapping("/staff/{email}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN', 'STAFF')")
    public ResponseEntity<List<EvaluationLog>> getStaffEvaluations(@PathVariable String email) {
        List<EvaluationLog> logs = evaluationLogRepository.findByStaffEmailOrderByTimestampDesc(email);
        return ResponseEntity.ok(logs);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN', 'STAFF')")
    public ResponseEntity<EvaluationLog> createEvaluation(@RequestBody EvaluationLog evaluationLog) {
        evaluationLog.setTimestamp(java.time.LocalDateTime.now());
        EvaluationLog saved = evaluationLogRepository.save(evaluationLog);

        // --- Notification Logic ---
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

        // Send Email Alert
        String htmlBody = "<h2>Update on your e-Tayo Permit Application</h2>" +
                          "<p><b>Permit Type:</b> " + saved.getPermitType() + "</p>" +
                          "<p><b>Status:</b> " + saved.getAction() + "</p>" +
                          "<p><b>Remarks:</b> " + saved.getComments() + "</p>" +
                          "<br><p>Log in to your dashboard to view more details.</p>";
        emailService.sendEmail(saved.getApplicantEmail(), "e-Tayo Permit Update: " + saved.getAction(), htmlBody);

        return ResponseEntity.ok(saved);
    }
}
