package com.etayo.backend.controller;

import com.etayo.backend.model.SystemAuditLog;
import com.etayo.backend.repository.SystemAuditLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/logs")
public class LogController {

    @Autowired
    private SystemAuditLogRepository systemAuditLogRepository;

    @GetMapping
    public ResponseEntity<List<SystemAuditLog>> getAllLogs(org.springframework.security.core.Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            return ResponseEntity.ok(java.util.Collections.emptyList());
        }
        boolean isAdminOrStaff = authentication.getAuthorities().stream().anyMatch(a ->
            a.getAuthority().equals("ROLE_ADMIN") ||
            a.getAuthority().equals("ROLE_SUPERADMIN") ||
            a.getAuthority().equals("ROLE_STAFF")
        );
        if (!isAdminOrStaff) {
            return ResponseEntity.ok(java.util.Collections.emptyList());
        }
        return ResponseEntity.ok(systemAuditLogRepository.findAllByOrderByTimestampDesc());
    }

    @PostMapping
    public ResponseEntity<SystemAuditLog> createLog(@RequestBody SystemAuditLog log) {
        if (log.getTimestamp() == null) {
            log.setTimestamp(java.time.LocalDateTime.now());
        }
        if (log.getIpAddress() == null || log.getIpAddress().trim().isEmpty()) {
            log.setIpAddress("127.0.0.1");
        }
        if ((log.getUserEmail() == null || log.getUserEmail().trim().isEmpty()) && log.getUser() != null) {
            log.setUserEmail(log.getUser());
        }
        if ((log.getDetails() == null || log.getDetails().trim().isEmpty()) && log.getMessage() != null) {
            log.setDetails(log.getMessage());
        }
        if (log.getAction() == null || log.getAction().trim().isEmpty()) {
            log.setAction("SYSTEM_LOG");
        }
        return ResponseEntity.ok(systemAuditLogRepository.save(log));
    }

    @DeleteMapping
    public ResponseEntity<?> clearAllLogs(org.springframework.security.core.Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            return ResponseEntity.status(401).build();
        }
        boolean isAdmin = authentication.getAuthorities().stream().anyMatch(a ->
            a.getAuthority().equals("ROLE_ADMIN") ||
            a.getAuthority().equals("ROLE_SUPERADMIN")
        );
        if (!isAdmin) {
            return ResponseEntity.status(403).build();
        }
        systemAuditLogRepository.deleteAll();
        return ResponseEntity.ok().build();
    }
}
