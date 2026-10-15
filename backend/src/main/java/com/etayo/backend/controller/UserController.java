package com.etayo.backend.controller;

import com.etayo.backend.model.Role;
import com.etayo.backend.model.User;
import com.etayo.backend.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserController(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Fetch all users. Only ADMIN can access this.
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getAllUsers(@RequestParam(required = false) String role) {
        List<User> users = userRepository.findAll();
        
        if (role != null && !role.isEmpty()) {
            users = users.stream().filter(u -> u.getRole().name().equals(role)).collect(Collectors.toList());
        }

        List<Map<String, Object>> userList = users.stream().map(user -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", user.getId());
            map.put("name", user.getName());
            map.put("email", user.getEmail());
            map.put("role", user.getRole() != null ? user.getRole().name() : "ROLE_APPLICANT");
            map.put("profileImage", user.getProfileImage());
            map.put("phone", user.getPhone());
            map.put("address", user.getAddress());
            return map;
        }).collect(Collectors.toList());

        String contentRange = users.isEmpty() ? "users 0-0/0" : ("users 0-" + (users.size() - 1) + "/" + users.size());

        return ResponseEntity.ok()
                .header("X-Total-Count", String.valueOf(users.size()))
                .header("Content-Range", contentRange)
                .body(userList);
    }

    /**
     * Get profile of currently logged-in user.
     */
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(org.springframework.security.core.Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).body(Map.of("error", "Not authenticated"));
        }
        String email = authentication.getName();
        User user = userRepository.findByEmailIgnoreCase(email).orElse(null);
        if (user == null) return ResponseEntity.notFound().build();

        Map<String, Object> map = new HashMap<>();
        map.put("id", user.getId());
        map.put("name", user.getName());
        map.put("email", user.getEmail());
        map.put("role", user.getRole() != null ? user.getRole().name() : "ROLE_APPLICANT");
        map.put("profileImage", user.getProfileImage());
        map.put("phone", user.getPhone());
        map.put("address", user.getAddress());
        return ResponseEntity.ok(map);
    }

    /**
     * Update current user profile (name, profileImage, phone, address, and password).
     */
    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestBody Map<String, Object> payload, org.springframework.security.core.Authentication authentication) {
        String email = null;
        if (authentication != null && authentication.isAuthenticated() && !"anonymousUser".equals(authentication.getPrincipal())) {
            email = authentication.getName();
        } else if (payload.containsKey("email") && payload.get("email") != null) {
            email = String.valueOf(payload.get("email")).trim();
        }

        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required to update profile"));
        }

        User user = userRepository.findByEmailIgnoreCase(email.trim()).orElse(null);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }

        if (payload.containsKey("name") && payload.get("name") != null) {
            String name = String.valueOf(payload.get("name")).trim();
            if (!name.isEmpty()) user.setName(name);
        }
        if (payload.containsKey("profileImage")) {
            user.setProfileImage(payload.get("profileImage") != null ? String.valueOf(payload.get("profileImage")) : null);
        }
        if (payload.containsKey("phone")) {
            user.setPhone(payload.get("phone") != null ? String.valueOf(payload.get("phone")).trim() : null);
        }
        if (payload.containsKey("address")) {
            user.setAddress(payload.get("address") != null ? String.valueOf(payload.get("address")).trim() : null);
        }
        if (payload.containsKey("newPassword") && payload.get("newPassword") != null) {
            String newPass = String.valueOf(payload.get("newPassword")).trim();
            if (!newPass.isEmpty()) {
                if (payload.containsKey("currentPassword")) {
                    String currPass = String.valueOf(payload.get("currentPassword")).trim();
                    if (!passwordEncoder.matches(currPass, user.getPassword()) && !currPass.equals(user.getPassword())) {
                        return ResponseEntity.badRequest().body(Map.of("error", "Current password does not match"));
                    }
                }
                user.setPassword(passwordEncoder.encode(newPass));
            }
        }

        userRepository.save(user);

        Map<String, Object> map = new HashMap<>();
        map.put("id", user.getId());
        map.put("name", user.getName());
        map.put("email", user.getEmail());
        map.put("role", user.getRole() != null ? user.getRole().name() : "ROLE_APPLICANT");
        map.put("profileImage", user.getProfileImage());
        map.put("phone", user.getPhone());
        map.put("address", user.getAddress());
        map.put("message", "Profile updated successfully");
        return ResponseEntity.ok(map);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<Map<String, Object>> getUser(@PathVariable Long id) {
        User user = userRepository.findById(id).orElse(null);
        if (user == null) return ResponseEntity.notFound().build();

        Map<String, Object> map = new HashMap<>();
        map.put("id", user.getId());
        map.put("name", user.getName());
        map.put("email", user.getEmail());
        map.put("role", user.getRole() != null ? user.getRole().name() : "ROLE_APPLICANT");
        map.put("profileImage", user.getProfileImage());
        map.put("phone", user.getPhone());
        map.put("address", user.getAddress());
        
        return ResponseEntity.ok(map);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<Map<String, Object>> updateUser(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        User user = userRepository.findById(id).orElse(null);
        if (user == null) return ResponseEntity.notFound().build();

        if (payload.containsKey("name")) user.setName((String) payload.get("name"));
        if (payload.containsKey("email") && payload.get("email") != null) {
            user.setEmail(((String) payload.get("email")).trim().toLowerCase());
        }
        if (payload.containsKey("profileImage")) {
            user.setProfileImage((String) payload.get("profileImage"));
        }
        if (payload.containsKey("phone")) {
            user.setPhone((String) payload.get("phone"));
        }
        if (payload.containsKey("address")) {
            user.setAddress((String) payload.get("address"));
        }
        if (payload.containsKey("password") && payload.get("password") != null) {
            String rawPassword = (String) payload.get("password");
            if (!rawPassword.trim().isEmpty()) {
                user.setPassword(passwordEncoder.encode(rawPassword.trim()));
            }
        }
        if (payload.containsKey("role")) {
            String roleStr = (String) payload.get("role");
            try {
                user.setRole(Role.valueOf(roleStr));
            } catch (Exception e) {
                // Ignore invalid roles
            }
        }
        
        userRepository.save(user);

        Map<String, Object> map = new HashMap<>();
        map.put("id", user.getId());
        map.put("name", user.getName());
        map.put("email", user.getEmail());
        map.put("role", user.getRole() != null ? user.getRole().name() : "ROLE_APPLICANT");
        map.put("profileImage", user.getProfileImage());
        map.put("phone", user.getPhone());
        map.put("address", user.getAddress());

        return ResponseEntity.ok(map);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<?> createUser(@RequestBody Map<String, Object> payload) {
        String rawEmail = (String) payload.get("email");
        String name = (String) payload.get("name");
        String roleStr = (String) payload.get("role");
        String rawPassword = (String) payload.get("password");
        
        if (rawEmail == null || name == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email and full name are required"));
        }

        String email = rawEmail.trim().toLowerCase();

        if (userRepository.existsByEmailIgnoreCase(email)) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.CONFLICT)
                    .body(Map.of("error", "User with email '" + email + "' already exists in the database"));
        }

        Role role = Role.ROLE_APPLICANT;
        if (roleStr != null) {
            try { role = Role.valueOf(roleStr); } catch (Exception e) {}
        }

        if (rawPassword == null || rawPassword.trim().isEmpty()) {
            rawPassword = "password123";
        }

        User user = new User(
                email,
                passwordEncoder.encode(rawPassword.trim()),
                role,
                name
        );
        userRepository.save(user);

        Map<String, Object> map = new HashMap<>();
        map.put("id", user.getId());
        map.put("name", user.getName());
        map.put("email", user.getEmail());
        map.put("role", user.getRole().name());

        return ResponseEntity.ok(map);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<Map<String, Object>> deleteUser(@PathVariable Long id) {
        User user = userRepository.findById(id).orElse(null);
        if (user == null) return ResponseEntity.notFound().build();

        userRepository.delete(user);

        Map<String, Object> map = new HashMap<>();
        map.put("id", user.getId());
        return ResponseEntity.ok(map);
    }

    /**
     * Promote a user to ROLE_STAFF. Only ADMIN can access this.
     */
    @PutMapping("/{id}/promote")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<Map<String, String>> promoteToStaff(@PathVariable Long id) {
        Map<String, String> response = new HashMap<>();
        
        User user = userRepository.findById(id).orElse(null);
        if (user == null) {
            response.put("error", "User not found");
            return ResponseEntity.badRequest().body(response);
        }

        user.setRole(Role.ROLE_STAFF);
        userRepository.save(user);

        response.put("message", "User " + user.getName() + " promoted to Staff successfully");
        return ResponseEntity.ok(response);
    }

    /**
     * Demote a user from ROLE_STAFF back to ROLE_APPLICANT. Only ADMIN can access this.
     */
    @PutMapping("/{id}/demote")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<Map<String, String>> demoteToApplicant(@PathVariable Long id) {
        Map<String, String> response = new HashMap<>();
        
        User user = userRepository.findById(id).orElse(null);
        if (user == null) {
            response.put("error", "User not found");
            return ResponseEntity.badRequest().body(response);
        }

        user.setRole(Role.ROLE_APPLICANT);
        userRepository.save(user);

        response.put("message", "User " + user.getName() + " unassigned from Staff successfully");
        return ResponseEntity.ok(response);
    }

    /**
     * Change user password. Only ADMIN and SUPERADMIN can execute this.
     */
    @PutMapping("/{id}/change-password")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<Map<String, String>> changePassword(
            @PathVariable Long id, 
            @RequestBody Map<String, String> body) {
        Map<String, String> res = new HashMap<>();
        String newPassword = body.get("newPassword");
        if (newPassword == null || newPassword.trim().isEmpty()) {
            res.put("error", "New password cannot be empty");
            return ResponseEntity.badRequest().body(res);
        }
        User user = userRepository.findById(id).orElse(null);
        if (user == null) {
            res.put("error", "User not found");
            return ResponseEntity.notFound().build();
        }
        user.setPassword(passwordEncoder.encode(newPassword.trim()));
        userRepository.save(user);
        res.put("message", "Password successfully updated for " + user.getEmail());
        return ResponseEntity.ok(res);
    }
}
