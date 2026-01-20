package com.accessplus.eventpro.core.security;

import io.jsonwebtoken.Claims;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.UUID;

/**
 * Utility class for extracting information from JWT tokens.
 * 
 * <p>Works with UsernamePasswordAuthenticationToken where:
 * <ul>
 *   <li>Principal is userId as String (UUID.toString())</li>
 *   <li>Details contains Claims object from jjwt</li>
 * </ul>
 */
public class JwtUtils {
    
    /**
     * Extracts the user ID from the current authentication.
     * 
     * <p>The principal in UsernamePasswordAuthenticationToken is the userId as String.
     * 
     * @return User ID (UUID) from the authentication principal
     * @throws IllegalStateException if no authentication is present or token is invalid
     */
    public static UUID getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null) {
            throw new IllegalStateException("No valid JWT authentication found: authentication is null");
        }
        
        if (!(authentication instanceof UsernamePasswordAuthenticationToken)) {
            throw new IllegalStateException(
                String.format("No valid JWT authentication found: authentication type is %s, expected UsernamePasswordAuthenticationToken", 
                    authentication.getClass().getName()));
        }
        
        Object principal = authentication.getPrincipal();
        if (principal == null) {
            throw new IllegalStateException("JWT authentication principal is null");
        }
        
        try {
            return UUID.fromString(principal.toString());
        } catch (IllegalArgumentException e) {
            throw new IllegalStateException("JWT authentication principal is not a valid UUID: " + principal, e);
        }
    }
    
    /**
     * Gets the current JWT claims from authentication details.
     * 
     * <p>Claims are stored in authentication details by JwtAuthenticationFilter.
     * 
     * @return JWT claims
     * @throws IllegalStateException if no authentication is present or claims are not available
     */
    public static Claims getCurrentJwt() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null) {
            throw new IllegalStateException("No valid JWT authentication found: authentication is null");
        }
        
        if (!(authentication instanceof UsernamePasswordAuthenticationToken)) {
            throw new IllegalStateException(
                String.format("No valid JWT authentication found: authentication type is %s, expected UsernamePasswordAuthenticationToken", 
                    authentication.getClass().getName()));
        }
        
        Object details = authentication.getDetails();
        if (details == null) {
            throw new IllegalStateException("JWT authentication details are null - claims not available");
        }
        
        if (!(details instanceof Claims)) {
            throw new IllegalStateException(
                String.format("JWT authentication details are not Claims: %s", details.getClass().getName()));
        }
        
        return (Claims) details;
    }
    
    /**
     * Extracts a claim value from the current JWT token.
     * 
     * @param claimName Name of the claim to extract
     * @return Claim value as String, or null if not present
     */
    public static String getClaim(String claimName) {
        Claims claims = getCurrentJwt();
        Object claim = claims.get(claimName);
        if (claim == null) {
            return null;
        }
        return claim.toString();
    }
}
