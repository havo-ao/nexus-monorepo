package com.nexus.identityservice.service;

import com.nexus.identityservice.model.Admin;
import com.nexus.identityservice.model.Genre;
import com.nexus.identityservice.model.Trader;
import com.nexus.identityservice.model.UserRol;
import com.nexus.identityservice.model.UserStatus;
import com.nexus.identityservice.repository.AdminRepository;
import com.nexus.identityservice.repository.BrokerRepository;
import com.nexus.identityservice.repository.LegalUserRepository;
import com.nexus.identityservice.repository.TraderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserLookupServiceTest {

    @Mock
    private TraderRepository traderRepository;
    @Mock
    private BrokerRepository brokerRepository;
    @Mock
    private AdminRepository adminRepository;
    @Mock
    private LegalUserRepository legalUserRepository;

    private UserLookupService userLookupService;

    @BeforeEach
    void setUp() {
        userLookupService = new UserLookupService(
                traderRepository,
                brokerRepository,
                adminRepository,
                legalUserRepository
        );
    }

    @Test
    void findByEmailReturnsFirstMatchingUserAcrossRoles() {
        Trader trader = trader();
        when(traderRepository.findByEmail("andy@nexus.local")).thenReturn(Optional.empty());
        when(brokerRepository.findByEmail("andy@nexus.local")).thenReturn(Optional.empty());
        when(adminRepository.findByEmail("andy@nexus.local")).thenReturn(Optional.of(admin()));
        when(legalUserRepository.findByEmail("andy@nexus.local")).thenReturn(Optional.empty());

        assertThat(userLookupService.findByEmail("andy@nexus.local"))
                .containsInstanceOf(Admin.class);
    }

    @Test
    void existsByUsernameChecksAllRoleTables() {
        when(traderRepository.existsByUsername("andy")).thenReturn(false);
        when(brokerRepository.existsByUsername("andy")).thenReturn(false);
        when(adminRepository.existsByUsername("andy")).thenReturn(true);

        assertThat(userLookupService.existsByUsername("andy")).isTrue();
    }

    @Test
    void handleFailedLoginBansTraderAfterFifthAttempt() {
        Trader trader = trader();
        trader.setFailedLoginAttempts(4);

        userLookupService.handleFailedLogin(trader);

        assertThat(trader.getFailedLoginAttempts()).isEqualTo(5);
        assertThat(trader.getBanUntil()).isNotNull();
        assertThat(trader.getStatus()).isEqualTo(UserStatus.BANNED_FOR_TRIES);
        verify(traderRepository).save(trader);
    }

    @Test
    void existsByEmailChecksAllRoleTables() {
        when(traderRepository.existsByEmail("test@test.com")).thenReturn(false);
        when(brokerRepository.existsByEmail("test@test.com")).thenReturn(false);
        when(adminRepository.existsByEmail("test@test.com")).thenReturn(true);

        assertThat(userLookupService.existsByEmail("test@test.com")).isTrue();
    }

    @Test
    void updateLastLoginByIdResetsAttemptsAndBan() {
        Trader trader = trader();
        trader.setFailedLoginAttempts(3);
        trader.setBanUntil(Instant.now());
        when(traderRepository.findById(7L)).thenReturn(Optional.of(trader));

        userLookupService.updateLastLoginById(7L, "TRADER");

        assertThat(trader.getLastLogin()).isNotNull();
        assertThat(trader.getFailedLoginAttempts()).isZero();
        assertThat(trader.getBanUntil()).isNull();
        verify(traderRepository).save(trader);
    }

    private Trader trader() {
        Trader trader = new Trader();
        trader.setId(7L);
        trader.setName("Andy");
        trader.setSurname("Canon");
        trader.setGenre(Genre.MALE);
        trader.setEmail("andy@nexus.local");
        trader.setUsername("andy");
        trader.setPassword("encoded-password");
        trader.setUserRol(UserRol.TRADER);
        trader.setStatus(UserStatus.ACTIVE);
        trader.setFailedLoginAttempts(0);
        return trader;
    }

    private Admin admin() {
        Admin admin = new Admin();
        admin.setId(3L);
        admin.setName("Admin");
        admin.setSurname("Nexus");
        admin.setGenre(Genre.MALE);
        admin.setEmail("admin@nexus.local");
        admin.setUsername("admin");
        admin.setPassword("encoded-password");
        admin.setUserRol(UserRol.ADMIN);
        admin.setFailedLoginAttempts(0);
        return admin;
    }
}
