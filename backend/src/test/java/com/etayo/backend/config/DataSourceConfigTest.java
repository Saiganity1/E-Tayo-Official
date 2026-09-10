package com.etayo.backend.config;

import com.zaxxer.hikari.HikariConfig;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class DataSourceConfigTest {

    @Test
    void testSupabasePoolerUrlParsing() {
        String supabaseUrl = "postgresql://postgres.abcdefghijklmno:SuperSecretPass%21@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres";

        HikariConfig config = DataSourceConfig.buildHikariConfig(supabaseUrl, null, null);

        assertEquals("jdbc:postgresql://aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require", config.getJdbcUrl());
        assertEquals("postgres.abcdefghijklmno", config.getUsername());
        assertEquals("SuperSecretPass!", config.getPassword());
        assertEquals("org.postgresql.Driver", config.getDriverClassName());
    }

    @Test
    void testRenderPostgresUrlParsing() {
        String renderUrl = "postgres://etayo_user:secret_pass99@dpg-c123456789.oregon-postgres.render.com:5432/etayo_prod";

        HikariConfig config = DataSourceConfig.buildHikariConfig(renderUrl, null, null);

        assertEquals("jdbc:postgresql://dpg-c123456789.oregon-postgres.render.com:5432/etayo_prod?sslmode=require", config.getJdbcUrl());
        assertEquals("etayo_user", config.getUsername());
        assertEquals("secret_pass99", config.getPassword());
        assertEquals("org.postgresql.Driver", config.getDriverClassName());
    }

    @Test
    void testH2FallbackWhenNoUrl() {
        HikariConfig config = DataSourceConfig.buildHikariConfig(null, null, null);

        assertTrue(config.getJdbcUrl().startsWith("jdbc:h2:"));
        assertEquals("sa", config.getUsername());
        assertEquals("org.h2.Driver", config.getDriverClassName());
    }
}
