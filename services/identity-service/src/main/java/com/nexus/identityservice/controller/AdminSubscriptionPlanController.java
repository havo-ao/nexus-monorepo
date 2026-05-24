package com.nexus.identityservice.controller;

import com.nexus.identityservice.dto.admin.SubscriptionPlanRequest;
import com.nexus.identityservice.dto.admin.SubscriptionPlanResponse;
import com.nexus.identityservice.service.SubscriptionPlanService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/subscription-plans")
@RequiredArgsConstructor
@Tag(name = "Planes de Suscripción", description = "Endpoints para la gestión administrativa de los planes de suscripción ofrecidos.")
public class AdminSubscriptionPlanController {

    private final SubscriptionPlanService subscriptionPlanService;

    @PostMapping
    @Operation(summary = "Crear plan de suscripción", description = "Permite definir un nuevo plan de suscripción en el sistema.")
    public ResponseEntity<SubscriptionPlanResponse> create(@Valid @RequestBody SubscriptionPlanRequest request) {
        return new ResponseEntity<>(subscriptionPlanService.create(request), HttpStatus.CREATED);
    }

    @GetMapping
    @Operation(summary = "Listar todos los planes", description = "Retorna una lista de todos los planes de suscripción configurados.")
    public ResponseEntity<List<SubscriptionPlanResponse>> getAll() {
        return ResponseEntity.ok(subscriptionPlanService.getAll());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener plan por ID", description = "Busca y retorna los detalles de un plan de suscripción específico.")
    public ResponseEntity<SubscriptionPlanResponse> getById(
            @Parameter(description = "ID del plan", example = "1") @PathVariable Long id) {
        return ResponseEntity.ok(subscriptionPlanService.getById(id));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar plan", description = "Actualiza la configuración de un plan de suscripción existente.")
    public ResponseEntity<SubscriptionPlanResponse> update(
            @Parameter(description = "ID del plan a actualizar", example = "1") @PathVariable Long id, 
            @Valid @RequestBody SubscriptionPlanRequest request
    ) {
        return ResponseEntity.ok(subscriptionPlanService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar plan", description = "Elimina un plan de suscripción del sistema mediante su ID.")
    public ResponseEntity<Void> delete(
            @Parameter(description = "ID del plan a eliminar", example = "1") @PathVariable Long id) {
        subscriptionPlanService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/toggle-active")
    @Operation(summary = "Alternar estado del plan", description = "Activa o desactiva un plan de suscripción.")
    public ResponseEntity<SubscriptionPlanResponse> toggleActive(
            @Parameter(description = "ID del plan", example = "1") @PathVariable Long id) {
        return ResponseEntity.ok(subscriptionPlanService.toggleActive(id));
    }
}
