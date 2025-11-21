package com.accessplus.eventpro.core.config;

import com.nimbusds.jwt.JWT;
import com.nimbusds.jwt.JWTClaimsSet;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Local development authentication configuration.
 * Provides mock JWT decoder for local development when Cognito is not available.
 * 
 * This configuration is activated when:
 * - aws.cognito.userPoolId is empty or missing
 * - OR LOCAL_AUTH_ENABLED=true is set
 * 
 * The mock decoder accepts unsigned JWT tokens with standard Cognito claims.
 */
@Configuration
@ConditionalOnProperty(
    name = "local.auth.enabled",
    havingValue = "true",
    matchIfMissing = false
)
public class LocalAuthConfig {

    @Value("${local.auth.default-user-id:local-user-123}")
    private String defaultUserId;

    @Value("${local.auth.default-email:dev@local.test}")
    private String defaultEmail;

    @Value("${local.auth.default-groups:USER}")
    private String defaultGroups;

    /**
     * Creates a mock JWT decoder that accepts unsigned tokens for local development.
     * 
     * This decoder:
     * - Accepts any JWT token (no signature validation)
     * - Extracts claims from the token payload
     * - Falls back to default values if claims are missing
     * 
     * @return Mock JWT decoder for local development
     */
    @Bean
    @Primary
    public JwtDecoder localJwtDecoder() {
        return new JwtDecoder() {
            @Override
            public Jwt decode(String token) throws JwtException {
                try {
                    // Parse JWT token using Nimbus JWT library
                    JWT jwt = com.nimbusds.jwt.JWTParser.parse(token);
                    JWTClaimsSet claimsSet;
                    if (jwt instanceof com.nimbusds.jwt.PlainJWT) {
                        claimsSet = ((com.nimbusds.jwt.PlainJWT) jwt).getJWTClaimsSet();
                    } else {
                        claimsSet = jwt.getJWTClaimsSet();
                    }
                    
                    // Extract claims from token
                    Map<String, Object> claims = new HashMap<>(claimsSet.getClaims());
                    
                    // Ensure required claims exist with defaults
                    if (!claims.containsKey("sub") || claims.get("sub") == null) {
                        claims.put("sub", defaultUserId);
                    }
                    if (!claims.containsKey("email") || claims.get("email") == null) {
                        claims.put("email", defaultEmail);
                    }
                    if (!claims.containsKey("cognito:groups") || claims.get("cognito:groups") == null) {
                        claims.put("cognito:groups", parseGroups(defaultGroups));
                    }
                    
                    // Get timestamps
                    Instant issuedAt = claimsSet.getIssueTime() != null 
                        ? claimsSet.getIssueTime().toInstant() 
                        : Instant.now().minusSeconds(60);
                    Instant expiresAt = claimsSet.getExpirationTime() != null 
                        ? claimsSet.getExpirationTime().toInstant() 
                        : Instant.now().plusSeconds(3600);
                    
                    // Create Spring Security JWT (no signature validation for local)
                    return Jwt.withTokenValue(token)
                            .header("alg", "none")
                            .header("typ", "JWT")
                            .claims(c -> c.putAll(claims))
                            .issuedAt(issuedAt)
                            .expiresAt(expiresAt)
                            .build();
                } catch (Exception e) {
                    // If token parsing fails, create a default token for local dev
                    Map<String, Object> defaultClaims = new HashMap<>();
                    defaultClaims.put("sub", defaultUserId);
                    defaultClaims.put("email", defaultEmail);
                    defaultClaims.put("given_name", "Local");
                    defaultClaims.put("family_name", "Developer");
                    defaultClaims.put("cognito:groups", parseGroups(defaultGroups));
                    
                    return Jwt.withTokenValue(token)
                            .header("alg", "none")
                            .header("typ", "JWT")
                            .claims(c -> c.putAll(defaultClaims))
                            .issuedAt(Instant.now())
                            .expiresAt(Instant.now().plusSeconds(3600))
                            .build();
                }
            }
        };
    }

    /**
     * Parses comma-separated groups string into list.
     */
    private List<String> parseGroups(String groupsStr) {
        if (groupsStr == null || groupsStr.trim().isEmpty()) {
            return List.of("USER");
        }
        return List.of(groupsStr.split(","));
    }
}

