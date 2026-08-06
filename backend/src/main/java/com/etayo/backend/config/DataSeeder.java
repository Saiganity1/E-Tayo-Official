package com.etayo.backend.config;

import com.etayo.backend.model.Role;
import com.etayo.backend.model.User;
import com.etayo.backend.model.EvaluationLog;
import com.etayo.backend.repository.UserRepository;
import com.etayo.backend.repository.EvaluationLogRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final EvaluationLogRepository evaluationLogRepository;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;

    public DataSeeder(UserRepository userRepository, EvaluationLogRepository evaluationLogRepository, PasswordEncoder passwordEncoder, JdbcTemplate jdbcTemplate) {
        this.userRepository = userRepository;
        this.evaluationLogRepository = evaluationLogRepository;
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

        // Dummy Staff User for Audit Logging Demo
        String staffEmail = "staff@etayo.gov.ph";
        if (!userRepository.existsByEmail(staffEmail)) {
            User staff = new User(
                    staffEmail,
                    passwordEncoder.encode("password123"),
                    Role.ROLE_STAFF,
                    "Staff User"
            );
            userRepository.save(staff);
            System.out.println("Created dummy STAFF user");
            
            // Generate Dummy Evaluations
            evaluationLogRepository.save(new EvaluationLog(staffEmail, "applicant1@gmail.com", "Building Permit", "Approved", "All documents verified.", LocalDateTime.now().minusDays(2)));
            evaluationLogRepository.save(new EvaluationLog(staffEmail, "juan.delacruz@yahoo.com", "Business Permit", "Rejected", "Missing DTI Registration.", LocalDateTime.now().minusDays(1)));
            evaluationLogRepository.save(new EvaluationLog(staffEmail, "maria.clara@gmail.com", "Sanitary Permit", "Approved", "Passed inspection.", LocalDateTime.now().minusHours(5)));
        }
    }
}
