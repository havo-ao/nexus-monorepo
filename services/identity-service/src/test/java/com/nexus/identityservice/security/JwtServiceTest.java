package com.nexus.identityservice.security;

import com.nexus.identityservice.model.Genre;
import com.nexus.identityservice.model.Trader;
import com.nexus.identityservice.model.UserRol;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class JwtServiceTest {

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        JwtProperties properties = new JwtProperties();
        properties.setSecret("local-test-jwt-secret-with-at-least-32-bytes");
        properties.setExpiration(60_000);
        properties.setRefreshExpiration(120_000);
        properties.setIssuer("identity-service-test");
        jwtService = new JwtService(properties);
    }

    @Test
    void generateAccessTokenIncludesUserClaims() {
        Trader trader = trader();

        String token = jwtService.generateAccessToken(trader);

        assertThat(jwtService.extractUsername(token)).isEqualTo(trader.getEmail());
        assertThat(jwtService.extractRole(token)).isEqualTo("TRADER");
        assertThat(jwtService.extractTokenType(token)).isEqualTo("access");
        assertThat(jwtService.isAccessToken(token)).isTrue();
        assertThat(jwtService.isTokenValid(token)).isTrue();
    }

    @Test
    void generateRefreshTokenUsesRefreshTokenType() {
        String token = jwtService.generateRefreshToken(trader());

        assertThat(jwtService.extractTokenType(token)).isEqualTo("refresh");
        assertThat(jwtService.isRefreshToken(token)).isTrue();
    }

    private Trader trader() {
        Trader trader = new Trader();
        trader.setId(12L);
        trader.setName("Andy");
        trader.setSurname("Canon");
        trader.setGenre(Genre.MALE);
        trader.setEmail("andy@nexus.local");
        trader.setUsername("andy");
        trader.setPassword("encoded-password");
        trader.setUserRol(UserRol.TRADER);
        trader.setFailedLoginAttempts(0);
        return trader;
    }
}
