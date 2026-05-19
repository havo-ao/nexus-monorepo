package com.nexus.identityservice.service;

import com.nexus.identityservice.config.StripeProperties;
import com.nexus.identityservice.repository.SubscriptionPlanRepository;
import com.nexus.identityservice.repository.TraderRepository;
import com.nexus.identityservice.repository.TraderSubscriptionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(MockitoExtension.class)
class StripeSubscriptionServiceTest {

    @Mock
    private StripeProperties stripeProperties;
    @Mock
    private TraderRepository traderRepository;
    @Mock
    private SubscriptionPlanRepository subscriptionPlanRepository;
    @Mock
    private TraderSubscriptionRepository traderSubscriptionRepository;

    private StripeSubscriptionService stripeSubscriptionService;

    @BeforeEach
    void setUp() {
        stripeSubscriptionService = new StripeSubscriptionService(
                stripeProperties,
                traderRepository,
                subscriptionPlanRepository,
                traderSubscriptionRepository
        );
    }

    @Test
    void checkoutRedirectUrlsDoNotDuplicateSlashesWhenFrontendDomainHasTrailingSlash() {
        ReflectionTestUtils.setField(stripeSubscriptionService, "frontEndDomain", "http://localhost:8100/");

        assertThat(stripeSubscriptionService.buildCheckoutSuccessUrl())
                .isEqualTo("http://localhost:8100/success?session_id={CHECKOUT_SESSION_ID}");
        assertThat(stripeSubscriptionService.buildCheckoutCancelUrl())
                .isEqualTo("http://localhost:8100/cancelledPayment");
    }

    @Test
    void checkoutRedirectUrlsUseFrontendDomainWithoutTrailingSlash() {
        ReflectionTestUtils.setField(stripeSubscriptionService, "frontEndDomain", "http://localhost:8100");

        assertThat(stripeSubscriptionService.buildCheckoutSuccessUrl())
                .isEqualTo("http://localhost:8100/success?session_id={CHECKOUT_SESSION_ID}");
        assertThat(stripeSubscriptionService.buildCheckoutCancelUrl())
                .isEqualTo("http://localhost:8100/cancelledPayment");
    }
}
