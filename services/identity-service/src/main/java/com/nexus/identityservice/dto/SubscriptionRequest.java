package com.nexus.identityservice.dto;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
@Schema(description = "Solicitud para iniciar el proceso de suscripción")
public class SubscriptionRequest {
    @NotBlank(message = "Plan is required")
    @Schema(description = "Nombre o tipo del plan seleccionado (e.g. monthly, yearly)", example = "monthly")
    private String plan;
}