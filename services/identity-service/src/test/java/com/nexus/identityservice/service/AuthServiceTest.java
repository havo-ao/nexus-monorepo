package com.nexus.identityservice.service;

import com.nexus.identityservice.dto.auth.AuthResponse;
import com.nexus.identityservice.dto.auth.LoginRequest;
import com.nexus.identityservice.dto.auth.UserResponse;
import com.nexus.identityservice.exception.UserBannedException;
import com.nexus.identityservice.mapper.UserMapper;
import com.nexus.identityservice.model.Genre;
import com.nexus.identityservice.model.Trader;
import com.nexus.identityservice.model.UserRol;
import com.nexus.identityservice.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private AuthenticationManager authenticationManager;
    @Mock
    private JwtService jwtService;
    @Mock
    private UserLookupService userLookupService;
    @Mock
    private UserMapper userMapper;
    @Mock
    private TraderService traderService;
    @Mock
    private AdminService adminService;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(
                authenticationManager,
                jwtService,
                userLookupService,
                userMapper,
                traderService,
                adminService
        );
    }

    @Test
    void loginGeneratesTokensAndResetsLoginState() {
        Trader trader = trader();
        LoginRequest request = loginRequest();
        UserResponse userResponse = UserResponse.builder()
                .id(trader.getId())
                .email(trader.getEmail())
                .username("andy")
                .userRol(UserRol.TRADER)
                .build();

        when(userLookupService.findByEmail(request.getEmail())).thenReturn(Optional.of(trader));
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(new TestingAuthenticationToken(request.getEmail(), request.getPassword()));
        when(jwtService.generateAccessToken(trader)).thenReturn("access-token");
        when(jwtService.generateRefreshToken(trader)).thenReturn("refresh-token");
        when(jwtService.getExpirationTime()).thenReturn(86_400_000L);
        when(userMapper.toResponse(trader)).thenReturn(userResponse);

        AuthResponse response = authService.login(request);

        assertThat(response.getAccessToken()).isEqualTo("access-token");
        assertThat(response.getRefreshToken()).isEqualTo("refresh-token");
        assertThat(response.getTokenType()).isEqualTo("Bearer");
        assertThat(response.getUser()).isEqualTo(userResponse);
        verify(userLookupService).updateLastLoginById(trader.getId(), "TRADER");
    }

    @Test
    void loginTracksFailedAttemptWhenCredentialsAreInvalid() {
        Trader trader = trader();
        LoginRequest request = loginRequest();
        when(userLookupService.findByEmail(request.getEmail())).thenReturn(Optional.of(trader));
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(BadCredentialsException.class);

        verify(userLookupService).handleFailedLogin(trader);
        verify(jwtService, never()).generateAccessToken(any());
    }

    @Test
    void loginRejectsBannedUsersBeforeAuthenticating() {
        Trader trader = trader();
        trader.setBanUntil(Instant.now().plusSeconds(120));
        LoginRequest request = loginRequest();
        when(userLookupService.findByEmail(request.getEmail())).thenReturn(Optional.of(trader));

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(UserBannedException.class);

        verify(authenticationManager, never()).authenticate(any());
        verify(userLookupService, never()).handleFailedLogin(any());
    }

    private LoginRequest loginRequest() {
        LoginRequest request = new LoginRequest();
        request.setEmail("andy@nexus.local");
        request.setPassword("Andy123@");
        return request;
    }

    private Trader trader() {
        Trader trader = new Trader();
        trader.setId(7L);
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
