package com.nexus.identityservice.controller;

import com.nexus.identityservice.dto.admin.AdminResponse;
import com.nexus.identityservice.dto.admin.AdminUpdateRequest;
import com.nexus.identityservice.dto.trader.TraderAuditResponse;
import com.nexus.identityservice.service.AdminService;
import com.nexus.identityservice.service.TraderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final TraderService traderService;
    private final AdminService adminService;


    // ==================== ADMIN CRUD ====================

    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminResponse> update(@PathVariable Long id, @Valid @RequestBody AdminUpdateRequest request) {
        AdminResponse response = adminService.update(id, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/count")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Long> countAdmins() {
        long count = adminService.count();
        return ResponseEntity.ok(count);
    }


    @GetMapping("/audit/traders")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<TraderAuditResponse>> getAll() {
        List<TraderAuditResponse> responses = traderService.getAll();
        return ResponseEntity.ok(responses);
    }
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminResponse> getAdminById(@PathVariable Long id) {
        AdminResponse response = adminService.getAdminById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/audit")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AdminResponse>> getAllAdmin() {
        List<AdminResponse> responses = adminService.getAllAdmin();
        return ResponseEntity.ok(responses);
    }
    @GetMapping("/traders/count")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Long> count() {
        long count = traderService.count();
        return ResponseEntity.ok(count);
    }
}
