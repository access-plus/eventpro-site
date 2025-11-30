package com.accessplus.eventpro.notification.config;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Produces;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import software.amazon.awssdk.services.ses.SesClient;

/**
 * Configuration for AWS SES Client.
 */
@ApplicationScoped
public class SESConfig {

    @ConfigProperty(name = "ses.sender.email", defaultValue = "noreply@eventpro.com")
    String senderEmail;

    @Produces
    public SesClient sesClient() {
        return SesClient.builder().build();
    }

    public String getSenderEmail() {
        return senderEmail;
    }
}

