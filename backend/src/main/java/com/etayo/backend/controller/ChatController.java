package com.etayo.backend.controller;

import com.etayo.backend.model.ChatMessage;
import com.etayo.backend.repository.ChatMessageRepository;
import com.etayo.backend.service.EmailService;
import com.etayo.backend.model.Notification;
import com.etayo.backend.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.time.Instant;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
public class ChatController {

    private final SimpMessagingTemplate messagingTemplate;
    private final ChatMessageRepository chatMessageRepository;
    private final EmailService emailService;
    private final NotificationRepository notificationRepository;

    @Autowired
    public ChatController(SimpMessagingTemplate messagingTemplate, 
                          ChatMessageRepository chatMessageRepository,
                          EmailService emailService,
                          NotificationRepository notificationRepository) {
        this.messagingTemplate = messagingTemplate;
        this.chatMessageRepository = chatMessageRepository;
        this.emailService = emailService;
        this.notificationRepository = notificationRepository;
    }

    private final java.util.Map<String, Long> recentMessageCache = new java.util.concurrent.ConcurrentHashMap<>();

    @MessageMapping("/chat.sendMessage")
    public void sendMessage(@Payload ChatMessage chatMessage) {
        if (chatMessage == null) return;

        // In-memory deduplication: prevent dual-dispatch (WebSocket + HTTP) from saving duplicate records in DB
        String sender = chatMessage.getSenderEmail() != null ? chatMessage.getSenderEmail().trim().toLowerCase() : "";
        String recipient = chatMessage.getRecipientEmail() != null ? chatMessage.getRecipientEmail().trim().toLowerCase() : "";
        String content = chatMessage.getContent() != null ? chatMessage.getContent().trim() : "";
        String appId = chatMessage.getApplicationId() != null ? chatMessage.getApplicationId().trim() : "";

        String dedupKey = sender + "|" + recipient + "|" + appId + "|" + content;
        long now = System.currentTimeMillis();
        Long lastSeen = recentMessageCache.get(dedupKey);

        if (lastSeen != null && (now - lastSeen) < 5000) {
            // Duplicate detected within 5 seconds - skip redundant database insert & broadcast
            return;
        }
        recentMessageCache.put(dedupKey, now);

        if (recentMessageCache.size() > 500) {
            recentMessageCache.entrySet().removeIf(entry -> (now - entry.getValue()) > 30000);
        }

        chatMessage.setTimestamp(Instant.now());
        ChatMessage savedMessage = chatMessageRepository.save(chatMessage);
        
        // Broadcast the message to the recipient
        if (chatMessage.getRecipientEmail() != null) {
            messagingTemplate.convertAndSend("/topic/messages/" + chatMessage.getRecipientEmail(), savedMessage);
        }
        
        // Also broadcast to the staff and admin inboxes
        if (recipient.equals("staff@etayo.gov.ph") || 
            recipient.equals("admin@etayo.gov.ph") ||
            recipient.contains("obo") ||
            recipient.contains("stotomas")) {
            messagingTemplate.convertAndSend("/topic/messages/staff@etayo.gov.ph", savedMessage);
            messagingTemplate.convertAndSend("/topic/messages/admin@etayo.gov.ph", savedMessage);
            messagingTemplate.convertAndSend("/topic/messages/obo.stotomas@gmail.com", savedMessage);
        }

        // --- Non-blocking Notification Logic ---
        try {
            String title = "New Message from " + chatMessage.getSenderEmail();
            String messagePreview = chatMessage.getContent();
            if (messagePreview != null && messagePreview.length() > 50) messagePreview = messagePreview.substring(0, 50) + "...";
            
            Notification notification = new Notification(
                chatMessage.getRecipientEmail(),
                title,
                messagePreview,
                "NEW_MESSAGE",
                "/messages"
            );
            notificationRepository.save(notification);
        } catch (Exception e) {
            // Non-critical: do not fail chat if notifications table is unreachable
        }

        // --- Non-blocking Email Alert ---
        try {
            String htmlBody = "<h2>You have a new message on e-Tayo</h2>" +
                              "<p><b>From:</b> " + chatMessage.getSenderEmail() + "</p>" +
                              "<p><b>Message:</b> " + chatMessage.getContent() + "</p>" +
                              "<br><p>Log in to your dashboard to reply.</p>";
            emailService.sendEmail(chatMessage.getRecipientEmail(), "e-Tayo: New Message Received", htmlBody);
        } catch (Exception e) {
            // Non-critical: do not fail chat if SMTP is not configured
        }
    }

    @PostMapping("/api/messages/send")
    public ResponseEntity<ChatMessage> postMessage(@RequestBody ChatMessage chatMessage) {
        sendMessage(chatMessage);
        return ResponseEntity.ok(chatMessage);
    }

    @GetMapping("/api/messages/history")
    public ResponseEntity<List<ChatMessage>> getChatHistory(
            @RequestParam String user1, 
            @RequestParam String user2,
            @RequestParam(required = false) String applicationId) {
        List<ChatMessage> history;
        if (applicationId != null && !applicationId.trim().isEmpty() && !applicationId.equalsIgnoreCase("all")) {
            history = chatMessageRepository.findChatHistoryByApplication(user1, user2, applicationId.trim());
        } else {
            history = chatMessageRepository.findChatHistory(user1, user2);
        }

        // Deduplicate any historical duplicate records
        List<ChatMessage> cleanHistory = new java.util.ArrayList<>();
        if (history != null) {
            for (ChatMessage m : history) {
                boolean isDup = false;
                for (ChatMessage ex : cleanHistory) {
                    if (ex.getContent() != null && ex.getContent().equals(m.getContent()) &&
                        ex.getSenderEmail() != null && ex.getSenderEmail().equalsIgnoreCase(m.getSenderEmail()) &&
                        ex.getTimestamp() != null && m.getTimestamp() != null) {
                        long diff = java.lang.Math.abs(java.time.Duration.between(ex.getTimestamp(), m.getTimestamp()).toMillis());
                        if (diff < 15000) {
                            isDup = true;
                            break;
                        }
                    }
                }
                if (!isDup) {
                    cleanHistory.add(m);
                }
            }
        }

        return ResponseEntity.ok(cleanHistory);
    }

    @GetMapping("/api/messages/conversations")
    public ResponseEntity<List<String>> getConversations(@RequestParam String user) {
        List<String> conversations = chatMessageRepository.findConversationsForUser(user);
        return ResponseEntity.ok(conversations);
    }
}
