package com.etayo.backend.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleCredential;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.FileContent;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.jackson2.JacksonFactory;
import com.google.api.services.drive.Drive;
import com.google.api.services.drive.DriveScopes;
import com.google.api.services.drive.model.File;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.util.Collections;

@Service
public class GoogleDriveService {

    @Value("${google.drive.credentials.json}")
    private String credentialsJson;

    @Value("${google.drive.folder.id}")
    private String folderId;

    private static final String APPLICATION_NAME = "e-Tayo Permit System";
    private static final JsonFactory JSON_FACTORY = JacksonFactory.getDefaultInstance();

    /**
     * Initializes the Google Drive API client using the Service Account JSON stored in the environment variable.
     */
    private Drive getDriveService() throws Exception {
        if (credentialsJson == null || credentialsJson.isEmpty()) {
            throw new IllegalStateException("Google Drive credentials are not configured in environment variables.");
        }

        // Load credentials directly from the environment variable string
        InputStream credentialsStream = new ByteArrayInputStream(credentialsJson.getBytes());
        GoogleCredential credential = GoogleCredential.fromStream(credentialsStream)
                .createScoped(Collections.singleton(DriveScopes.DRIVE_FILE));

        return new Drive.Builder(GoogleNetHttpTransport.newTrustedTransport(), JSON_FACTORY, credential)
                .setApplicationName(APPLICATION_NAME)
                .build();
    }

    /**
     * Uploads a file to Google Drive and returns the webViewLink (shareable link).
     */
    public String uploadFile(MultipartFile multipartFile) throws Exception {
        Drive driveService = getDriveService();

        File fileMetadata = new File();
        fileMetadata.setName(multipartFile.getOriginalFilename());
        
        // If a specific folder is set in env vars, upload it there
        if (folderId != null && !folderId.isEmpty()) {
            fileMetadata.setParents(Collections.singletonList(folderId));
        }

        // Convert Spring MultipartFile to Google API's InputStreamContent
        java.io.File tempFile = java.io.File.createTempFile("etayo-upload-", multipartFile.getOriginalFilename());
        multipartFile.transferTo(tempFile);
        
        FileContent mediaContent = new FileContent(multipartFile.getContentType(), tempFile);

        // Upload
        File uploadedFile = driveService.files().create(fileMetadata, mediaContent)
                .setFields("id, webViewLink")
                .execute();

        // Delete the temporary local file
        tempFile.delete();

        // Make the file publicly accessible (Anyone with the link can view)
        com.google.api.services.drive.model.Permission permission = new com.google.api.services.drive.model.Permission()
                .setType("anyone")
                .setRole("reader");
        driveService.permissions().create(uploadedFile.getId(), permission).execute();

        return uploadedFile.getWebViewLink();
    }
}
