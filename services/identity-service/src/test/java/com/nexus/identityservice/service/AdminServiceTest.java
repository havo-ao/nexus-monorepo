package com.nexus.identityservice.service;

import com.nexus.identityservice.dto.admin.AdminCreateRequest;
import com.nexus.identityservice.dto.admin.AdminResponse;
import com.nexus.identityservice.exception.DuplicateResourceException;
import com.nexus.identityservice.mapper.AdminMapper;
import com.nexus.identityservice.model.Admin;
import com.nexus.identityservice.model.Genre;
import com.nexus.identityservice.model.UserRol;
import com.nexus.identityservice.repository.AdminRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminServiceTest {

    @Mock
    private AdminRepository adminRepository;
    @Mock
    private AdminMapper adminMapper;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private UserLookupService userLookupService;

    private AdminService adminService;

    @BeforeEach
    void setUp() {
        adminService = new AdminService(
                adminRepository,
                adminMapper,
                passwordEncoder,
                userLookupService
        );
    }

    @Test
    void createAssignsAdminRoleAndEncodedPassword() {
        AdminCreateRequest request = request();
        Admin admin = new Admin();
        AdminResponse response = AdminResponse.builder()
                .id(1L)
                .email(request.getEmail())
                .username(request.getUsername())
                .userRol(UserRol.ADMIN)
                .build();

        when(userLookupService.existsByEmail(request.getEmail())).thenReturn(false);
        when(userLookupService.existsByUsername(request.getUsername())).thenReturn(false);
        when(adminMapper.toEntity(request)).thenReturn(admin);
        when(passwordEncoder.encode(request.getPassword())).thenReturn("encoded-password");
        when(adminRepository.save(admin)).thenReturn(admin);
        when(adminMapper.toResponse(admin)).thenReturn(response);

        AdminResponse result = adminService.create(request);

        assertThat(result).isEqualTo(response);
        assertThat(admin.getPassword()).isEqualTo("encoded-password");
        assertThat(admin.getUserRol()).isEqualTo(UserRol.ADMIN);
        assertThat(admin.getCreatedAt()).isNotNull();
    }

    @Test
    void createRejectsDuplicateUsernameBeforePersisting() {
        AdminCreateRequest request = request();
        when(userLookupService.existsByEmail(request.getEmail())).thenReturn(false);
        when(userLookupService.existsByUsername(request.getUsername())).thenReturn(true);

        assertThatThrownBy(() -> adminService.create(request))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessage("Username is not available");

        verify(adminRepository, never()).save(any());
    }

    private AdminCreateRequest request() {
        return AdminCreateRequest.builder()
                .name("Admin")
                .surname("Nexus")
                .genre(Genre.MALE)
                .email("admin@nexus.local")
                .username("admin")
                .password("Admin123@")
                .department("Operations")
                .position("Lead")
                .build();
    }
}
