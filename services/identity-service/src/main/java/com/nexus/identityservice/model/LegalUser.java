package com.nexus.identityservice.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Getter
@Setter
@NoArgsConstructor
@SuperBuilder
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)  // ← Includes User fields
@ToString(callSuper = true)
@Entity
@Table
public class LegalUser extends User {

    @Column(length = 80, nullable = false)
    private String department;
}
