package com.habittracker.habitTracker.Auth.Controller;

import com.habittracker.habitTracker.Auth.Service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping; // Use GetMapping for easy browser testing
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth") // Keep this consistent with your other auth controllers
public class EmailController {

    @Autowired
    private EmailService emailService;

    @GetMapping("/test-email") // Changed to GET so you can hit it from browser easily
    public ResponseEntity<String> testEmail() {
        try {
            System.out.println("🚨 HIT /api/auth/test-email");

            // USE THE EMAIL THAT WORKED IN YOUR TEST
            String toEmail = "sannidhishetty9@gmail.com";

            emailService.sendResetEmail(toEmail, "http://localhost:5173/reset?token=TEST");

            return ResponseEntity.ok("✅ Test email triggered to " + toEmail);
        }
        catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("❌ Error: " + e.getMessage());
        }
    }
}