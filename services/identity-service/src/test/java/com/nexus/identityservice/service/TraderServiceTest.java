package com.nexus.identityservice.service;

import com.nexus.identityservice.dto.trader.TraderCreateRequest;
import com.nexus.identityservice.dto.trader.TraderResponse;
import com.nexus.identityservice.exception.DuplicateResourceException;
import com.nexus.identityservice.mapper.TraderMapper;
import com.nexus.identityservice.model.Genre;
import com.nexus.identityservice.model.Trader;
import com.nexus.identityservice.model.TraderExperience;
import com.nexus.identityservice.model.UserRol;
import com.nexus.identityservice.model.UserStatus;
import com.nexus.identityservice.repository.TraderRepository;
import com.nexus.identityservice.repository.TraderSubscriptionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TraderServiceTest {

    @Mock
    private TraderRepository traderRepository;
    @Mock
    private TraderSubscriptionRepository traderSubscriptionRepository;
    @Mock
    private TraderMapper traderMapper;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private UserLookupService userLookupService;

    private TraderService traderService;

    @BeforeEach
    void setUp() {
        traderService = new TraderService(
                traderRepository,
                traderSubscriptionRepository,
                traderMapper,
                passwordEncoder,
                userLookupService
        );
    }

    @Test
    void createAssignsSecurityAndLifecycleFields() {
        TraderCreateRequest request = request();
        Trader trader = new Trader();
        TraderResponse response = TraderResponse.builder()
                .id(9L)
                .email(request.getEmail())
                .username(request.getUsername())
                .userRol(UserRol.TRADER)
                .build();

        when(userLookupService.existsByEmail(request.getEmail())).thenReturn(false);
        when(userLookupService.existsByUsername(request.getUsername())).thenReturn(false);
        when(traderMapper.toEntity(request)).thenReturn(trader);
        when(passwordEncoder.encode(request.getPassword())).thenReturn("encoded-password");
        when(traderRepository.save(trader)).thenReturn(trader);
        when(traderMapper.toResponse(trader)).thenReturn(response);

        TraderResponse result = traderService.create(request);

        assertThat(result).isEqualTo(response);
        assertThat(trader.getPassword()).isEqualTo("encoded-password");
        assertThat(trader.getUserRol()).isEqualTo(UserRol.TRADER);
        assertThat(trader.getStatus()).isEqualTo(UserStatus.ACTIVE);
        assertThat(trader.getCreatedAt()).isNotNull();
    }

    @Test
    void createRejectsDuplicateEmailBeforePersisting() {
        TraderCreateRequest request = request();
        when(userLookupService.existsByEmail(request.getEmail())).thenReturn(true);

        assertThatThrownBy(() -> traderService.create(request))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessage("Email already registered");

        verify(traderRepository, never()).save(any());
    }

    private TraderCreateRequest request() {
        return TraderCreateRequest.builder()
                .name("Andy")
                .surname("Canon")
                .genre(Genre.MALE)
                .email("andy@nexus.local")
                .username("andy")
                .password("Andy123@")
                .phone("+573001112233")
                .address("Main Street 123")
                .nationalityCode("CO")
                .timeZone("America/Bogota")
                .experience(TraderExperience.BEGINNER)
                .build();
    }
}
