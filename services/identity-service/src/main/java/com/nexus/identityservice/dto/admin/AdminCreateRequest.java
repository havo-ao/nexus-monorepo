package com.nexus.identityservice.dto.admin;

import com.nexus.identityservice.model.Genre;
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
@Schema(description = "Solicitud para crear un nuevo Administrador")
public class AdminCreateRequest {

    @NotBlank(message = "Name is required")
    @Length(min = 1, max = 80, message = "Name must be between 1 and 80 characters")
    @Schema(description = "Nombre del administrador", example = "Carlos")
    private String name;

    @NotBlank(message = "Surname is required")
    @Length(min = 1, max = 80, message = "Surname must be between 1 and 80 characters")
    @Schema(description = "Apellidos del administrador", example = "García")
    private String surname;

    @NotNull(message = "Genre is required")
    @Schema(description = "Género", example = "MALE")
    private Genre genre;

    @NotBlank(message = "Email is required")
    @Email(message = "Must provide a valid email")
    @Length(max = 120, message = "Email cannot exceed 120 characters")
    @Schema(description = "Correo electrónico institucional", example = "carlos.garcia@nexus.com")
    private String email;

    @NotBlank(message = "Username is required")
    @Length(min = 3, max = 60, message = "Username must be between 3 and 60 characters")
    @Pattern(regexp = "^[a-zA-Z0-9._-]+$", message = "Username can only contain letters, numbers, dots, underscores and hyphens")
    @Schema(description = "Nombre de usuario único", example = "carlosadmin")
    private String username;

    @NotBlank(message = "Password is required")
    @Length(min = 8, max = 255, message = "Password must be between 8 and 255 characters")
    @Pattern(regexp = "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!])(?=\\S+$).{8,}$",
            message = "Password must contain at least one digit, one lowercase letter, one uppercase letter, one special character (including !) and no spaces")
    @Schema(description = "Contraseña segura", example = "AdminPass123!")
    private String password;

    @NotBlank(message = "Department is required")
    @Length(max = 80, message = "Department cannot exceed 80 characters")
    @Schema(description = "Departamento asignado", example = "IT")
    private String department;

    @NotBlank(message = "Position is required")
    @Length(max = 80, message = "Position cannot exceed 80 characters")
    @Schema(description = "Cargo", example = "Security Lead")
    private String position;
}
