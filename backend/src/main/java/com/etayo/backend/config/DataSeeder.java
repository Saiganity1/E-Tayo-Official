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

        // Ensure SuperAdmin account always exists and password is set to Admin
        User admin = userRepository.findByEmail("admin").orElse(null);
        if (admin == null) {
            admin = new User(
                    "admin",
                    passwordEncoder.encode("Admin"),
                    Role.ROLE_SUPERADMIN,
                    "Super Admin"
            );
            userRepository.save(admin);
            System.out.println("Created SUPERADMIN user with email: admin");
        } else {
            admin.setPassword(passwordEncoder.encode("Admin"));
            admin.setRole(Role.ROLE_SUPERADMIN);
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
            
            // Generate Dummy Evaluations
            evaluationLogRepository.save(new EvaluationLog(staffEmail, "applicant1@gmail.com", "Building Permit", "Approved", "All documents verified.", LocalDateTime.now().minusDays(2)));
            evaluationLogRepository.save(new EvaluationLog(staffEmail, "juan.delacruz@yahoo.com", "Business Permit", "Rejected", "Missing DTI Registration.", LocalDateTime.now().minusDays(1)));
            evaluationLogRepository.save(new EvaluationLog(staffEmail, "maria.clara@gmail.com", "Sanitary Permit", "Approved", "Passed inspection.", LocalDateTime.now().minusHours(5)));
        }

        if (permitApplicationRepository.count() == 0) {
            seedPermits();
        }
        if (feeStructureRepository.count() == 0) {
            seedFees();
        }
        if (systemAuditLogRepository.count() == 0) {
            seedLogs();
        }
    }

    private void seedPermits() {
        com.etayo.backend.model.PermitApplication app1 = new com.etayo.backend.model.PermitApplication();
        app1.setId("LC-2025-0001");
        app1.setPermitType("locational_clearance");
        app1.setProjectName("Dela Cruz Warehouse");
        app1.setApplicantName("Juan Dela Cruz");
        app1.setApplicantPhone("0917 000 4567");
        app1.setApplicantEmail("juan.delacruz@email.com");
        app1.setApplicantAddress("123 Rizal Street, Sto. Tomas, Pampanga");
        app1.setProjectAddress("Lot 8, Block 3, Brgy. San Bartolome, Sto. Tomas, Pampanga");
        app1.setProjectDescription("Proposed construction of a warehouse building for logistics and storage purposes.");
        app1.setStatus("under_review");
        app1.setDateSubmitted("May 13, 2025");
        
        com.etayo.backend.model.Requirement r1 = new com.etayo.backend.model.Requirement();
        r1.setName("Zoning Clearance Application Form");
        r1.setRequired(true);
        r1.setStatus("approved");
        
        app1.setRequirements(java.util.Arrays.asList(r1));
        
        com.etayo.backend.model.LocationCoordinates loc1 = new com.etayo.backend.model.LocationCoordinates();
        loc1.setLat(15.0163);
        loc1.setLng(120.7188);
        loc1.setAddress("Brgy. San Bartolome, Sto. Tomas, Pampanga");
        loc1.setLotNo("8");
        loc1.setBlockNo("3");
        app1.setLocation(loc1);
        
        com.etayo.backend.model.TrackingStep ts1 = new com.etayo.backend.model.TrackingStep();
        ts1.setTitle("Application Submitted");
        ts1.setStatus("completed");
        ts1.setDate("May 13, 2025");
        
        app1.setTrackingSteps(java.util.Arrays.asList(ts1));
        app1.setEstimatedFees(4500);
        app1.setPaymentStatus("paid");
        app1.setAssignedStaff("Zoning Officer Amara Santos");
        
        com.etayo.backend.model.HistoryLog h1 = new com.etayo.backend.model.HistoryLog();
        h1.setDate("May 13, 2025, 09:30 AM");
        h1.setAction("Application Submitted");
        h1.setActor("Juan Dela Cruz");
        h1.setDetails("Application package uploaded online.");
        
        app1.setHistoryLog(java.util.Arrays.asList(h1));

        permitApplicationRepository.save(app1);
        System.out.println("Seeded PermitApplication LC-2025-0001");
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
        com.etayo.backend.model.SystemAuditLog log1 = new com.etayo.backend.model.SystemAuditLog(
            "USER_LOGIN",
            "juan.delacruz@email.com",
            "Logged in",
            "127.0.0.1"
        );
        systemAuditLogRepository.save(log1);
        System.out.println("Seeded SystemAuditLog");
    }
}
