package com.habittracker.habitTracker.Auth.repository;

import com.habittracker.habitTracker.Auth.Model.RememberMeToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface remeberMeRepo extends JpaRepository<RememberMeToken, Long> {
    Optional<RememberMeToken> findByTokenHash(String token);
}
