package com.etayo.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import com.etayo.backend.repository.UserRepository;
import com.etayo.backend.model.User;
import com.etayo.backend.model.Role;

@RestController
public class HealthCheckController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public HealthCheckController(AuthenticationManager authenticationManager, UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping("/")
    public ResponseEntity<String> healthCheck() {
        return ResponseEntity.ok("E-Tayo Backend is running successfully!");
    }

    @GetMapping("/test-auth")
    public ResponseEntity<String> testAuth() {
        try {
            if (!userRepository.existsByEmail("testauth@test.com")) {
                userRepository.save(new User("testauth@test.com", passwordEncoder.encode("password"), Role.ROLE_APPLICANT, "Test"));
            }
            authenticationManager.authenticate(new UsernamePasswordAuthenticationToken("testauth@test.com", "password"));
            return ResponseEntity.ok("Auth success!");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Auth failed: " + e.getClass().getName() + " - " + e.getMessage());
        }
    }
}
