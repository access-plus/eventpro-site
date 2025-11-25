package com.accessplus.eventpro.core.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

/**
 * Utility class for extracting information from JWT tokens.
 */
public class JwtUtils {
    
    private static final String SUB_CLAIM = "sub";
    
    /**
     * Extracts the Cognito user ID (sub claim) from the current JWT token.
     * 
     * @return Cognito user ID (sub claim) from the JWT token
     * @throws IllegalStateException if no authentication is present or token is invalid
     */
    public static String getCurrentUserCognitoId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null) {
            throw new IllegalStateException("No valid JWT authentication found: authentication is null");
        }
        
        if (!(authentication instanceof JwtAuthenticationToken)) {
            throw new IllegalStateException(
                String.format("No valid JWT authentication found: authentication type is %s, expected JwtAuthenticationToken", 
                    authentication.getClass().getName()));
        }
        
        JwtAuthenticationToken jwtAuth = (JwtAuthenticationToken) authentication;
        Jwt jwt = jwtAuth.getToken();
        
        String sub = jwt.getClaimAsString(SUB_CLAIM);
        if (sub == null || sub.isEmpty()) {
            throw new IllegalStateException("JWT token does not contain 'sub' claim");
        }
        
        return sub;
    }
    
    /**
     * Gets the current JWT token.
     * 
     * @return JWT token
     * @throws IllegalStateException if no authentication is present or token is invalid
     */
    public static Jwt getCurrentJwt() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || !(authentication instanceof JwtAuthenticationToken)) {
            throw new IllegalStateException("No valid JWT authentication found");
        }
        
        JwtAuthenticationToken jwtAuth = (JwtAuthenticationToken) authentication;
        return jwtAuth.getToken();
    }
    
    /**
     * Extracts a claim value from the current JWT token.
     * 
     * @param claimName Name of the claim to extract
     * @return Claim value as String, or null if not present
     */
    public static String getClaim(String claimName) {
        Jwt jwt = getCurrentJwt();
        return jwt.getClaimAsString(claimName);
    }
}

