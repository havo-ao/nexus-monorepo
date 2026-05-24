package com.nexus.identityservice.dto.trader;

import com.nexus.identityservice.model.Genre;
import com.nexus.identityservice.model.TraderExperience;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.validator.constraints.Length;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Solicitud para crear un nuevo Trader")
public class TraderCreateRequest {

    @NotBlank(message = "Name is required")
    @Length(min = 1, max = 80, message = "Name must be between 1 and 80 characters")
    @Schema(description = "Nombre del trader", example = "Juan")
    private String name;

    @NotBlank(message = "Surname is required")
    @Length(min = 1, max = 80, message = "Surname must be between 1 and 80 characters")
    @Schema(description = "Apellidos del trader", example = "Pérez")
    private String surname;

    @NotNull(message = "Genre is required")
    @Schema(description = "Género del trader", example = "MALE")
    private Genre genre;

    @NotBlank(message = "Email is required")
    @Email(message = "Must provide a valid email")
    @Length(max = 120, message = "Email cannot exceed 120 characters")
    @Schema(description = "Correo electrónico único", example = "juan.perez@example.com")
    private String email;

    @NotBlank(message = "Username is required")
    @Length(min = 3, max = 60, message = "Username must be between 3 and 60 characters")
    @Pattern(regexp = "^[a-zA-Z0-9._-]+$", message = "Username can only contain letters, numbers, dots, underscores and hyphens")
    @Schema(description = "Nombre de usuario único", example = "juanperez88")
    private String username;

    @NotBlank(message = "Password is required")
    @Length(min = 8, max = 255, message = "Password must be between 8 and 255 characters")
    @Pattern(regexp = "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!])(?=\\S+$).{8,}$",
            message = "Password must contain at least one digit, one lowercase letter, one uppercase letter, one special character (including !) and no spaces")
    @Schema(description = "Contraseña segura", example = "Password123!")
    private String password;

    @NotBlank(message = "Phone is required")
    @Pattern(regexp = "^\\+[0-9]{9,16}$", message = "Phone must be between 9 and 16 digits, using international format")
    @Schema(description = "Teléfono en formato internacional", example = "+34600111222")
    private String phone;

    @NotBlank(message = "Address is required")
    @Length(max = 100, message = "Address cannot exceed 100 characters")
    @Schema(description = "Dirección de residencia", example = "Calle Falsa 123")
    private String address;

    @NotBlank(message = "Nationality code is required")
    @Pattern(regexp = "^[A-Z]{2}$", message = "Nationality code must be a 2-letter uppercase ISO code")
    @Schema(description = "Código ISO de nacionalidad (2 letras)", example = "ES")
    private String nationalityCode;

    @NotBlank(message = "Time zone is required")
    @Pattern(regexp = "^[A-Za-z]+/[A-Za-z_]+$", message = "Time zone must have format 'Region/City' (e.g: Europe/Istanbul)")
    @Schema(description = "Zona horaria", example = "Europe/Madrid")
    private String timeZone;

    @NotNull(message = "Experience is required")
    @Schema(description = "Nivel de experiencia", example = "INTERMEDIATE")
    private TraderExperience experience;
}