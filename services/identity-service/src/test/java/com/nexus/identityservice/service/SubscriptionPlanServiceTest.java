package com.nexus.identityservice.service;

import com.nexus.identityservice.dto.admin.SubscriptionPlanRequest;
import com.nexus.identityservice.dto.admin.SubscriptionPlanResponse;
import com.nexus.identityservice.exception.DuplicateResourceException;
import com.nexus.identityservice.exception.NotFoundResourceException;
import com.nexus.identityservice.mapper.SubscriptionPlanMapper;
import com.nexus.identityservice.model.SubscriptionPlan;
import com.nexus.identityservice.repository.SubscriptionPlanRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SubscriptionPlanServiceTest {

    @Mock
    private SubscriptionPlanRepository subscriptionPlanRepository;
    @Mock
    private SubscriptionPlanMapper subscriptionPlanMapper;

    private SubscriptionPlanService subscriptionPlanService;

    @BeforeEach
    void setUp() {
        subscriptionPlanService = new SubscriptionPlanService(
                subscriptionPlanRepository,
                subscriptionPlanMapper
        );
    }

    @Test
    void createPersistsUniquePlan() {
        SubscriptionPlanRequest request = request("Premium");
        SubscriptionPlan plan = new SubscriptionPlan();
        SubscriptionPlanResponse response = SubscriptionPlanResponse.builder()
                .id(5L)
                .name("Premium")
                .active(true)
                .build();

        when(subscriptionPlanRepository.existsByName("Premium")).thenReturn(false);
        when(subscriptionPlanMapper.toEntity(request)).thenReturn(plan);
        when(subscriptionPlanRepository.save(plan)).thenReturn(plan);
        when(subscriptionPlanMapper.toResponse(plan)).thenReturn(response);

        assertThat(subscriptionPlanService.create(request)).isEqualTo(response);
    }

    @Test
    void createRejectsDuplicatePlanName() {
        SubscriptionPlanRequest request = request("Premium");
        when(subscriptionPlanRepository.existsByName("Premium")).thenReturn(true);

        assertThatThrownBy(() -> subscriptionPlanService.create(request))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessage("Subscription plan with name 'Premium' already exists");

        verify(subscriptionPlanRepository, never()).save(any());
    }

    @Test
    void toggleActiveFlipsPlanStatus() {
        SubscriptionPlan plan = new SubscriptionPlan();
        plan.setId(5L);
        plan.setName("Premium");
        plan.setActive(true);
        SubscriptionPlanResponse response = SubscriptionPlanResponse.builder()
                .id(5L)
                .name("Premium")
                .active(false)
                .build();

        when(subscriptionPlanRepository.findById(5L)).thenReturn(Optional.of(plan));
        when(subscriptionPlanRepository.save(plan)).thenReturn(plan);
        when(subscriptionPlanMapper.toResponse(plan)).thenReturn(response);

        SubscriptionPlanResponse result = subscriptionPlanService.toggleActive(5L);

        assertThat(plan.isActive()).isFalse();
        assertThat(plan.getUpdatedAt()).isNotNull();
        assertThat(result).isEqualTo(response);
    }

    @Test
    void deleteRequiresExistingPlan() {
        when(subscriptionPlanRepository.existsById(404L)).thenReturn(false);

        assertThatThrownBy(() -> subscriptionPlanService.delete(404L))
                .isInstanceOf(NotFoundResourceException.class)
                .hasMessage("Subscription plan not found with id: 404");

        verify(subscriptionPlanRepository, never()).deleteById(404L);
    }

    private SubscriptionPlanRequest request(String name) {
        return SubscriptionPlanRequest.builder()
                .name(name)
                .description("Premium access")
                .priceMonthly(BigDecimal.valueOf(19.99))
                .priceYearly(BigDecimal.valueOf(199.99))
                .stripePriceIdMonthly("price_monthly")
                .stripePriceIdYearly("price_yearly")
                .active(true)
                .build();
    }
}
