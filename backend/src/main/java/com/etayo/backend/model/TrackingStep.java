package com.etayo.backend.model;

import jakarta.persistence.Embeddable;

@Embeddable
public class TrackingStep {
    private String title;
    private String status;
    private String date;
    private String notes;
    private String actor;

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public String getActor() { return actor; }
    public void setActor(String actor) { this.actor = actor; }
}
