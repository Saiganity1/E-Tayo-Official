package com.etayo.backend.controller;

import com.etayo.backend.model.EvaluationLog;
import com.etayo.backend.repository.EvaluationLogRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/evaluations")
public class EvaluationLogController {

    private final EvaluationLogRepository evaluationLogRepository;

    public EvaluationLogController(EvaluationLogRepository evaluationLogRepository) {
        this.evaluationLogRepository = evaluationLogRepository;
    }

    /**
     * Fetch evaluation logs for a specific staff member.
     * Only ADMIN and SUPERADMIN can access this.
     */
    @GetMapping("/staff/{email}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<List<EvaluationLog>> getStaffEvaluations(@PathVariable String email) {
        List<EvaluationLog> logs = evaluationLogRepository.findByStaffEmailOrderByTimestampDesc(email);
        return ResponseEntity.ok(logs);
    }
}
