package com.accessplus.eventpro.core.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.ArrayList;
import java.util.List;

/**
 * Production: set {@code eventpro.cors.allowed-origins} to your web app origins only (no wildcards).
 * Example: {@code EVENTPRO_CORS_ALLOWED_ORIGINS_0=https://app.example.com} or YAML list.
 */
@Data
@ConfigurationProperties(prefix = "eventpro.cors")
public class CorsProperties {

    /**
     * Browser origins allowed to call the API with credentials. Empty list falls back to local dev defaults.
     */
    private List<String> allowedOrigins = new ArrayList<>(List.of(
            "http://localhost:5173",
            "http://localhost:3000",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:3000"
    ));
}
