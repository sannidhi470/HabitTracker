package com.habittracker.habitTracker.Auth.Service;

import com.habittracker.habitTracker.Auth.Model.User;
import com.habittracker.habitTracker.Auth.repository.userRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

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

    public User login(String email, String password){

        Optional<User> user = userrepo.findByEmail(email);
        if(user.isEmpty()){
            throw new RuntimeException("Email or password incorrect");
        }

        if(!bCryptPasswordEncoder.matches(password,user.get().getPassword())){
            throw new RuntimeException("Email or password incorrect");
        }
        return user.get();
    }

}
