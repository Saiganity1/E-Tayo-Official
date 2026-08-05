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
import java.util.List;

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
    public ResponseEntity<Map<String, Object>> uploadFiles(
            @RequestParam("files") List<MultipartFile> files, 
            @RequestParam(value = "permitType", required = false, defaultValue = "General Application") String permitType,
            Principal principal) {
        Map<String, Object> response = new HashMap<>();
        try {
            String applicantName = "Unknown Applicant";
            if (principal != null) {
                User user = userRepository.findByEmail(principal.getName()).orElse(null);
                if (user != null) {
                    applicantName = user.getName();
                }
            }

            // Generate ONE timestamp for the entire batch of files
            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm-ss"));

            java.util.List<String> fileUrls = new java.util.ArrayList<>();
            for (MultipartFile file : files) {
                String fileUrl = googleDriveService.uploadApplicantFile(file, applicantName, permitType, timestamp);
                fileUrls.add(fileUrl);
            }
            
            response.put("urls", fileUrls);
            response.put("message", files.size() + " files uploaded successfully to Google Drive");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            response.put("error", "Failed to upload files: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}
