package com.accessplus.eventpro.core.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String path = request.getRequestURI();
        String method = request.getMethod();

        // 1. Skip filter for public endpoints
        if (isPublicEndpoint(path, method)) {
            filterChain.doFilter(request, response);
            return;
        }

        // 2. Extract token from header
        String token = extractToken(request);

        // 3. Handle missing token
        if (token == null) {
            // Continue filter chain - SecurityConfig will handle authorization failure (returns 403)
            filterChain.doFilter(request, response);
            return;
        }

        // 4. Validate token
        io.jsonwebtoken.Claims claims;
        try {
            claims = jwtService.validateToken(token);
        } catch (io.jsonwebtoken.JwtException e) {
            log.warn("JWT token validation failed: {}", e.getMessage());
            handleAuthenticationError(response, "Invalid or expired token");
            return;
        }

        // 5. Extract claims
        UUID userId;
        String email;
        String role;
        try {
            userId = jwtService.getUserId(claims);
            email = jwtService.getEmail(claims);
            role = jwtService.getRole(claims);
        } catch (Exception e) {
            log.error("Failed to extract claims from JWT token", e);
            handleAuthenticationError(response, "Invalid token claims");
            return;
        }

        // 6. Create authentication token
        String principal = userId.toString();
        List<SimpleGrantedAuthority> authorities = List.of(
                new SimpleGrantedAuthority("ROLE_" + role.toUpperCase(Locale.ROOT))
        );
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                principal, null, authorities);
        
        // Store Claims in details for backward compatibility (JwtUtils.getCurrentJwt()/getClaim())
        auth.setDetails(claims);

        // 7. Set authentication and continue
        SecurityContextHolder.getContext().setAuthentication(auth);
        filterChain.doFilter(request, response);
    }

    private boolean isPublicEndpoint(String path, String method) {
        // Health endpoint
        if ("/actuator/health".equals(path)) {
            return true;
        }

        // Swagger/OpenAPI endpoints
        if (path.startsWith("/swagger-ui") || 
            path.startsWith("/v3/api-docs") || 
            path.startsWith("/api-docs")) {
            return true;
        }

        // Auth endpoints (POST only)
        if (HttpMethod.POST.name().equals(method)) {
            if (path.equals("/api/v1/auth/signup") ||
                path.equals("/api/v1/auth/login") ||
                path.equals("/api/v1/auth/send-reset-email")) {
                return true;
            }
        }

        // Public Events endpoints (GET only) - but exclude protected organizer endpoints
        if (HttpMethod.GET.name().equals(method)) {
            // Organizer endpoints require authentication
            if (path.startsWith("/api/v1/events/organizer/")) {
                return false;
            }
            // my-events requires authentication
            if (path.equals("/api/v1/events/my-events")) {
                return false;
            }
            // Public event endpoints
            if (path.equals("/api/v1/events") ||
                path.startsWith("/api/v1/events/") ||
                path.startsWith("/api/v1/events/category/")) {
                return true;
            }
        }

        return false;
    }

    private String extractToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return null;
        }
        return authHeader.substring(7); // Remove "Bearer " prefix
    }

    private void handleAuthenticationError(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        String jsonResponse = String.format("{\"error\":\"Unauthorized\",\"message\":\"%s\"}", message);
        response.getWriter().write(jsonResponse);
    }
}
