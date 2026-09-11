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

        // Ensure SuperAdmin account always exists and password is set to Admin
        User admin = userRepository.findByEmailIgnoreCase("admin").orElse(null);
        if (admin == null) {
            admin = new User(
                    "admin",
                    passwordEncoder.encode("Admin"),
                    Role.ROLE_ADMIN,
                    "Super Admin"
            );
            userRepository.save(admin);
            System.out.println("Created SUPERADMIN user with email: admin");
        } else {
            admin.setPassword(passwordEncoder.encode("Admin"));
            admin.setRole(Role.ROLE_ADMIN);
            userRepository.save(admin);
        }

        // Also ensure admin@etayo.gov.ph has password Admin
        User municipalAdmin = userRepository.findByEmail("admin@etayo.gov.ph").orElse(null);
        if (municipalAdmin == null) {
            municipalAdmin = new User(
                    "admin@etayo.gov.ph",
                    passwordEncoder.encode("Admin"),
                    Role.ROLE_ADMIN,
                    "Admin User"
            );
            userRepository.save(municipalAdmin);
        } else {
            municipalAdmin.setPassword(passwordEncoder.encode("Admin"));
            userRepository.save(municipalAdmin);
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
            
            // Generate Initial Staff Evaluation Logs
            evaluationLogRepository.save(new EvaluationLog(staffEmail, "citizen@example.com", "Building Permit", "Approved", "All documents verified.", LocalDateTime.now().minusDays(2)));
            evaluationLogRepository.save(new EvaluationLog(staffEmail, "business@example.com", "Business Permit", "Rejected", "Missing DTI Registration.", LocalDateTime.now().minusDays(1)));
        }

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
        if (systemAuditLogRepository.count() == 0) {
            seedLogs();
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
    
    private void seedLogs() {
        String staffEmail = "staff@etayo.gov.ph";
        com.etayo.backend.model.SystemAuditLog log1 = new com.etayo.backend.model.SystemAuditLog(
            "SYSTEM_STARTUP",
            staffEmail,
            "e-Tayo Municipal Online System initialized and operational.",
            "127.0.0.1"
        );
        com.etayo.backend.model.SystemAuditLog log2 = new com.etayo.backend.model.SystemAuditLog(
            "USER_LOGIN",
            "admin@etayo.gov.ph",
            "Administrator logged in to Admin Portal",
            "127.0.0.1"
        );
        systemAuditLogRepository.save(log1);
        systemAuditLogRepository.save(log2);
        System.out.println("Seeded SystemAuditLogs");
    }
}
