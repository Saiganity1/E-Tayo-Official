package com.etayo.backend.controller;

import com.etayo.backend.dto.JwtAuthResponse;
import com.etayo.backend.dto.LoginDto;
import com.etayo.backend.model.User;
import com.etayo.backend.repository.UserRepository;
import com.etayo.backend.security.JwtTokenProvider;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import com.etayo.backend.dto.RegisterDto;
import com.etayo.backend.model.Role;
import com.etayo.backend.model.OtpVerification;
import com.etayo.backend.repository.OtpVerificationRepository;
import com.etayo.backend.service.EmailService;
import com.etayo.backend.service.AuditLoggingService;
import com.etayo.backend.service.RefreshTokenService;
import com.etayo.backend.model.RefreshToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import java.time.LocalDateTime;
import java.util.Random;
import java.util.Optional;
import java.util.Map;
import java.util.HashMap;
import java.util.List;
import org.springframework.transaction.annotation.Transactional;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;
    private final OtpVerificationRepository otpVerificationRepository;
    private final EmailService emailService;
    private final AuditLoggingService auditLoggingService;
    private final RefreshTokenService refreshTokenService;

    public AuthController(AuthenticationManager authenticationManager, 
                          UserRepository userRepository, 
                          JwtTokenProvider jwtTokenProvider, 
                          PasswordEncoder passwordEncoder,
                          OtpVerificationRepository otpVerificationRepository,
                          EmailService emailService,
                          AuditLoggingService auditLoggingService,
                          RefreshTokenService refreshTokenService) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.jwtTokenProvider = jwtTokenProvider;
        this.passwordEncoder = passwordEncoder;
        this.otpVerificationRepository = otpVerificationRepository;
        this.emailService = emailService;
        this.auditLoggingService = auditLoggingService;
        this.refreshTokenService = refreshTokenService;
    }

    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOtp(@RequestBody java.util.Map<String, String> payload) {
        String email = payload.get("email");
        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", "Email is required"));
        }
        email = email.trim().toLowerCase();

        if (userRepository.existsByEmail(email)) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", "Email is already taken!"));
        }

        // Generate 6 digit OTP
        String otp = String.format("%06d", new Random().nextInt(999999));
        
        Optional<OtpVerification> existingOpt = otpVerificationRepository.findByEmail(email);
        OtpVerification otpVer;
        if (existingOpt.isPresent()) {
            otpVer = existingOpt.get();
            otpVer.setOtp(otp);
            otpVer.setExpiryTime(LocalDateTime.now().plusMinutes(10));
        } else {
            otpVer = new OtpVerification(email, otp, LocalDateTime.now().plusMinutes(10));
        }
        otpVerificationRepository.save(otpVer);

        // Send Email
        String htmlBody = "<h2>Verify your e-Tayo Account</h2>" +
                          "<p>Your verification code is: <b>" + otp + "</b></p>" +
                          "<p>This code will expire in 10 minutes.</p>";
        emailService.sendEmail(email, "e-Tayo Verification Code", htmlBody);
        
        auditLoggingService.logAction("OTP_REQUESTED", email, "OTP requested for registration");

        return ResponseEntity.ok(java.util.Map.of("message", "OTP sent to email"));
    }


    @Transactional
    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody LoginDto loginDto, HttpServletResponse response) {
        try {
            String rawEmail = loginDto.getEmail() != null ? loginDto.getEmail().trim() : "";
            if (rawEmail.isEmpty() || loginDto.getPassword() == null || loginDto.getPassword().trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(java.util.Map.of("error", "Email and password are required"));
            }

            // Find user case-insensitively
            User user = userRepository.findByEmailIgnoreCase(rawEmail)
                    .orElseThrow(() -> new RuntimeException("Account not found with username/email: " + rawEmail));

            // Verify password using BCrypt
            if (!passwordEncoder.matches(loginDto.getPassword().trim(), user.getPassword())) {
                throw new RuntimeException("Incorrect password for account: " + rawEmail);
            }

            Authentication authentication = new UsernamePasswordAuthenticationToken(
                    user.getEmail(),
                    null,
                    java.util.Collections.singletonList(new org.springframework.security.core.authority.SimpleGrantedAuthority(user.getRole().name()))
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);

            String jwt = jwtTokenProvider.generateToken(authentication);
            
            // Create Refresh Token
            RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getId());
            
            // Add Refresh Token to HTTP-Only Cookie
            Cookie refreshCookie = new Cookie("refreshToken", refreshToken.getToken());
            refreshCookie.setHttpOnly(true);
            refreshCookie.setPath("/api/auth/");
            refreshCookie.setMaxAge(7 * 24 * 60 * 60); // 7 days
            response.addCookie(refreshCookie);
            
            auditLoggingService.logAction("USER_LOGIN", user.getEmail(), "User logged in successfully");

            return ResponseEntity.ok(new JwtAuthResponse(jwt, user.getRole().name(), user.getName()));
        } catch (Exception e) {
            e.printStackTrace();
            try {
                auditLoggingService.logAction("LOGIN_FAILED", loginDto.getEmail(), "Failed login attempt: " + e.getMessage());
            } catch (Exception ignored) {}
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(java.util.Map.of("error", e.getMessage() != null ? e.getMessage() : "Invalid credentials"));
        }
    }

    /**
     * Emergency / Master Reset for SuperAdmin credentials
     */
    @Transactional
    @PostMapping("/reset-superadmin")
    public ResponseEntity<?> resetSuperadmin(@RequestBody(required = false) Map<String, String> body) {
        try {
            String newPassword = (body != null && body.containsKey("newPassword") && !body.get("newPassword").trim().isEmpty())
                    ? body.get("newPassword").trim()
                    : "Admin";

            List<User> adminList = userRepository.findAllByEmailIgnoreCase("admin");
            if (adminList.isEmpty()) {
                User admin = new User("admin", passwordEncoder.encode(newPassword), Role.ROLE_ADMIN, "Super Admin");
                userRepository.save(admin);
            } else {
                for (User u : adminList) {
                    u.setEmail("admin");
                    u.setPassword(passwordEncoder.encode(newPassword));
                    u.setRole(Role.ROLE_ADMIN);
                    userRepository.save(u);
                }
            }

            List<User> municipalList = userRepository.findAllByEmailIgnoreCase("admin@etayo.gov.ph");
            if (municipalList.isEmpty()) {
                User municipalAdmin = new User("admin@etayo.gov.ph", passwordEncoder.encode(newPassword), Role.ROLE_ADMIN, "Admin User");
                userRepository.save(municipalAdmin);
            } else {
                for (User u : municipalList) {
                    u.setEmail("admin@etayo.gov.ph");
                    u.setPassword(passwordEncoder.encode(newPassword));
                    u.setRole(Role.ROLE_ADMIN);
                    userRepository.save(u);
                }
            }

            return ResponseEntity.ok(java.util.Map.of(
                    "message", "SuperAdmin credentials successfully reset to password: " + newPassword,
                    "email", "admin"
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(java.util.Map.of("error", e.getMessage() != null ? e.getMessage() : "Reset failed"));
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(@CookieValue(name = "refreshToken", required = false) String requestRefreshToken) {
        if (requestRefreshToken == null || requestRefreshToken.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(java.util.Map.of("error", "Refresh Token is missing!"));
        }

        return refreshTokenService.findByToken(requestRefreshToken)
                .map(refreshTokenService::verifyExpiration)
                .map(RefreshToken::getUser)
                .map(user -> {
                    String token = jwtTokenProvider.generateTokenFromUsername(user.getEmail());
                    auditLoggingService.logAction("TOKEN_REFRESHED", user.getEmail(), "JWT successfully refreshed");
                    return ResponseEntity.ok(java.util.Map.of("accessToken", token));
                })
                .orElse(ResponseEntity.status(HttpStatus.FORBIDDEN).body(java.util.Map.of("error", "Refresh token is not in database!")));
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody RegisterDto registerDto) {
        try {
            String email = registerDto.getEmail().trim().toLowerCase();
            String providedOtp = registerDto.getOtp();

            if (providedOtp == null || providedOtp.trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(java.util.Map.of("error", "OTP is required"));
            }

            if (userRepository.existsByEmail(email)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(java.util.Map.of("error", "Email is already taken!"));
            }

            Optional<OtpVerification> otpOpt = otpVerificationRepository.findByEmail(email);
            if (otpOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(java.util.Map.of("error", "No OTP generated for this email"));
            }

            OtpVerification otpVer = otpOpt.get();
            if (!otpVer.getOtp().equals(providedOtp)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(java.util.Map.of("error", "Invalid Verification Code"));
            }

            if (LocalDateTime.now().isAfter(otpVer.getExpiryTime())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(java.util.Map.of("error", "Verification Code has expired"));
            }

            User user = new User(
                    email,
                    passwordEncoder.encode(registerDto.getPassword()),
                    Role.ROLE_APPLICANT,
                    registerDto.getName()
            );

            userRepository.save(user);
            
            // Delete the OTP as it is single use
            otpVerificationRepository.delete(otpVer);

            return ResponseEntity.ok(java.util.Map.of("message", "User registered successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(java.util.Map.of("error", "Registration error: " + e.getMessage()));
        }
    }
}
