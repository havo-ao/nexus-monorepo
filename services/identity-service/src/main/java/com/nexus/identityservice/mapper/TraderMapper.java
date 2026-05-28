package com.nexus.identityservice.mapper;

import com.nexus.identityservice.dto.trader.*;
import com.nexus.identityservice.model.Trader;
import com.nexus.identityservice.model.TraderSubscription;
import org.mapstruct.*;

@Mapper(componentModel = "spring", uses = UserMapper.class)
public interface TraderMapper {

    // For creation (all fields come complete)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "password", ignore = true)
    @Mapping(target = "userRol", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "createdAt", expression = "java(java.time.Instant.now())")
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "lastLogin", ignore = true)
    @Mapping(target = "emailVerified", constant = "false")
    @Mapping(target = "phoneVerified", constant = "false")
    @Mapping(target = "failedLoginAttempts", constant = "0")
    @Mapping(target = "lastFailedLogin", ignore = true)
    @Mapping(target = "banUntil", ignore = true)
    @Mapping(target = "subscriptions", ignore = true)
    @Mapping(target = "activePremiumPlan", ignore = true)
    Trader toEntity(TraderCreateRequest request);

    // For PARTIAL update - IGNORE NULLS
    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "email", ignore = true)
    @Mapping(target = "username", ignore = true)
    @Mapping(target = "password", ignore = true)
    @Mapping(target = "userRol", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", expression = "java(java.time.Instant.now())")
    @Mapping(target = "lastLogin", ignore = true)
    @Mapping(target = "emailVerified", ignore = true)
    @Mapping(target = "phoneVerified", ignore = true)
    @Mapping(target = "failedLoginAttempts",ignore = true)
    @Mapping(target = "lastFailedLogin", ignore = true)
    @Mapping(target = "banUntil", ignore = true)
    //Ignore UserDetails fields
    @Mapping(target = "authorities", ignore = true)
    @Mapping(target = "accountNonExpired", ignore = true)
    @Mapping(target = "accountNonLocked", ignore = true)
    @Mapping(target = "credentialsNonExpired", ignore = true)
    @Mapping(target = "enabled", ignore = true)
    @Mapping(target = "subscriptions", ignore = true)
    @Mapping(target = "activePremiumPlan", ignore = true)
    void updateEntity(@MappingTarget Trader trader, TraderUpdateRequest request);


    @Mapping(source = "userNickname", target = "username")
    @Mapping(target = "activePremiumPlan", source = "activePremiumPlan")
    TraderResponse toResponse(Trader trader);

    @Mapping(source = "userNickname", target = "username")
    @Mapping(target = "activePremiumPlan", source = "activePremiumPlan")
    TraderAuditResponse toAuditResponse(Trader trader);

    @Mapping(source = "plan.name", target = "planName")
    TraderSubscriptionResponse toSubscriptionResponse(TraderSubscription subscription);

}