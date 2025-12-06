package com.habittracker.habitTracker.Auth.repository;

import com.habittracker.habitTracker.Auth.Model.passwordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface resetPasswordTokenRepo extends JpaRepository<passwordResetToken, Long> {
    Optional<passwordResetToken>  findByTokenHash(String tokenHash);
    void deleteAllByUserId(Long userId);
}
