package com.nexus.identityservice.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@EqualsAndHashCode(callSuper = true)
@ToString(callSuper = true)
@Entity
@Table
public class Broker extends User{

    @Column(length = 2, nullable = false)
    private String nationalityCode;

    @Column(length = 120, nullable = false)
    private String languages;

    @Column(nullable = false)
    private Integer yearsExperience;

    @Column(precision = 5, scale = 2, nullable = false)
    private BigDecimal riskProfileScore;

    @Column(precision = 5, scale = 2, nullable = false)
    private BigDecimal drawdown;

    @Column(precision = 5, scale = 2, nullable = false)
    private BigDecimal retentionRate;

    //defines the average response time in minutes
    @Column(precision = 5, scale = 2, nullable = false)
    private BigDecimal avgResponseTime;

    @Column(precision = 15, scale = 2, nullable = false)
    private BigDecimal minimumRecommendedCapital;

    @Column(length = 100, nullable = false)
    private String contactChannel;



}
