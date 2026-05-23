package com.nexus.identityservice.controller;

import com.nexus.identityservice.dto.trader.TraderCreateRequest;
import com.nexus.identityservice.dto.trader.TraderResponse;
import com.nexus.identityservice.dto.trader.TraderSubscriptionResponse;
import com.nexus.identityservice.dto.trader.TraderUpdateRequest;
import com.nexus.identityservice.model.User;
import com.nexus.identityservice.service.TraderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/traders")
@RequiredArgsConstructor
@Tag(name = "Trader", description = "Endpoints para la gestión de perfiles de Trader")
public class TraderController {
    private final TraderService traderService;


    @PostMapping
    @Operation(summary = "Crear un Trader", description = "Endpoint alternativo para la creación de traders (generalmente se usa /api/auth/register/trader).")
    public ResponseEntity<TraderResponse> create(@Valid @RequestBody TraderCreateRequest request) {
        TraderResponse response = traderService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/me")
    @Operation(summary = "Obtener mi perfil", description = "Retorna los datos del trader autenticado basándose en el token JWT proporcionado.")
    public ResponseEntity<TraderResponse> getMe(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(traderService.findById(user.getId()));
    }

    // ==================== UPDATE ====================

    @PatchMapping
    @Operation(summary = "Actualizar mi perfil", description = "Permite al trader autenticado actualizar sus datos personales de forma parcial.")
    public ResponseEntity<TraderResponse> update(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody TraderUpdateRequest request) {
        TraderResponse response = traderService.update(user.getId(), request);
        return ResponseEntity.ok(response);
    }


    @GetMapping("/{id}/subscriptions")
    @Operation(summary = "Obtener historial de suscripciones", description = "Consulta el historial de todas las suscripciones (activas y pasadas) de un trader específico por su ID.")
    public ResponseEntity<List<TraderSubscriptionResponse>> getSubscriptions(
            @Parameter(description = "ID del trader", example = "1") @PathVariable Long id) {
        return ResponseEntity.ok(traderService.getTraderSubscriptions(id));
    }


}
