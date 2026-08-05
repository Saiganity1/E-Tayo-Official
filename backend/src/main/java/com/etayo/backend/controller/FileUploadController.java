package com.etayo.backend.controller;

import com.etayo.backend.service.GoogleDriveService;
import com.etayo.backend.repository.UserRepository;
import com.etayo.backend.model.User;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.security.Principal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import java.util.HashMap;
import java.util.Map;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/upload")
public class FileUploadController {

    private final GoogleDriveService googleDriveService;
    private final UserRepository userRepository;

    public FileUploadController(GoogleDriveService googleDriveService, UserRepository userRepository) {
        this.googleDriveService = googleDriveService;
        this.userRepository = userRepository;
    }

    @PostMapping
    public ResponseEntity<Map<String, String>> uploadFile(@RequestParam("file") MultipartFile file, Principal principal) {
        Map<String, String> response = new HashMap<>();
        try {
            String applicantName = "Unknown Applicant";
            if (principal != null) {
                User user = userRepository.findByEmail(principal.getName()).orElse(null);
                if (user != null) {
                    applicantName = user.getName();
                }
            }

            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm-ss"));

            String fileUrl = googleDriveService.uploadApplicantFile(file, applicantName, timestamp);
            response.put("url", fileUrl);
            response.put("message", "File uploaded successfully to Google Drive");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            response.put("error", "Failed to upload file: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}
