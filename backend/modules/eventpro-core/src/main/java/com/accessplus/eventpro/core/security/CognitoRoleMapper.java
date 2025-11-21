package com.accessplus.eventpro.core.security;

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
 */
@Component
public class CognitoRoleMapper implements Converter<Jwt, Collection<GrantedAuthority>> {

    private static final String COGNITO_GROUPS_CLAIM = "cognito:groups";
    private static final String ROLE_PREFIX = "ROLE_";

    /**
     * Converts Cognito groups from JWT claims to Spring Security authorities.
     * 
     * Mapping:
     * - ADMIN → ROLE_ADMIN
     * - ORGANIZER → ROLE_ORGANIZER
     * - USER → ROLE_USER
     *
     * @param jwt the JWT token containing Cognito claims
     * @return collection of granted authorities based on Cognito groups
     */
    @Override
    public Collection<GrantedAuthority> convert(Jwt jwt) {
        @SuppressWarnings("unchecked")
        List<String> groups = (List<String>) jwt.getClaim(COGNITO_GROUPS_CLAIM);

        if (groups == null || groups.isEmpty()) {
            return Collections.emptyList();
        }

        return groups.stream()
                .map(this::mapGroupToRole)
                .filter(role -> role != null && !role.isEmpty())
                .map(SimpleGrantedAuthority::new)
                .collect(Collectors.toList());
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

