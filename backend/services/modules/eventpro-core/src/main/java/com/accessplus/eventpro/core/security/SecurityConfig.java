package com.accessplus.eventpro.core.security;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.web.BearerTokenResolver;
import org.springframework.security.oauth2.server.resource.web.DefaultBearerTokenResolver;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Spring Security configuration for OAuth2 Resource Server.
 * Configures JWT token validation using AWS Cognito and maps Cognito groups to Spring Security roles.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    private final JwtDecoder jwtDecoder;
    private final CognitoRoleMapper cognitoRoleMapper;

    public SecurityConfig(JwtDecoder jwtDecoder, CognitoRoleMapper cognitoRoleMapper) {
        this.jwtDecoder = jwtDecoder;
        this.cognitoRoleMapper = cognitoRoleMapper;
    }

    /**
     * Configures the security filter chain with OAuth2 resource server.
     * 
     * Security rules:
     * - /actuator/health: Public access (no authentication required)
     * - All other endpoints: Require valid JWT access token from Cognito
     * 
     * The backend validates JWT tokens directly (not relying on ALB authentication).
     *
     * @param http the HttpSecurity configuration
     * @return configured SecurityFilterChain
     * @throws Exception if configuration fails
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> {}) // Enable CORS - handled by @CrossOrigin on controllers
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/actuator/health").permitAll()
                // Swagger/OpenAPI documentation endpoints - public access
                .requestMatchers("/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**", "/api-docs/**").permitAll()
                // Public Events endpoints - no authentication required (GET only)
                .requestMatchers(HttpMethod.GET, "/api/v1/events").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/events/*").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/events/*/ticket-types").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/events/category/**").permitAll()
                .anyRequest().authenticated())
            .oauth2ResourceServer(oauth2 -> oauth2
                .bearerTokenResolver(publicEndpointBearerTokenResolver())
                .jwt(jwt -> jwt
                    .decoder(jwtDecoder)
                    .jwtAuthenticationConverter(jwtAuthenticationConverter())));

        return http.build();
    }

    /**
     * Creates a BearerTokenResolver that returns null for public endpoints.
     * This prevents the OAuth2 Resource Server from attempting JWT processing
     * for Swagger/OpenAPI endpoints, avoiding unnecessary exceptions.
     *
     * @return BearerTokenResolver that skips token extraction for public endpoints
     */
    @Bean
    public BearerTokenResolver publicEndpointBearerTokenResolver() {
        return new BearerTokenResolver() {
            private final BearerTokenResolver defaultResolver = new DefaultBearerTokenResolver();

            @Override
            public String resolve(HttpServletRequest request) {
                String path = request.getRequestURI();
                
                // For public endpoints, return null to skip JWT processing
                if (path.startsWith("/swagger-ui") || 
                    path.startsWith("/v3/api-docs") || 
                    path.startsWith("/api-docs") ||
                    path.equals("/actuator/health") ||
                    (path.startsWith("/api/v1/events") && "GET".equals(request.getMethod()))) {
                    return null;
                }
                
                // For protected endpoints, use default token resolution
                return defaultResolver.resolve(request);
            }
        };
    }

    /**
     * Creates a JWT authentication converter that extracts authorities from Cognito groups.
     * Uses CognitoRoleMapper to convert Cognito group claims to Spring Security authorities.
     *
     * @return JwtAuthenticationConverter configured for Cognito groups
     */
    private JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(cognitoRoleMapper::convert);
        return converter;
    }
}

