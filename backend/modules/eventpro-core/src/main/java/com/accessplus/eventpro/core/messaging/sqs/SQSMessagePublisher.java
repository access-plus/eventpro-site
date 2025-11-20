package com.accessplus.eventpro.core.messaging.sqs;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import software.amazon.awssdk.services.sqs.SqsClient;
import software.amazon.awssdk.services.sqs.model.SendMessageRequest;

@Slf4j
@RequiredArgsConstructor
public class SQSMessagePublisher {
    private final SqsClient sqsClient;
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    public void publish(String queueUrl, Object message) {
        try {
            String messageBody = objectMapper.writeValueAsString(message);
            
            SendMessageRequest request = SendMessageRequest.builder()
                .queueUrl(queueUrl)
                .messageBody(messageBody)
                .build();
            
            sqsClient.sendMessage(request);
            log.info("Message published to queue: {}", queueUrl);
        } catch (Exception e) {
            log.error("Error publishing message to queue: {}", queueUrl, e);
            throw new RuntimeException("Failed to publish message", e);
        }
    }
}

