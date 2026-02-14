package com.accessplus.eventpro.event.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

import java.net.URI;

@Configuration
@Profile("local")
public class LocalStackS3Config {

    @Value("${aws.region:us-east-1}")
    private String awsRegion;

    @Value("${AWS_ENDPOINT_URL:http://localhost:4566}")
    private String s3Endpoint;

    @Bean
    public S3Client s3Client() {
        return S3Client.builder()
                .region(Region.of(awsRegion))
                .credentialsProvider(DefaultCredentialsProvider.builder().build())
                .endpointOverride(URI.create(s3Endpoint))
                .forcePathStyle(true) // Required for LocalStack
                .build();
    }

    @Bean
    public S3Presigner s3Presigner() {
        return S3Presigner.builder()
                .region(Region.of(awsRegion))
                .credentialsProvider(DefaultCredentialsProvider.builder().build())
                .endpointOverride(URI.create(s3Endpoint))
                .build();
    }
}
