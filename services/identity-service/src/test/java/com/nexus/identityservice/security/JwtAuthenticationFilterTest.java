package com.nexus.identityservice.security;

import jakarta.servlet.http.HttpServletRequest;
import io.jsonwebtoken.JwtException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.userdetails.UserDetailsService;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JwtAuthenticationFilterTest {

    @Mock
    private JwtService jwtService;

    @Mock
    private UserDetailsService userDetailsService;

    @Mock
    private HttpServletRequest request;

    @Test
    void shouldNotFilterPublicAuthEndpoints() {
        JwtAuthenticationFilter filter = new JwtAuthenticationFilter(jwtService, userDetailsService);

        when(request.getServletPath()).thenReturn("/api/auth/login");
        assertThat(filter.shouldNotFilter(request)).isTrue();

        when(request.getServletPath()).thenReturn("/api/auth/register/trader");
        assertThat(filter.shouldNotFilter(request)).isTrue();
    }

    @Test
    void shouldFilterAuthenticatedAuthEndpoints() {
        JwtAuthenticationFilter filter = new JwtAuthenticationFilter(jwtService, userDetailsService);

        when(request.getServletPath()).thenReturn("/api/auth/me");
        assertThat(filter.shouldNotFilter(request)).isFalse();

        when(request.getServletPath()).thenReturn("/api/auth/register/admin");
        assertThat(filter.shouldNotFilter(request)).isFalse();
    }

    @Test
    void rejectsInvalidJwtWithoutContinuingFilterChain() throws Exception {
        JwtAuthenticationFilter filter = new JwtAuthenticationFilter(jwtService, userDetailsService);
        MockHttpServletRequest protectedRequest = new MockHttpServletRequest("GET", "/api/traders/me");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain filterChain = new MockFilterChain();
        protectedRequest.addHeader("Authorization", "Bearer expired-token");
        when(jwtService.extractUsername("expired-token")).thenThrow(new JwtException("expired"));

        filter.doFilterInternal(protectedRequest, response, filterChain);

        assertThat(response.getStatus()).isEqualTo(401);
        verifyNoInteractions(userDetailsService);
    }
}
