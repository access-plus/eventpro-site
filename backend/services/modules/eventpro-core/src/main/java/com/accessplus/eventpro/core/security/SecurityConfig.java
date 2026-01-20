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
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

/**
 * Spring Security configuration for OAuth2 Resource Server.
 * Configures JWT token validation and maps role claims to Spring Security roles.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    private final JwtDecoder jwtDecoder;
    private final JwtRoleMapper jwtRoleMapper;

    public SecurityConfig(JwtDecoder jwtDecoder, JwtRoleMapper jwtRoleMapper) {
        this.jwtDecoder = jwtDecoder;
        this.jwtRoleMapper = jwtRoleMapper;
    }

    /**
     * Configures the security filter chain with OAuth2 resource server.
     * 
     * Security rules:
     * - /actuator/health: Public access (no authentication required)
     * - All other endpoints: Require valid JWT access token
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
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/actuator/health").permitAll()
                // Swagger/OpenAPI documentation endpoints - public access
                .requestMatchers("/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**", "/api-docs/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/v1/auth/signup", "/api/v1/auth/login", "/api/v1/auth/send-reset-email").permitAll()
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
     * Creates a JWT authentication converter that extracts authorities from JWT role claims.
     *
     * @return JwtAuthenticationConverter configured for role claims
     */
    private JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(jwtRoleMapper::convert);
        return converter;
    }

    /**
     * Configures CORS to allow Authorization header from frontend origins.
     * This is critical for JWT token authentication - browsers require explicit
     * permission for the Authorization header in CORS preflight responses.
     *
     * @return CorsConfigurationSource configured with allowed origins, headers, and methods
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList(
            "http://localhost:5173",
            "http://localhost:3000",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:3000"
        ));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
