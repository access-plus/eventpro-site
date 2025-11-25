package com.accessplus.eventpro.core.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.secretsmanager.SecretsManagerClient;
import software.amazon.awssdk.services.secretsmanager.model.GetSecretValueRequest;
import software.amazon.awssdk.services.secretsmanager.model.GetSecretValueResponse;
import software.amazon.awssdk.services.secretsmanager.model.SecretsManagerException;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Service for retrieving secrets from AWS Secrets Manager.
 * 
 * This service caches secrets in memory to avoid repeated API calls.
 * Secrets are retrieved on-demand and cached for the lifetime of the application.
 * 
 * This service is only active when USE_SECRETS_MANAGER=true is set.
 * In local development, secrets are provided via environment variables.
 */
@Service
@ConditionalOnProperty(
    name = "USE_SECRETS_MANAGER",
    havingValue = "true",
    matchIfMissing = false
)
public class SecretsManagerService {

    private static final Logger log = LoggerFactory.getLogger(SecretsManagerService.class);

    private final SecretsManagerClient secretsManagerClient;
    private final ObjectMapper objectMapper;
    private final Map<String, Map<String, String>> secretCache = new ConcurrentHashMap<>();

    public SecretsManagerService(SecretsManagerClient secretsManagerClient, ObjectMapper objectMapper) {
        this.secretsManagerClient = secretsManagerClient;
        this.objectMapper = objectMapper;
    }

    /**
     * Retrieves a secret value from AWS Secrets Manager.
     * 
     * @param secretArn The ARN of the secret
     * @param key The key within the JSON secret (if null, returns the entire secret as a string)
     * @return The secret value, or null if not found
     */
    public String getSecretValue(String secretArn, String key) {
        if (secretArn == null || secretArn.isEmpty()) {
            log.warn("Secret ARN is null or empty");
            return null;
        }

        try {
            // Check cache first
            Map<String, String> cachedSecret = secretCache.get(secretArn);
            if (cachedSecret != null && cachedSecret.containsKey(key)) {
                log.debug("Retrieved secret from cache: secretArn={}, key={}", secretArn, key);
                return cachedSecret.get(key);
            }

            // Retrieve secret from AWS Secrets Manager
            GetSecretValueRequest request = GetSecretValueRequest.builder()
                    .secretId(secretArn)
                    .build();

            GetSecretValueResponse response = secretsManagerClient.getSecretValue(request);
            String secretString = response.secretString();

            // Parse JSON secret and cache it
            Map<String, String> secretMap = parseSecretJson(secretString);
            secretCache.put(secretArn, secretMap);

            String value = secretMap.get(key);
            if (value != null) {
                log.debug("Retrieved secret from AWS Secrets Manager: secretArn={}, key={}", secretArn, key);
            } else {
                log.warn("Secret key not found: secretArn={}, key={}", secretArn, key);
            }

            return value;

        } catch (SecretsManagerException e) {
            log.error("Error retrieving secret from AWS Secrets Manager: secretArn={}, key={}, error={}", 
                    secretArn, key, e.getMessage(), e);
            return null;
        } catch (Exception e) {
            log.error("Unexpected error retrieving secret: secretArn={}, key={}, error={}", 
                    secretArn, key, e.getMessage(), e);
            return null;
        }
    }

    /**
     * Retrieves the entire secret as a JSON string.
     * 
     * @param secretArn The ARN of the secret
     * @return The secret JSON string, or null if not found
     */
    public String getSecretString(String secretArn) {
        if (secretArn == null || secretArn.isEmpty()) {
            log.warn("Secret ARN is null or empty");
            return null;
        }

        try {
            GetSecretValueRequest request = GetSecretValueRequest.builder()
                    .secretId(secretArn)
                    .build();

            GetSecretValueResponse response = secretsManagerClient.getSecretValue(request);
            return response.secretString();

        } catch (SecretsManagerException e) {
            log.error("Error retrieving secret string from AWS Secrets Manager: secretArn={}, error={}", 
                    secretArn, e.getMessage(), e);
            return null;
        } catch (Exception e) {
            log.error("Unexpected error retrieving secret string: secretArn={}, error={}", 
                    secretArn, e.getMessage(), e);
            return null;
        }
    }

    /**
     * Parses a JSON secret string into a map of key-value pairs.
     * 
     * @param secretString The JSON secret string
     * @return Map of key-value pairs from the JSON secret
     */
    private Map<String, String> parseSecretJson(String secretString) {
        Map<String, String> secretMap = new HashMap<>();

        try {
            JsonNode jsonNode = objectMapper.readTree(secretString);
            jsonNode.fieldNames().forEachRemaining(key -> {
                JsonNode valueNode = jsonNode.get(key);
                if (valueNode != null && valueNode.isTextual()) {
                    secretMap.put(key, valueNode.asText());
                } else if (valueNode != null) {
                    secretMap.put(key, valueNode.toString());
                }
            });
        } catch (Exception e) {
            log.warn("Secret is not valid JSON, treating as plain string: {}", e.getMessage());
            // If not JSON, treat the entire string as a single value with key "value"
            secretMap.put("value", secretString);
        }

        return secretMap;
    }

    /**
     * Clears the secret cache. Useful for testing or when secrets are rotated.
     */
    public void clearCache() {
        secretCache.clear();
        log.info("Secret cache cleared");
    }
}

