package com.nexus.identityservice.config;

import com.nexus.identityservice.model.Admin;
import com.nexus.identityservice.model.Genre;
import com.nexus.identityservice.model.UserRol;
import com.nexus.identityservice.repository.AdminRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;

/**
 * Configuration class to load initial data into the database. Creates default
 * admin user upon application startup if they do not exist
 * previously.
 */
@Configuration
@Profile("!test")
public class LoadDefaultAdmin {
    /**
     * Logger to record messages during data loading.
     */
    private static final Logger log = LoggerFactory.getLogger(LoadDefaultAdmin.class);

    private static final String DEFAULT_ADMIN_NAME = "David";
    private static final String DEFAULT_ADMIN_SURNAME = "Ramirez";
    private static final String DEFAULT_ADMIN_USERNAME = "masterTech8122";
    private static final String DEFAULT_ADMIN_DEPARTMENT = "Technology";
    private static final String DEFAULT_ADMIN_POSITION = "Database Administrator";

    @Value("${ADMIN_EMAIL:}")
    private String adminEmail;
    @Value("${ADMIN_PASSWORD:}")
    private String adminPassword;


    /**
     * Initializes the database with default users. Creates an administrator user if he doesn't exist.
     *
     * @param adminRepo       Admin repository for database access
     * @param passwordEncoder Password encoder for encrypting user passwords
     * @return A CommandLineRunner that executes upon application startup
     */
    @Bean
    CommandLineRunner initDatabase(AdminRepository adminRepo, PasswordEncoder passwordEncoder) {

        return args -> {
            if (adminRepo.findByNameAndSurname(DEFAULT_ADMIN_NAME, DEFAULT_ADMIN_SURNAME).isPresent()) {
                log.info("Administrator already exists, skipping administrator creation...");
                return;
            }


            if (isBlank(adminEmail) || isBlank(adminPassword)) {
                log.error("ADMIN_EMAIL or ADMIN_PASSWORD environment variables are not set");
                return;
            }

            Admin master = createDefaultAdmin(adminEmail, adminPassword, passwordEncoder);
            adminRepo.save(master);

            log.info("Preloading administrator user");
        };
    }

    private Admin createDefaultAdmin(
            String adminEmail,
            String adminPassword,
            PasswordEncoder passwordEncoder
    ) {
        Admin admin = new Admin();
        admin.setName(DEFAULT_ADMIN_NAME);
        admin.setSurname(DEFAULT_ADMIN_SURNAME);
        admin.setGenre(Genre.MALE);
        admin.setEmail(adminEmail);
        admin.setUsername(DEFAULT_ADMIN_USERNAME);
        admin.setPassword(passwordEncoder.encode(adminPassword));
        admin.setUserRol(UserRol.ADMIN);
        admin.setCreatedAt(Instant.now());
        admin.setFailedLoginAttempts(0);
        admin.setDepartment(DEFAULT_ADMIN_DEPARTMENT);
        admin.setPosition(DEFAULT_ADMIN_POSITION);

        return admin;
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}

    
