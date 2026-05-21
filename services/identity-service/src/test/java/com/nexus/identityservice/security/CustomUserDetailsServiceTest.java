package com.nexus.identityservice.security;

import com.nexus.identityservice.model.Admin;
import com.nexus.identityservice.model.Genre;
import com.nexus.identityservice.model.UserRol;
import com.nexus.identityservice.service.UserLookupService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CustomUserDetailsServiceTest {

    @Mock
    private UserLookupService userLookupService;

    private CustomUserDetailsService customUserDetailsService;

    @BeforeEach
    void setUp() {
        customUserDetailsService = new CustomUserDetailsService(userLookupService);
    }

    @Test
    void loadUserByUsernameReturnsMatchingUser() {
        Admin admin = admin();
        when(userLookupService.findByEmail("admin@nexus.local")).thenReturn(Optional.of(admin));

        assertThat(customUserDetailsService.loadUserByUsername("admin@nexus.local"))
                .isEqualTo(admin);
    }

    @Test
    void loadUserByUsernameRejectsUnknownEmail() {
        when(userLookupService.findByEmail("missing@nexus.local")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> customUserDetailsService.loadUserByUsername("missing@nexus.local"))
                .isInstanceOf(UsernameNotFoundException.class)
                .hasMessage("User not found");
    }

    private Admin admin() {
        Admin admin = new Admin();
        admin.setId(3L);
        admin.setName("Admin");
        admin.setSurname("Nexus");
        admin.setGenre(Genre.MALE);
        admin.setEmail("admin@nexus.local");
        admin.setUsername("admin");
        admin.setPassword("encoded-password");
        admin.setUserRol(UserRol.ADMIN);
        admin.setFailedLoginAttempts(0);
        return admin;
    }
}
