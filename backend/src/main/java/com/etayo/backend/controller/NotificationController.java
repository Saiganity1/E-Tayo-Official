package com.etayo.backend.controller;

import com.etayo.backend.model.Notification;
import com.etayo.backend.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "*", maxAge = 3600)
public class NotificationController {

    @Autowired
    private NotificationRepository notificationRepository;

    @GetMapping("/{email}")
    public ResponseEntity<List<Notification>> getUserNotifications(
            @PathVariable String email,
            @RequestParam(required = false, defaultValue = "false") boolean unreadOnly) {
        
        String cleanEmail = email != null ? email.trim() : "";
        List<Notification> notifications;
        if (unreadOnly) {
            notifications = notificationRepository.findByRecipientEmailIgnoreCaseAndIsReadFalseOrderByTimestampDesc(cleanEmail);
        } else {
            notifications = notificationRepository.findByRecipientEmailIgnoreCaseOrderByTimestampDesc(cleanEmail);
        }
        
        return ResponseEntity.ok(notifications);
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Long id) {
        Optional<Notification> notifOpt = notificationRepository.findById(id);
        if (notifOpt.isPresent()) {
            Notification notification = notifOpt.get();
            notification.setRead(true);
            notificationRepository.saveAndFlush(notification);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
    
    @PutMapping("/read-all/{email}")
    public ResponseEntity<?> markAllAsRead(@PathVariable String email) {
        String cleanEmail = email != null ? email.trim() : "";
        if (!cleanEmail.isEmpty()) {
            try {
                notificationRepository.markAllAsReadForEmail(cleanEmail);
            } catch (Exception e) {
                System.err.println("Notice: Direct query markAllAsRead failed, falling back to batch update: " + e.getMessage());
            }

            List<Notification> unread = notificationRepository.findByRecipientEmailIgnoreCaseAndIsReadFalseOrderByTimestampDesc(cleanEmail);
            for (Notification n : unread) {
                n.setRead(true);
            }
            if (!unread.isEmpty()) {
                notificationRepository.saveAllAndFlush(unread);
            }
        }
        return ResponseEntity.ok().build();
    }
}
