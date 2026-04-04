package com.accessplus.eventpro.core.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Optional HSTS for environments terminated with TLS (set true behind HTTPS ALB/CloudFront).
 */
@Data
@ConfigurationProperties(prefix = "eventpro.security")
public class EventProSecurityHeadersProperties {

    /**
     * When true and the request is HTTPS (or {@code X-Forwarded-Proto: https}), send Strict-Transport-Security.
     */
    private boolean hstsEnabled = false;
}
