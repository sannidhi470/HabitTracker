package com.habittracker.habitTracker.Auth.Controller;

import com.habittracker.habitTracker.Auth.DTO.ForgotPasswordRequest;
import com.habittracker.habitTracker.Auth.DTO.ResetPasswordRequest;
import com.habittracker.habitTracker.Auth.Service.passwordResetService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class passwordResetController {

    @Autowired
    private passwordResetService passwordResetService;

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequest forgotPasswordRequest) {
        try {
            if (forgotPasswordRequest == null || forgotPasswordRequest.getEmail() == null) {
                return ResponseEntity.badRequest().build();
            }
            passwordResetService.requestReset(forgotPasswordRequest.getEmail());
            return ResponseEntity.status(HttpStatus.OK).body("If that email exists, we sent a reset link.");
        }
        catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }

    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest resetPasswordRequest) {
        try {
            if (resetPasswordRequest == null || resetPasswordRequest.getNewPassword() == null || resetPasswordRequest.getToken() == null)
                return ResponseEntity.badRequest().body("Invalid payload");
            passwordResetService.resetPassword(resetPasswordRequest.getNewPassword(), resetPasswordRequest.getToken());
            return ResponseEntity.ok("Password has been reset.");
        }catch (Exception e){
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
