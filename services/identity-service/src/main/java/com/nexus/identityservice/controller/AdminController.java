package com.nexus.identityservice.controller;

import com.nexus.identityservice.dto.admin.AdminResponse;
import com.nexus.identityservice.dto.admin.AdminUpdateRequest;
import com.nexus.identityservice.dto.trader.TraderAuditResponse;
import com.nexus.identityservice.model.User;
import com.nexus.identityservice.service.AdminService;
import com.nexus.identityservice.service.TraderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Tag(name = "Administración", description = "Endpoints exclusivos para administradores. Permite auditoría de traders y gestión de otros administradores.")
public class AdminController {

    private final TraderService traderService;
    private final AdminService adminService;


    // ==================== ADMIN CRUD ====================

    @GetMapping("/me")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Obtener mi perfil de administrador", description = "Retorna los datos del administrador autenticado actualmente.")
    public ResponseEntity<AdminResponse> getMe(@AuthenticationPrincipal User user) {
        AdminResponse response = adminService.getAdminById(user.getId());
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Actualizar un administrador", description = "Permite actualizar los datos de un administrador específico mediante su ID.")
    public ResponseEntity<AdminResponse> update(
            @Parameter(description = "ID del administrador a actualizar", example = "2") @PathVariable Long id,
            @Valid @RequestBody AdminUpdateRequest request) {
        AdminResponse response = adminService.update(id, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/count")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Contar administradores", description = "Retorna el número total de administradores registrados en el sistema.")
    public ResponseEntity<Long> countAdmins() {
        long count = adminService.count();
        return ResponseEntity.ok(count);
    }


    @GetMapping("/audit/traders")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Auditar todos los traders", description = "Lista todos los traders registrados con información detallada para fines de auditoría.")
    public ResponseEntity<List<TraderAuditResponse>> getAll() {
        List<TraderAuditResponse> responses = traderService.getAll();
        return ResponseEntity.ok(responses);
    }
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Obtener administrador por ID", description = "Busca y retorna la información de un administrador específico.")
    public ResponseEntity<AdminResponse> getAdminById(
            @Parameter(description = "ID del administrador", example = "2") @PathVariable Long id) {
        AdminResponse response = adminService.getAdminById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/audit")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Listar todos los administradores", description = "Retorna una lista con todos los administradores del sistema.")
    public ResponseEntity<List<AdminResponse>> getAllAdmin() {
        List<AdminResponse> responses = adminService.getAllAdmin();
        return ResponseEntity.ok(responses);
    }
    @GetMapping("/traders/count")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Contar traders", description = "Retorna el número total de traders registrados.")
    public ResponseEntity<Long> count() {
        long count = traderService.count();
        return ResponseEntity.ok(count);
    }
}
