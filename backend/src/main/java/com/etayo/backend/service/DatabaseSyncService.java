package com.etayo.backend.service;

import com.etayo.backend.model.ChatMessage;
import com.etayo.backend.model.User;
import com.etayo.backend.repository.ChatMessageRepository;
import com.etayo.backend.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Arrays;
import java.util.List;

@Service
public class DatabaseSyncService {

    private final UserRepository userRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final GoogleDriveService googleDriveService;
    private final ObjectMapper objectMapper;

    @Value("${jwt.secret}")
    private String secretKeyString;

    private static final String BACKUP_FILENAME = "etayo_database_backup.enc";
    private static final String ALGORITHM = "AES";

    public DatabaseSyncService(UserRepository userRepository, ChatMessageRepository chatMessageRepository, GoogleDriveService googleDriveService) {
        this.userRepository = userRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.googleDriveService = googleDriveService;
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule()); // Support for LocalDateTime
    }

    // --- DTO for holding all data ---
    public static class DatabaseDump {
        public List<User> users;
        public List<ChatMessage> chatMessages;

        public DatabaseDump() {}
        
        public DatabaseDump(List<User> users, List<ChatMessage> chatMessages) {
            this.users = users;
            this.chatMessages = chatMessages;
        }
    }

    /**
     * Backup the local database to Google Drive (Encrypted).
     * Runs every 1 hour (3600000 ms).
     */
    @org.springframework.scheduling.annotation.Scheduled(fixedRate = 3600000)
    @jakarta.annotation.PreDestroy
    public void backupToGoogleDrive() {
        try {
            System.out.println("Starting Database Backup to Google Drive...");
            List<User> users = userRepository.findAll();
            List<ChatMessage> chatMessages = chatMessageRepository.findAll();
            
            DatabaseDump dump = new DatabaseDump(users, chatMessages);
            String jsonStr = objectMapper.writeValueAsString(dump);
            
            byte[] encryptedData = encrypt(jsonStr, secretKeyString);
            
            googleDriveService.uploadBackupData(BACKUP_FILENAME, encryptedData);
            System.out.println("Database Backup Successful: " + BACKUP_FILENAME);
        } catch (Exception e) {
            System.err.println("Failed to backup database to Google Drive: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Restore the local database from Google Drive (Encrypted).
     */
    public void restoreFromGoogleDrive() {
        try {
            System.out.println("Attempting to restore database from Google Drive...");
            byte[] encryptedData = googleDriveService.downloadBackupData(BACKUP_FILENAME);
            
            if (encryptedData == null) {
                System.out.println("No backup found on Google Drive. Skipping restore.");
                return;
            }
            
            String jsonStr = decrypt(encryptedData, secretKeyString);
            DatabaseDump dump = objectMapper.readValue(jsonStr, DatabaseDump.class);
            
            if (dump.users != null && !dump.users.isEmpty()) {
                userRepository.saveAll(dump.users);
            }
            if (dump.chatMessages != null && !dump.chatMessages.isEmpty()) {
                chatMessageRepository.saveAll(dump.chatMessages);
            }
            
            System.out.println("Database Restore Successful!");
        } catch (Exception e) {
            System.err.println("Failed to restore database from Google Drive: " + e.getMessage());
            e.printStackTrace();
        }
    }

    // --- Encryption Utilities ---
    
    private SecretKeySpec generateKey(String secret) throws Exception {
        byte[] key = secret.getBytes(StandardCharsets.UTF_8);
        MessageDigest sha = MessageDigest.getInstance("SHA-256");
        key = sha.digest(key);
        key = Arrays.copyOf(key, 16); // use only first 128 bit
        return new SecretKeySpec(key, ALGORITHM);
    }

    private byte[] encrypt(String data, String secret) throws Exception {
        SecretKeySpec secretKey = generateKey(secret);
        Cipher cipher = Cipher.getInstance(ALGORITHM);
        cipher.init(Cipher.ENCRYPT_MODE, secretKey);
        return cipher.doFinal(data.getBytes(StandardCharsets.UTF_8));
    }

    private String decrypt(byte[] encryptedData, String secret) throws Exception {
        SecretKeySpec secretKey = generateKey(secret);
        Cipher cipher = Cipher.getInstance(ALGORITHM);
        cipher.init(Cipher.DECRYPT_MODE, secretKey);
        return new String(cipher.doFinal(encryptedData), StandardCharsets.UTF_8);
    }
}
