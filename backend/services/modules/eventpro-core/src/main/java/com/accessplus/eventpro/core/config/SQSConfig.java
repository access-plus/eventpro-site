package com.accessplus.eventpro.core.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.sqs.SqsClient;

import java.net.URI;

/**
 * Configuration for AWS SQS client and queue URLs.
 * Configures SqsClient bean and provides queue URL properties for message publishing.
 */
@Configuration
public class SQSConfig {

    @Value("${aws.region:us-east-1}")
    private String awsRegion;

    @Value("${aws.sqs.endpoint:}")
    private String sqsEndpoint; // Optional: for LocalStack or custom endpoints

    @Value("${aws.sqs.orderQueueUrl:}")
    private String orderQueueUrl;

    @Value("${aws.sqs.paymentQueueUrl:}")
    private String paymentQueueUrl;

    @Value("${aws.sqs.notificationQueueUrl:}")
    private String notificationQueueUrl;

    /**
     * Creates and configures SqsClient bean for AWS SQS operations.
     * Supports both AWS and LocalStack endpoints.
     *
     * @return configured SqsClient instance
     */
    @Bean
    public SqsClient sqsClient() {
        var builder = SqsClient.builder()
                .region(Region.of(awsRegion))
                .credentialsProvider(DefaultCredentialsProvider.builder().build());

        // Configure custom endpoint if provided (for LocalStack)
        if (sqsEndpoint != null && !sqsEndpoint.isEmpty()) {
            builder.endpointOverride(URI.create(sqsEndpoint));
        }

        return builder.build();
    }

    /**
     * Gets the order queue URL.
     *
     * @return order queue URL
     */
    public String getOrderQueueUrl() {
        return orderQueueUrl;
    }

    /**
     * Gets the payment queue URL.
     *
     * @return payment queue URL
     */
    public String getPaymentQueueUrl() {
        return paymentQueueUrl;
    }

    /**
     * Gets the notification queue URL.
     *
     * @return notification queue URL
     */
    public String getNotificationQueueUrl() {
        return notificationQueueUrl;
    }
}

