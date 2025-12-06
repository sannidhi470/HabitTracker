package com.habittracker.habitTracker.Auth.Model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name="passwordresettoken")
public class passwordResetToken {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String tokenHash;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private LocalDateTime expiresAt;

    @Column
    private LocalDateTime usedAt;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    public passwordResetToken() {

    }
    public passwordResetToken(String tokenHash, Long userId, LocalDateTime expiresAt, LocalDateTime createdAt) {
        this.tokenHash = tokenHash;
        this.userId = userId;
        this.expiresAt = expiresAt;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }
    public void setId(Long id) {
        this.id = id;
    }
    public String getTokenHash() {
        return tokenHash;
    }
    public void setTokenHash(String tokenHash) {
        this.tokenHash = tokenHash;
    }
    public Long getUserId() {
        return userId;
    }
    public void setUserId(Long userId) {
        this.userId = userId;
    }
    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }
    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }
    public LocalDateTime getUsedAt() {
        return usedAt;
    }
    public void setUsedAt(LocalDateTime usedAt) {
        this.usedAt = usedAt;
    }
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }


}
