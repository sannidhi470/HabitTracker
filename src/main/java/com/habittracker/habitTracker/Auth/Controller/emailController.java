package com.habittracker.habitTracker.Auth.Controller;

import com.habittracker.habitTracker.Auth.Service.emailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class emailController {
    @Autowired
    private emailService emailService;

    @GetMapping("/test-email")
    public String testEmail() {
        try {
            emailService.sendResetEmail("sannidhishetty9@gmail.com", "http://localhost:5173/reset?token=TEST");
            return "Test email triggered";
        }
        catch (Exception e) {
            e.printStackTrace();
            return "Test email could not be sent";
        }
    }
}
