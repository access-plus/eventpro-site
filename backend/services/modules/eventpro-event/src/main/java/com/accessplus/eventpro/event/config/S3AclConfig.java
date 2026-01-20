package com.accessplus.eventpro.event.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

@Configuration
public class S3AclConfig {

    @Configuration
    @Profile("local")
    static class LocalStackAclConfig {
        @Bean
        public S3AclProperties s3AclProperties() {
            return new S3AclProperties(false);
        }
    }

    @Configuration
    @Profile("!local")
    static class AwsAclConfig {
        @Bean
        public S3AclProperties s3AclProperties() {
            return new S3AclProperties(true);
        }
    }

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
