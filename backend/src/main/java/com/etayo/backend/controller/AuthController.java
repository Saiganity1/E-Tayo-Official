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

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Map;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.transaction.annotation.Transactional;

@CrossOrigin(origins = {"https://e-tayo-official.vercel.app", "http://localhost:3000", "http://localhost:3001"}, allowCredentials = "true")
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    // In-memory sliding-window rate limiters
    // Max 3 OTP requests per 10 minutes per email
    private final ConcurrentHashMap<String, List<Long>> otpRequestHistory = new ConcurrentHashMap<>();
    
    // Max 5 failed login attempts per 5 minutes per email
    private static class LoginTracker {
        int failedAttempts = 0;
        long lockedUntil = 0;
    }
    private final ConcurrentHashMap<String, LoginTracker> loginAttemptHistory = new ConcurrentHashMap<>();

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
    public ResponseEntity<?> sendOtp(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email is required"));
        }
        email = email.trim().toLowerCase();

        // Rate limiting check: Max 3 requests in 10 minutes
        long now = System.currentTimeMillis();
        long window = 10 * 60 * 1000L;
        List<Long> timestamps = otpRequestHistory.computeIfAbsent(email, k -> new java.util.concurrent.CopyOnWriteArrayList<>());
        timestamps.removeIf(t -> now - t > window);

        if (timestamps.size() >= 3) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(Map.of("error", "Too many OTP requests. Please wait a few minutes before trying again."));
        }
        timestamps.add(now);

        if (userRepository.existsByEmail(email)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email is already taken!"));
        }

        // Cryptographically secure 6 digit OTP
        String otp = String.format("%06d", SECURE_RANDOM.nextInt(1_000_000));
        
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
        
        auditLoggingService.logAction("OTP_REQUESTED", email, "Secure OTP requested for registration");

        return ResponseEntity.ok(Map.of("message", "OTP sent to email"));
    }

    @Transactional
    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody LoginDto loginDto, HttpServletResponse response) {
        String rawEmail = loginDto.getEmail() != null ? loginDto.getEmail().trim().toLowerCase() : "";
        if (rawEmail.isEmpty() || loginDto.getPassword() == null || loginDto.getPassword().trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Email and password are required"));
        }

        // Check Rate Limiter for brute force protection
        long now = System.currentTimeMillis();
        LoginTracker tracker = loginAttemptHistory.computeIfAbsent(rawEmail, k -> new LoginTracker());
        if (tracker.lockedUntil > now) {
            long remainingSeconds = (tracker.lockedUntil - now) / 1000;
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(Map.of("error", "Account temporarily locked due to multiple failed login attempts. Please try again in " + remainingSeconds + " seconds."));
        }

        try {
            // Find user case-insensitively
            Optional<User> userOpt = userRepository.findByEmailIgnoreCase(rawEmail);

            // Verify existence and password without revealing whether email or password was wrong
            if (userOpt.isEmpty() || !passwordEncoder.matches(loginDto.getPassword().trim(), userOpt.get().getPassword())) {
                tracker.failedAttempts++;
                if (tracker.failedAttempts >= 5) {
                    tracker.lockedUntil = now + (5 * 60 * 1000L); // Lock for 5 minutes
                    tracker.failedAttempts = 0;
                    try {
                        auditLoggingService.logAction("ACCOUNT_LOCKOUT", rawEmail, "Account temporarily locked after 5 failed login attempts.");
                    } catch (Exception ignored) {}
                    return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                            .body(Map.of("error", "Too many failed attempts. Account temporarily locked for 5 minutes."));
                }
                try {
                    auditLoggingService.logAction("LOGIN_FAILED", rawEmail, "Failed login attempt (attempt " + tracker.failedAttempts + " of 5).");
                } catch (Exception ignored) {}
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid email or password"));
            }

            User user = userOpt.get();

            // Successful login: reset failed attempts
            tracker.failedAttempts = 0;
            tracker.lockedUntil = 0;

            Authentication authentication = new UsernamePasswordAuthenticationToken(
                    user.getEmail(),
                    null,
                    java.util.Collections.singletonList(new org.springframework.security.core.authority.SimpleGrantedAuthority(user.getRole().name()))
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);

            // Generate JWT containing signed claims (email, role, name)
            String jwt = jwtTokenProvider.generateToken(user.getEmail(), user.getRole().name(), user.getName());
            
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
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid email or password"));
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(@CookieValue(name = "refreshToken", required = false) String requestRefreshToken) {
        if (requestRefreshToken == null || requestRefreshToken.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Refresh Token is missing!"));
        }

        return refreshTokenService.findByToken(requestRefreshToken)
                .map(refreshTokenService::verifyExpiration)
                .map(RefreshToken::getUser)
                .map(user -> {
                    String token = jwtTokenProvider.generateToken(user.getEmail(), user.getRole().name(), user.getName());
                    auditLoggingService.logAction("TOKEN_REFRESHED", user.getEmail(), "JWT successfully refreshed");
                    return ResponseEntity.ok(Map.of("accessToken", token));
                })
                .orElse(ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Refresh token is invalid or expired!")));
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody RegisterDto registerDto) {
        try {
            String email = registerDto.getEmail().trim().toLowerCase();
            String providedOtp = registerDto.getOtp();

            if (providedOtp == null || providedOtp.trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "OTP is required"));
            }

            if (userRepository.existsByEmail(email)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Email is already taken!"));
            }

            Optional<OtpVerification> otpOpt = otpVerificationRepository.findByEmail(email);
            if (otpOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "No OTP generated for this email"));
            }

            OtpVerification otpVer = otpOpt.get();
            if (!otpVer.getOtp().equals(providedOtp)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Invalid Verification Code"));
            }

            if (LocalDateTime.now().isAfter(otpVer.getExpiryTime())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Verification Code has expired"));
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

            return ResponseEntity.ok(Map.of("message", "User registered successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Registration error: " + e.getMessage()));
        }
    }
}
