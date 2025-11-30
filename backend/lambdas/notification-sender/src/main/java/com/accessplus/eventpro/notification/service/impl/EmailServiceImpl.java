package com.accessplus.eventpro.notification.service.impl;

import com.accessplus.eventpro.notification.config.SESConfig;
import com.accessplus.eventpro.notification.service.EmailService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.jboss.logging.Logger;
import software.amazon.awssdk.services.ses.SesClient;
import software.amazon.awssdk.services.ses.model.*;

/**
 * Implementation of EmailService using AWS SES.
 */
@ApplicationScoped
public class EmailServiceImpl implements EmailService {

    private static final Logger LOG = Logger.getLogger(EmailServiceImpl.class);

    @Inject
    SesClient sesClient;

    @Inject
    SESConfig sesConfig;

    @Override
    public void sendEmail(String to, String subject, String htmlBody, String textBody) {
        LOG.debugf("Sending email to: %s, subject: %s", to, subject);

        try {
            SendEmailRequest sendEmailRequest = SendEmailRequest.builder()
                    .destination(Destination.builder().toAddresses(to).build())
                    .message(Message.builder()
                            .subject(Content.builder().data(subject).build())
                            .body(Body.builder()
                                    .html(Content.builder().data(htmlBody).build())
                                    .text(Content.builder().data(textBody).build())
                                    .build())
                            .build())
                    .source(sesConfig.getSenderEmail())
                    .build();

            sesClient.sendEmail(sendEmailRequest);
            LOG.infof("Email sent successfully to: %s", to);
        } catch (SesException e) {
            LOG.errorf(e, "Failed to send email to %s: %s", to, e.getMessage());
            throw new RuntimeException("Failed to send email: " + e.getMessage(), e);
        }
    }
}

