package com.etayo.backend.config;

import com.etayo.backend.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public static PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public org.springframework.security.authentication.AuthenticationProvider authenticationProvider(org.springframework.security.core.userdetails.UserDetailsService userDetailsService) {
        org.springframework.security.authentication.dao.DaoAuthenticationProvider authProvider = new org.springframework.security.authentication.dao.DaoAuthenticationProvider(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    @org.springframework.core.annotation.Order(2)
    SecurityFilterChain securityFilterChain(HttpSecurity http, org.springframework.security.authentication.AuthenticationProvider authenticationProvider) throws Exception {

        http.cors(org.springframework.security.config.Customizer.withDefaults())
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authenticationProvider(authenticationProvider)
                .authorizeHttpRequests(authorize -> authorize
                        // 1. Health check & Error pages
                        .requestMatchers("/").permitAll()
                        .requestMatchers("/error").permitAll()
                        .requestMatchers("/h2-console/**").permitAll()
                        .requestMatchers("/ws/**").permitAll() // WebSocket handshake endpoint

                        // 2. Authentication & Registration
                        .requestMatchers("/api/auth/**").permitAll()

                        // 3. Public Read-Only Lookups (Tracking & Fee Structure)
                        .requestMatchers(HttpMethod.GET, "/api/permits/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/fees/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/messages/**").permitAll()

                        // 4. Authenticated Permit Application Submissions & File Uploads
                        .requestMatchers(HttpMethod.POST, "/api/permits").authenticated()
                        .requestMatchers("/api/upload/**").authenticated()

                        // 5. Protected Permit Status Updates & Official Evaluations (Staff / Admin only)
                        .requestMatchers(HttpMethod.PUT, "/api/permits/**").hasAnyRole("STAFF", "ADMIN", "SUPERADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/api/permits/**").hasAnyRole("STAFF", "ADMIN", "SUPERADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/permits/**").hasAnyRole("ADMIN", "SUPERADMIN")
                        .requestMatchers("/api/evaluations/**").hasAnyRole("STAFF", "ADMIN", "SUPERADMIN")

                        // 6. Fee Configuration Management (Admin only)
                        .requestMatchers(HttpMethod.POST, "/api/fees/**").hasAnyRole("ADMIN", "SUPERADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/fees/**").hasAnyRole("ADMIN", "SUPERADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/fees/**").hasAnyRole("ADMIN", "SUPERADMIN")

                        // 7. Audit Logging & System Diagnostics (Staff / Admin only)
                        .requestMatchers("/api/logs/**").hasAnyRole("STAFF", "ADMIN", "SUPERADMIN")

                        // 8. Administrative Management Routes
                        .requestMatchers("/api/notifications/**").authenticated()
                        .requestMatchers("/api/admin/**").hasAnyRole("ADMIN", "SUPERADMIN")
                        .requestMatchers("/api/staff/**").hasAnyRole("STAFF", "ADMIN", "SUPERADMIN")

                        // 9. All remaining requests must be authenticated
                        .anyRequest().authenticated()
                );

        // Clickjacking protection: allow frames only from same origin (for H2 console / modals)
        http.headers(headers -> headers.frameOptions(frameOptions -> frameOptions.sameOrigin()));

        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of(
                "https://*.vercel.app",
                "https://e-tayo-official.vercel.app",
                "http://localhost:3000",
                "http://localhost:3001",
                "http://127.0.0.1:3000"
        ));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "Accept", "X-Requested-With", "Origin", "Access-Control-Request-Method", "Access-Control-Request-Headers"));
        configuration.setExposedHeaders(Arrays.asList("X-Total-Count", "Content-Range", "Authorization"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
