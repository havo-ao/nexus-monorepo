package com.nexus.identityservice.model;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Getter
@Setter
@NoArgsConstructor
@SuperBuilder
@EqualsAndHashCode(callSuper = true)
@ToString(callSuper = true)
@Entity
@Table
public class Trader extends User {
    @Column(length = 12, nullable = false)
    private String phone;
    @Column(length = 100, nullable = false)
    private String address;
    @Column(length = 2, nullable = false)
    private String nationalityCode;
    @Column(length = 64, nullable = false)
    //data input example: Europe/Istanbul; it's easy to convert to ZoneId and use Instant to timestamps;
    private String timeZone;
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private TraderExperience experience;
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private UserStatus status;
    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean emailVerified;
    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean phoneVerified;

}
