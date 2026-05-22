package com.nexus.identityservice.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubscriptionPlan {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String name;

    private String description;

    @Column(precision = 10, scale = 2)
    private BigDecimal priceMonthly;

    @Column(precision = 10, scale = 2)
    private BigDecimal priceYearly;

    private String stripePriceIdMonthly;
    private String stripePriceIdYearly;

    private boolean active = true;

    private Instant createdAt;
    private Instant updatedAt;
}