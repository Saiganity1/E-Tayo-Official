package com.etayo.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "evaluation_logs")
public class EvaluationLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String staffEmail;

    @Column(nullable = false)
    private String applicantEmail;

    @Column(nullable = false)
    private String permitType;

    @Column(nullable = false)
    private String action; // e.g., "Approved", "Rejected"

    @Column(nullable = false)
    private String comments;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    public EvaluationLog() {}

    public EvaluationLog(String staffEmail, String applicantEmail, String permitType, String action, String comments, LocalDateTime timestamp) {
        this.staffEmail = staffEmail;
        this.applicantEmail = applicantEmail;
        this.permitType = permitType;
        this.action = action;
        this.comments = comments;
        this.timestamp = timestamp;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getStaffEmail() { return staffEmail; }
    public void setStaffEmail(String staffEmail) { this.staffEmail = staffEmail; }

    public String getApplicantEmail() { return applicantEmail; }
    public void setApplicantEmail(String applicantEmail) { this.applicantEmail = applicantEmail; }

    public String getPermitType() { return permitType; }
    public void setPermitType(String permitType) { this.permitType = permitType; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public String getComments() { return comments; }
    public void setComments(String comments) { this.comments = comments; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}
