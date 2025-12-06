package com.habittracker.habitTracker.Auth.repository;

import com.habittracker.habitTracker.Auth.Model.sessionToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface sessionTokenRepo extends JpaRepository<sessionToken, Long> {
    Optional<sessionToken> findByTokenHash(String tokenHash);
    void deleteByTokenHash(String tokenHash);
    void deleteAllByUserId(Long userId);
}
