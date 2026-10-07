package com.etayo.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "evaluation_logs")
public class EvaluationLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = true)
    private String applicationId;

    @Column(nullable = true)
    private String projectName;

    @Column(nullable = true)
    private String applicantName;

    @Column(nullable = true)
    private String evaluatorName;

    @Column(nullable = false)
    private String staffEmail;

    @Column(nullable = false)
    private String applicantEmail;

    @Column(nullable = false)
    private String permitType;

    @Column(nullable = false)
    private String action; // e.g., "Approved", "Revision Requested", "Disapproved", "Permit Released"

    @Column(nullable = false, columnDefinition = "TEXT")
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

    public EvaluationLog(String staffEmail, String applicantEmail, String applicantName, String applicationId, String projectName, String evaluatorName, String permitType, String action, String comments, LocalDateTime timestamp) {
        this.staffEmail = staffEmail;
        this.applicantEmail = applicantEmail;
        this.applicantName = applicantName;
        this.applicationId = applicationId;
        this.projectName = projectName;
        this.evaluatorName = evaluatorName;
        this.permitType = permitType;
        this.action = action;
        this.comments = comments;
        this.timestamp = timestamp;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getApplicationId() { return applicationId; }
    public void setApplicationId(String applicationId) { this.applicationId = applicationId; }

    public String getProjectName() { return projectName; }
    public void setProjectName(String projectName) { this.projectName = projectName; }

    public String getApplicantName() { return applicantName; }
    public void setApplicantName(String applicantName) { this.applicantName = applicantName; }

    public String getEvaluatorName() { return evaluatorName; }
    public void setEvaluatorName(String evaluatorName) { this.evaluatorName = evaluatorName; }

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
