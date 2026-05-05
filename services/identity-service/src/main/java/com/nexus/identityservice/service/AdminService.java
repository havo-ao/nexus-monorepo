package com.nexus.identityservice.service;

import com.nexus.identityservice.dto.admin.AdminCreateRequest;
import com.nexus.identityservice.dto.admin.AdminResponse;
import com.nexus.identityservice.dto.admin.AdminUpdateRequest;
import com.nexus.identityservice.exception.DuplicateResourceException;
import com.nexus.identityservice.exception.NotFoundResourceException;
import com.nexus.identityservice.mapper.AdminMapper;
import com.nexus.identityservice.model.Admin;
import com.nexus.identityservice.model.UserRol;
import com.nexus.identityservice.repository.AdminRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminService {
    private final AdminRepository adminRepository;
    private final AdminMapper adminMapper;
    private final PasswordEncoder passwordEncoder;
    private final UserLookupService userLookupService;

    @Transactional
    public AdminResponse create(AdminCreateRequest request) {
        if (userLookupService.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email already registered");
        }
        if (userLookupService.existsByUsername(request.getUsername())) {
            throw new DuplicateResourceException("Username is not available");
        }

        Admin admin = adminMapper.toEntity(request);
        admin.setPassword(passwordEncoder.encode(request.getPassword()));
        admin.setUserRol(UserRol.ADMIN);
        admin.setCreatedAt(Instant.now());

        Admin saved = adminRepository.save(admin);
        return adminMapper.toResponse(saved);
    }

    @Transactional
    public AdminResponse update(Long id, AdminUpdateRequest request) {
        Admin existing = adminRepository.findById(id)
                .orElseThrow(() -> new NotFoundResourceException("Admin not found"));

        adminMapper.updateEntity(existing, request);
        existing.setUpdatedAt(Instant.now());

        Admin updated = adminRepository.save(existing);
        return adminMapper.toResponse(updated);
    }

    @Transactional(readOnly = true)
    public List<AdminResponse> getAllAdmin() {
        return adminRepository.findAll().stream()
                .map(adminMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public AdminResponse getAdminById(Long id) {
        Admin admin = findAdminById(id);
        return adminMapper.toResponse(admin);
    }


    @Transactional(readOnly = true)
    public long count() {
        return adminRepository.count();
    }

    private Admin findAdminById(Long id) {
        return adminRepository.findById(id)
                .orElseThrow(() -> new NotFoundResourceException("Admin not found"));
    }
}
