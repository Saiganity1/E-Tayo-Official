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
    private final com.etayo.backend.repository.PermitApplicationRepository permitApplicationRepository;
    private final com.etayo.backend.repository.FeeStructureRepository feeStructureRepository;
    private final com.etayo.backend.repository.SystemAuditLogRepository systemAuditLogRepository;

    public DataSeeder(UserRepository userRepository, EvaluationLogRepository evaluationLogRepository, PasswordEncoder passwordEncoder, JdbcTemplate jdbcTemplate, com.etayo.backend.repository.PermitApplicationRepository permitApplicationRepository, com.etayo.backend.repository.FeeStructureRepository feeStructureRepository, com.etayo.backend.repository.SystemAuditLogRepository systemAuditLogRepository) {
        this.userRepository = userRepository;
        this.evaluationLogRepository = evaluationLogRepository;
        this.passwordEncoder = passwordEncoder;
        this.jdbcTemplate = jdbcTemplate;
        this.permitApplicationRepository = permitApplicationRepository;
        this.feeStructureRepository = feeStructureRepository;
        this.systemAuditLogRepository = systemAuditLogRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        // Drop the constraint that blocks ROLE_SUPERADMIN from being inserted
        try {
            jdbcTemplate.execute("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check");
        } catch (Exception e) {
            System.out.println("Could not drop constraint (might not exist or using H2): " + e.getMessage());
        }

        // Ensure all notes, details, and remarks columns in PostgreSQL are TEXT
        try {
            jdbcTemplate.execute("ALTER TABLE permit_tracking_steps ALTER COLUMN notes TYPE TEXT;");
        } catch (Exception ignored) {}
        try {
            jdbcTemplate.execute("ALTER TABLE permit_history_logs ALTER COLUMN details TYPE TEXT;");
        } catch (Exception ignored) {}
        try {
            jdbcTemplate.execute("ALTER TABLE permit_requirements ALTER COLUMN remarks TYPE TEXT;");
        } catch (Exception ignored) {}
        try {
            jdbcTemplate.execute("ALTER TABLE evaluation_logs ALTER COLUMN comments TYPE TEXT;");
        } catch (Exception ignored) {}
        try {
            jdbcTemplate.execute("ALTER TABLE permit_applications ALTER COLUMN remarks TYPE TEXT;");
        } catch (Exception ignored) {}
        try {
            jdbcTemplate.execute("ALTER TABLE permit_applications ALTER COLUMN file_url TYPE TEXT;");
        } catch (Exception ignored) {}
        try {
            jdbcTemplate.execute("ALTER TABLE permit_applications ALTER COLUMN sketch_image_url TYPE TEXT;");
        } catch (Exception ignored) {}
        try {
            jdbcTemplate.execute("ALTER TABLE permit_applications ALTER COLUMN project_description TYPE TEXT;");
        } catch (Exception ignored) {}

        // Ensure administrative user exists with strong credentials
        userRepository.findByEmail("admin@etayo.gov.ph").ifPresentOrElse(
            admin -> {
                if (passwordEncoder.matches("Admin", admin.getPassword()) || passwordEncoder.matches("admin123", admin.getPassword())) {
                    admin.setPassword(passwordEncoder.encode("Admin#StoTomas2026!Secured"));
                    userRepository.save(admin);
                    System.out.println("Upgraded admin@etayo.gov.ph password to strong credentials");
                }
            },
            () -> {
                User municipalAdmin = new User(
                        "admin@etayo.gov.ph",
                        passwordEncoder.encode("Admin#StoTomas2026!Secured"),
                        Role.ROLE_ADMIN,
                        "Admin User"
                );
                userRepository.save(municipalAdmin);
                System.out.println("Created admin@etayo.gov.ph with strong credentials");
            }
        );

        // Remove any automatic / dummy staff accounts - Admin assigns staff manually
        userRepository.findByEmail("staff@etayo.gov.ph").ifPresent(user -> {
            userRepository.delete(user);
            System.out.println("Cleaned up automatic staff: staff@etayo.gov.ph");
        });
        userRepository.findByEmail("dave.sicat@etayo.gov.ph").ifPresent(user -> {
            userRepository.delete(user);
            System.out.println("Cleaned up automatic staff: dave.sicat@etayo.gov.ph");
        });

        // Clean up legacy dummy evaluation logs if present
        try {
            evaluationLogRepository.findAll().forEach(l -> {
                if (l != null && (
                    "citizen@example.com".equalsIgnoreCase(l.getApplicantEmail()) ||
                    "business@example.com".equalsIgnoreCase(l.getApplicantEmail())
                )) {
                    evaluationLogRepository.delete(l);
                }
            });
        } catch (Exception ignored) {}

        // Ensure default dummy applicant account is removed if present
        userRepository.findByEmail("applicant@etayo.gov.ph").ifPresent(user -> {
            userRepository.delete(user);
            System.out.println("Cleaned up default dummy applicant: applicant@etayo.gov.ph");
        });

        // Ensure default dummy permit LC-2025-0001 (Juan Dela Cruz) is cleaned up if present
        permitApplicationRepository.findById("LC-2025-0001").ifPresent(legacyApp -> {
            if ("Juan Dela Cruz".equalsIgnoreCase(legacyApp.getApplicantName()) || "juan.delacruz@email.com".equalsIgnoreCase(legacyApp.getApplicantEmail())) {
                permitApplicationRepository.delete(legacyApp);
                System.out.println("Cleaned up default dummy permit: LC-2025-0001");
            }
        });

        if (feeStructureRepository.count() == 0) {
            seedFees();
        }
    }

    private void seedFees() {
        com.etayo.backend.model.FeeStructure f1 = new com.etayo.backend.model.FeeStructure();
        f1.setId("FEE-001");
        f1.setName("Zoning & Land Use Inspection Base Fee");
        f1.setBaseAmount(1500);
        f1.setCategory("locational_clearance");
        feeStructureRepository.save(f1);
        System.out.println("Seeded FeeStructure FEE-001");
    }
}
