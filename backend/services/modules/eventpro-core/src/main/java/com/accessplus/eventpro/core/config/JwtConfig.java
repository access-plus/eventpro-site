package com.accessplus.eventpro.core.config;

import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.proc.SecurityContext;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;

import java.security.KeyFactory;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;

@Slf4j
@Configuration
public class JwtConfig {

    private final JwtProperties jwtProperties;

    public JwtConfig(JwtProperties jwtProperties) {
        this.jwtProperties = jwtProperties;
    }

    @Bean
    public JwtDecoder jwtDecoder() {
        RSAPublicKey publicKey = parsePublicKey(jwtProperties.getPublicKey());
        return NimbusJwtDecoder.withPublicKey(publicKey).build();
    }

    @Bean
    public JwtEncoder jwtEncoder() {
        RSAPublicKey publicKey = parsePublicKey(jwtProperties.getPublicKey());
        RSAPrivateKey privateKey = parsePrivateKey(jwtProperties.getPrivateKey());
        RSAKey rsaKey = new RSAKey.Builder(publicKey)
                .privateKey(privateKey)
                .keyID("eventpro-jwt")
                .build();
        JWKSource<SecurityContext> jwkSource = new ImmutableJWKSet<>(new JWKSet(rsaKey));
        return new NimbusJwtEncoder(jwkSource);
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    private RSAPublicKey parsePublicKey(String key) {
        try {
            String sanitized = sanitizeKey(key);
            byte[] decoded = Base64.getDecoder().decode(sanitized);
            X509EncodedKeySpec keySpec = new X509EncodedKeySpec(decoded);
            return (RSAPublicKey) KeyFactory.getInstance("RSA").generatePublic(keySpec);
        } catch (Exception e) {
            log.error("Failed to parse JWT public key", e);
            throw new IllegalStateException("JWT_PUBLIC_KEY is invalid or missing", e);
        }
    }

    private RSAPrivateKey parsePrivateKey(String key) {
        try {
            String sanitized = sanitizeKey(key);
            byte[] decoded = Base64.getDecoder().decode(sanitized);
            PKCS8EncodedKeySpec keySpec = new PKCS8EncodedKeySpec(decoded);
            return (RSAPrivateKey) KeyFactory.getInstance("RSA").generatePrivate(keySpec);
        } catch (Exception e) {
            log.error("Failed to parse JWT private key", e);
            throw new IllegalStateException("JWT_PRIVATE_KEY is invalid or missing", e);
        }
    }

    private String sanitizeKey(String key) {
        if (key == null || key.trim().isEmpty()) {
            throw new IllegalStateException("JWT keys must be configured");
        }
        return key
                .replace("-----BEGIN PUBLIC KEY-----", "")
                .replace("-----END PUBLIC KEY-----", "")
                .replace("-----BEGIN PRIVATE KEY-----", "")
                .replace("-----END PRIVATE KEY-----", "")
                .replace("-----BEGIN RSA PRIVATE KEY-----", "")
                .replace("-----END RSA PRIVATE KEY-----", "")
                .replaceAll("\\s+", "");
    }
}
