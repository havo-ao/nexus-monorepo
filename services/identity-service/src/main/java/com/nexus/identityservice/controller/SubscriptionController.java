package com.nexus.identityservice.controller;

import com.nexus.identityservice.dto.SubscriptionRequest;
import com.nexus.identityservice.dto.trader.TraderSubscriptionResponse;
import com.nexus.identityservice.model.User;
import com.nexus.identityservice.service.StripeSubscriptionService;
import com.nexus.identityservice.service.TraderService;
import com.stripe.exception.StripeException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/subscriptions")
@RequiredArgsConstructor
@Tag(name = "Suscripciones (Stripe)", description = "Flujo de suscripciones utilizando Stripe para procesar pagos.")
public class SubscriptionController {

    private final StripeSubscriptionService service;
    private final TraderService traderService;

    @PostMapping("/checkout")
    @Operation(summary = "Crear sesión de pago", description = "Inicia el proceso de suscripción creando una sesión de Stripe Checkout. Retorna la URL a la que el usuario debe ser redirigido.")
    public ResponseEntity<Map<String, String>> checkout(
            @RequestBody SubscriptionRequest request,
            @AuthenticationPrincipal User user
    ) throws StripeException {

        String url =
                service.createCheckoutSession(
                        request.getPlan(),
                        user.getId()
                );

        return ResponseEntity.ok(
                Map.of("url", url)
        );
    }

    @GetMapping("/verify")
    @Operation(summary = "Verificar pago", description = "Endpoint de retorno tras completar el pago en Stripe. Valida la sesión y activa la suscripción en el sistema.")
    public ResponseEntity<Map<String, String>> verify(
            @Parameter(description = "ID de la sesión de Stripe retornado en la URL", example = "cs_test_a1b2c3d4") @RequestParam("session_id") String sessionId
    ) throws StripeException {
        service.verifySubscription(sessionId);
        return ResponseEntity.ok(
                Map.of("status", "success", "message", "Subscription verified and active")
        );
    }

    @GetMapping("/status")
    @Operation(summary = "Consultar estado de suscripción", description = "Retorna los detalles de la suscripción activa del trader autenticado.")
    public ResponseEntity<TraderSubscriptionResponse> getStatus(
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(traderService.getActiveSubscription(user.getId()));
    }
}