package com.etayo.backend.controller;

import com.etayo.backend.model.PermitApplication;
import com.etayo.backend.repository.PermitApplicationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/permits")
public class PermitController {

    @Autowired
    private PermitApplicationRepository permitApplicationRepository;

    @Autowired
    private com.etayo.backend.service.AuditLoggingService auditLoggingService;

    @GetMapping
    public ResponseEntity<List<PermitApplication>> getAllPermits() {
        return ResponseEntity.ok(permitApplicationRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PermitApplication> getPermitById(@PathVariable String id) {
        return permitApplicationRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<PermitApplication> createPermit(@RequestBody PermitApplication permit) {
        PermitApplication saved = permitApplicationRepository.save(permit);
        try {
            auditLoggingService.logAction(
                "PERMIT_CREATED",
                saved.getApplicantEmail() != null ? saved.getApplicantEmail() : "Applicant",
                String.format("New application submitted: %s (%s) for %s",
                    saved.getId(),
                    saved.getPermitType() != null ? saved.getPermitType().replace("_", " ") : "Permit",
                    saved.getApplicantName() != null ? saved.getApplicantName() : "Applicant")
            );
        } catch (Exception ignored) {}
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<PermitApplication> updatePermit(@PathVariable String id, @RequestBody PermitApplication permit) {
        permit.setId(id);
        return permitApplicationRepository.findById(id).map(existing -> {
            String oldStatus = existing.getStatus();
            existing.setStatus(permit.getStatus());
            if (permit.getRemarks() != null) existing.setRemarks(permit.getRemarks());

            if (oldStatus != null && !oldStatus.equalsIgnoreCase(permit.getStatus())) {
                try {
                    String staff = permit.getAssignedStaff() != null ? permit.getAssignedStaff() : "Staff Evaluator";
                    String applicant = existing.getApplicantName() != null ? existing.getApplicantName() : existing.getApplicantEmail();
                    auditLoggingService.logAction(
                        "PERMIT_EVALUATED_" + permit.getStatus().toUpperCase(),
                        staff,
                        String.format("Application %s (%s) status changed from '%s' to '%s' for applicant %s. Remarks: %s",
                            id,
                            existing.getProjectName() != null ? existing.getProjectName() : "Permit",
                            oldStatus,
                            permit.getStatus(),
                            applicant,
                            permit.getRemarks() != null ? permit.getRemarks() : "None")
                    );
                } catch (Exception ignored) {}
            }
            
            if (permit.getTrackingSteps() != null) {
                if (existing.getTrackingSteps() == null) {
                    existing.setTrackingSteps(new java.util.ArrayList<>(permit.getTrackingSteps()));
                } else {
                    existing.getTrackingSteps().clear();
                    existing.getTrackingSteps().addAll(permit.getTrackingSteps());
                }
            }
            if (permit.getHistoryLog() != null) {
                if (existing.getHistoryLog() == null) {
                    existing.setHistoryLog(new java.util.ArrayList<>(permit.getHistoryLog()));
                } else {
                    existing.getHistoryLog().clear();
                    existing.getHistoryLog().addAll(permit.getHistoryLog());
                }
            }
            if (permit.getRequirements() != null) {
                if (existing.getRequirements() == null) {
                    existing.setRequirements(new java.util.ArrayList<>(permit.getRequirements()));
                } else {
                    existing.getRequirements().clear();
                    existing.getRequirements().addAll(permit.getRequirements());
                }
            }
            
            if (permit.getApplicantName() != null) existing.setApplicantName(permit.getApplicantName());
            if (permit.getProjectName() != null) existing.setProjectName(permit.getProjectName());
            if (permit.getApplicantEmail() != null) existing.setApplicantEmail(permit.getApplicantEmail());
            if (permit.getApplicantPhone() != null) existing.setApplicantPhone(permit.getApplicantPhone());
            if (permit.getApplicantAddress() != null) existing.setApplicantAddress(permit.getApplicantAddress());
            if (permit.getProjectAddress() != null) existing.setProjectAddress(permit.getProjectAddress());
            if (permit.getProjectDescription() != null) existing.setProjectDescription(permit.getProjectDescription());
            if (permit.getPermitType() != null) existing.setPermitType(permit.getPermitType());
            if (permit.getLocation() != null) existing.setLocation(permit.getLocation());
            if (permit.getAssignedStaff() != null) existing.setAssignedStaff(permit.getAssignedStaff());
            if (permit.getPaymentStatus() != null) existing.setPaymentStatus(permit.getPaymentStatus());
            if (permit.getEstimatedFees() > 0) existing.setEstimatedFees(permit.getEstimatedFees());
            if (permit.getFileUrl() != null && !permit.getFileUrl().isEmpty()) existing.setFileUrl(permit.getFileUrl());
            if (permit.getFileName() != null && !permit.getFileName().isEmpty()) existing.setFileName(permit.getFileName());
            if (permit.getSketchImageUrl() != null && !permit.getSketchImageUrl().isEmpty()) existing.setSketchImageUrl(permit.getSketchImageUrl());
            if (permit.getProjectType() != null) existing.setProjectType(permit.getProjectType());
            if (permit.getDateSubmitted() != null) existing.setDateSubmitted(permit.getDateSubmitted());
            
            return ResponseEntity.ok(permitApplicationRepository.save(existing));
        }).orElseGet(() -> {
            return ResponseEntity.ok(permitApplicationRepository.save(permit));
        });
    }

    @PatchMapping("/{id}/status")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<PermitApplication> updatePermitStatus(@PathVariable String id, @RequestBody java.util.Map<String, Object> payload) {
        return permitApplicationRepository.findById(id).map(existing -> {
            String oldStatus = existing.getStatus();
            if (payload.containsKey("status") && payload.get("status") != null) {
                existing.setStatus(String.valueOf(payload.get("status")));
            }
            if (payload.containsKey("remarks") && payload.get("remarks") != null) {
                existing.setRemarks(String.valueOf(payload.get("remarks")));
            }
            if (oldStatus != null && !oldStatus.equalsIgnoreCase(existing.getStatus())) {
                try {
                    auditLoggingService.logAction(
                        "PERMIT_EVALUATED_" + existing.getStatus().toUpperCase(),
                        existing.getAssignedStaff() != null ? existing.getAssignedStaff() : "Staff Evaluator",
                        String.format("Application %s (%s) status changed from '%s' to '%s' for applicant %s. Remarks: %s",
                            id,
                            existing.getProjectName() != null ? existing.getProjectName() : "Permit",
                            oldStatus,
                            existing.getStatus(),
                            existing.getApplicantName() != null ? existing.getApplicantName() : existing.getApplicantEmail(),
                            existing.getRemarks() != null ? existing.getRemarks() : "None")
                    );
                } catch (Exception ignored) {}
            }
            return ResponseEntity.ok(permitApplicationRepository.save(existing));
        }).orElseGet(() -> {
            PermitApplication app = new PermitApplication();
            app.setId(id);
            if (payload.containsKey("status") && payload.get("status") != null) {
                app.setStatus(String.valueOf(payload.get("status")));
            }
            if (payload.containsKey("remarks") && payload.get("remarks") != null) {
                app.setRemarks(String.valueOf(payload.get("remarks")));
            }
            return ResponseEntity.ok(permitApplicationRepository.save(app));
        });
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePermit(@PathVariable String id) {
        if (!permitApplicationRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        permitApplicationRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
