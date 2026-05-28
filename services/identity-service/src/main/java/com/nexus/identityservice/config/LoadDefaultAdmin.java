package com.nexus.identityservice.config;

import com.nexus.identityservice.model.Admin;
import com.nexus.identityservice.model.Broker;
import com.nexus.identityservice.model.Genre;
import com.nexus.identityservice.model.LegalUser;
import com.nexus.identityservice.model.SubscriptionPlan;
import com.nexus.identityservice.model.SubscriptionStatus;
import com.nexus.identityservice.model.Trader;
import com.nexus.identityservice.model.TraderExperience;
import com.nexus.identityservice.model.TraderSubscription;
import com.nexus.identityservice.model.UserRol;
import com.nexus.identityservice.model.UserStatus;
import com.nexus.identityservice.repository.AdminRepository;
import com.nexus.identityservice.repository.BrokerRepository;
import com.nexus.identityservice.repository.LegalUserRepository;
import com.nexus.identityservice.repository.SubscriptionPlanRepository;
import com.nexus.identityservice.repository.TraderRepository;
import com.nexus.identityservice.repository.TraderSubscriptionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

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
    private static final String DEFAULT_TRADER_EMAIL = "trader@accioneselbosque.local";
    private static final String DEFAULT_TRADER_USERNAME = "andytrader";
    private static final String DEFAULT_BROKER_EMAIL = "broker@accioneselbosque.local";
    private static final String DEFAULT_BROKER_USERNAME = "camilabroker";
    private static final String DEFAULT_LEGAL_EMAIL = "legal@accioneselbosque.local";
    private static final String DEFAULT_LEGAL_USERNAME = "lauralegal";
    private static final String DEFAULT_PREMIUM_PLAN_NAME = "Premium";

    @Value("${ADMIN_EMAIL:}")
    private String adminEmail;
    @Value("${ADMIN_PASSWORD:}")
    private String adminPassword;
    @Value("${DEMO_USER_PASSWORD:${ADMIN_PASSWORD:}}")
    private String demoUserPassword;


    /**
     * Initializes the database with default users. Creates an administrator user if he doesn't exist.
     *
     * @param adminRepo       Admin repository for database access
     * @param passwordEncoder Password encoder for encrypting user passwords
     * @return A CommandLineRunner that executes upon application startup
     */
    @Bean
    CommandLineRunner initDatabase(
            AdminRepository adminRepo,
            TraderRepository traderRepo,
            BrokerRepository brokerRepo,
            LegalUserRepository legalUserRepo,
            SubscriptionPlanRepository subscriptionPlanRepo,
            TraderSubscriptionRepository traderSubscriptionRepo,
            PasswordEncoder passwordEncoder
    ) {

        return args -> {
            if (isBlank(adminEmail) || isBlank(adminPassword)) {
                log.error("ADMIN_EMAIL or ADMIN_PASSWORD environment variables are not set");
            } else {
                preloadAdmin(adminRepo, traderRepo, brokerRepo, legalUserRepo, passwordEncoder);
            }

            preloadDemoUsers(
                    traderRepo,
                    brokerRepo,
                    legalUserRepo,
                    subscriptionPlanRepo,
                    traderSubscriptionRepo,
                    passwordEncoder
            );
        };
    }

    private void preloadAdmin(
            AdminRepository adminRepo,
            TraderRepository traderRepo,
            BrokerRepository brokerRepo,
            LegalUserRepository legalUserRepo,
            PasswordEncoder passwordEncoder
    ) {
        Admin admin = adminRepo.findByEmail(adminEmail)
                .orElseGet(() -> adminRepo.findByUsername(DEFAULT_ADMIN_USERNAME).orElse(null));

        if (admin != null) {
            admin.setPassword(passwordEncoder.encode(adminPassword));
            admin.setFailedLoginAttempts(0);
            adminRepo.save(admin);
            log.info("Administrator already exists, refreshing administrator credentials...");
            return;
        }

        if (traderRepo.findByEmail(adminEmail).isPresent()
                || brokerRepo.findByEmail(adminEmail).isPresent()
                || legalUserRepo.findByEmail(adminEmail).isPresent()) {
            log.warn("ADMIN_EMAIL already belongs to another role; skipping administrator creation");
            return;
        }

        Admin master = createDefaultAdmin(
                adminEmail,
                availableUsername(adminRepo, DEFAULT_ADMIN_USERNAME),
                adminPassword,
                passwordEncoder
        );
        adminRepo.save(master);
        log.info("Preloading administrator user");
    }

    private Admin createDefaultAdmin(
            String adminEmail,
            String username,
            String adminPassword,
            PasswordEncoder passwordEncoder
    ) {
        Admin admin = new Admin();
        admin.setName(DEFAULT_ADMIN_NAME);
        admin.setSurname(DEFAULT_ADMIN_SURNAME);
        admin.setGenre(Genre.MALE);
        admin.setEmail(adminEmail);
        admin.setUsername(username);
        admin.setPassword(passwordEncoder.encode(adminPassword));
        admin.setUserRol(UserRol.ADMIN);
        admin.setCreatedAt(Instant.now());
        admin.setFailedLoginAttempts(0);
        admin.setDepartment(DEFAULT_ADMIN_DEPARTMENT);
        admin.setPosition(DEFAULT_ADMIN_POSITION);

        return admin;
    }

    private void preloadDemoUsers(
            TraderRepository traderRepo,
            BrokerRepository brokerRepo,
            LegalUserRepository legalUserRepo,
            SubscriptionPlanRepository subscriptionPlanRepo,
            TraderSubscriptionRepository traderSubscriptionRepo,
            PasswordEncoder passwordEncoder
    ) {
        if (isBlank(demoUserPassword)) {
            log.warn("DEMO_USER_PASSWORD or ADMIN_PASSWORD is not set; skipping demo role users");
            return;
        }

        SubscriptionPlan premiumPlan = ensurePremiumPlan(subscriptionPlanRepo);
        Trader trader = traderRepo.findByEmail(DEFAULT_TRADER_EMAIL).orElse(null);
        if (trader == null) {
            trader = traderRepo.save(createDemoTrader(
                    availableUsername(traderRepo, DEFAULT_TRADER_USERNAME),
                    passwordEncoder
            ));
            log.info("Preloading demo trader user");
        } else {
            refreshDemoPassword(trader, passwordEncoder);
        }
        if (!trader.isActivePremiumPlan()) {
            trader.setActivePremiumPlan(true);
            trader = traderRepo.save(trader);
        }
        ensureDemoSubscription(trader, premiumPlan, traderSubscriptionRepo);

        Broker broker = brokerRepo.findByEmail(DEFAULT_BROKER_EMAIL).orElse(null);
        if (broker == null) {
            brokerRepo.save(createDemoBroker(
                    availableUsername(brokerRepo, DEFAULT_BROKER_USERNAME),
                    passwordEncoder
            ));
            log.info("Preloading demo broker user");
        } else {
            refreshDemoPassword(broker, passwordEncoder);
            brokerRepo.save(broker);
        }

        LegalUser legalUser = legalUserRepo.findByEmail(DEFAULT_LEGAL_EMAIL).orElse(null);
        if (legalUser == null) {
            legalUserRepo.save(createDemoLegalUser(
                    availableUsername(legalUserRepo, DEFAULT_LEGAL_USERNAME),
                    passwordEncoder
            ));
            log.info("Preloading demo legal user");
        } else {
            refreshDemoPassword(legalUser, passwordEncoder);
            legalUserRepo.save(legalUser);
        }
    }

    private SubscriptionPlan ensurePremiumPlan(SubscriptionPlanRepository subscriptionPlanRepo) {
        return subscriptionPlanRepo.findByName(DEFAULT_PREMIUM_PLAN_NAME)
                .orElseGet(() -> subscriptionPlanRepo.save(SubscriptionPlan.builder()
                        .name(DEFAULT_PREMIUM_PLAN_NAME)
                        .description("Premium access to watchlists, market alerts and advanced reports")
                        .priceMonthly(new BigDecimal("12.00"))
                        .priceYearly(new BigDecimal("120.00"))
                        .stripePriceIdMonthly("demo-monthly-price")
                        .stripePriceIdYearly("demo-yearly-price")
                        .active(true)
                        .createdAt(Instant.now())
                        .build()));
    }

    private void ensureDemoSubscription(
            Trader trader,
            SubscriptionPlan premiumPlan,
            TraderSubscriptionRepository traderSubscriptionRepo
    ) {
        if (traderSubscriptionRepo.findFirstByTraderIdOrderByCreatedAtDesc(trader.getId()).isPresent()) {
            return;
        }

        traderSubscriptionRepo.save(TraderSubscription.builder()
                .trader(trader)
                .plan(premiumPlan)
                .startDate(LocalDate.now())
                .endDate(LocalDate.now().plusYears(1))
                .status(SubscriptionStatus.ACTIVE)
                .autoRenew(false)
                .stripeSubscriptionId("demo-premium-subscription-" + trader.getId())
                .stripeCustomerId("demo-premium-customer-" + trader.getId())
                .stripePriceId(premiumPlan.getStripePriceIdYearly())
                .createdAt(Instant.now())
                .build());
    }

    private Trader createDemoTrader(String username, PasswordEncoder passwordEncoder) {
        Trader trader = new Trader();
        applyBaseUser(
                trader,
                "Andy",
                "Trader",
                DEFAULT_TRADER_EMAIL,
                username,
                UserRol.TRADER,
                passwordEncoder
        );
        trader.setPhone("3000000000");
        trader.setAddress("Bogota");
        trader.setNationalityCode("CO");
        trader.setTimeZone("America/Bogota");
        trader.setExperience(TraderExperience.INTERMEDIATE);
        trader.setStatus(UserStatus.ACTIVE);
        trader.setEmailVerified(true);
        trader.setPhoneVerified(true);
        trader.setActivePremiumPlan(true);
        return trader;
    }

    private Broker createDemoBroker(String username, PasswordEncoder passwordEncoder) {
        Broker broker = new Broker();
        applyBaseUser(
                broker,
                "Camila",
                "Broker",
                DEFAULT_BROKER_EMAIL,
                username,
                UserRol.CONSULTANT,
                passwordEncoder
        );
        broker.setNationalityCode("CO");
        broker.setLanguages("Spanish, English");
        broker.setYearsExperience(8);
        broker.setRiskProfileScore(new BigDecimal("82.50"));
        broker.setDrawdown(new BigDecimal("12.20"));
        broker.setRetentionRate(new BigDecimal("91.40"));
        broker.setAvgResponseTime(new BigDecimal("6.00"));
        broker.setMinimumRecommendedCapital(new BigDecimal("1000.00"));
        broker.setContactChannel("email");
        return broker;
    }

    private LegalUser createDemoLegalUser(String username, PasswordEncoder passwordEncoder) {
        LegalUser legalUser = new LegalUser();
        applyBaseUser(
                legalUser,
                "Laura",
                "Legal",
                DEFAULT_LEGAL_EMAIL,
                username,
                UserRol.LEGAL_USER,
                passwordEncoder
        );
        legalUser.setDepartment("Compliance");
        return legalUser;
    }

    private void applyBaseUser(
            com.nexus.identityservice.model.User user,
            String name,
            String surname,
            String email,
            String username,
            UserRol role,
            PasswordEncoder passwordEncoder
    ) {
        user.setName(name);
        user.setSurname(surname);
        user.setGenre(Genre.OTHER);
        user.setEmail(email);
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(demoUserPassword));
        user.setUserRol(role);
        user.setCreatedAt(Instant.now());
        user.setFailedLoginAttempts(0);
    }

    private void refreshDemoPassword(
            com.nexus.identityservice.model.User user,
            PasswordEncoder passwordEncoder
    ) {
        user.setPassword(passwordEncoder.encode(demoUserPassword));
        user.setFailedLoginAttempts(0);
    }

    private String availableUsername(
            com.nexus.identityservice.repository.UserRepository<?> repository,
            String preferredUsername
    ) {
        if (!repository.existsByUsername(preferredUsername)) {
            return preferredUsername;
        }

        int suffix = 2;
        String candidate = preferredUsername + suffix;
        while (repository.existsByUsername(candidate)) {
            suffix++;
            candidate = preferredUsername + suffix;
        }
        return candidate;
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}

    
