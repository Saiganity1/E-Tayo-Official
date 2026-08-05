package com.etayo.backend.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;

@Configuration
public class DatabaseConfig {

    @Value("${DATABASE_URL:}")
    private String databaseUrl;

    @Bean
    @Primary
    public DataSource dataSource() {
        HikariConfig config = new HikariConfig();

        if (databaseUrl != null && databaseUrl.startsWith("postgres://")) {
            // Convert Render's postgres:// to jdbc:postgresql://
            String dbUri = databaseUrl.substring("postgres://".length());
            
            // Format: user:password@host:port/database
            if (dbUri.contains("@")) {
                String[] credentialsAndHost = dbUri.split("@");
                String[] credentials = credentialsAndHost[0].split(":");
                String hostAndDatabase = credentialsAndHost[1];

                config.setJdbcUrl("jdbc:postgresql://" + hostAndDatabase);
                if (credentials.length > 0) config.setUsername(credentials[0]);
                if (credentials.length > 1) config.setPassword(credentials[1]);
            } else {
                config.setJdbcUrl("jdbc:postgresql://" + dbUri);
            }
            config.setDriverClassName("org.postgresql.Driver");
        } else if (databaseUrl != null && databaseUrl.startsWith("jdbc:postgresql://")) {
            config.setJdbcUrl(databaseUrl);
            config.setDriverClassName("org.postgresql.Driver");
        } else {
            // Local H2 fallback
            config.setJdbcUrl("jdbc:h2:file:./data/etayodb");
            config.setUsername("sa");
            config.setPassword("password");
            config.setDriverClassName("org.h2.Driver");
        }

        // Optimized connection pool settings
        config.setMaximumPoolSize(10);
        config.setMinimumIdle(2);
        config.setIdleTimeout(30000);
        config.setConnectionTimeout(20000);

        return new HikariDataSource(config);
    }
}
