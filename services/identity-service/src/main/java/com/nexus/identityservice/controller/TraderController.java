package com.nexus.identityservice.controller;

import com.nexus.identityservice.dto.trader.TraderCreateRequest;
import com.nexus.identityservice.dto.trader.TraderResponse;
import com.nexus.identityservice.dto.trader.TraderSubscriptionResponse;
import com.nexus.identityservice.dto.trader.TraderUpdateRequest;
import com.nexus.identityservice.model.User;
import com.nexus.identityservice.service.TraderService;
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
public class TraderController {
    private final TraderService traderService;


    @PostMapping
    public ResponseEntity<TraderResponse> create(@Valid @RequestBody TraderCreateRequest request) {
        TraderResponse response = traderService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/me")
    public ResponseEntity<TraderResponse> getMe(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(traderService.findById(user.getId()));
    }

    // ==================== UPDATE ====================

    @PatchMapping
    public ResponseEntity<TraderResponse> update(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody TraderUpdateRequest request) {
        TraderResponse response = traderService.update(user.getId(), request);
        return ResponseEntity.ok(response);
    }


    @GetMapping("/{id}/subscriptions")
    public ResponseEntity<List<TraderSubscriptionResponse>> getSubscriptions(@PathVariable Long id) {
        return ResponseEntity.ok(traderService.getTraderSubscriptions(id));
    }


}
