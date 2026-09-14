package com.etayo.backend.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleCredential;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.ByteArrayContent;
import com.google.api.client.http.FileContent;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.gson.GsonFactory;
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

    @Value("${google.drive.client.id}")
    private String clientId;

    @Value("${google.drive.client.secret}")
    private String clientSecret;

    @Value("${google.drive.refresh.token}")
    private String refreshToken;

    @Value("${google.drive.folder.id}")
    private String folderId;

    private static final String APPLICATION_NAME = "e-Tayo Permit System";
    private static final JsonFactory JSON_FACTORY = GsonFactory.getDefaultInstance();

    /**
     * Initializes the Google Drive API client using the Service Account JSON stored in the environment variable.
     */
    private Drive getDriveService() throws Exception {
        if (clientId == null || clientSecret == null || refreshToken == null) {
            throw new IllegalStateException("Google Drive OAuth credentials are not fully configured in environment variables.");
        }

        GoogleCredential credential = new GoogleCredential.Builder()
                .setTransport(GoogleNetHttpTransport.newTrustedTransport())
                .setJsonFactory(JSON_FACTORY)
                .setClientSecrets(clientId, clientSecret)
                .build()
                .setRefreshToken(refreshToken);

        return new Drive.Builder(GoogleNetHttpTransport.newTrustedTransport(), JSON_FACTORY, credential)
                .setApplicationName(APPLICATION_NAME)
                .build();
    }

    /**
     * Checks if Google Drive credentials and folder ID are configured in environment variables.
     */
    public boolean isConfigured() {
        return clientId != null && !clientId.trim().isEmpty() && !clientId.contains("sample") && !"dummy".equalsIgnoreCase(clientId)
                && clientSecret != null && !clientSecret.trim().isEmpty() && !clientSecret.contains("sample") && !"dummy".equalsIgnoreCase(clientSecret)
                && refreshToken != null && !refreshToken.trim().isEmpty() && !refreshToken.contains("sample") && !"dummy".equalsIgnoreCase(refreshToken)
                && folderId != null && !folderId.trim().isEmpty() && !folderId.contains("sample") && !"dummy".equalsIgnoreCase(folderId);
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

    /**
     * Resolves or creates the 3-tier folder structure:
     * 1. Level 1: First Name and Last Name of User (e.g. "Juan Dela Cruz") directly inside Root folder
     * 2. Level 2: Project Type application (e.g. "Escalator") inside User folder
     * 3. Level 3: Date and Time created (e.g. "2026-09-14_22-30-00") inside Project Type folder
     * Returns the Date/Time folder ID where forms and attachments reside.
     */
    public String getOrCreateApplicationFolder(String applicantName, String projectType, String timestamp) throws Exception {
        Drive driveService = getDriveService();
        return getOrCreateApplicationFolder(driveService, applicantName, projectType, timestamp);
    }

    public String getOrCreateApplicationFolder(Drive driveService, String applicantName, String projectType, String timestamp) throws Exception {
        if (folderId == null || folderId.isEmpty()) return null;

        String cleanApplicant = (applicantName != null && !applicantName.trim().isEmpty())
                ? applicantName.trim()
                : "Applicant";
        String cleanProjectType = (projectType != null && !projectType.trim().isEmpty())
                ? projectType.replace("/", " - ").trim()
                : "General Application";
        String cleanTimestamp = (timestamp != null && !timestamp.trim().isEmpty())
                ? timestamp.trim()
                : java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm-ss"));

        // Determine the root for applicant dossiers:
        // If an "Applications" folder exists inside folderId, use it as the base.
        // Otherwise, use folderId directly.
        String applicationsRootId = folderId;
        try {
            String query = "name='Applications' and mimeType='application/vnd.google-apps.folder' and '" + folderId + "' in parents and trashed=false";
            com.google.api.services.drive.model.FileList result = driveService.files().list()
                    .setQ(query)
                    .setSpaces("drive")
                    .setFields("files(id)")
                    .execute();
            if (result.getFiles() != null && !result.getFiles().isEmpty()) {
                applicationsRootId = result.getFiles().get(0).getId();
            }
        } catch (Exception ignored) {}

        // Level 1: First Name and Last Name of User (e.g. "Dave Sicat") inside Applications
        String userFolderId = getOrCreateSubFolderId(driveService, applicationsRootId, cleanApplicant);

        // Level 2: Project Type application (e.g. "Escalator") inside User folder
        String projectTypeFolderId = getOrCreateSubFolderId(driveService, userFolderId, cleanProjectType);

        // Level 3: Date and Time created folder inside Project Type folder
        String dateTimeFolderId = getOrCreateSubFolderId(driveService, projectTypeFolderId, cleanTimestamp);

        return dateTimeFolderId;
    }

    /**
     * Uploads in-memory file bytes directly into a specified Google Drive folder ID.
     */
    public String uploadBytesToFolderId(byte[] data, String fileName, String contentType, String folderId) throws Exception {
        Drive driveService = getDriveService();

        File fileMetadata = new File();
        fileMetadata.setName(fileName);
        if (folderId != null && !folderId.isEmpty()) {
            fileMetadata.setParents(Collections.singletonList(folderId));
        }

        ByteArrayContent mediaContent = new ByteArrayContent(
                contentType != null ? contentType : "application/pdf", data
        );

        File uploadedFile = driveService.files().create(fileMetadata, mediaContent)
                .setFields("id, webViewLink, webContentLink")
                .execute();

        try {
            com.google.api.services.drive.model.Permission permission = new com.google.api.services.drive.model.Permission()
                    .setType("anyone")
                    .setRole("reader");
            driveService.permissions().create(uploadedFile.getId(), permission).execute();
        } catch (Exception ignored) {}

        return uploadedFile.getWebViewLink() != null 
                ? uploadedFile.getWebViewLink() 
                : ("https://drive.google.com/file/d/" + uploadedFile.getId() + "/view");
    }

    /**
     * Uploads in-memory file bytes (e.g. base64 generated PDFs or images)
     * into: <Applicant Name> / <Project Type> / <Date and Time created> / <fileName>
     */
    public String uploadApplicantBytes(byte[] data, String fileName, String contentType, String applicantName, String projectType, String timestamp) throws Exception {
        Drive driveService = getDriveService();
        String targetFolderId = getOrCreateApplicationFolder(driveService, applicantName, projectType, timestamp);
        return uploadBytesToFolderId(data, fileName, contentType, targetFolderId);
    }

    /**
     * Uploads an applicant MultipartFile into: <Applicant Name> / <Project Type> / <Date and Time created> / <fileName>
     */
    public String uploadApplicantFile(MultipartFile multipartFile, String applicantName, String projectType, String timestamp) throws Exception {
        Drive driveService = getDriveService();
        String targetFolderId = getOrCreateApplicationFolder(driveService, applicantName, projectType, timestamp);

        File fileMetadata = new File();
        fileMetadata.setName(multipartFile.getOriginalFilename());
        if (targetFolderId != null && !targetFolderId.isEmpty()) {
            fileMetadata.setParents(Collections.singletonList(targetFolderId));
        }

        java.io.File tempFile = java.io.File.createTempFile("etayo-upload-", multipartFile.getOriginalFilename());
        multipartFile.transferTo(tempFile);

        FileContent mediaContent = new FileContent(multipartFile.getContentType(), tempFile);

        File uploadedFile = driveService.files().create(fileMetadata, mediaContent)
                .setFields("id, webViewLink, webContentLink")
                .execute();

        tempFile.delete();

        try {
            com.google.api.services.drive.model.Permission permission = new com.google.api.services.drive.model.Permission()
                    .setType("anyone")
                    .setRole("reader");
            driveService.permissions().create(uploadedFile.getId(), permission).execute();
        } catch (Exception ignored) {}

        return uploadedFile.getWebViewLink() != null 
                ? uploadedFile.getWebViewLink() 
                : ("https://drive.google.com/file/d/" + uploadedFile.getId() + "/view");
    }

    private String getOrCreateSubFolderId(Drive driveService, String parentId, String folderName) throws Exception {
        if (parentId == null || parentId.isEmpty()) return null;

        String safeFolderName = folderName != null && !folderName.trim().isEmpty() 
                ? folderName.trim() 
                : "General";
        // Escape single quotes and backslashes for Google Drive search query syntax
        String escapedName = safeFolderName.replace("\\", "\\\\").replace("'", "\\'");

        String query = "name='" + escapedName + "' and mimeType='application/vnd.google-apps.folder' and '" + parentId + "' in parents and trashed=false";
        com.google.api.services.drive.model.FileList result = driveService.files().list()
                .setQ(query)
                .setSpaces("drive")
                .setFields("files(id)")
                .execute();

        if (!result.getFiles().isEmpty()) {
            return result.getFiles().get(0).getId();
        }

        File folderMetadata = new File();
        folderMetadata.setName(safeFolderName);
        folderMetadata.setMimeType("application/vnd.google-apps.folder");
        folderMetadata.setParents(Collections.singletonList(parentId));

        File folder = driveService.files().create(folderMetadata)
                .setFields("id")
                .execute();
        
        return folder.getId();
    }

    private String getOrCreateBackupFolderId(Drive driveService) throws Exception {
        return getOrCreateSubFolderId(driveService, folderId, "Database Backups");
    }

    /**
     * Uploads or updates a specific backup file in Google Drive inside a specific subfolder.
     */
    public void uploadBackupData(String subFolderName, String filename, byte[] data) throws Exception {
        Drive driveService = getDriveService();
        String backupFolderId = getOrCreateBackupFolderId(driveService);
        String targetFolderId = backupFolderId;
        
        if (subFolderName != null && !subFolderName.isEmpty() && backupFolderId != null) {
            targetFolderId = getOrCreateSubFolderId(driveService, backupFolderId, subFolderName);
        }
        
        // Check if file exists
        String query = "name='" + filename + "' and trashed=false";
        if (targetFolderId != null) {
            query += " and '" + targetFolderId + "' in parents";
        }
        
        com.google.api.services.drive.model.FileList result = driveService.files().list()
                .setQ(query)
                .setSpaces("drive")
                .setFields("files(id, name)")
                .execute();
                
        FileContent mediaContent = new FileContent("application/octet-stream", createTempFileFromBytes(filename, data));
        
        if (result.getFiles().isEmpty()) {
            // Create new
            File fileMetadata = new File();
            fileMetadata.setName(filename);
            if (targetFolderId != null) {
                fileMetadata.setParents(Collections.singletonList(targetFolderId));
            }
            driveService.files().create(fileMetadata, mediaContent).execute();
        } else {
            // Update existing
            String existingFileId = result.getFiles().get(0).getId();
            driveService.files().update(existingFileId, null, mediaContent).execute();
        }
    }

    /**
     * Downloads a specific backup file from Google Drive. Returns null if not found.
     */
    public byte[] downloadBackupData(String subFolderName, String filename) throws Exception {
        Drive driveService = getDriveService();
        String backupFolderId = getOrCreateBackupFolderId(driveService);
        String targetFolderId = backupFolderId;
        
        if (subFolderName != null && !subFolderName.isEmpty() && backupFolderId != null) {
            targetFolderId = getOrCreateSubFolderId(driveService, backupFolderId, subFolderName);
        }
        
        String query = "name='" + filename + "' and trashed=false";
        if (targetFolderId != null) {
            query += " and '" + targetFolderId + "' in parents";
        }
        
        com.google.api.services.drive.model.FileList result = driveService.files().list()
                .setQ(query)
                .setSpaces("drive")
                .setFields("files(id, name)")
                .execute();
                
        if (result.getFiles().isEmpty()) {
            return null; // Not found
        }
        
        String fileId = result.getFiles().get(0).getId();
        java.io.ByteArrayOutputStream outputStream = new java.io.ByteArrayOutputStream();
        driveService.files().get(fileId).executeMediaAndDownloadTo(outputStream);
        return outputStream.toByteArray();
    }
    
    private java.io.File createTempFileFromBytes(String name, byte[] data) throws Exception {
        java.io.File temp = java.io.File.createTempFile("backup-", name);
        temp.deleteOnExit();
        java.nio.file.Files.write(temp.toPath(), data);
        return temp;
    }
}
