package com.accessplus.eventpro.event.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

@Configuration
public class S3AclConfig {

    @Bean
    @Profile("local")
    public S3AclProperties s3AclPropertiesLocal() {
        // Use ACL so uploads set PUBLIC_READ; proxy and direct URLs can then read the object
        return new S3AclProperties(true);
    }

    @Bean
    @Profile("!local")
    public S3AclProperties s3AclPropertiesAws() {
        return new S3AclProperties(true);
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
