package com.nexus.identityservice.dto.admin;

import com.nexus.identityservice.dto.auth.UserResponse;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Data
@SuperBuilder
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class AdminResponse extends UserResponse {
    private String department;
    private String position;
}
