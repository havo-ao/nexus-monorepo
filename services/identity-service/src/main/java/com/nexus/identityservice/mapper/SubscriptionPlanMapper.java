package com.nexus.identityservice.mapper;

import com.nexus.identityservice.dto.admin.SubscriptionPlanRequest;
import com.nexus.identityservice.dto.admin.SubscriptionPlanResponse;
import com.nexus.identityservice.model.SubscriptionPlan;
import org.mapstruct.*;

@Mapper(componentModel = "spring")
public interface SubscriptionPlanMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", expression = "java(java.time.Instant.now())")
    @Mapping(target = "updatedAt", ignore = true)
    SubscriptionPlan toEntity(SubscriptionPlanRequest request);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", expression = "java(java.time.Instant.now())")
    void updateEntity(@MappingTarget SubscriptionPlan subscriptionPlan, SubscriptionPlanRequest request);

    SubscriptionPlanResponse toResponse(SubscriptionPlan subscriptionPlan);
}
