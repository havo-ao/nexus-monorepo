package com.nexus.identityservice.service;

import com.nexus.identityservice.dto.admin.AdminCreateRequest;
import com.nexus.identityservice.dto.admin.AdminResponse;
import com.nexus.identityservice.dto.auth.AuthResponse;
import com.nexus.identityservice.dto.auth.LoginRequest;
import com.nexus.identityservice.dto.trader.TraderCreateRequest;
import com.nexus.identityservice.dto.trader.TraderResponse;
import com.nexus.identityservice.exception.UserBannedException;
import com.nexus.identityservice.mapper.UserMapper;
import com.nexus.identityservice.model.User;
import com.nexus.identityservice.security.JwtService;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserLookupService userLookupService;
    private final UserMapper userMap;
    private final TraderService traderService;
    private final AdminService adminService;
    private final NotificationServiceClient notificationServiceClient;

    @Transactional
    public TraderResponse registerTrader(TraderCreateRequest request) {
        return traderService.create(request);
    }
    @Transactional
    public AdminResponse registerAdmin(AdminCreateRequest request) {
        return adminService.create(request);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        // 1. Audit log: Attempting login for user
        // TODO: AuditLogService.log("Login attempt for email: " + request.getEmail());

        // 2. Find user first to check if they are banned
        User user = userLookupService.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        // 3. Check if user is currently banned
        if (user.getBanUntil() != null && user.getBanUntil().isAfter(Instant.now())) {
            // Audit log: Login blocked due to active ban
            // TODO: AuditLogService.log("Login blocked for email: " + request.getEmail() + " until " + user.getBanUntil());
            throw new UserBannedException("You cannot log in for ten minutes.");
        }

        try {
            // 4. Authenticate user using Spring Security
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);

            // 5. Audit log: Login successful
            // TODO: AuditLogService.log("Login successful for email: " + request.getEmail());
            notificationServiceClient.sendLoginSuccess(user);

            // 6. Update lastLogin and reset failed attempts
            userLookupService.updateLastLoginById(user.getId(), user.getUserRol().name());

            // 7. Generate tokens
            String accessToken = jwtService.generateAccessToken(user);
            String refreshToken = jwtService.generateRefreshToken(user);

            // 8. Build response
            return AuthResponse.builder()
                    .accessToken(accessToken)
                    .refreshToken(refreshToken)
                    .tokenType("Bearer")
                    .expiresIn(jwtService.getExpirationTime())
                    .user(userMap.toResponse(user))
                    .build();

        } catch (BadCredentialsException e) {
            // 9. Audit log: Login failed
            // TODO: AuditLogService.log("Login failed for email: " + request.getEmail());

            // 10. Handle failed attempt logic
            userLookupService.handleFailedLogin(user);
            throw e;
        }
    }

}
