package com.accessplus.eventpro.event.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

/**
 * Configuration for S3 ACL usage based on profile.
 * LocalStack doesn't support ACLs, so we disable them for local profile.
 */
@Configuration
public class S3AclConfig {

    /**
     * ACL configuration for local profile (LocalStack).
     * ACLs are disabled because LocalStack doesn't fully support them.
     */
    @Configuration
    @Profile("local")
    static class LocalStackAclConfig {
        @Bean
        public S3AclProperties s3AclProperties() {
            return new S3AclProperties(false);
        }
    }

    /**
     * ACL configuration for non-local profiles (real AWS).
     * ACLs are enabled for proper access control.
     */
    @Configuration
    @Profile("!local")
    static class AwsAclConfig {
        @Bean
        public S3AclProperties s3AclProperties() {
            return new S3AclProperties(true);
        }
    }

    /**
     * Properties for S3 ACL configuration.
     */
    public static class S3AclProperties {
        private final boolean useAcl;

        public S3AclProperties(boolean useAcl) {
            this.useAcl = useAcl;
        }

        public boolean isUseAcl() {
            return useAcl;
        }
    }
}
