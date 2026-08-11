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
    public ResponseEntity<List<SystemAuditLog>> getAllLogs() {
        return ResponseEntity.ok(systemAuditLogRepository.findAll());
    }
}
