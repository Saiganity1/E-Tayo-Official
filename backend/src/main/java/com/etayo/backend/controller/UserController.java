package com.etayo.backend.controller;

import com.etayo.backend.model.Role;
import com.etayo.backend.model.User;
import com.etayo.backend.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Fetch all users. Only ADMIN can access this.
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getAllUsers() {
        List<User> users = userRepository.findAll();
        
        List<Map<String, Object>> userList = users.stream().map(user -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", user.getId());
            map.put("name", user.getName());
            map.put("email", user.getEmail());
            map.put("role", user.getRole().name());
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(userList);
    }

    /**
     * Promote a user to ROLE_STAFF. Only ADMIN can access this.
     */
    @PutMapping("/{id}/promote")
    @PreAuthorize("hasRole('ADMIN')")
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
}
