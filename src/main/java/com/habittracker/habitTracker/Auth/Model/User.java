package com.habittracker.habitTracker.Auth.Model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.*;
import jdk.jfr.Enabled;

@Entity
@Table(name="users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;
    @Column(nullable = false, unique = true)
    private String email;
    @Column(nullable = false)
    private String password;
    @Column(nullable = false)
    private String fullName;
    public User(String email, String password, String fullName) {

        this.email = email;
        this.password = password;
        this.fullName = fullName;
    }

    public User() {

    }

    public String getEmail() {
        return email;
    }
    public String getPassword() {
        return password;
    }
    public String getFullName() {
        return fullName;
    }
    public void setEmail(String email) {
        this.email = email;
    }
    public void setPassword(String password) {
        this.password = password;
    }
    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

}
