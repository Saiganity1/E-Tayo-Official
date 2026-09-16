package com.etayo.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;
import java.io.File;
import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FileStorageService {

    private final Path fileStorageLocation;

    public FileStorageService(@Value("${app.upload.dir:uploads}") String uploadDir) {
        this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
    }

    @PostConstruct
    public void init() {
        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (Exception ex) {
            throw new RuntimeException("Could not create the directory where uploaded files will be stored.", ex);
        }
    }

    /**
     * Sanitizes and saves an uploaded MultipartFile to the local uploads directory.
     * Returns the relative saved filename.
     */
    public String saveFile(MultipartFile file) throws IOException {
        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "document.pdf");
        
        // Remove any dangerous characters or path separators
        String cleanName = originalFilename.replaceAll("[^a-zA-Z0-9._-]", "_");
        String uniqueFileName = UUID.randomUUID().toString().substring(0, 8) + "_" + cleanName;

        Path targetLocation = this.fileStorageLocation.resolve(uniqueFileName);
        Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

        return uniqueFileName;
    }

    /**
     * Saves raw byte data (e.g. decoded PDF or canvas sketch) to local storage with a given preferred filename.
     */
    public String saveBytes(byte[] bytes, String preferredFileName) throws IOException {
        String cleanName = StringUtils.cleanPath(preferredFileName != null ? preferredFileName : "document.pdf");
        cleanName = cleanName.replaceAll("[^a-zA-Z0-9._-]", "_");
        
        // Ensure unique prefix so files with same name don't collide
        String uniqueFileName = System.currentTimeMillis() + "_" + cleanName;

        Path targetLocation = this.fileStorageLocation.resolve(uniqueFileName);
        Files.write(targetLocation, bytes);

        return uniqueFileName;
    }

    /**
     * Loads a file from local storage as a Spring Resource with path traversal protection.
     */
    public Resource loadFileAsResource(String fileName) {
        try {
            String cleanName = StringUtils.cleanPath(fileName);
            Path filePath = this.fileStorageLocation.resolve(cleanName).normalize();

            // Verify file is strictly inside the storage directory
            if (!filePath.startsWith(this.fileStorageLocation)) {
                throw new SecurityException("Cannot access file outside current directory: " + fileName);
            }

            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                return null;
            }
        } catch (MalformedURLException ex) {
            return null;
        }
    }

    /**
     * Determines proper MediaType for serving documents inline.
     */
    public MediaType determineContentType(String fileName) {
        String lower = fileName.toLowerCase();
        if (lower.endsWith(".pdf")) {
            return MediaType.APPLICATION_PDF;
        } else if (lower.endsWith(".png")) {
            return MediaType.IMAGE_PNG;
        } else if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
            return MediaType.IMAGE_JPEG;
        } else if (lower.endsWith(".gif")) {
            return MediaType.IMAGE_GIF;
        } else if (lower.endsWith(".txt")) {
            return MediaType.TEXT_PLAIN;
        } else if (lower.endsWith(".docx")) {
            return MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.wordprocessingml.document");
        }
        return MediaType.APPLICATION_OCTET_STREAM;
    }

    public Path getFileStorageLocation() {
        return fileStorageLocation;
    }
}
