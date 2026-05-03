package com.nexus.identityservice.mapper;

import com.nexus.identityservice.dto.auth.UserResponse;
import com.nexus.identityservice.model.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface UserMapper {

    @Mapping(source = "userNickname", target = "username")
    UserResponse toResponse(User user);
}