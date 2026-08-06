package com.etayo.backend.config;

import com.etayo.backend.model.Role;
import com.etayo.backend.model.User;
import com.etayo.backend.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;

    public DataSeeder(UserRepository userRepository, PasswordEncoder passwordEncoder, JdbcTemplate jdbcTemplate) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) throws Exception {
        // Drop the constraint that blocks ROLE_SUPERADMIN from being inserted
        try {
            jdbcTemplate.execute("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check");
        } catch (Exception e) {
            System.out.println("Could not drop constraint (might not exist or using H2): " + e.getMessage());
        }

        String adminEmail = "admin";
        if (!userRepository.existsByEmail(adminEmail)) {
            User admin = new User(
                    adminEmail,
                    passwordEncoder.encode("Admin"),
                    Role.ROLE_SUPERADMIN,
                    "Super Admin"
            );
            userRepository.save(admin);
            System.out.println("Created SUPERADMIN user with email: admin");
        }
    }
}
