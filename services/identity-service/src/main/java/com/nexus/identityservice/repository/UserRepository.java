package com.nexus.identityservice.repository;

import com.nexus.identityservice.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.NoRepositoryBean;

import java.util.Optional;

@NoRepositoryBean
public interface UserRepository<T extends User> extends JpaRepository<T, Long> {
    Optional<T> findByUsername(String username);
    Optional<T> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByUsername(String username);
}
