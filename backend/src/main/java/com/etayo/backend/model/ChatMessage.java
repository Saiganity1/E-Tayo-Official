package com.etayo.backend.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "chat_messages")
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String senderEmail;

    @Column(nullable = false)
    private String recipientEmail;

    @Column(nullable = false, length = 1000)
    private String content;

    @Column(nullable = true)
    private String actualSender;

    @Column(nullable = false)
    private Instant timestamp;

    public ChatMessage() {
        this.timestamp = Instant.now();
    }

    public ChatMessage(String senderEmail, String recipientEmail, String content) {
        this.senderEmail = senderEmail;
        this.recipientEmail = recipientEmail;
        this.content = content;
        this.timestamp = Instant.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getSenderEmail() { return senderEmail; }
    public void setSenderEmail(String senderEmail) { this.senderEmail = senderEmail; }

    public String getRecipientEmail() { return recipientEmail; }
    public void setRecipientEmail(String recipientEmail) { this.recipientEmail = recipientEmail; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getActualSender() { return actualSender; }
    public void setActualSender(String actualSender) { this.actualSender = actualSender; }

    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }
}
