package com.habittracker.habitTracker.Auth.Controller;

import com.habittracker.habitTracker.Auth.Service.emailService;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.testng.AbstractTestNGSpringContextTests;
import org.testng.annotations.Test;

@SpringBootTest
public class emailServiceTest extends AbstractTestNGSpringContextTests {

    @Autowired
    private emailService emailS;

    @Test
    public void testSendEmail() {
        emailS.sendResetEmail("sannidhishetty9@gmail.com", "http://localhost:5173/reset?token=TEST");
        System.out.println("✅ Test executed");
    }
}

