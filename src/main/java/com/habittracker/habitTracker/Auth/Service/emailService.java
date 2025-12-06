package com.habittracker.habitTracker.Auth.Service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;


@Service
public class emailService {

    @Autowired
    private JavaMailSender mailSender;

    public void sendResetEmail(String to, String resetURL)
    {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("Reset your Habit Tracker password");
        message.setText(
                "We received a request to reset your password.\n\n" +
                        "Click this link to reset (valid for ~30 minutes):\n" + resetURL + "\n\n" +
                        "If you did not request this, you can ignore this email."

        );
            mailSender.send(message);
            System.out.println("✅ Reset email sent successfully to: " + to);

    }

    public void sendPasswordChangedEmail(String to)
    {
        SimpleMailMessage message = new SimpleMailMessage();
//        message.setFrom(from);
        message.setTo(to);
        message.setSubject("Your Habit Tracker password was changed");
        message.setText(
                "Your password was just changed. If this wasn't you, please contact support immediately."
        );
        mailSender.send(message);
    }

}
