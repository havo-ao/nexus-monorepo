package com.nexus.identityservice.service;

import com.nexus.identityservice.dto.notification.NotificationRequest;
import com.nexus.identityservice.model.User;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.http.MediaType;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Date;

@Slf4j
@Service
public class NotificationServiceClient {

    private final RestClient restClient;
    private final String baseUrl;

    public NotificationServiceClient(@Value("${notification-service-url}") String baseUrl) {
        if (baseUrl != null && baseUrl.endsWith("/")) {
            baseUrl = baseUrl.substring(0, baseUrl.length() - 1);
        }
        this.baseUrl = baseUrl;
        log.info("Initializing NotificationServiceClient with baseUrl: {}", this.baseUrl);
        this.restClient = RestClient.builder()
                .baseUrl(this.baseUrl)
                .build();
    }

    @Async
    public void sendNotification(NotificationRequest request) {
        String endpoint = "/notifications/email";
        try {
            log.info("Attempting to send notification {} to {} via URL: {}{}", 
                    request.getTemplateName(), request.getEmail(), this.baseUrl, endpoint);
            log.debug("Notification payload: {}", request);
            restClient.post()
                    .uri(endpoint)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .onStatus(status -> status.isError(), (req, res) -> {
                        String responseBody = new String(res.getBody().readAllBytes());
                        log.error("Notification service returned error: {} {} for URL: {}. Response: {}", 
                                res.getStatusCode(), res.getStatusText(), req.getURI(), responseBody);
                        throw new RuntimeException("Notification service error: " + res.getStatusCode() + " " + responseBody);
                    })
                    .toBodilessEntity();
            log.info("Notification {} sent successfully to {}", request.getTemplateName(), request.getEmail());
        } catch (Exception e) {
            log.error("Failed to send notification {} to {}. Target URL: {}{}", 
                    request.getTemplateName(), request.getEmail(), this.baseUrl, endpoint);
            log.error("Error details - Type: {}, Message: {}", e.getClass().getName(), e.getMessage());
            if (e.getCause() != null) {
                log.error("Caused by: {} {}", e.getCause().getClass().getName(), e.getCause().getMessage());
            }
        }
    }

    public void sendLoginSuccess(User user) {
        NotificationRequest request = NotificationRequest.builder()
                .templateName("LOGIN_SUCCESS")
                .email(user.getEmail())
                .name(user.getName())
                .surname(user.getSurname())
                .username(user.getUserNickname())
                .occurredAt(Instant.now())
                .build();
        sendNotification(request);
    }

    public void sendLoginFailed(User user) {
        NotificationRequest request = NotificationRequest.builder()
                .templateName("LOGIN_FAILED")
                .email(user.getEmail())
                .name(user.getName())
                .surname(user.getSurname())
                .username(user.getUserNickname())
                .occurredAt(Instant.now())
                .build();
        sendNotification(request);
    }

    public void sendUserRegistered(User user) {
        NotificationRequest request = NotificationRequest.builder()
                .templateName("USER_REGISTERED")
                .email(user.getEmail())
                .name(user.getName())
                .surname(user.getSurname())
                .username(user.getUserNickname())
                .occurredAt(Instant.now())
                .build();
        sendNotification(request);
    }
}
