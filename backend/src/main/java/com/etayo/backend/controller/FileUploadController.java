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

import java.util.*;

@CrossOrigin(origins = {"https://e-tayo-official.vercel.app", "http://localhost:3000", "http://localhost:3001"}, allowCredentials = "true")
@RestController
@RequestMapping("/api/upload")
public class FileUploadController {

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            "pdf", "png", "jpg", "jpeg", "doc", "docx"
    );

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "application/pdf",
            "image/png",
            "image/jpeg",
            "image/jpg",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );

    // 50 MB in bytes
    private static final long MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024L;

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

        if (principal == null || principal.getName() == null || principal.getName().trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Authentication required to upload permit documents"));
        }

        if (files == null || files.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "No files provided for upload"));
        }

        try {
            String applicantName = principal.getName();
            User user = userRepository.findByEmail(principal.getName()).orElse(null);
            if (user != null && user.getName() != null) {
                applicantName = user.getName();
            }

            // Security Validation on every file in the batch
            for (MultipartFile file : files) {
                if (file.isEmpty()) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Cannot upload empty file"));
                }

                if (file.getSize() > MAX_FILE_SIZE_BYTES) {
                    return ResponseEntity.badRequest().body(Map.of("error", "File exceeds maximum permitted limit of 50MB: " + file.getOriginalFilename()));
                }

                String originalFilename = file.getOriginalFilename();
                if (originalFilename == null || originalFilename.contains("..") || originalFilename.contains("/") || originalFilename.contains("\\")) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Invalid or unsafe file name"));
                }

                int lastDot = originalFilename.lastIndexOf('.');
                if (lastDot <= 0) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Uploaded file has no extension"));
                }

                String ext = originalFilename.substring(lastDot + 1).toLowerCase();
                if (!ALLOWED_EXTENSIONS.contains(ext)) {
                    return ResponseEntity.badRequest().body(Map.of("error", "File extension '." + ext + "' is not allowed. Permitted: PDF, PNG, JPG, DOCX."));
                }

                String contentType = file.getContentType();
                if (contentType != null && !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase()) && !"application/octet-stream".equalsIgnoreCase(contentType)) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Invalid MIME type: " + contentType));
                }
            }

            // Generate ONE timestamp for the entire batch of files
            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm-ss"));

            List<String> fileUrls = new ArrayList<>();
            for (MultipartFile file : files) {
                String fileUrl = googleDriveService.uploadApplicantFile(file, applicantName, permitType, timestamp);
                fileUrls.add(fileUrl);
            }
            
            response.put("urls", fileUrls);
            response.put("message", files.size() + " files verified and uploaded successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            response.put("error", "Failed to upload files: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}
