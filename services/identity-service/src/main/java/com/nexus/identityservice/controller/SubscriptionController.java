package com.nexus.identityservice.controller;

import com.nexus.identityservice.dto.SubscriptionRequest;
import com.nexus.identityservice.dto.trader.TraderSubscriptionResponse;
import com.nexus.identityservice.model.User;
import com.nexus.identityservice.service.StripeSubscriptionService;
import com.nexus.identityservice.service.TraderService;
import com.stripe.exception.StripeException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/subscriptions")
@RequiredArgsConstructor
public class SubscriptionController {

    private final StripeSubscriptionService service;
    private final TraderService traderService;

    @PostMapping("/checkout")
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
    public ResponseEntity<Map<String, String>> verify(
            @RequestParam("session_id") String sessionId
    ) throws StripeException {
        service.verifySubscription(sessionId);
        return ResponseEntity.ok(
                Map.of("status", "success", "message", "Subscription verified and active")
        );
    }

    @GetMapping("/status")
    public ResponseEntity<TraderSubscriptionResponse> getStatus(
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(traderService.getActiveSubscription(user.getId()));
    }
}