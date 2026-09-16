package com.etayo.backend.controller;

import com.etayo.backend.model.PermitApplication;
import com.etayo.backend.repository.PermitApplicationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/permits")
public class PermitController {

    @Autowired
    private PermitApplicationRepository permitApplicationRepository;

    @Autowired
    private com.etayo.backend.service.AuditLoggingService auditLoggingService;

    @Autowired
    private com.etayo.backend.service.GoogleDriveService googleDriveService;

    @Autowired
    private com.etayo.backend.repository.UserRepository userRepository;

    @Autowired
    private com.etayo.backend.service.FileStorageService fileStorageService;

    @GetMapping
    public ResponseEntity<List<PermitApplication>> getAllPermits(org.springframework.security.core.Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            // Unauthenticated / public callers cannot dump municipal permit records
            return ResponseEntity.ok(java.util.Collections.emptyList());
        }

        boolean isStaffOrAdmin = authentication.getAuthorities().stream().anyMatch(a ->
            a.getAuthority().equals("ROLE_STAFF") ||
            a.getAuthority().equals("ROLE_ADMIN") ||
            a.getAuthority().equals("ROLE_SUPERADMIN")
        );

        if (isStaffOrAdmin) {
            return ResponseEntity.ok(permitApplicationRepository.findAll());
        }

        // Authenticated applicants can only access applications matching their email or name
        String principal = authentication.getName();
        com.etayo.backend.model.User currentUser = userRepository.findByEmail(principal).orElse(null);
        String currentUserName = (currentUser != null && currentUser.getName() != null) ? currentUser.getName() : null;

        List<PermitApplication> applicantPermits = permitApplicationRepository.findAll().stream()
            .filter(p -> (p.getApplicantEmail() != null && p.getApplicantEmail().equalsIgnoreCase(principal))
                      || (p.getApplicantName() != null && p.getApplicantName().equalsIgnoreCase(principal))
                      || (currentUserName != null && currentUserName.equalsIgnoreCase(p.getApplicantName())))
            .toList();

        return ResponseEntity.ok(applicantPermits);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PermitApplication> getPermitById(@PathVariable String id) {
        return permitApplicationRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<PermitApplication> createPermit(
            @RequestBody PermitApplication permit,
            org.springframework.security.core.Authentication authentication) {

        // Strict Guard 1: If application with this ID already exists in the database, return it immediately without touching Drive!
        if (permit.getId() != null && permitApplicationRepository.existsById(permit.getId())) {
            return ResponseEntity.ok(permitApplicationRepository.findById(permit.getId()).get());
        }

        // Strict Guard 2: If the payload has a Google Drive link and no base64 files to extract locally
        if (permit.getFileUrl() != null && permit.getFileUrl().contains("drive.google.com")
                && !permit.getFileUrl().contains("base64,")
                && (permit.getSketchImageUrl() == null || !permit.getSketchImageUrl().contains("base64,"))) {
            PermitApplication saved = permitApplicationRepository.save(permit);
            return ResponseEntity.ok(saved);
        }

        // 1. Resolve applicant full name and email
        String applicantName = permit.getApplicantName();
        if (authentication != null) {
            String principalName = authentication.getName();
            com.etayo.backend.model.User user = userRepository.findByEmail(principalName).orElse(null);
            if (user != null) {
                if (user.getName() != null && !user.getName().trim().isEmpty()) {
                    applicantName = user.getName().trim();
                    permit.setApplicantName(applicantName);
                }
                if (user.getEmail() != null && !user.getEmail().trim().isEmpty()) {
                    permit.setApplicantEmail(user.getEmail().trim());
                }
            } else if (principalName != null && !principalName.trim().isEmpty()) {
                applicantName = principalName.trim();
                permit.setApplicantName(applicantName);
                if (principalName.contains("@")) {
                    permit.setApplicantEmail(principalName);
                }
            }
        }
        if (applicantName == null || applicantName.trim().isEmpty()) {
            applicantName = "Applicant";
        }

        // 2. Resolve project type (e.g. "Escalator") and sanitize slashes
        String projectType = permit.getProjectType();
        if (projectType == null || projectType.trim().isEmpty()) {
            if (permit.getProjectName() != null && !permit.getProjectName().trim().isEmpty()) {
                projectType = permit.getProjectName().trim();
            } else if (permit.getPermitType() != null && !permit.getPermitType().trim().isEmpty()) {
                projectType = permit.getPermitType().trim().replace("_", " ");
            } else {
                projectType = "General Application";
            }
        }
        projectType = projectType.replace("/", " - ").trim();
        permit.setProjectType(projectType);

        // 3. Generate timestamp for Date and Time created folder
        String timestamp = java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm-ss"));

        // 4. Primary: Save application documents and attachments to local in-system storage
        List<String> localFileUrls = new ArrayList<>();
        List<byte[]> savedDocBytes = new ArrayList<>();
        List<String> savedDocNames = new ArrayList<>();

        if (permit.getFileUrl() != null && !permit.getFileUrl().trim().isEmpty()) {
            String rawUrls = permit.getFileUrl().trim();
            String[] parts = rawUrls.split(",(?=data:|http:|https:|/|APP-)");
            if (parts.length <= 1 && rawUrls.contains(",data:")) {
                parts = rawUrls.split(",(?=data:)");
            }

            for (int i = 0; i < parts.length; i++) {
                String docUrl = parts[i].trim();
                if (docUrl.isEmpty()) continue;

                if (docUrl.contains("base64,")) {
                    byte[] pdfBytes = decodeBase64Safely(docUrl);
                    if (pdfBytes != null && pdfBytes.length > 0) {
                        String docFileName = (i == 0)
                                ? (permit.getFileName() != null && !permit.getFileName().trim().isEmpty()
                                        ? permit.getFileName().trim()
                                        : (permit.getId() + "_" + projectType.replaceAll("[^a-zA-Z0-9.-]", "_") + "_Permit_Package.pdf"))
                                : (permit.getId() + "_Attachment_" + i + ".pdf");

                        try {
                            String localName = fileStorageService.saveBytes(pdfBytes, docFileName);
                            localFileUrls.add("/api/files/" + localName);
                            savedDocBytes.add(pdfBytes);
                            savedDocNames.add(docFileName);
                        } catch (Exception ioEx) {
                            System.err.println("Failed to save doc locally: " + ioEx.getMessage());
                        }
                    }
                } else if (docUrl.startsWith("/api/files/") || docUrl.startsWith("http")) {
                    localFileUrls.add(docUrl);
                }
            }

            if (!localFileUrls.isEmpty()) {
                permit.setFileUrl(String.join(",", localFileUrls));
            }
        }

        // 5. Primary: Save vicinity sketch map locally
        byte[] sketchBytes = null;
        String sketchFileName = null;
        String sketchContentType = "image/png";
        if (permit.getSketchImageUrl() != null && permit.getSketchImageUrl().contains("base64,")) {
            int commaIdx = permit.getSketchImageUrl().indexOf("base64,");
            String imgMeta = permit.getSketchImageUrl().substring(0, commaIdx);
            if (imgMeta.contains("image/jpeg") || imgMeta.contains("image/jpg")) {
                sketchContentType = "image/jpeg";
            } else if (imgMeta.contains("application/pdf")) {
                sketchContentType = "application/pdf";
            }
            String ext = sketchContentType.contains("jpeg") ? ".jpg" : (sketchContentType.contains("pdf") ? ".pdf" : ".png");
            sketchBytes = decodeBase64Safely(permit.getSketchImageUrl());
            if (sketchBytes != null && sketchBytes.length > 0) {
                sketchFileName = permit.getId() + "_Vicinity_Sketch" + ext;
                try {
                    String localSketchName = fileStorageService.saveBytes(sketchBytes, sketchFileName);
                    permit.setSketchImageUrl("/api/files/" + localSketchName);
                } catch (Exception ioEx) {
                    System.err.println("Failed to save sketch locally: " + ioEx.getMessage());
                }
            }
        }

        // 6. Secondary / Archival: Background backup to Google Drive (if configured)
        // Note: Primary fileUrl is kept pointing to in-system storage; Drive is for backups only.
        try {
            if (googleDriveService != null && googleDriveService.isConfigured()) {
                String targetFolderId = googleDriveService.getOrCreateApplicationFolder(
                    applicantName, projectType, timestamp
                );

                if (targetFolderId != null) {
                    for (int i = 0; i < savedDocBytes.size(); i++) {
                        try {
                            googleDriveService.uploadBytesToFolderId(
                                savedDocBytes.get(i), savedDocNames.get(i), "application/pdf", targetFolderId
                            );
                        } catch (Exception ignored) {}
                    }

                    if (sketchBytes != null && sketchFileName != null) {
                        try {
                            googleDriveService.uploadBytesToFolderId(
                                sketchBytes, sketchFileName, sketchContentType, targetFolderId
                            );
                        } catch (Exception ignored) {}
                    }

                    // Upload backup summary text dossier to Google Drive folder
                    byte[] summaryDoc = generateApplicationSummaryDoc(permit);
                    String summaryFileName = permit.getId() + "_Application_Details.txt";
                    googleDriveService.uploadBytesToFolderId(
                        summaryDoc, summaryFileName, "text/plain", targetFolderId
                    );
                }
            }
        } catch (Exception e) {
            System.err.println("Notice: Google Drive background backup skipped: " + e.getMessage());
        }

        PermitApplication saved = permitApplicationRepository.save(permit);
        try {
            auditLoggingService.logAction(
                "PERMIT_CREATED",
                saved.getApplicantEmail() != null ? saved.getApplicantEmail() : "Applicant",
                String.format("New application submitted: %s (%s) for %s [Drive Synced: %s]",
                    saved.getId(),
                    saved.getPermitType() != null ? saved.getPermitType().replace("_", " ") : "Permit",
                    saved.getApplicantName() != null ? saved.getApplicantName() : "Applicant",
                    (saved.getFileUrl() != null && saved.getFileUrl().contains("drive.google.com")) ? "YES" : "LOCAL")
            );
        } catch (Exception ignored) {}
        return ResponseEntity.ok(saved);
    }

    /**
     * Safely sanitizes and decodes a raw Base64 string into bytes.
     * Prevents IllegalArgumentException caused by whitespace, invalid padding, or concatenated URIs.
     */
    private byte[] decodeBase64Safely(String raw) {
        if (raw == null || raw.trim().isEmpty()) return null;
        String clean = raw.trim();
        if (clean.contains("base64,")) {
            clean = clean.substring(clean.indexOf("base64,") + 7);
        }
        int endIdx = clean.indexOf(',');
        if (endIdx != -1) {
            clean = clean.substring(0, endIdx);
        }
        // Remove all characters outside the Base64 alphabet
        clean = clean.replaceAll("[^A-Za-z0-9+/=_-]", "");
        if (clean.isEmpty()) return null;

        clean = clean.replace('-', '+').replace('_', '/');

        int mod = clean.length() % 4;
        if (mod == 2) clean += "==";
        else if (mod == 3) clean += "=";
        else if (mod == 1) clean = clean.substring(0, clean.length() - 1);

        try {
            return java.util.Base64.getMimeDecoder().decode(clean);
        } catch (Exception e1) {
            try {
                return java.util.Base64.getDecoder().decode(clean);
            } catch (Exception e2) {
                try {
                    return java.util.Base64.getUrlDecoder().decode(clean);
                } catch (Exception e3) {
                    System.err.println("Notice: Could not decode base64 data: " + e3.getMessage());
                    return null;
                }
            }
        }
    }

    private byte[] generateApplicationSummaryDoc(PermitApplication permit) {
        StringBuilder sb = new StringBuilder();
        sb.append("========================================================================\n");
        sb.append("      REPUBLIC OF THE PHILIPPINES - MUNICIPALITY OF STO. TOMAS\n");
        sb.append("              OFFICIAL APPLICATION DOSSIER & SUMMARY\n");
        sb.append("========================================================================\n\n");
        sb.append("APPLICATION REFERENCE: ").append(permit.getId()).append("\n");
        sb.append("DATE SUBMITTED:        ").append(permit.getDateSubmitted()).append("\n");
        sb.append("CURRENT STATUS:        ").append(permit.getStatus() != null ? permit.getStatus().toUpperCase() : "PENDING").append("\n");
        sb.append("PROJECT TYPE:          ").append(permit.getProjectType()).append("\n");
        sb.append("PERMIT CLASSIFICATION: ").append(permit.getPermitType()).append("\n");
        if (permit.getLocationalClearanceRef() != null) {
            sb.append("LOCATIONAL CLEARANCE:  ").append(permit.getLocationalClearanceRef()).append("\n");
        }
        sb.append("\n--- APPLICANT INFORMATION ---\n");
        sb.append("APPLICANT NAME:        ").append(permit.getApplicantName()).append("\n");
        sb.append("APPLICANT EMAIL:       ").append(permit.getApplicantEmail()).append("\n");
        sb.append("APPLICANT PHONE:       ").append(permit.getApplicantPhone()).append("\n");
        sb.append("APPLICANT ADDRESS:     ").append(permit.getApplicantAddress()).append("\n");
        sb.append("\n--- PROJECT SPECIFICATIONS ---\n");
        sb.append("PROJECT NAME:          ").append(permit.getProjectName()).append("\n");
        sb.append("PROJECT ADDRESS:       ").append(permit.getProjectAddress()).append("\n");
        sb.append("PROJECT DESCRIPTION:   ").append(permit.getProjectDescription()).append("\n");
        if (permit.getLocation() != null) {
            sb.append("COORDINATES:           Lat ").append(permit.getLocation().getLat())
              .append(", Lng ").append(permit.getLocation().getLng()).append("\n");
        }
        if (permit.getEstimatedFees() > 0) {
            sb.append("ESTIMATED FEES:        PHP ").append(String.format("%.2f", permit.getEstimatedFees())).append("\n");
        }
        if (permit.getRequirements() != null && !permit.getRequirements().isEmpty()) {
            sb.append("\n--- SUBMITTED DOCUMENTS & PERMITS ---\n");
            for (com.etayo.backend.model.Requirement req : permit.getRequirements()) {
                sb.append(" - ").append(req.getName()).append(" [Status: ").append(req.getStatus()).append("] (File: ").append(req.getFileName()).append(")\n");
            }
        }
        sb.append("\n========================================================================\n");
        sb.append("e-Tayo Sto. Tomas Municipal e-Governance and Permitting Platform\n");
        sb.append("Official Record Automatically Synced with Google Drive Storage\n");
        sb.append("========================================================================\n");
        return sb.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
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
