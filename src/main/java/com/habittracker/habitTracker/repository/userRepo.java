package com.habittracker.habitTracker.repository;

import com.habittracker.habitTracker.Model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface userRepo extends JpaRepository<User,Long> {

    Optional<User> findByEmail(String email);

}
