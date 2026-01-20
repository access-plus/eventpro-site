package com.accessplus.eventpro.core.security;

import com.accessplus.eventpro.core.config.JwtProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.security.SignatureException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.security.PrivateKey;
import java.security.PublicKey;
import java.time.Instant;
import java.util.Collection;
import java.util.Date;
import java.util.Locale;
import java.util.UUID;

/**
 * Service for JWT token generation and validation using jjwt library.
 * 
 * <p>Handles:
 * <ul>
 *   <li>Token generation with RS256 signing</li>
 *   <li>Token validation and claim extraction</li>
 *   <li>Helper methods for extracting user information from claims</li>
 * </ul>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class JwtService {

    private final JwtProperties jwtProperties;
    private final PrivateKey privateKey;
    private final PublicKey publicKey;

    /**
     * Generates a JWT token for the given user.
     * 
     * @param userId User ID (UUID)
     * @param email User email
     * @param role User role (USER, ORGANIZER, ADMIN)
     * @return JWT token string
     */
    public String generateToken(UUID userId, String email, String role) {
        Instant now = Instant.now();
        Instant expiration = now.plusSeconds(jwtProperties.getAccessTokenTtlSeconds());

        return Jwts.builder()
                .subject(userId.toString())
                .claim("email", email)
                .claim("role", role)
                .issuer(jwtProperties.getIssuer())
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiration))
                .signWith(privateKey)
                .compact();
    }

    /**
     * Validates a JWT token and returns its claims.
     * 
     * @param token JWT token string
     * @return Claims from the validated token
     * @throws JwtException if token is invalid, expired, or malformed
     */
    public Claims validateToken(String token) throws JwtException {
        try {
            return Jwts.parser()
                    .verifyWith(publicKey)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (ExpiredJwtException e) {
            log.warn("JWT token has expired: {}", e.getMessage());
            throw e;
        } catch (MalformedJwtException e) {
            log.warn("JWT token is malformed: {}", e.getMessage());
            throw e;
        } catch (SignatureException e) {
            log.warn("JWT token signature is invalid: {}", e.getMessage());
            throw e;
        } catch (JwtException e) {
            log.warn("JWT token validation failed: {}", e.getMessage());
            throw e;
        }
    }

    /**
     * Extracts the user ID from JWT claims.
     * 
     * @param claims JWT claims
     * @return User ID (UUID)
     * @throws IllegalStateException if sub claim is missing or invalid
     */
    public UUID getUserId(Claims claims) {
        String sub = claims.getSubject();
        if (sub == null || sub.isEmpty()) {
            throw new IllegalStateException("JWT token does not contain 'sub' claim");
        }
        try {
            return UUID.fromString(sub);
        } catch (IllegalArgumentException e) {
            throw new IllegalStateException("JWT token 'sub' claim is not a valid UUID: " + sub, e);
        }
    }

    /**
     * Extracts the email from JWT claims.
     * 
     * @param claims JWT claims
     * @return User email, or null if not present
     */
    public String getEmail(Claims claims) {
        return claims.get("email", String.class);
    }

    /**
     * Extracts the role from JWT claims.
     * 
     * <p>Handles both "role" (single) and "roles" (collection) claims,
     * matching the behavior of JwtRoleMapper.
     * 
     * @param claims JWT claims
     * @return User role, or "USER" if not found
     */
    public String getRole(Claims claims) {
        // Check "role" claim first
        Object roleClaim = claims.get("role");
        if (roleClaim instanceof String role) {
            return role.trim().toUpperCase(Locale.ROOT);
        }
        if (roleClaim instanceof Collection<?> roles) {
            String role = roles.stream()
                    .filter(value -> value != null && !value.toString().isBlank())
                    .map(value -> value.toString().trim().toUpperCase(Locale.ROOT))
                    .findFirst()
                    .orElse("USER");
            return role;
        }

        // Check "roles" claim as fallback
        Object rolesClaim = claims.get("roles");
        if (rolesClaim instanceof Collection<?> roles) {
            String role = roles.stream()
                    .filter(value -> value != null && !value.toString().isBlank())
                    .map(value -> value.toString().trim().toUpperCase(Locale.ROOT))
                    .findFirst()
                    .orElse("USER");
            return role;
        }

        // Default to USER if no role found
        log.debug("JWT token does not contain role claims, defaulting to USER");
        return "USER";
    }

    /**
     * Returns the access token TTL in seconds.
     * 
     * @return TTL in seconds
     */
    public long getAccessTokenTtlSeconds() {
        return jwtProperties.getAccessTokenTtlSeconds();
    }
}
