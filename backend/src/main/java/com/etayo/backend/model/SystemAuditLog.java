package com.etayo.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "system_audit_logs")
public class SystemAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String action; // e.g., "USER_LOGIN", "OTP_REQUESTED", "ROLE_CHANGED", "EVALUATION_APPROVED"

    @Column(nullable = false)
    private String userEmail; // The user who performed or is associated with the action

    @Column(columnDefinition = "TEXT")
    private String details; // Any extra context

    @Column(nullable = false)
    private String ipAddress; // The IP address of the requester

    @Column(nullable = false)
    private LocalDateTime timestamp;

    public SystemAuditLog() {
        this.timestamp = LocalDateTime.now();
        this.ipAddress = "127.0.0.1";
    }

    public SystemAuditLog(String action, String userEmail, String details, String ipAddress) {
        this.action = action;
        this.userEmail = userEmail;
        this.details = details;
        this.ipAddress = (ipAddress != null && !ipAddress.isEmpty()) ? ipAddress : "127.0.0.1";
        this.timestamp = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }

    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }

    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }

    // Helpers for Jackson serialization and direct frontend compatibility
    public String getMessage() {
        if (details != null && !details.trim().isEmpty()) {
            return details;
        }
        if (action != null && !action.trim().isEmpty()) {
            return action.replace("_", " ");
        }
        return "System Activity";
    }

    public String getUser() {
        return (userEmail != null && !userEmail.trim().isEmpty()) ? userEmail : "System";
    }

    public String getCategory() {
        if (action == null) return "system";
        String upper = action.toUpperCase();
        if (upper.contains("EVALUAT") || upper.contains("PERMIT") || upper.contains("APPLICATION")) {
            return "application";
        }
        if (upper.contains("LOGIN") || upper.contains("OTP") || upper.contains("AUTH") || upper.contains("TOKEN") || upper.contains("PASSWORD")) {
            return "security";
        }
        if (upper.contains("FEE") || upper.contains("SETTING")) {
            return "setting";
        }
        return "system";
    }

    public String getStatus() {
        if (action == null && details == null) return "info";
        String combined = ((action != null ? action : "") + " " + (details != null ? details : "")).toUpperCase();
        if (combined.contains("APPROV") || combined.contains("SUCCESS") || combined.contains("PASSED")) {
            return "success";
        }
        if (combined.contains("REVISION") || combined.contains("INCOMPLETE") || combined.contains("WARNING") || combined.contains("PENDING")) {
            return "warning";
        }
        if (combined.contains("REJECT") || combined.contains("FAIL") || combined.contains("ERROR") || combined.contains("DENIED")) {
            return "error";
        }
        return "info";
    }
}
