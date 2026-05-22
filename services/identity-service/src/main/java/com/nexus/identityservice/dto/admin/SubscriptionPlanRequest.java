package com.nexus.identityservice.dto.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubscriptionPlanRequest {

    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "description is required")
    private String description;

    @NotNull(message = "Monthly price is required")
    @PositiveOrZero(message = "Monthly price must be zero or positive")
    private BigDecimal priceMonthly;

    @NotNull(message = "Yearly price is required")
    @PositiveOrZero(message = "Yearly price must be zero or positive")
    private BigDecimal priceYearly;

    @NotBlank(message = "priceIdMonthly is required")
    private String stripePriceIdMonthly;
    @NotBlank(message = "PriceIdYearly is required")
    private String stripePriceIdYearly;

    private boolean active = true;
}
