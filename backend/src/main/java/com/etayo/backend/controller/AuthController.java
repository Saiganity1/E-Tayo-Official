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
import org.springframework.security.crypto.password.PasswordEncoder;
import java.time.LocalDateTime;
import java.util.Random;
import java.util.Optional;

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

    public AuthController(AuthenticationManager authenticationManager, 
                          UserRepository userRepository, 
                          JwtTokenProvider jwtTokenProvider, 
                          PasswordEncoder passwordEncoder,
                          OtpVerificationRepository otpVerificationRepository,
                          EmailService emailService) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.jwtTokenProvider = jwtTokenProvider;
        this.passwordEncoder = passwordEncoder;
        this.otpVerificationRepository = otpVerificationRepository;
        this.emailService = emailService;
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

        return ResponseEntity.ok(java.util.Map.of("message", "OTP sent to email"));
    }

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody LoginDto loginDto) {
        try {
            String email = loginDto.getEmail().trim().toLowerCase();
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, loginDto.getPassword())
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);
            String token = jwtTokenProvider.generateToken(authentication);
            
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            return ResponseEntity.ok(new JwtAuthResponse(token, user.getRole().name(), user.getName()));
        } catch (org.springframework.security.core.AuthenticationException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Auth Error: " + e.getClass().getSimpleName() + " - " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Server Error: " + e.getClass().getSimpleName() + " - " + e.getMessage());
        }
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
