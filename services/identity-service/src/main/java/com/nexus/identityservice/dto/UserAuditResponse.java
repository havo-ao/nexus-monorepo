package com.nexus.identityservice.dto;

import com.nexus.identityservice.model.Genre;
import com.nexus.identityservice.model.UserRol;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.time.Instant;

@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class UserAuditResponse {
    private Long id;
    private String name;
    private String surname;
    private Genre genre;
    private String email;
    private String username;
    private String password;
    private UserRol userRol;
    private Instant createdAt;
    private Instant updatedAt;
    private Instant lastLogin;
    private Integer failedLoginAttempts = 0;
    private Instant lastFailedLogin;
    private Instant banUntil;
}
