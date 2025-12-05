package com.accessplus.eventpro.notification.config;

import com.accessplus.eventpro.shared.util.DatabaseSecretParser;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;
import software.amazon.awssdk.services.secretsmanager.SecretsManagerClient;
import software.amazon.awssdk.services.secretsmanager.model.GetSecretValueRequest;
import software.amazon.awssdk.services.secretsmanager.model.SecretsManagerException;

/**
 * Configuration for database credentials.
 * Fetches credentials from RDS-managed Secrets Manager secret or uses environment variables for local development.
 */
@ApplicationScoped
public class DatabaseSecretsConfig {

    private static final Logger LOG = Logger.getLogger(DatabaseSecretsConfig.class);

    @ConfigProperty(name = "DB_SECRET_ARN", defaultValue = "")
    String dbSecretArn;

    @ConfigProperty(name = "DB_USERNAME", defaultValue = "")
    String dbUsername; // Fallback for local development

    @ConfigProperty(name = "DB_PASSWORD", defaultValue = "")
    String dbPassword; // Fallback for local development

    @Inject
    SecretsManagerClient secretsManagerClient;

    @Inject
    ObjectMapper objectMapper;

    @PostConstruct
    public void init() {
        // Construct JDBC URL from environment variables
        String dbHost = System.getenv("DB_HOST");
        String dbPort = System.getenv("DB_PORT");
        String dbName = System.getenv("DB_NAME");
        
        if (dbHost != null && dbPort != null && dbName != null) {
            String jdbcUrl = String.format("jdbc:postgresql://%s:%s/%s", dbHost, dbPort, dbName);
            System.setProperty("quarkus.datasource.jdbc.url", jdbcUrl);
            LOG.infof("JDBC URL constructed: %s", jdbcUrl.replace(dbHost, "***").replace(dbPort, "***"));
        }
        
        // If DB_SECRET_ARN is provided, fetch from Secrets Manager
        if (dbSecretArn != null && !dbSecretArn.isEmpty()) {
            try {
                LOG.infof("Loading database credentials from Secrets Manager: %s", dbSecretArn);
                GetSecretValueRequest request = GetSecretValueRequest.builder()
                        .secretId(dbSecretArn)
                        .build();

                String secretString = secretsManagerClient.getSecretValue(request).secretString();

                // Use shared utility to parse (no duplication)
                DatabaseSecretParser.DatabaseCredentials creds = DatabaseSecretParser.parseSecretJson(secretString);
                
                // Set system properties that Quarkus reads for datasource configuration
                System.setProperty("quarkus.datasource.username", creds.getUsername());
                System.setProperty("quarkus.datasource.password", creds.getPassword());
                
                LOG.info("Database credentials loaded from Secrets Manager");
            } catch (SecretsManagerException e) {
                LOG.errorf(e, "Failed to load database credentials from Secrets Manager: %s", dbSecretArn);
                throw new RuntimeException("Cannot initialize database credentials from Secrets Manager", e);
            } catch (Exception e) {
                LOG.errorf(e, "Failed to parse database secret JSON");
                throw new RuntimeException("Cannot parse database credentials from secret", e);
            }
        } else {
            // Local development fallback: use environment variables
            LOG.info("Using environment variables for database credentials (local development)");
            if (dbUsername != null && !dbUsername.isEmpty()) {
                System.setProperty("quarkus.datasource.username", dbUsername);
            }
            if (dbPassword != null && !dbPassword.isEmpty()) {
                System.setProperty("quarkus.datasource.password", dbPassword);
            }
        }
    }
}

