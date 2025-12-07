package com.habittracker.habitTracker.Auth.Service;

import com.habittracker.habitTracker.Auth.Controller.HashUtil;
import com.habittracker.habitTracker.Auth.Model.User;
import com.habittracker.habitTracker.Auth.Model.passwordResetToken;
import com.habittracker.habitTracker.Auth.repository.resetPasswordTokenRepo;
import com.habittracker.habitTracker.Auth.repository.userRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.Optional;

@Service
public class passwordResetService {

    @Value("${app.url:http://localhost:5173}")
    private String url;

    @Autowired
    private userRepo userRepo;

    @Autowired
    private resetPasswordTokenRepo resetPasswordTokenRepo;

    @Autowired
    private remebberMeService remebberMeService;

    @Autowired
    private EmailService  emailService;

    private final BCryptPasswordEncoder bCryptPasswordEncoder = new BCryptPasswordEncoder();
    private final SecureRandom secureRandom = new SecureRandom();
    private String generateToken() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return HexFormat.of().formatHex(bytes); // URL-safe hex
    }
    public void requestReset(String email) {
        if(email == null || email.trim().isEmpty()) return;

        Optional<User> userR = userRepo.findByEmail(email);
        if(userR.isEmpty())
        {
            throw new RuntimeException("No user found with email " + email);
        }
        User user = userR.get();
        resetPasswordTokenRepo.deleteAllByUserId(user.getId());
        String rawToken = generateToken();
        String tokenHash = HashUtil.sha256Hex(rawToken);
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiresAt = now.plusMinutes(30);
        passwordResetToken passwordResetToken = new passwordResetToken(tokenHash,user.getId(),expiresAt,now);
        resetPasswordTokenRepo.save(passwordResetToken);

        String resetURL = url+"/reset-password?token="+rawToken;
        //TO REPLACE WITH ACTUAL EMAIL SERVICE
        try {
            emailService.sendResetEmail(user.getEmail(), resetURL);
        }
        catch (Exception e) {
            throw new RuntimeException("Failed to send reset email", e);
        }
//        System.out.println("[Password Reset] Send to " + user.getEmail() + ": " + resetURL);
    }

    public void resetPassword(String rawToken,String newPassword)
    {
        if (rawToken == null || rawToken.isBlank()) throw new RuntimeException("Invalid token");
        if (newPassword == null || newPassword.length() < 8) throw new RuntimeException("Password too short"); // ADD THE PROPER VALIDAION HERE
        String tokenHash = HashUtil.sha256Hex(rawToken);
        passwordResetToken prt = resetPasswordTokenRepo.findByTokenHash(tokenHash)
                .orElseThrow(() -> new RuntimeException("Invalid or expired token"));
        if (prt.getUsedAt() != null || prt.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Invalid or expired token");
        }
        User user = userRepo.findById(prt.getUserId()).orElseThrow(() -> new RuntimeException("User not found"));
        user.setPassword(bCryptPasswordEncoder.encode(newPassword));
        userRepo.save(user);
//        emailService.sendPasswordChangedEmail(user.getEmail());
        resetPasswordTokenRepo.deleteAllByUserId(user.getId());
        remebberMeService.deleteAllForUser(user.getId());
    }
}
