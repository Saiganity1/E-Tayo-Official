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
    private String action; // e.g., "USER_LOGIN", "OTP_REQUESTED", "ROLE_CHANGED"

    @Column(nullable = false)
    private String userEmail; // The user who performed or is associated with the action

    @Column(length = 500)
    private String details; // Any extra context

    @Column(nullable = false)
    private String ipAddress; // The IP address of the requester

    @Column(nullable = false)
    private LocalDateTime timestamp;

    public SystemAuditLog() {}

    public SystemAuditLog(String action, String userEmail, String details, String ipAddress) {
        this.action = action;
        this.userEmail = userEmail;
        this.details = details;
        this.ipAddress = ipAddress;
        this.timestamp = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public String getAction() { return action; }
    public String getUserEmail() { return userEmail; }
    public String getDetails() { return details; }
    public String getIpAddress() { return ipAddress; }
    public LocalDateTime getTimestamp() { return timestamp; }
}
