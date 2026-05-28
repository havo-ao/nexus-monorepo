package com.nexus.identityservice.dto.admin;

import com.nexus.identityservice.model.Genre;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
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
@Schema(description = "Solicitud para actualizar los datos de un Administrador (campos opcionales)")
public class AdminUpdateRequest {

    @Length(min = 1, max = 80, message = "Name must be between 1 and 80 characters")
    @Schema(description = "Nuevo nombre", example = "Carlos Alberto")
    private String name;

    @Length(min = 1, max = 80, message = "Surname must be between 1 and 80 characters")
    @Schema(description = "Nuevos apellidos", example = "García López")
    private String surname;

    @Schema(description = "Género", example = "MALE")
    private Genre genre;

    @Email(message = "Must provide a valid email")
    @Length(max = 120, message = "Email cannot exceed 120 characters")
    @Schema(description = "Nuevo correo electrónico", example = "carlos.alberto@nexus.com")
    private String email;

    @Length(min = 3, max = 60, message = "Username must be between 3 and 60 characters")
    @Pattern(regexp = "^[a-zA-Z0-9._-]+$", message = "Username can only contain letters, numbers, dots, underscores and hyphens")
    @Schema(description = "Nuevo nombre de usuario", example = "carlosalbertoadmin")
    private String username;

    @Length(min = 8, max = 255, message = "Password must be between 8 and 255 characters")
    @Pattern(regexp = "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!])(?=\\S+$).{8,}$", message = "Password must contain at least one digit, one lowercase letter, one uppercase letter, one special character (including !) and no spaces")
    @Schema(description = "Nueva contraseña", example = "NewAdminPass123!")
    private String password;

    @Length(max = 80, message = "Department cannot exceed 80 characters")
    @Schema(description = "Nuevo departamento", example = "Operations")
    private String department;

    @Length(max = 80, message = "Position cannot exceed 80 characters")
    @Schema(description = "Nuevo cargo", example = "Senior Administrator")
    private String position;
}
