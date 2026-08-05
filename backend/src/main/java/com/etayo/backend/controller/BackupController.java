package com.etayo.backend.controller;

import com.etayo.backend.service.DatabaseSyncService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/backup")
public class BackupController {

    private final DatabaseSyncService databaseSyncService;

    public BackupController(DatabaseSyncService databaseSyncService) {
        this.databaseSyncService = databaseSyncService;
    }

    @PostMapping("/trigger")
    public ResponseEntity<String> triggerBackup() {
        try {
            databaseSyncService.backupToGoogleDrive();
            return ResponseEntity.ok("Backup to Google Drive completed successfully.");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Backup failed: " + e.getMessage());
        }
    }
}
