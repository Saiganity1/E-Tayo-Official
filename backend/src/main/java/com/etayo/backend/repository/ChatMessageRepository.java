package com.etayo.backend.repository;

import com.etayo.backend.model.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    
    @Query("SELECT m FROM ChatMessage m WHERE " +
           "(LOWER(m.senderEmail) = LOWER(:user1) AND LOWER(m.recipientEmail) = LOWER(:user2)) OR " +
           "(LOWER(m.senderEmail) = LOWER(:user2) AND LOWER(m.recipientEmail) = LOWER(:user1)) OR " +
           "((LOWER(:user2) = 'mdpsicat.student@ua.edu.ph' OR LOWER(:user2) = 'davesicat@gmail.com') AND " +
           " (LOWER(m.senderEmail) = 'davesicat@gmail.com' OR LOWER(m.senderEmail) = 'mdpsicat.student@ua.edu.ph' OR " +
           "  LOWER(m.recipientEmail) = 'davesicat@gmail.com' OR LOWER(m.recipientEmail) = 'mdpsicat.student@ua.edu.ph')) " +
           "ORDER BY m.timestamp ASC")
    List<ChatMessage> findChatHistory(@Param("user1") String user1, @Param("user2") String user2);

    @Query("SELECT m FROM ChatMessage m WHERE " +
           "(((LOWER(m.senderEmail) = LOWER(:user1) AND LOWER(m.recipientEmail) = LOWER(:user2)) OR " +
           "  (LOWER(m.senderEmail) = LOWER(:user2) AND LOWER(m.recipientEmail) = LOWER(:user1)) OR " +
           "  ((LOWER(:user2) = 'mdpsicat.student@ua.edu.ph' OR LOWER(:user2) = 'davesicat@gmail.com') AND " +
           "   (LOWER(m.senderEmail) = 'davesicat@gmail.com' OR LOWER(m.senderEmail) = 'mdpsicat.student@ua.edu.ph' OR " +
           "    LOWER(m.recipientEmail) = 'davesicat@gmail.com' OR LOWER(m.recipientEmail) = 'mdpsicat.student@ua.edu.ph')))) " +
           "AND m.applicationId = :applicationId ORDER BY m.timestamp ASC")
    List<ChatMessage> findChatHistoryByApplication(@Param("user1") String user1, @Param("user2") String user2, @Param("applicationId") String applicationId);

    @Query("SELECT DISTINCT CASE WHEN m.senderEmail = :user THEN m.recipientEmail ELSE m.senderEmail END FROM ChatMessage m WHERE m.senderEmail = :user OR m.recipientEmail = :user")
    List<String> findConversationsForUser(@Param("user") String user);
}
