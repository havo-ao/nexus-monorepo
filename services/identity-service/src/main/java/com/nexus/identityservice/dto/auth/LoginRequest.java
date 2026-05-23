package com.nexus.identityservice.dto.auth;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
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
    @Length(min = 8, max = 255, message = "Password must be between 8 and 255 characters")
    @Pattern(regexp = "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!])(?=\\S+$).{8,}$",
            message = "Password must contain at least one digit, one lowercase letter, one uppercase letter, one special character (including !) and no spaces")
    @Schema(description = "Contraseña del usuario (mínimo 8 caracteres, 1 mayúscula, 1 minúscula, 1 número y 1 carácter especial)", example = "Password123!")
    private String password;
}