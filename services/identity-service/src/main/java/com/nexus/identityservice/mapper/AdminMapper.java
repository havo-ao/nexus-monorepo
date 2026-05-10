package com.nexus.identityservice.mapper;

import com.nexus.identityservice.dto.admin.AdminCreateRequest;
import com.nexus.identityservice.dto.admin.AdminResponse;
import com.nexus.identityservice.dto.admin.AdminUpdateRequest;
import com.nexus.identityservice.model.Admin;
import org.mapstruct.*;

@Mapper(componentModel = "spring", uses = UserMapper.class)
public interface AdminMapper {

    // For creation (all fields come complete)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "password", ignore = true)
    @Mapping(target = "userRol", ignore = true)
    @Mapping(target = "createdAt", expression = "java(java.time.Instant.now())")
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "lastLogin", ignore = true)
    @Mapping(target = "failedLoginAttempts", constant = "0")
    @Mapping(target = "lastFailedLogin", ignore = true)
    @Mapping(target = "banUntil", ignore = true)
    Admin toEntity(AdminCreateRequest request);

    // For PARTIAL update - IGNORE NULLS
    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "email", ignore = true)
    @Mapping(target = "username", ignore = true)
    @Mapping(target = "password", ignore = true)
    @Mapping(target = "userRol", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", expression = "java(java.time.Instant.now())")
    @Mapping(target = "lastLogin", ignore = true)
    @Mapping(target = "failedLoginAttempts", ignore = true)
    @Mapping(target = "lastFailedLogin", ignore = true)
    @Mapping(target = "banUntil", ignore = true)
    //Ignore UserDetails fields
    @Mapping(target = "authorities", ignore = true)
    @Mapping(target = "accountNonExpired", ignore = true)
    @Mapping(target = "accountNonLocked", ignore = true)
    @Mapping(target = "credentialsNonExpired", ignore = true)
    @Mapping(target = "enabled", ignore = true)
    void updateEntity(@MappingTarget Admin admin, AdminUpdateRequest request);

    @Mapping(source = "userNickname", target = "username")
    AdminResponse toResponse(Admin admin);


}
