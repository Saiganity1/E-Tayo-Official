package com.etayo.backend.controller;

import com.etayo.backend.model.PermitApplication;
import com.etayo.backend.repository.PermitApplicationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/permits")
public class PermitController {

    @Autowired
    private PermitApplicationRepository permitApplicationRepository;

    @GetMapping
    public ResponseEntity<List<PermitApplication>> getAllPermits() {
        return ResponseEntity.ok(permitApplicationRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PermitApplication> getPermitById(@PathVariable String id) {
        return permitApplicationRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<PermitApplication> createPermit(@RequestBody PermitApplication permit) {
        return ResponseEntity.ok(permitApplicationRepository.save(permit));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PermitApplication> updatePermit(@PathVariable String id, @RequestBody PermitApplication permit) {
        if (!permitApplicationRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        permit.setId(id);
        return ResponseEntity.ok(permitApplicationRepository.save(permit));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePermit(@PathVariable String id) {
        if (!permitApplicationRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        permitApplicationRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
