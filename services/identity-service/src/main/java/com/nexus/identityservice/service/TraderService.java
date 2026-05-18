package com.nexus.identityservice.service;

import com.nexus.identityservice.dto.trader.TraderAuditResponse;
import com.nexus.identityservice.dto.trader.TraderCreateRequest;
import com.nexus.identityservice.dto.trader.TraderResponse;
import com.nexus.identityservice.dto.trader.TraderSubscriptionResponse;
import com.nexus.identityservice.dto.trader.TraderUpdateRequest;
import com.nexus.identityservice.exception.DuplicateResourceException;
import com.nexus.identityservice.exception.NotFoundResourceException;
import com.nexus.identityservice.mapper.TraderMapper;
import com.nexus.identityservice.model.Trader;
import com.nexus.identityservice.model.TraderSubscription;
import com.nexus.identityservice.model.UserRol;
import com.nexus.identityservice.model.UserStatus;
import com.nexus.identityservice.repository.TraderRepository;
import com.nexus.identityservice.repository.TraderSubscriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TraderService {

    private final TraderRepository traderRepository;
    private final TraderSubscriptionRepository traderSubscriptionRepository;
    private final TraderMapper traderMapper;
    private final PasswordEncoder passwordEncoder;
    private final UserLookupService userLookupService;

    // ==================== CREATE ====================

    @Transactional
    public TraderResponse create(TraderCreateRequest request) {
        // Global uniqueness validations
        if (userLookupService.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email already registered");
        }
        if (userLookupService.existsByUsername(request.getUsername())) {
            throw new DuplicateResourceException("Username is not available");
        }

        // DTO → Entity mapping
        Trader trader = traderMapper.toEntity(request);

        // Assign fields that do not come from the DTO
        trader.setPassword(passwordEncoder.encode(request.getPassword()));
        trader.setUserRol(UserRol.TRADER);
        trader.setStatus(UserStatus.ACTIVE);
        trader.setCreatedAt(Instant.now());


        Trader saved = traderRepository.save(trader);
        return traderMapper.toResponse(saved);
    }


    @Transactional(readOnly = true)
    public List<TraderAuditResponse> getAll() {
        return traderRepository.findAll().stream()
                .map(traderMapper::toAuditResponse)
                .toList();
    }


    @Transactional(readOnly = true)
    public TraderResponse findById(Long id) {
        return traderMapper.toResponse(findTraderById(id));
    }


    // ==================== UPDATES ====================

    @Transactional
    public TraderResponse update(Long id, TraderUpdateRequest request) {
        Trader existing = findTraderById(id);

        // Update only non-null fields
        traderMapper.updateEntity(existing, request);

        // Update modification timestamp
        existing.setUpdatedAt(Instant.now());

        Trader updated = traderRepository.save(existing);
        return traderMapper.toResponse(updated);
    }
    @Transactional
    public void updateLastLogin(Long id) {
        Trader trader = findTraderById(id);
        trader.setLastLogin(Instant.now());
        traderRepository.save(trader);
    }

    // ==================== SUBSCRIPTIONS ====================

    @Transactional(readOnly = true)
    public List<TraderSubscriptionResponse> getTraderSubscriptions(Long traderId) {
        Trader trader = findTraderById(traderId);
        return trader.getSubscriptions().stream()
                .sorted((s1, s2) -> s2.getCreatedAt().compareTo(s1.getCreatedAt())) // Ordenar por creación descendente
                .map(traderMapper::toSubscriptionResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public TraderSubscriptionResponse getActiveSubscription(Long traderId) {
        return traderSubscriptionRepository.findFirstByTraderIdOrderByCreatedAtDesc(traderId)
                .map(traderMapper::toSubscriptionResponse)
                .orElseThrow(() -> new NotFoundResourceException("No subscription found for this trader"));
    }

    // ==================== COUNT ====================

    @Transactional(readOnly = true)
    public long count() {
        return traderRepository.count();
    }

    // ==================== PRIVATE AUXILIARY METHOD ====================

    private Trader findTraderById(Long id) {
        return traderRepository.findById(id)
                .orElseThrow(() -> new NotFoundResourceException("Trader not found"));
    }
}