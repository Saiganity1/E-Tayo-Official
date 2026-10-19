package com.etayo.backend.repository;

import com.etayo.backend.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByRecipientEmailOrderByTimestampDesc(String recipientEmail);
    List<Notification> findByRecipientEmailIgnoreCaseOrderByTimestampDesc(String recipientEmail);
    List<Notification> findByRecipientEmailAndIsReadFalseOrderByTimestampDesc(String recipientEmail);
    List<Notification> findByRecipientEmailIgnoreCaseAndIsReadFalseOrderByTimestampDesc(String recipientEmail);

    @Transactional
    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE LOWER(TRIM(n.recipientEmail)) = LOWER(TRIM(:email))")
    int markAllAsReadForEmail(@Param("email") String email);
}
