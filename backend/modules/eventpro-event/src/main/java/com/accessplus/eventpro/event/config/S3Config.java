package com.accessplus.eventpro.event.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

import java.net.URI;

/**
 * Configuration for AWS S3 client.
 * Configures S3Client and S3Presigner beans for S3 operations (image upload, delete, URL generation).
 * Supports both AWS and LocalStack endpoints.
 */
@Configuration
public class S3Config {

    @Value("${aws.region:us-east-1}")
    private String awsRegion;

    @Value("${aws.s3.endpoint:}")
    private String s3Endpoint; // Optional: for LocalStack or custom endpoints

    @Value("${aws.s3.bucketName}")
    private String bucketName;

    /**
     * Creates and configures S3Client bean for AWS S3 operations.
     * Supports both AWS and LocalStack endpoints.
     *
     * @return configured S3Client instance
     */
    @Bean
    public S3Client s3Client() {
        var builder = S3Client.builder()
                .region(Region.of(awsRegion))
                .credentialsProvider(DefaultCredentialsProvider.builder().build());

        // Configure custom endpoint if provided (for LocalStack)
        if (s3Endpoint != null && !s3Endpoint.isEmpty()) {
            builder.endpointOverride(URI.create(s3Endpoint));
            // For LocalStack, we need to use path-style addressing
            builder.forcePathStyle(true);
        }

        return builder.build();
    }

    /**
     * Creates and configures S3Presigner bean for generating presigned URLs.
     * Supports both AWS and LocalStack endpoints.
     *
     * @return configured S3Presigner instance
     */
    @Bean
    public S3Presigner s3Presigner() {
        var builder = S3Presigner.builder()
                .region(Region.of(awsRegion))
                .credentialsProvider(DefaultCredentialsProvider.builder().build());

        // Configure custom endpoint if provided (for LocalStack)
        if (s3Endpoint != null && !s3Endpoint.isEmpty()) {
            builder.endpointOverride(URI.create(s3Endpoint));
        }

        return builder.build();
    }

    /**
     * Gets the S3 bucket name for image storage.
     *
     * @return S3 bucket name
     */
    public String getBucketName() {
        return bucketName;
    }

    /**
     * Gets the S3 endpoint URL (for LocalStack or custom endpoints).
     *
     * @return S3 endpoint URL, or empty string if using default AWS endpoint
     */
    public String getS3Endpoint() {
        return s3Endpoint != null ? s3Endpoint : "";
    }
}

