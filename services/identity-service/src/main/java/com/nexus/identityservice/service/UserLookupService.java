package com.nexus.identityservice.service;

import com.nexus.identityservice.model.*;
import com.nexus.identityservice.repository.AdminRepository;
import com.nexus.identityservice.repository.BrokerRepository;
import com.nexus.identityservice.repository.LegalUserRepository;
import com.nexus.identityservice.repository.TraderRepository;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Optional;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class UserLookupService {

    private final TraderRepository traderRepository;
    private final BrokerRepository brokerRepository;
    private final AdminRepository adminRepository;
    private final LegalUserRepository legalUserRepository;

    /**
     * Searches for a user by email in all user tables.
     * Returns the first match found.
     */
    public Optional<User> findByEmail(String email) {
        return Stream.of(
                        traderRepository.findByEmail(email),
                        brokerRepository.findByEmail(email),
                        adminRepository.findByEmail(email),
                        legalUserRepository.findByEmail(email)
                )
                .filter(Optional::isPresent)
                .map(Optional::get)
                .findFirst()
                .map(user -> (User) user);
    }
    /**
     * Verifies if a user exists with the given email (in any table).
     */
    public boolean existsByEmail(String email) {
        return traderRepository.existsByEmail(email) ||
                brokerRepository.existsByEmail(email) ||
                adminRepository.existsByEmail(email) ||
                legalUserRepository.existsByEmail(email);
    }

    /**
     * Verifies if a user exists with the given username (in any table).
     */
    public boolean existsByUsername(String username) {
        return traderRepository.existsByUsername(username) ||
                brokerRepository.existsByUsername(username) ||
                adminRepository.existsByUsername(username) ||
                legalUserRepository.existsByUsername(username);
    }

    /**
     * Updates the lastLogin of a user by ID (more efficient)
     */
    @Transactional
    public void updateLastLoginById(Long id, String userType) {
        switch (userType) {
            case "TRADER" -> traderRepository.findById(id).ifPresent(trader -> {
                trader.setLastLogin(Instant.now());
                trader.setFailedLoginAttempts(0);
                trader.setBanUntil(null);
                traderRepository.save(trader);
            });
            case "BROKER" -> brokerRepository.findById(id).ifPresent(broker -> {
                broker.setLastLogin(Instant.now());
                broker.setFailedLoginAttempts(0);
                broker.setBanUntil(null);
                brokerRepository.save(broker);
            });
            case "ADMIN" -> adminRepository.findById(id).ifPresent(admin -> {
                admin.setLastLogin(Instant.now());
                admin.setFailedLoginAttempts(0);
                admin.setBanUntil(null);
                adminRepository.save(admin);
            });
            case "LEGAL_USER" -> legalUserRepository.findById(id).ifPresent(legal -> {
                legal.setLastLogin(Instant.now());
                legal.setFailedLoginAttempts(0);
                legal.setBanUntil(null);
                legalUserRepository.save(legal);
            });
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void handleFailedLogin(User user) {
        user.setFailedLoginAttempts(user.getFailedLoginAttempts() + 1);
        user.setLastFailedLogin(Instant.now());

        if (user.getFailedLoginAttempts() >= 5) {
            user.setBanUntil(Instant.now().plusSeconds(600)); // 10 minutes
            // Audit log: User banned for 10 minutes due to 5 failed attempts
            // TODO: AuditLogService.log("User banned: " + user.getEmail());

            if (user instanceof Trader trader) {
                trader.setStatus(UserStatus.BANNED_FOR_TRIES);
            }
        }
        saveUser(user);
    }

    private void saveUser(User user) {
        if (user instanceof Trader trader) {
            traderRepository.save(trader);
        } else if (user instanceof Broker broker) {
            brokerRepository.save(broker);
        } else if (user instanceof Admin admin) {
            adminRepository.save(admin);
        } else if (user instanceof LegalUser legalUser) {
            legalUserRepository.save(legalUser);
        }
    }
}
