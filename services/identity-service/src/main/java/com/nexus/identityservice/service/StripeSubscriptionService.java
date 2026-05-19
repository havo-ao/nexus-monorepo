package com.nexus.identityservice.service;

import com.nexus.identityservice.config.StripeProperties;
import com.nexus.identityservice.model.*;
import com.nexus.identityservice.repository.SubscriptionPlanRepository;
import com.nexus.identityservice.repository.TraderRepository;
import com.nexus.identityservice.repository.TraderSubscriptionRepository;
import com.stripe.StripeClient;
import com.stripe.exception.StripeException;
import com.stripe.model.Subscription;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;

@Service
@RequiredArgsConstructor
public class StripeSubscriptionService {
    private final StripeProperties stripeProperties;
    private StripeClient client;

    private final TraderRepository traderRepository;
    private final SubscriptionPlanRepository subscriptionPlanRepository;
    private final TraderSubscriptionRepository traderSubscriptionRepository;

    @Value("${frontend-domain}")
    private String frontEndDomain;

    @PostConstruct
    public void init() {
         this.client = new StripeClient(stripeProperties.getSecretKey());
    }

    public String createCheckoutSession(String plan, Long traderId) throws StripeException {
        String priceId = switch (plan.toLowerCase()) {

            case "monthly" ->
                    stripeProperties.getMonthlyPriceId();

            case "yearly" ->
                    stripeProperties.getYearlyPriceId();

            default ->
                    throw new IllegalArgumentException("Invalid plan");
        };

        SessionCreateParams params =
                SessionCreateParams.builder()
                        .setMode(SessionCreateParams.Mode.SUBSCRIPTION)

                        .setSuccessUrl(
                                buildCheckoutSuccessUrl()
                        )

                        .setCancelUrl(
                                buildCheckoutCancelUrl()
                        )
                        .putMetadata("traderId", traderId.toString())
                        .putMetadata("planType", plan.toLowerCase())
                        .addLineItem(
                                SessionCreateParams.LineItem.builder()
                                        .setPrice(priceId)
                                        .setQuantity(1L)
                                        .build()
                        )

                        .build();

        Session session = client.v1().checkout().sessions().create(params);

        return session.getUrl();
    }

    public void verifySubscription(String sessionId) throws StripeException {
        Session session = client.v1().checkout().sessions().retrieve(sessionId);
        if ("paid".equals(session.getPaymentStatus())) {
            String traderIdStr = session.getMetadata().get("traderId");
            String planType = session.getMetadata().get("planType");
            String stripeSubscriptionId = session.getSubscription();

            if (traderIdStr != null && stripeSubscriptionId != null) {
                Long traderId = Long.parseLong(traderIdStr);
                
                // Evitar duplicados si ya se procesó
                if (traderSubscriptionRepository.existsByStripeSubscriptionId(stripeSubscriptionId)) {
                    return;
                }

                Trader trader = traderRepository.findById(traderId)
                        .orElseThrow(() -> new RuntimeException("Trader not found"));

                Subscription subscription = client.v1().subscriptions().retrieve(stripeSubscriptionId);

                // Asumimos que existe un plan base o buscamos por nombre
                SubscriptionPlan plan = subscriptionPlanRepository.findByName("Premium")
                        .orElseGet(() -> {
                            // Si no existe, crear uno por defecto o lanzar error
                            return subscriptionPlanRepository.findAll().stream().findFirst()
                                    .orElseThrow(() -> new RuntimeException("No subscription plans available"));
                        });

                TraderSubscription traderSubscription = TraderSubscription.builder()
                        .trader(trader)
                        .plan(plan)
                        .startDate(LocalDate.now())
                        .endDate(LocalDate.now().plusMonths(planType.equals("yearly") ? 12 : 1))
                        .status(SubscriptionStatus.ACTIVE)
                        .stripeSubscriptionId(stripeSubscriptionId)
                        .stripeCustomerId(session.getCustomer())
                        .stripePriceId(subscription.getItems().getData().get(0).getPrice().getId())
                        .createdAt(Instant.now())
                        .updatedAt(Instant.now())
                        .build();

                traderSubscriptionRepository.save(traderSubscription);

                trader.setActivePremiumPlan(true);
                traderRepository.save(trader);
            }
        }
    }

    String buildCheckoutSuccessUrl() {
        return normalizedFrontEndDomain().concat("/success?session_id={CHECKOUT_SESSION_ID}");
    }

    String buildCheckoutCancelUrl() {
        return normalizedFrontEndDomain().concat("/cancelledPayment");
    }

    private String normalizedFrontEndDomain() {
        return frontEndDomain.replaceAll("/+$", "");
    }
}
