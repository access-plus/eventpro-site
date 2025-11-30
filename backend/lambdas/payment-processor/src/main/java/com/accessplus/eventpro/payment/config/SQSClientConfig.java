package com.accessplus.eventpro.payment.config;

import jakarta.enterprise.inject.Produces;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;
import software.amazon.awssdk.services.sqs.SqsClient;
import software.amazon.awssdk.services.sqs.SqsClientBuilder;

/**
 * Configuration for AWS SQS Client.
 * Supports LocalStack endpoint via AWS_ENDPOINT_URL environment variable.
 */
public class SQSClientConfig {

    private static final Logger LOG = Logger.getLogger(SQSClientConfig.class);

    @ConfigProperty(name = "AWS_ENDPOINT_URL", defaultValue = "")
    String awsEndpointUrl;

    @Produces
    public SqsClient sqsClient() {
        SqsClientBuilder builder = SqsClient.builder();
        
        // Support LocalStack endpoint for local development
        if (awsEndpointUrl != null && !awsEndpointUrl.isEmpty()) {
            builder.endpointOverride(java.net.URI.create(awsEndpointUrl));
            LOG.infof("SQS Client configured with endpoint: %s", awsEndpointUrl);
        }
        
        return builder.build();
    }
}

