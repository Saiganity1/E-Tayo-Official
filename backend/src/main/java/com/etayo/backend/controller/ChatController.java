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
        messagingTemplate.convertAndSend("/topic/messages/" + chatMessage.getRecipientEmail(), savedMessage);
        
        // Also broadcast to the staff inbox if the recipient is staff
        if (chatMessage.getRecipientEmail().equals("staff@etayo.gov.ph")) {
             messagingTemplate.convertAndSend("/topic/messages/staff@etayo.gov.ph", savedMessage);
        }

        // --- Notification Logic ---
        // Save in-app notification
        String title = "New Message from " + chatMessage.getSenderEmail();
        String messagePreview = chatMessage.getContent();
        if (messagePreview.length() > 50) messagePreview = messagePreview.substring(0, 50) + "...";
        
        Notification notification = new Notification(
            chatMessage.getRecipientEmail(),
            title,
            messagePreview,
            "NEW_MESSAGE",
            "/messages"
        );
        notificationRepository.save(notification);

        // Send Email Alert
        String htmlBody = "<h2>You have a new message on e-Tayo</h2>" +
                          "<p><b>From:</b> " + chatMessage.getSenderEmail() + "</p>" +
                          "<p><b>Message:</b> " + chatMessage.getContent() + "</p>" +
                          "<br><p>Log in to your dashboard to reply.</p>";
        emailService.sendEmail(chatMessage.getRecipientEmail(), "e-Tayo: New Message Received", htmlBody);
    }

    @GetMapping("/api/messages/history")
    public ResponseEntity<List<ChatMessage>> getChatHistory(@RequestParam String user1, @RequestParam String user2) {
        List<ChatMessage> history = chatMessageRepository.findChatHistory(user1, user2);
        return ResponseEntity.ok(history);
    }

    @GetMapping("/api/messages/conversations")
    public ResponseEntity<List<String>> getConversations(@RequestParam String user) {
        List<String> conversations = chatMessageRepository.findConversationsForUser(user);
        return ResponseEntity.ok(conversations);
    }
}
