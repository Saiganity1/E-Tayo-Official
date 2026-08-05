package com.etayo.backend;

import com.etayo.backend.model.Role;
import com.etayo.backend.model.User;
import com.etayo.backend.repository.UserRepository;
import com.etayo.backend.service.DatabaseSyncService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class BackendApplication {

	public static void main(String[] args) {
		String dbUrl = System.getenv("DATABASE_URL");
		if (dbUrl != null && (dbUrl.startsWith("postgres://") || dbUrl.startsWith("postgresql://"))) {
			// e.g. postgres://user:password@host:port/database
			String uri = dbUrl.replaceFirst("^postgres(?:ql)?://", "");
			if (uri.contains("@")) {
				String[] credentialsAndHost = uri.split("@");
				String[] credentials = credentialsAndHost[0].split(":");
				String hostAndDatabase = credentialsAndHost[1];
				System.setProperty("spring.datasource.url", "jdbc:postgresql://" + hostAndDatabase);
				if (credentials.length > 0) System.setProperty("spring.datasource.username", credentials[0]);
				if (credentials.length > 1) System.setProperty("spring.datasource.password", credentials[1]);
			} else {
				System.setProperty("spring.datasource.url", "jdbc:postgresql://" + uri);
			}
			System.setProperty("spring.datasource.driverClassName", "org.postgresql.Driver");
		}
		SpringApplication.run(BackendApplication.class, args);
	}

	@Bean
	public CommandLineRunner initDatabase(UserRepository userRepository, PasswordEncoder passwordEncoder, DatabaseSyncService databaseSyncService, @Value("${jwt.secret}") String jwtSecret) {
		return args -> {
			if (userRepository.count() == 0) {
				System.out.println("Local database is empty. Attempting to restore from Google Drive...");
				databaseSyncService.restoreFromGoogleDrive();
			}

			if (!userRepository.existsByEmail("applicant@etayo.gov.ph")) {
				userRepository.save(new User("applicant@etayo.gov.ph", passwordEncoder.encode("password123"), Role.ROLE_APPLICANT, "Juan Dela Cruz"));
			}
			if (!userRepository.existsByEmail("staff@etayo.gov.ph")) {
				userRepository.save(new User("staff@etayo.gov.ph", passwordEncoder.encode("password123"), Role.ROLE_STAFF, "Staff User"));
			}
			if (!userRepository.existsByEmail("admin@etayo.gov.ph")) {
				userRepository.save(new User("admin@etayo.gov.ph", passwordEncoder.encode("password123"), Role.ROLE_ADMIN, "Admin User"));
			}
		};
	}
}
