package com.etayo.backend.controller;

import com.etayo.backend.model.FeeStructure;
import com.etayo.backend.repository.FeeStructureRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/fees")
public class FeeController {

    @Autowired
    private FeeStructureRepository feeStructureRepository;

    @GetMapping
    public ResponseEntity<List<FeeStructure>> getAllFees() {
        return ResponseEntity.ok(feeStructureRepository.findAll());
    }

    @PutMapping("/{id}")
    public ResponseEntity<FeeStructure> updateFee(@PathVariable String id, @RequestBody FeeStructure fee) {
        if (!feeStructureRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        fee.setId(id);
        return ResponseEntity.ok(feeStructureRepository.save(fee));
    }
}
