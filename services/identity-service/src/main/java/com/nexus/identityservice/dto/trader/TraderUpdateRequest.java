package com.nexus.identityservice.dto.trader;

import com.nexus.identityservice.model.Genre;
import com.nexus.identityservice.model.TraderExperience;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.validator.constraints.Length;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Solicitud para actualizar los datos de un Trader (campos opcionales)")
public class TraderUpdateRequest {

    @Length(min = 1, max = 80, message = "Name must be between 1 and 80 characters")
    @Schema(description = "Nuevo nombre", example = "Juan Ignacio")
    private String name;


    @Length(min = 1, max = 80, message = "Surname must be between 1 and 80 characters")
    @Schema(description = "Nuevos apellidos", example = "Pérez Gómez")
    private String surname;


    @Schema(description = "Género", example = "MALE")
    private Genre genre;


    @Email(message = "Must provide a valid email")
    @Length(max = 120, message = "Email cannot exceed 120 characters")
    @Schema(description = "Nuevo correo electrónico", example = "juan.ig@example.com")
    private String email;


    @Length(min = 3, max = 60, message = "Username must be between 3 and 60 characters")
    @Pattern(regexp = "^[a-zA-Z0-9._-]+$", message = "Username can only contain letters, numbers, dots, underscores and hyphens")
    @Schema(description = "Nuevo nombre de usuario", example = "juanignacio88")
    private String username;


    @Length(min = 8, max = 255, message = "Password must be between 8 and 255 characters")
    @Pattern(regexp = "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!])(?=\\S+$).{8,}$", message = "Password must contain at least one digit, one lowercase letter, one uppercase letter, one special character (including !) and no spaces")
    @Schema(description = "Nueva contraseña", example = "NewPassword123!")
    private String password;


    @Pattern(regexp = "^\\+[0-9]{9,16}$",
            message = "Phone must be international format without spaces")
    @Schema(description = "Nuevo teléfono", example = "+34600999888")
    private String phone;


    @Length(max = 100, message = "Address cannot exceed 100 characters")
    @Schema(description = "Nueva dirección", example = "Avenida Siempre Viva 742")
    private String address;


    @Pattern(regexp = "^[A-Z]{2}$", message = "Nationality code must be a 2-letter uppercase ISO code")
    @Schema(description = "Nuevo código ISO de nacionalidad", example = "ES")
    private String nationalityCode;


    @Pattern(regexp = "^[A-Za-z]+/[A-Za-z_]+$", message = "Time zone must have format 'Region/City' (e.g: Europe/Istanbul)")
    @Schema(description = "Nueva zona horaria", example = "Europe/Madrid")
    private String timeZone;


    @Schema(description = "Nuevo nivel de experiencia", example = "ADVANCED")
    private TraderExperience experience;
}