package com.nexus.identityservice.service;

import com.nexus.identityservice.dto.admin.SubscriptionPlanRequest;
import com.nexus.identityservice.dto.admin.SubscriptionPlanResponse;
import com.nexus.identityservice.exception.DuplicateResourceException;
import com.nexus.identityservice.exception.NotFoundResourceException;
import com.nexus.identityservice.mapper.SubscriptionPlanMapper;
import com.nexus.identityservice.model.SubscriptionPlan;
import com.nexus.identityservice.repository.SubscriptionPlanRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SubscriptionPlanService {

    private final SubscriptionPlanRepository subscriptionPlanRepository;
    private final SubscriptionPlanMapper subscriptionPlanMapper;

    @Transactional
    public SubscriptionPlanResponse create(SubscriptionPlanRequest request) {
        if (subscriptionPlanRepository.existsByName(request.getName())) {
            throw new DuplicateResourceException("Subscription plan with name '" + request.getName() + "' already exists");
        }

        SubscriptionPlan subscriptionPlan = subscriptionPlanMapper.toEntity(request);
        SubscriptionPlan saved = subscriptionPlanRepository.save(subscriptionPlan);
        return subscriptionPlanMapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<SubscriptionPlanResponse> getAll() {
        return subscriptionPlanRepository.findAll().stream()
                .map(subscriptionPlanMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public SubscriptionPlanResponse getById(Long id) {
        return subscriptionPlanRepository.findById(id)
                .map(subscriptionPlanMapper::toResponse)
                .orElseThrow(() -> new NotFoundResourceException("Subscription plan not found with id: " + id));
    }

    @Transactional
    public SubscriptionPlanResponse update(Long id, SubscriptionPlanRequest request) {
        SubscriptionPlan existing = subscriptionPlanRepository.findById(id)
                .orElseThrow(() -> new NotFoundResourceException("Subscription plan not found with id: " + id));

        // Check if the new name is already taken by another plan
        if (!existing.getName().equalsIgnoreCase(request.getName()) && 
            subscriptionPlanRepository.existsByName(request.getName())) {
            throw new DuplicateResourceException("Subscription plan with name '" + request.getName() + "' already exists");
        }

        subscriptionPlanMapper.updateEntity(existing, request);
        existing.setUpdatedAt(Instant.now());
        
        SubscriptionPlan updated = subscriptionPlanRepository.save(existing);
        return subscriptionPlanMapper.toResponse(updated);
    }

    @Transactional
    public void delete(Long id) {
        if (!subscriptionPlanRepository.existsById(id)) {
            throw new NotFoundResourceException("Subscription plan not found with id: " + id);
        }
        subscriptionPlanRepository.deleteById(id);
    }

    @Transactional
    public SubscriptionPlanResponse toggleActive(Long id) {
        SubscriptionPlan existing = subscriptionPlanRepository.findById(id)
                .orElseThrow(() -> new NotFoundResourceException("Subscription plan not found with id: " + id));
        
        existing.setActive(!existing.isActive());
        existing.setUpdatedAt(Instant.now());
        
        return subscriptionPlanMapper.toResponse(subscriptionPlanRepository.save(existing));
    }
}
