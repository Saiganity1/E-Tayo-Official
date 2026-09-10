package com.etayo.backend;

import com.etayo.backend.model.Role;
import com.etayo.backend.model.User;
import com.etayo.backend.repository.UserRepository;
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
		SpringApplication.run(BackendApplication.class, args);
	}

	@Bean
	public CommandLineRunner initDatabase(UserRepository userRepository, PasswordEncoder passwordEncoder, @Value("${jwt.secret}") String jwtSecret) {
		return args -> {

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
