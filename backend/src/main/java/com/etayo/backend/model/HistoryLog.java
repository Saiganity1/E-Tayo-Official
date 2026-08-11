package com.etayo.backend.model;

import jakarta.persistence.Embeddable;

@Embeddable
public class HistoryLog {
    private String date;
    private String action;
    private String actor;
    private String details;

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }
    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
    public String getActor() { return actor; }
    public void setActor(String actor) { this.actor = actor; }
    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }
}
