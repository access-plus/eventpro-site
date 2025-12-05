package com.accessplus.eventpro.core.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import software.amazon.awssdk.auth.credentials.AwsCredentialsProvider;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.cognitoidentityprovider.CognitoIdentityProviderClient;

import java.net.URI;

/**
 * Configuration for AWS Cognito JWT token validation and Admin API.
 * Configures JWT decoder to validate access tokens from Cognito User Pool
 * and CognitoIdentityProviderClient for Admin API operations.
 * 
 * IMPORTANT: Cognito MUST use real AWS, not LocalStack, because LocalStack Community
 * Edition does not support Cognito Admin API operations (AdminGetUser, etc.).
 * 
 * This configuration is always active and requires Cognito credentials to be configured.
 */
@Configuration
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
                "aws.cognito.userPoolId must be configured. " +
                "Please set COGNITO_USER_POOL_ID environment variable."
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
     * Creates a credentials provider for Cognito that uses the standard AWS credentials chain.
     * The DefaultCredentialsProvider checks credentials in this order:
     * 1. Java system properties (aws.accessKeyId, aws.secretAccessKey)
     * 2. Environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
     * 3. AWS credentials file (~/.aws/credentials)
     * 4. IAM role (when running on EC2/ECS/Lambda)
     * 
     * This ensures Cognito uses real AWS credentials from environment variables or IAM role,
     * which is the standard approach for containerized applications.
     *
     * @return AwsCredentialsProvider using the standard AWS credentials chain
     */
    private AwsCredentialsProvider createCognitoCredentialsProvider() {
        // Use DefaultCredentialsProvider which follows the standard AWS credentials chain
        // This checks environment variables first, then credentials file, then IAM role
        // This is the recommended approach for containerized applications
        return DefaultCredentialsProvider.builder().build();
    }

    /**
     * Creates a CognitoIdentityProviderClient for Admin API operations.
     * Used for operations like promoting users to ORGANIZER role and fetching user attributes.
     * 
     * IMPORTANT: This client ALWAYS uses real AWS Cognito, never LocalStack, because:
     * 1. LocalStack Community Edition does not support Cognito Admin API
     * 2. Cognito User Pool is provisioned in real AWS (not LocalStack)
     * 
     * The client explicitly:
     * - Sets endpoint override to real AWS Cognito endpoint (https://cognito-idp.{region}.amazonaws.com)
     *   This ensures it ALWAYS uses real AWS, never LocalStack, regardless of AWS_ENDPOINT_URL env var
     * - Uses DefaultCredentialsProvider which follows the standard AWS credentials chain:
     *   environment variables -> credentials file -> IAM role
     * 
     * For local development, set real AWS credentials in environment variables:
     * AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY (in .env file for Docker Compose)
     * These credentials are used for Cognito, while test credentials can be used for LocalStack services
     *
     * @return CognitoIdentityProviderClient configured for the specified region (real AWS)
     */
    @Bean
    public CognitoIdentityProviderClient cognitoIdentityProviderClient() {
        // Explicitly set the endpoint to real AWS Cognito to prevent any LocalStack usage
        // Even though AWS SDK v2 doesn't automatically use AWS_ENDPOINT_URL, we explicitly
        // set the endpoint here to ensure it ALWAYS uses real AWS, never LocalStack
        String cognitoEndpoint = String.format("https://cognito-idp.%s.amazonaws.com", region);
        
        return CognitoIdentityProviderClient.builder()
                .region(Region.of(region))
                .credentialsProvider(createCognitoCredentialsProvider())
                .endpointOverride(URI.create(cognitoEndpoint)) // Explicitly set real AWS endpoint
                .build();
    }
}

