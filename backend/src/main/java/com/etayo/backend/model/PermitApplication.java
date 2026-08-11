package com.etayo.backend.model;

import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "permit_applications")
public class PermitApplication {

    @Id
    private String id; // e.g., "LC-2025-0001"

    private String permitType;
    private String projectName;
    private String applicantName;
    private String applicantPhone;
    private String applicantEmail;
    private String applicantAddress;
    private String projectAddress;
    @Column(length = 2000)
    private String projectDescription;
    private String status;
    private String dateSubmitted;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "permit_requirements", joinColumns = @JoinColumn(name = "permit_id"))
    private List<Requirement> requirements;

    @Embedded
    private LocationCoordinates location;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "permit_tracking_steps", joinColumns = @JoinColumn(name = "permit_id"))
    private List<TrackingStep> trackingSteps;

    private double estimatedFees;
    private String paymentStatus;
    private String assignedStaff;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "permit_history_logs", joinColumns = @JoinColumn(name = "permit_id"))
    private List<HistoryLog> historyLog;

    @Column(length = 1000)
    private String remarks;

    // Getters and Setters

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getPermitType() { return permitType; }
    public void setPermitType(String permitType) { this.permitType = permitType; }
    public String getProjectName() { return projectName; }
    public void setProjectName(String projectName) { this.projectName = projectName; }
    public String getApplicantName() { return applicantName; }
    public void setApplicantName(String applicantName) { this.applicantName = applicantName; }
    public String getApplicantPhone() { return applicantPhone; }
    public void setApplicantPhone(String applicantPhone) { this.applicantPhone = applicantPhone; }
    public String getApplicantEmail() { return applicantEmail; }
    public void setApplicantEmail(String applicantEmail) { this.applicantEmail = applicantEmail; }
    public String getApplicantAddress() { return applicantAddress; }
    public void setApplicantAddress(String applicantAddress) { this.applicantAddress = applicantAddress; }
    public String getProjectAddress() { return projectAddress; }
    public void setProjectAddress(String projectAddress) { this.projectAddress = projectAddress; }
    public String getProjectDescription() { return projectDescription; }
    public void setProjectDescription(String projectDescription) { this.projectDescription = projectDescription; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getDateSubmitted() { return dateSubmitted; }
    public void setDateSubmitted(String dateSubmitted) { this.dateSubmitted = dateSubmitted; }
    public List<Requirement> getRequirements() { return requirements; }
    public void setRequirements(List<Requirement> requirements) { this.requirements = requirements; }
    public LocationCoordinates getLocation() { return location; }
    public void setLocation(LocationCoordinates location) { this.location = location; }
    public List<TrackingStep> getTrackingSteps() { return trackingSteps; }
    public void setTrackingSteps(List<TrackingStep> trackingSteps) { this.trackingSteps = trackingSteps; }
    public double getEstimatedFees() { return estimatedFees; }
    public void setEstimatedFees(double estimatedFees) { this.estimatedFees = estimatedFees; }
    public String getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }
    public String getAssignedStaff() { return assignedStaff; }
    public void setAssignedStaff(String assignedStaff) { this.assignedStaff = assignedStaff; }
    public List<HistoryLog> getHistoryLog() { return historyLog; }
    public void setHistoryLog(List<HistoryLog> historyLog) { this.historyLog = historyLog; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
}
