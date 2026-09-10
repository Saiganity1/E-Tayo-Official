package com.etayo.backend.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.io.File;
import java.net.URI;

@Configuration
public class DataSourceConfig {

    private static final Logger log = LoggerFactory.getLogger(DataSourceConfig.class);

    @Bean
    @Primary
    public DataSource dataSource(
            @Value("${SPRING_DATASOURCE_URL:${DATABASE_URL:#{null}}}") String rawDbUrl,
            @Value("${SPRING_DATASOURCE_USERNAME:${DB_USERNAME:#{null}}}") String envUsername,
            @Value("${SPRING_DATASOURCE_PASSWORD:${DB_PASSWORD:#{null}}}") String envPassword) {
        HikariConfig config = buildHikariConfig(rawDbUrl, envUsername, envPassword);
        return new HikariDataSource(config);
    }

    public static HikariConfig buildHikariConfig(String rawDbUrl, String envUsername, String envPassword) {
        HikariConfig config = new HikariConfig();

        // 1. Check if remote PostgreSQL DATABASE_URL is provided (e.g. Supabase, Render, Neon)
        if (rawDbUrl != null && !rawDbUrl.trim().isEmpty() && !rawDbUrl.startsWith("jdbc:h2:")) {
            String dbUrl = rawDbUrl.trim();
            log.info("Detected remote DATABASE_URL. Configuring production DataSource...");

            if (dbUrl.startsWith("postgres://") || dbUrl.startsWith("postgresql://")) {
                try {
                    // Standardize scheme to postgresql:// for java.net.URI parsing
                    String normalizedUrl = dbUrl.replaceFirst("^postgres://", "postgresql://");
                    URI uri = new URI(normalizedUrl);

                    String userInfo = uri.getUserInfo();
                    String username = envUsername;
                    String password = envPassword;

                    if (userInfo != null && !userInfo.isEmpty()) {
                        String[] parts = userInfo.split(":", 2);
                        username = java.net.URLDecoder.decode(parts[0], java.nio.charset.StandardCharsets.UTF_8);
                        if (parts.length > 1) {
                            password = java.net.URLDecoder.decode(parts[1], java.nio.charset.StandardCharsets.UTF_8);
                        }
                    }

                    String host = uri.getHost();
                    int port = uri.getPort() > 0 ? uri.getPort() : 5432;
                    String path = uri.getPath(); // e.g. /postgres
                    String query = uri.getQuery();

                    StringBuilder jdbcUrl = new StringBuilder("jdbc:postgresql://")
                            .append(host)
                            .append(":")
                            .append(port)
                            .append(path != null ? path : "");

                    if (query != null && !query.isEmpty()) {
                        jdbcUrl.append("?").append(query);
                        if (!query.contains("sslmode=")) {
                            jdbcUrl.append("&sslmode=require");
                        }
                    } else {
                        // Supabase / Render Postgres external connections require sslmode=require
                        jdbcUrl.append("?sslmode=require");
                    }

                    log.info("Configured PostgreSQL JDBC connection: jdbc:postgresql://{}:{}", host, port);
                    config.setJdbcUrl(jdbcUrl.toString());
                    config.setUsername(username != null ? username : "postgres");
                    config.setPassword(password != null ? password : "");
                    config.setDriverClassName("org.postgresql.Driver");

                    // Cloud database resilience settings (Supabase / Render)
                    config.setConnectionTimeout(30000);
                    config.setInitializationFailTimeout(-1);
                    config.setMaximumPoolSize(10);
                    config.setMinimumIdle(2);
                    config.setIdleTimeout(30000);
                    config.setMaxLifetime(1800000);

                    return config;
                } catch (Exception e) {
                    log.error("Failed to parse PostgreSQL DATABASE_URL as URI, using fallback prefix: {}", e.getMessage());
                    String fallback = dbUrl.startsWith("jdbc:") ? dbUrl : "jdbc:" + dbUrl;
                    config.setJdbcUrl(fallback);
                    if (envUsername != null) config.setUsername(envUsername);
                    if (envPassword != null) config.setPassword(envPassword);
                    config.setDriverClassName("org.postgresql.Driver");
                    return config;
                }
            } else if (dbUrl.startsWith("jdbc:postgresql:")) {
                config.setJdbcUrl(dbUrl);
                if (envUsername != null) config.setUsername(envUsername);
                if (envPassword != null) config.setPassword(envPassword);
                config.setDriverClassName("org.postgresql.Driver");
                config.setConnectionTimeout(30000);
                config.setInitializationFailTimeout(-1);
                return config;
            }
        }

        // 2. Fallback to Local H2 Database (for local dev and testing)
        log.info("No remote PostgreSQL DATABASE_URL configured. Initializing local H2 file database.");
        File dataDir = new File("./data");
        if (!dataDir.exists()) {
            dataDir.mkdirs();
        }

        config.setJdbcUrl("jdbc:h2:file:./data/etayodb;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE;NON_KEYWORDS=USER");
        config.setUsername("sa");
        config.setPassword("password");
        config.setDriverClassName("org.h2.Driver");
        config.setMaximumPoolSize(5);

        return config;
    }
}
