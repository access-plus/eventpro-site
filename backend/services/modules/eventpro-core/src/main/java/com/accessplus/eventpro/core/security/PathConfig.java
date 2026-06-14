package com.accessplus.eventpro.core.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.web.servlet.util.matcher.PathPatternRequestMatcher;
import org.springframework.security.web.util.matcher.RequestMatcher;

import java.util.List;

@Configuration
public class PathConfig {

    @Bean(name = "publicMatchers")
    public List<RequestMatcher> publicMatchers() {
        return List.of(
                PathPatternRequestMatcher.pathPattern("/actuator/health"),
                PathPatternRequestMatcher.pathPattern("/swagger-ui/**"),
                PathPatternRequestMatcher.pathPattern("/swagger-ui.html"),
                PathPatternRequestMatcher.pathPattern("/v3/api-docs/**"),
                PathPatternRequestMatcher.pathPattern("/api-docs/**"),
                PathPatternRequestMatcher.pathPattern("/swagger-resources/**"),
                PathPatternRequestMatcher.pathPattern("/webjars/**"),
                PathPatternRequestMatcher.pathPattern("/api/v3/api-docs/**"),
                PathPatternRequestMatcher.pathPattern(HttpMethod.POST, "/api/v1/auth/signup"),
                PathPatternRequestMatcher.pathPattern(HttpMethod.POST, "/api/v1/auth/login"),
                PathPatternRequestMatcher.pathPattern(HttpMethod.POST, "/api/v1/auth/send-reset-email"),
                PathPatternRequestMatcher.pathPattern(HttpMethod.GET, "/api/v1/events"),
                PathPatternRequestMatcher.pathPattern(HttpMethod.GET, "/api/v1/events/*"),
                PathPatternRequestMatcher.pathPattern(HttpMethod.GET, "/api/v1/events/*/ticket-types"),
                PathPatternRequestMatcher.pathPattern(HttpMethod.GET, "/api/v1/events/*/seats"),
                PathPatternRequestMatcher.pathPattern(HttpMethod.GET, "/api/v1/events/*/addons"),
                PathPatternRequestMatcher.pathPattern(HttpMethod.GET, "/api/v1/events/category/**"),
                PathPatternRequestMatcher.pathPattern(HttpMethod.GET, "/api/v1/images/proxy"),
                PathPatternRequestMatcher.pathPattern(HttpMethod.GET, "/api/v1/users/*/public-profile"),
                PathPatternRequestMatcher.pathPattern(HttpMethod.GET, "/api/v1/payments/config"),
                PathPatternRequestMatcher.pathPattern(HttpMethod.POST, "/api/v1/payments/create-intent"),
                PathPatternRequestMatcher.pathPattern(HttpMethod.POST, "/api/v1/payments/create-intent/"),
                PathPatternRequestMatcher.pathPattern(HttpMethod.POST, "/api/v1/payments/guest/confirm"),
                PathPatternRequestMatcher.pathPattern(HttpMethod.POST, "/api/v1/payments/guest/confirm/"),
                PathPatternRequestMatcher.pathPattern(HttpMethod.POST, "/api/v1/payments/guest-reserve"),
                PathPatternRequestMatcher.pathPattern(HttpMethod.POST, "/api/v1/payments/guest-reserve/"),
                PathPatternRequestMatcher.pathPattern(HttpMethod.POST, "/api/v1/webhooks/stripe")
        );
    }

    @Bean(name = "securedMatchers")
    public List<RequestMatcher> securedMatchers() {
        return List.of(
                PathPatternRequestMatcher.pathPattern("/**")
        );
    }
}
