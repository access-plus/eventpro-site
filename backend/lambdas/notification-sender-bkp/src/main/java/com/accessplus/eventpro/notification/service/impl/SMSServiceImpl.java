package com.accessplus.eventpro.notification.service.impl;

import com.accessplus.eventpro.notification.service.SMSService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.jboss.logging.Logger;
import software.amazon.awssdk.services.sns.SnsClient;
import software.amazon.awssdk.services.sns.model.PublishRequest;
import software.amazon.awssdk.services.sns.model.SnsException;

/**
 * Implementation of SMSService using AWS SNS.
 */
@ApplicationScoped
public class SMSServiceImpl implements SMSService {

    private static final Logger LOG = Logger.getLogger(SMSServiceImpl.class);

    @Inject
    SnsClient snsClient;

    @Override
    public void sendSMS(String phoneNumber, String message) {
        LOG.debugf("Sending SMS to: %s", phoneNumber);

        try {
            PublishRequest publishRequest = PublishRequest.builder()
                    .phoneNumber(phoneNumber)
                    .message(message)
                    .build();

            snsClient.publish(publishRequest);
            LOG.infof("SMS sent successfully to: %s", phoneNumber);
        } catch (SnsException e) {
            LOG.errorf(e, "Failed to send SMS to %s: %s", phoneNumber, e.getMessage());
            throw new RuntimeException("Failed to send SMS: " + e.getMessage(), e);
        }
    }
}

