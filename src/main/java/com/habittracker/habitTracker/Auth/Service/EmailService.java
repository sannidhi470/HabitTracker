package com.habittracker.habitTracker.Auth.Service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;


@Service
public class EmailService {
    @Autowired
    private JavaMailSender mailSender;

    public void sendResetEmail(String to, String resetURL) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom("sannidhi.shetty16@gmail.com");
        message.setTo(to);
        message.setSubject("Reset your Habit Tracker password");
        message.setText("We received a request to reset your password.\n\n" +
                "Click this link to reset (valid for ~30 minutes):\n" + resetURL + "\n\n" +
                "If you did not request this, ignore this email.");

        mailSender.send(message);
        System.out.println("✅ Reset email sent to: " + to);
    }

    public void sendPasswordChangedEmail(String to)
    {
        SimpleMailMessage message = new SimpleMailMessage();
       message.setFrom("sannidhi.shetty16@gmail.com");
        message.setTo(to);
        message.setSubject("Your Habit Tracker password was changed");
        message.setText(
                "Your password was just changed. If this wasn't you, please contact support immediately."
        );
        mailSender.send(message);
    }

}
