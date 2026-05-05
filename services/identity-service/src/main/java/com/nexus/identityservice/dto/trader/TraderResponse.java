package com.nexus.identityservice.dto.trader;

import com.nexus.identityservice.dto.auth.UserResponse;
import com.nexus.identityservice.model.TraderExperience;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Data
@SuperBuilder
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class TraderResponse extends UserResponse {
    private String phone;
    private String address;
    private String nationalityCode;
    private String timeZone;
    private TraderExperience experience;
}