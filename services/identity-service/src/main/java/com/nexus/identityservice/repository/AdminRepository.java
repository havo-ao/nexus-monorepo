package com.nexus.identityservice.repository;

import com.nexus.identityservice.model.Admin;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AdminRepository extends UserRepository<Admin> {
    Optional<Admin> findByNameAndSurname(String name, String surname);

}
