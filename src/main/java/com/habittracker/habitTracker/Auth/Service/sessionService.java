package com.habittracker.habitTracker.Auth.Service;

import com.habittracker.habitTracker.Auth.Model.sessionToken;
import com.habittracker.habitTracker.Auth.repository.sessionTokenRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class sessionService {
    @Autowired
    private sessionTokenRepo sessionTokenRepo;
    public void saveToken(Long userId, String tokenHash) {
        sessionToken t = new sessionToken();
        t.setUserId(userId);
        t.setTokenHash(tokenHash);
        t.setExpiresAt(LocalDateTime.now().plusHours(24));
        sessionTokenRepo.save(t);
    }

    public Optional<sessionToken> findByTokenHash(String tokenHash) {
        return sessionTokenRepo.findByTokenHash(tokenHash);
    }

    public void deleteByTokenHash(String tokenHash) {
        sessionTokenRepo.deleteByTokenHash(tokenHash);
    }

    public void deleteAllForUser(Long userId) {
        sessionTokenRepo.deleteAllByUserId(userId);
    }

}
