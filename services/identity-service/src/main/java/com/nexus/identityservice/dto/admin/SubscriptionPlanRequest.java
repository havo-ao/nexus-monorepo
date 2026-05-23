package com.nexus.identityservice.dto.admin;

import io.swagger.v3.oas.annotations.media.Schema;
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
@Schema(description = "Solicitud para crear o actualizar un plan de suscripción")
public class SubscriptionPlanRequest {

    @NotBlank(message = "Name is required")
    @Schema(description = "Nombre del plan", example = "Plan Premium")
    private String name;

    @NotBlank(message = "description is required")
    @Schema(description = "Descripción detallada de las ventajas del plan", example = "Acceso total a todas las herramientas de trading y señales en tiempo real.")
    private String description;

    @NotNull(message = "Monthly price is required")
    @PositiveOrZero(message = "Monthly price must be zero or positive")
    @Schema(description = "Precio mensual", example = "29.99")
    private BigDecimal priceMonthly;

    @NotNull(message = "Yearly price is required")
    @PositiveOrZero(message = "Yearly price must be zero or positive")
    @Schema(description = "Precio anual (con descuento)", example = "299.99")
    private BigDecimal priceYearly;

    @NotBlank(message = "priceIdMonthly is required")
    @Schema(description = "ID del precio mensual en Stripe", example = "price_1N2b3c4d5e6f7g8h9i0j")
    private String stripePriceIdMonthly;

    @NotBlank(message = "PriceIdYearly is required")
    @Schema(description = "ID del precio anual en Stripe", example = "price_1N9j8h7g6f5e4d3c2b1a")
    private String stripePriceIdYearly;

    @Schema(description = "Indica si el plan está activo y visible para los usuarios", example = "true")
    private boolean active = true;
}
