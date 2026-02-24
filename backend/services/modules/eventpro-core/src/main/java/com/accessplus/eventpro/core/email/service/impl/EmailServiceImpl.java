package com.accessplus.eventpro.core.email.service.impl;

import com.accessplus.eventpro.core.email.service.EmailService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.ses.SesClient;
import software.amazon.awssdk.services.ses.model.*;

/**
 * Implementation of EmailService using AWS SES.
 */
@Slf4j
@Service
public class EmailServiceImpl implements EmailService {
    
    @Value("${aws.ses.region:us-east-1}")
    private String awsRegion;
    
    @Value("${aws.ses.fromEmail:noreply@eventpro.com}")
    private String fromEmail;
    
    private SesClient sesClient;
    
    private SesClient getSesClient() {
        if (sesClient == null) {
            sesClient = SesClient.builder()
                    .region(Region.of(awsRegion))
                    .credentialsProvider(DefaultCredentialsProvider.create())
                    .build();
        }
        return sesClient;
    }
    
    @Override
    public void sendPasswordResetConfirmation(String email, String code) throws Exception {
        log.info("Sending password reset confirmation email to: {}", email);
        
        try {
            String subject = "Password Reset Confirmation - EventPro";
            String bodyText = String.format(
                    "Your password has been successfully reset.\n\n" +
                    "Verification Code: %s\n\n" +
                    "If you did not request this password reset, please contact support immediately.\n\n" +
                    "Thank you,\n" +
                    "EventPro Team",
                    code
            );
            
            String bodyHtml = String.format(
                    "<html><body>" +
                    "<h2>Password Reset Confirmation</h2>" +
                    "<p>Your password has been successfully reset.</p>" +
                    "<p><strong>Verification Code:</strong> %s</p>" +
                    "<p>If you did not request this password reset, please contact support immediately.</p>" +
                    "<p>Thank you,<br>EventPro Team</p>" +
                    "</body></html>",
                    code
            );
            
            SendEmailRequest emailRequest = SendEmailRequest.builder()
                    .source(fromEmail)
                    .destination(Destination.builder()
                            .toAddresses(email)
                            .build())
                    .message(Message.builder()
                            .subject(Content.builder()
                                    .data(subject)
                                    .charset("UTF-8")
                                    .build())
                            .body(Body.builder()
                                    .text(Content.builder()
                                            .data(bodyText)
                                            .charset("UTF-8")
                                            .build())
                                    .html(Content.builder()
                                            .data(bodyHtml)
                                            .charset("UTF-8")
                                            .build())
                                    .build())
                            .build())
                    .build();
            
            SendEmailResponse response = getSesClient().sendEmail(emailRequest);
            log.info("Password reset confirmation email sent successfully. MessageId: {}", response.messageId());
            
        } catch (SesException e) {
            log.error("Failed to send password reset confirmation email: {}", e.getMessage(), e);
            throw new Exception("Failed to send email: " + e.getMessage(), e);
        }
    }
}

