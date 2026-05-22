package com.nexus.identityservice.service;

import com.nexus.identityservice.dto.trader.*;
import com.nexus.identityservice.exception.DuplicateResourceException;
import com.nexus.identityservice.exception.NotFoundResourceException;
import com.nexus.identityservice.mapper.TraderMapper;
import com.nexus.identityservice.model.*;
import com.nexus.identityservice.repository.TraderRepository;
import com.nexus.identityservice.repository.TraderSubscriptionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

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

    @Test
    void createRejectsDuplicateUsernameBeforePersisting() {
        TraderCreateRequest request = request();
        when(userLookupService.existsByEmail(request.getEmail())).thenReturn(false);
        when(userLookupService.existsByUsername(request.getUsername())).thenReturn(true);

        assertThatThrownBy(() -> traderService.create(request))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessage("Username is not available");

        verify(traderRepository, never()).save(any());
    }

    @Test
    void getAllReturnsListOfAuditResponses() {
        Trader trader = new Trader();
        TraderAuditResponse response = new TraderAuditResponse();
        when(traderRepository.findAll()).thenReturn(List.of(trader));
        when(traderMapper.toAuditResponse(trader)).thenReturn(response);

        List<TraderAuditResponse> result = traderService.getAll();

        assertThat(result).hasSize(1).contains(response);
    }

    @Test
    void findByIdReturnsResponse() {
        Long id = 1L;
        Trader trader = new Trader();
        TraderResponse response = new TraderResponse();
        when(traderRepository.findById(id)).thenReturn(Optional.of(trader));
        when(traderMapper.toResponse(trader)).thenReturn(response);

        TraderResponse result = traderService.findById(id);

        assertThat(result).isEqualTo(response);
    }

    @Test
    void updateModifiesExistingTrader() {
        Long id = 1L;
        TraderUpdateRequest request = new TraderUpdateRequest();
        Trader existing = new Trader();
        TraderResponse response = new TraderResponse();

        when(traderRepository.findById(id)).thenReturn(Optional.of(existing));
        when(traderRepository.save(existing)).thenReturn(existing);
        when(traderMapper.toResponse(existing)).thenReturn(response);

        TraderResponse result = traderService.update(id, request);

        assertThat(result).isEqualTo(response);
        verify(traderMapper).updateEntity(existing, request);
        assertThat(existing.getUpdatedAt()).isNotNull();
    }

    @Test
    void updateLastLoginSavesNewTimestamp() {
        Long id = 1L;
        Trader trader = new Trader();
        when(traderRepository.findById(id)).thenReturn(Optional.of(trader));

        traderService.updateLastLogin(id);

        verify(traderRepository).save(trader);
        assertThat(trader.getLastLogin()).isNotNull();
    }

    @Test
    void getTraderSubscriptionsReturnsSortedResponses() {
        Long id = 1L;
        Trader trader = new Trader();
        TraderSubscription s1 = TraderSubscription.builder().createdAt(Instant.now().minusSeconds(100)).build();
        TraderSubscription s2 = TraderSubscription.builder().createdAt(Instant.now()).build();
        trader.setSubscriptions(List.of(s1, s2));
        
        when(traderRepository.findById(id)).thenReturn(Optional.of(trader));
        when(traderMapper.toSubscriptionResponse(any())).thenReturn(new TraderSubscriptionResponse());

        List<TraderSubscriptionResponse> result = traderService.getTraderSubscriptions(id);

        assertThat(result).hasSize(2);
        verify(traderMapper).toSubscriptionResponse(s2); // Should be first due to sorting
    }

    @Test
    void getActiveSubscriptionReturnsLatest() {
        Long id = 1L;
        TraderSubscription subscription = new TraderSubscription();
        TraderSubscriptionResponse response = new TraderSubscriptionResponse();
        
        when(traderSubscriptionRepository.findFirstByTraderIdOrderByCreatedAtDesc(id))
                .thenReturn(Optional.of(subscription));
        when(traderMapper.toSubscriptionResponse(subscription)).thenReturn(response);

        TraderSubscriptionResponse result = traderService.getActiveSubscription(id);

        assertThat(result).isEqualTo(response);
    }

    @Test
    void countReturnsRepositoryCount() {
        when(traderRepository.count()).thenReturn(10L);
        assertThat(traderService.count()).isEqualTo(10L);
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
