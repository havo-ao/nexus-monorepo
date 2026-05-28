package com.nexus.identityservice.dto.trader;


import com.nexus.identityservice.dto.UserAuditResponse;
import com.nexus.identityservice.model.TraderExperience;
import com.nexus.identityservice.model.UserStatus;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Data
@SuperBuilder
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class TraderAuditResponse extends UserAuditResponse{
    private String phone;
    private String address;
    private String nationalityCode;
    //data input example: Europe/Istanbul; it's easy to convert to ZoneId and use Instant to timestamps;
    private String timeZone;
    private TraderExperience experience;
    private UserStatus status;
    private boolean emailVerified;
    private boolean phoneVerified;
    private boolean activePremiumPlan;
}
