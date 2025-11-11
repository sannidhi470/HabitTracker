package com.habittracker.habitTracker.Service;

import com.habittracker.habitTracker.Model.User;
import com.habittracker.habitTracker.repository.userRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class userService {

    @Autowired
    private userRepo userrepo;

    private BCryptPasswordEncoder bCryptPasswordEncoder = new BCryptPasswordEncoder();

    public User signup(User user) {

        if(userrepo.findByEmail(user.getEmail()).isPresent()){
            throw new RuntimeException("Email already exists"); // In this case user needs to login - need to handle in frontend
        }

        user.setPassword(bCryptPasswordEncoder.encode(user.getPassword()));
        return userrepo.save(user);
    }
    public void login(String email, String password){
        if(!userrepo.findByEmail(email).isPresent()){
            throw new RuntimeException("Email or password incorrect");
        }
    }

}
