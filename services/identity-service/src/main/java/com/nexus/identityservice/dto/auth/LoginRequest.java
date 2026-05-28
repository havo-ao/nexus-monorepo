package com.nexus.identityservice.dto.auth;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import org.hibernate.validator.constraints.Length;

@Data
@Schema(description = "Solicitud de inicio de sesión")
public class LoginRequest {
    @NotBlank(message = "Email is required")
    @Email(message = "Must provide a valid email")
    @Length(max = 120, message = "Email cannot exceed 120 characters")
    @Schema(description = "Correo electrónico del usuario", example = "juan.perez@example.com")
    private String email;

    @NotBlank(message = "Password is required")
    @Length(max = 255, message = "Password cannot exceed 255 characters")
    @Schema(description = "Contraseña del usuario", example = "Password123!")
    private String password;
}
