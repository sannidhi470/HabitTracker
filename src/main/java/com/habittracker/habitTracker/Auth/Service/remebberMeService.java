package com.habittracker.habitTracker.Auth.Service;

import com.habittracker.habitTracker.Auth.Model.RememberMeToken;
import com.habittracker.habitTracker.Auth.repository.remeberMeRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class remebberMeService {
    @Autowired
    private remeberMeRepo remeberMeRepo;

    public void saveToken(Long userId, String tokenHash) {
        RememberMeToken rememberMeToken = new RememberMeToken();
        rememberMeToken.setUserId(userId);
        rememberMeToken.setTokenHash(tokenHash);
        rememberMeToken.setExpiresAt(LocalDateTime.now().plusDays(30));
        remeberMeRepo.save(rememberMeToken);
    }

    public Optional<RememberMeToken> findByTokenHash(String tokenHash) {
        return remeberMeRepo.findByTokenHash(tokenHash);
    }
}
