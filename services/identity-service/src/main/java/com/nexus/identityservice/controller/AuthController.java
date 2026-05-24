package com.nexus.identityservice.controller;

import com.nexus.identityservice.dto.admin.AdminCreateRequest;
import com.nexus.identityservice.dto.admin.AdminResponse;
import com.nexus.identityservice.dto.auth.AuthResponse;
import com.nexus.identityservice.dto.auth.LoginRequest;
import com.nexus.identityservice.dto.trader.TraderCreateRequest;
import com.nexus.identityservice.dto.trader.TraderResponse;
import com.nexus.identityservice.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/auth")
@Tag(name = "Autenticación", description = "Endpoints para el registro y acceso de usuarios (Traders y Admins)")
public class AuthController {
    private final AuthService authService;

    @PostMapping("/login")
    @Operation(summary = "Iniciar sesión", description = "Permite a cualquier usuario autenticarse y obtener un token JWT. Use las credenciales registradas.")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/register/trader")
    @Operation(summary = "Registrar un nuevo Trader", description = "Crea una cuenta de Trader en el sistema. Tras el registro, el trader debe iniciar sesión para obtener su token.")
    public ResponseEntity<TraderResponse> registerTrader(@Valid @RequestBody TraderCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.registerTrader(request));
    }
    @PostMapping("/register/admin")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Registrar un nuevo Administrador", description = "Endpoint restringido a administradores existentes. Permite dar de alta a otros miembros del equipo administrativo.")
    public ResponseEntity<AdminResponse> registerAdmin(@Valid @RequestBody AdminCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.registerAdmin(request));
    }
}
