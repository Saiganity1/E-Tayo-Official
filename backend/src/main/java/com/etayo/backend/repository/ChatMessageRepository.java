package com.etayo.backend.repository;

import com.etayo.backend.model.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    
    @Query("SELECT m FROM ChatMessage m WHERE (m.senderEmail = :user1 AND m.recipientEmail = :user2) OR (m.senderEmail = :user2 AND m.recipientEmail = :user1) ORDER BY m.timestamp ASC")
    List<ChatMessage> findChatHistory(@Param("user1") String user1, @Param("user2") String user2);

    @Query("SELECT DISTINCT CASE WHEN m.senderEmail = :user THEN m.recipientEmail ELSE m.senderEmail END FROM ChatMessage m WHERE m.senderEmail = :user OR m.recipientEmail = :user")
    List<String> findConversationsForUser(@Param("user") String user);
}
