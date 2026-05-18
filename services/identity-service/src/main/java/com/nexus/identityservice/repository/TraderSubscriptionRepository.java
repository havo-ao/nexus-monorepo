package com.nexus.identityservice.repository;

import com.stripe.model.checkout.Session;
import com.nexus.identityservice.model.TraderSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TraderSubscriptionRepository extends JpaRepository<TraderSubscription, Long> {
    List<TraderSubscription> findByTraderId(Long traderId);
    Optional<TraderSubscription> findFirstByTraderIdOrderByCreatedAtDesc(Long traderId);
    boolean existsByStripeSubscriptionId(String stripeSubscriptionId);
}
