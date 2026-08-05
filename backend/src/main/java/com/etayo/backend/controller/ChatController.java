package com.etayo.backend.controller;

import com.etayo.backend.model.ChatMessage;
import com.etayo.backend.repository.ChatMessageRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
public class ChatController {

    private final SimpMessagingTemplate messagingTemplate;
    private final ChatMessageRepository chatMessageRepository;

    public ChatController(SimpMessagingTemplate messagingTemplate, ChatMessageRepository chatMessageRepository) {
        this.messagingTemplate = messagingTemplate;
        this.chatMessageRepository = chatMessageRepository;
    }

    @MessageMapping("/chat.sendMessage")
    public void processMessage(@Payload ChatMessage chatMessage) {
        // Save to database
        ChatMessage savedMessage = chatMessageRepository.save(chatMessage);
        
        // Broadcast to recipient
        messagingTemplate.convertAndSend(
                "/topic/messages/" + chatMessage.getRecipientEmail(),
                savedMessage
        );
        
        // Broadcast to sender (so they see it on their screen if they have multiple tabs open)
        messagingTemplate.convertAndSend(
                "/topic/messages/" + chatMessage.getSenderEmail(),
                savedMessage
        );
    }

    @GetMapping("/api/messages/history")
    public ResponseEntity<List<ChatMessage>> getChatHistory(@RequestParam String user1, @RequestParam String user2) {
        List<ChatMessage> history = chatMessageRepository.findChatHistory(user1, user2);
        return ResponseEntity.ok(history);
    }
}
