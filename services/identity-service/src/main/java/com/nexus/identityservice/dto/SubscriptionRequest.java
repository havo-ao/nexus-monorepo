package com.nexus.identityservice.dto;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SubscriptionRequest {
    @NotBlank(message = "Plan is required")
    private String plan;
}