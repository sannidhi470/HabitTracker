package com.habittracker.habitTracker.Controller;

import com.habittracker.habitTracker.Model.User;
import com.habittracker.habitTracker.Service.userService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class userController {
    @Autowired
    private userService userService;

    @PostMapping("/signup")
    public ResponseEntity<Void> signup(@RequestBody User user){
        try{
            User newuser = userService.signup(user);
            return ResponseEntity.status(HttpStatus.CREATED).build();
        }
        catch(RuntimeException e){
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @PostMapping("/login")
    public ResponseEntity<Void> login(@RequestBody String email, @RequestBody String password){
        try{
            userService.login(email, password);
            return ResponseEntity.status(HttpStatus.CREATED).build();
        }
        catch(RuntimeException e){
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

}
