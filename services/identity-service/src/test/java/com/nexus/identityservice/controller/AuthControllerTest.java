package com.nexus.identityservice.controller;

import com.nexus.identityservice.dto.auth.UserResponse;
import com.nexus.identityservice.mapper.UserMapper;
import com.nexus.identityservice.model.User;
import com.nexus.identityservice.service.AuthService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock
    private AuthService authService;

    @Mock
    private UserMapper userMapper;

    @Mock
    private User user;

    @Mock
    private UserResponse userResponse;

    @InjectMocks
    private AuthController authController;

    @Test
    void getMeReturnsAuthenticatedUserProfile() {
        when(userMapper.toResponse(user)).thenReturn(userResponse);

        ResponseEntity<UserResponse> result = authController.getMe(user);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isSameAs(userResponse);
        verify(userMapper).toResponse(user);
        verifyNoInteractions(authService);
    }
}
