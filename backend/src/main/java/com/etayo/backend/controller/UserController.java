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
            map.put("role", user.getRole().name());
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok()
                .header("X-Total-Count", String.valueOf(users.size()))
                .header("Content-Range", "users 0-" + (users.size() - 1) + "/" + users.size())
                .body(userList);
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
        map.put("role", user.getRole().name());
        
        return ResponseEntity.ok(map);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<Map<String, Object>> updateUser(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        User user = userRepository.findById(id).orElse(null);
        if (user == null) return ResponseEntity.notFound().build();

        if (payload.containsKey("name")) user.setName((String) payload.get("name"));
        if (payload.containsKey("email")) user.setEmail((String) payload.get("email"));
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
        map.put("role", user.getRole().name());

        return ResponseEntity.ok(map);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<Map<String, Object>> createUser(@RequestBody Map<String, Object> payload) {
        String email = (String) payload.get("email");
        String name = (String) payload.get("name");
        String roleStr = (String) payload.get("role");
        
        if (email == null || name == null) {
            return ResponseEntity.badRequest().build();
        }

        Role role = Role.ROLE_APPLICANT;
        if (roleStr != null) {
            try { role = Role.valueOf(roleStr); } catch (Exception e) {}
        }

        User user = new User(
                email,
                passwordEncoder.encode("password123"), // Default password for manually created users
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
