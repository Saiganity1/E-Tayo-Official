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

    @MessageMapping("/chat.sendMessage")
    public void sendMessage(@Payload ChatMessage chatMessage) {
        chatMessage.setTimestamp(Instant.now());
        ChatMessage savedMessage = chatMessageRepository.save(chatMessage);
        
        // Broadcast the message to the recipient
        if (chatMessage.getRecipientEmail() != null) {
            messagingTemplate.convertAndSend("/topic/messages/" + chatMessage.getRecipientEmail(), savedMessage);
        }
        
        // Also broadcast to the staff and admin inboxes
        if (chatMessage.getRecipientEmail() != null && 
            (chatMessage.getRecipientEmail().equals("staff@etayo.gov.ph") || chatMessage.getRecipientEmail().equals("admin@etayo.gov.ph"))) {
            messagingTemplate.convertAndSend("/topic/messages/staff@etayo.gov.ph", savedMessage);
            messagingTemplate.convertAndSend("/topic/messages/admin@etayo.gov.ph", savedMessage);
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
        if (applicationId != null && !applicationId.trim().isEmpty() && !applicationId.equalsIgnoreCase("all")) {
            List<ChatMessage> history = chatMessageRepository.findChatHistoryByApplication(user1, user2, applicationId.trim());
            return ResponseEntity.ok(history);
        }
        List<ChatMessage> history = chatMessageRepository.findChatHistory(user1, user2);
        return ResponseEntity.ok(history);
    }

    @GetMapping("/api/messages/conversations")
    public ResponseEntity<List<String>> getConversations(@RequestParam String user) {
        List<String> conversations = chatMessageRepository.findConversationsForUser(user);
        return ResponseEntity.ok(conversations);
    }
}
