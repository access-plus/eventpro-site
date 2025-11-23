package com.accessplus.eventpro.core.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.cognitoidentityprovider.CognitoIdentityProviderClient;

/**
 * Configuration for AWS Cognito JWT token validation and Admin API.
 * Configures JWT decoder to validate access tokens from Cognito User Pool
 * and CognitoIdentityProviderClient for Admin API operations.
 * 
 * This configuration is only active when local.auth.enabled is explicitly set to "false".
 * When local.auth.enabled is "true" or not set, LocalAuthConfig will be used instead.
 */
@Configuration
@ConditionalOnProperty(
    name = "local.auth.enabled",
    havingValue = "false",
    matchIfMissing = false
)
public class CognitoConfig {

    @Value("${aws.cognito.userPoolId:}")
    private String userPoolId;

    @Value("${aws.cognito.region:us-east-1}")
    private String region;

    /**
     * Creates a JWT decoder that validates tokens using Cognito's JWK Set URI.
     * The decoder fetches public keys from Cognito's well-known endpoint to verify token signatures.
     *
     * @return JwtDecoder configured for Cognito access tokens
     * @throws IllegalStateException if userPoolId is not configured
     */
    @Bean
    public JwtDecoder jwtDecoder() {
        if (userPoolId == null || userPoolId.trim().isEmpty()) {
            throw new IllegalStateException(
                "aws.cognito.userPoolId must be configured when using CognitoConfig. " +
                "Either set COGNITO_USER_POOL_ID environment variable or set local.auth.enabled=true for local development."
            );
        }
        String jwkSetUri = String.format(
            "https://cognito-idp.%s.amazonaws.com/%s/.well-known/jwks.json",
            region,
            userPoolId
        );
        return NimbusJwtDecoder.withJwkSetUri(jwkSetUri).build();
    }

    /**
     * Creates a CognitoIdentityProviderClient for Admin API operations.
     * Used for operations like promoting users to ORGANIZER role.
     *
     * @return CognitoIdentityProviderClient configured for the specified region
     */
    @Bean
    public CognitoIdentityProviderClient cognitoIdentityProviderClient() {
        return CognitoIdentityProviderClient.builder()
                .region(Region.of(region))
                .build();
    }
}

