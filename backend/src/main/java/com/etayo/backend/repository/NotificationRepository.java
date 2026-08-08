package com.etayo.backend.repository;

import com.etayo.backend.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByRecipientEmailOrderByTimestampDesc(String recipientEmail);
    List<Notification> findByRecipientEmailAndIsReadFalseOrderByTimestampDesc(String recipientEmail);
}
