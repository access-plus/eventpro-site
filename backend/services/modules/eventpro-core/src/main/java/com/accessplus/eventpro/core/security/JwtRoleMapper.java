package com.accessplus.eventpro.core.security;

import lombok.extern.slf4j.Slf4j;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Slf4j
@Component
public class JwtRoleMapper implements Converter<Jwt, Collection<GrantedAuthority>> {

    private static final String ROLE_PREFIX = "ROLE_";

    @Override
    public Collection<GrantedAuthority> convert(Jwt jwt) {
        Object claim = jwt.getClaims().get("role");
        if (claim instanceof String role) {
            return Collections.singletonList(new SimpleGrantedAuthority(toRole(role)));
        }
        if (claim instanceof Collection<?> roles) {
            return roles.stream()
                    .filter(value -> value != null && !value.toString().isBlank())
                    .map(value -> new SimpleGrantedAuthority(toRole(value.toString())))
                    .collect(Collectors.toList());
        }

        Object rolesClaim = jwt.getClaims().get("roles");
        if (rolesClaim instanceof Collection<?> roles) {
            return roles.stream()
                    .filter(value -> value != null && !value.toString().isBlank())
                    .map(value -> new SimpleGrantedAuthority(toRole(value.toString())))
                    .collect(Collectors.toList());
        }

        log.debug("JWT token does not contain role claims");
        return List.of();
    }

    private String toRole(String rawRole) {
        String role = rawRole.trim().toUpperCase(Locale.ROOT);
        return role.startsWith(ROLE_PREFIX) ? role : ROLE_PREFIX + role;
    }
}
