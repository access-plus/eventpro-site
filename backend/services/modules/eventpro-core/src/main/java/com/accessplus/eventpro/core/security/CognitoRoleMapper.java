package com.accessplus.eventpro.core.security;

import com.accessplus.eventpro.core.user.entity.UserEntity;
import com.accessplus.eventpro.core.user.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Maps Cognito groups from JWT claims to Spring Security roles.
 * Extracts the 'cognito:groups' claim from the JWT token and converts
 * Cognito group names to Spring Security role authorities.
 * 
 * If 'cognito:groups' claim is not present in the access token (which is common),
 * falls back to looking up the user's role from the database.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class CognitoRoleMapper implements Converter<Jwt, Collection<GrantedAuthority>> {

    private static final String COGNITO_GROUPS_CLAIM = "cognito:groups";
    private static final String SUB_CLAIM = "sub";
    private static final String ROLE_PREFIX = "ROLE_";

    private final UserService userService;

    /**
     * Converts Cognito groups from JWT claims to Spring Security authorities.
     * 
     * First tries to extract roles from 'cognito:groups' claim (if present in token).
     * If not present, falls back to looking up the user in the database by Cognito user ID (sub claim)
     * and using their stored role.
     * 
     * Mapping:
     * - ADMIN → ROLE_ADMIN
     * - ORGANIZER → ROLE_ORGANIZER
     * - USER → ROLE_USER
     *
     * @param jwt the JWT token containing Cognito claims
     * @return collection of granted authorities based on Cognito groups or database role
     */
    @Override
    public Collection<GrantedAuthority> convert(Jwt jwt) {
        // First, try to get roles from cognito:groups claim (if present in access token)
        @SuppressWarnings("unchecked")
        List<String> groups = (List<String>) jwt.getClaim(COGNITO_GROUPS_CLAIM);

        if (groups != null && !groups.isEmpty()) {
            log.debug("Found cognito:groups claim in JWT, using groups for role mapping");
            return groups.stream()
                    .map(this::mapGroupToRole)
                    .filter(role -> role != null && !role.isEmpty())
                    .map(SimpleGrantedAuthority::new)
                    .collect(Collectors.toList());
        }

        // Fallback: cognito:groups not present in access token, look up role from database
        log.debug("cognito:groups claim not found in JWT, falling back to database lookup");
        String cognitoUserId = jwt.getClaimAsString(SUB_CLAIM);
        
        if (cognitoUserId == null || cognitoUserId.isEmpty()) {
            log.warn("JWT token does not contain 'sub' claim, cannot determine user role");
            return Collections.emptyList();
        }

        try {
            UserEntity user = userService.getUserByCognitoId(cognitoUserId);
            String role = user.getRole();
            if (role != null && !role.isEmpty()) {
                log.debug("Retrieved role from database for user: cognitoUserId={}, role={}", cognitoUserId, role);
                String roleAuthority = mapGroupToRole(role);
                if (roleAuthority != null && !roleAuthority.isEmpty()) {
                    return Collections.singletonList(new SimpleGrantedAuthority(roleAuthority));
                }
            }
        } catch (Exception e) {
            log.warn("Failed to retrieve user role from database: cognitoUserId={}, error={}", 
                    cognitoUserId, e.getMessage());
            // If user doesn't exist in database yet, return empty authorities
            // The user will be created on first API call (e.g., /api/v1/users/me)
        }

        return Collections.emptyList();
    }

    /**
     * Maps a Cognito group name to a Spring Security role name.
     *
     * @param group the Cognito group name (e.g., "ADMIN", "ORGANIZER", "USER")
     * @return the Spring Security role name with ROLE_ prefix
     */
    private String mapGroupToRole(String group) {
        if (group == null || group.isEmpty()) {
            return null;
        }

        // Convert group name to uppercase and add ROLE_ prefix
        String role = group.toUpperCase();
        if (!role.startsWith(ROLE_PREFIX)) {
            role = ROLE_PREFIX + role;
        }

        return role;
    }
}

