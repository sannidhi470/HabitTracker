package com.habittracker.habitTracker.Auth.Model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name="session_tokens")
public class sessionToken {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable=false, unique=true)
    private String tokenHash;

    @Column(nullable=false)
    private Long userId;

    @Column(nullable=false)
    private LocalDateTime expiresAt;

    public sessionToken() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTokenHash() { return tokenHash; }
    public void setTokenHash(String tokenHash) { this.tokenHash = tokenHash; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public LocalDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }
}
