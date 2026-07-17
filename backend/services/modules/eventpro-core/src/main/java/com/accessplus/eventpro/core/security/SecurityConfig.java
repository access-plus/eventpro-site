package com.accessplus.eventpro.core.security;

import com.accessplus.eventpro.core.config.CorsProperties;
import com.accessplus.eventpro.core.config.EventProApiSecurityProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.ArrayList;
import java.util.Arrays;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final CorsProperties corsProperties;
    private final EventProApiSecurityProperties apiSecurityProperties;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter,
                          CorsProperties corsProperties,
                          EventProApiSecurityProperties apiSecurityProperties) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.corsProperties = corsProperties;
        this.apiSecurityProperties = apiSecurityProperties;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> {
                auth.requestMatchers("/actuator/health").permitAll();
                if (apiSecurityProperties.isPublicActuatorMetrics()) {
                    auth.requestMatchers("/actuator/metrics", "/actuator/metrics/**",
                            "/actuator/prometheus").permitAll();
                }
                if (apiSecurityProperties.isPublicSwagger()) {
                    auth.requestMatchers("/swagger-ui/**", "/swagger-ui.html",
                            "/v3/api-docs/**", "/api-docs/**").permitAll();
                }
                auth.requestMatchers(HttpMethod.POST, "/api/v1/auth/signup", "/api/v1/auth/login", "/api/v1/auth/send-reset-email").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/events").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/events/*").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/events/*/ticket-types").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/events/*/seats").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/events/*/addons").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/events/category/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/images/proxy").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/payments/config").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/users/*/public-profile").permitAll()
                .requestMatchers(HttpMethod.POST,
                    "/api/v1/payments/create-intent", "/api/v1/payments/create-intent/",
                    "/api/v1/payments/guest/confirm", "/api/v1/payments/guest/confirm/",
                    "/api/v1/payments/guest-reserve", "/api/v1/payments/guest-reserve/").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/v1/webhooks/stripe").permitAll()
                .anyRequest().authenticated();
            })
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(new ArrayList<>(corsProperties.getAllowedOrigins()));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
