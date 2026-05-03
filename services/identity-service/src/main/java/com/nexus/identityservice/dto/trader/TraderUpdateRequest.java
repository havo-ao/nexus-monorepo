package com.nexus.identityservice.dto.trader;

import com.nexus.identityservice.model.Genre;
import com.nexus.identityservice.model.TraderExperience;
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
public class TraderUpdateRequest {

    @Length(min = 1, max = 80, message = "Name must be between 1 and 80 characters")
    private String name;


    @Length(min = 1, max = 80, message = "Surname must be between 1 and 80 characters")
    private String surname;


    private Genre genre;


    @Email(message = "Must provide a valid email")
    @Length(max = 120, message = "Email cannot exceed 120 characters")
    private String email;


    @Length(min = 3, max = 60, message = "Username must be between 3 and 60 characters")
    @Pattern(regexp = "^[a-zA-Z0-9._-]+$", message = "Username can only contain letters, numbers, dots, underscores and hyphens")
    private String username;


    @Length(min = 8, max = 255, message = "Password must be between 8 and 255 characters")
    @Pattern(regexp = "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=])(?=\\S+$).{8,}$", message = "Password must contain at least one digit, one lowercase letter, one uppercase letter, one special character and no spaces")
    private String password;


    @Pattern(regexp = "^[0-9]{10,12}$", message = "Phone must be between 10 and 12 digits")
    private String phone;


    @Length(max = 100, message = "Address cannot exceed 100 characters")
    private String address;


    @Pattern(regexp = "^[A-Z]{2}$", message = "Nationality code must be a 2-letter uppercase ISO code")
    private String nationalityCode;


    @Pattern(regexp = "^[A-Za-z]+/[A-Za-z_]+$", message = "Time zone must have format 'Region/City' (e.g: Europe/Istanbul)")
    private String timeZone;


    private TraderExperience experience;
}