package com.nexus.identityservice.security;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Class to configure the JWT properties calling them from the application.yml
 */
@Data
@Component
@ConfigurationProperties(prefix = "jwt")
public class JwtProperties {
    /**
     * secret key to sign the JWT tokens. shall be defined in the application.yml
     */
    private String secret;
    /**
     * time to live in milliseconds for the generated token. shall be defined in the application.yml
     */
    private long expiration; // 24 hours
    /**
     * time to live in milliseconds for the generated refresh token.
     */
    private long refreshExpiration;
    /**
     * secret key to sign the JWT tokens. shall be defined in the application.yml
     */
    private String issuer;

}
