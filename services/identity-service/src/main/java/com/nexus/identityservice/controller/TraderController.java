package com.nexus.identityservice.controller;

import com.nexus.identityservice.dto.trader.TraderCreateRequest;
import com.nexus.identityservice.dto.trader.TraderResponse;
import com.nexus.identityservice.dto.trader.TraderUpdateRequest;
import com.nexus.identityservice.service.TraderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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

    // ==================== UPDATE ====================

    @PatchMapping("/{id}")
    public ResponseEntity<TraderResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody TraderUpdateRequest request) {
        TraderResponse response = traderService.update(id, request);
        return ResponseEntity.ok(response);
    }


}
