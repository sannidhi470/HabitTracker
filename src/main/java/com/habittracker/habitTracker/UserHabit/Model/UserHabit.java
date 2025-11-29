package com.habittracker.habitTracker.UserHabit.Model;

import com.habittracker.habitTracker.Auth.Model.User;
import com.habittracker.habitTracker.Habit.Model.Habit;
import jakarta.persistence.*;

@Entity
@Table(name="userhabit")
public class UserHabit {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @ManyToOne
    @JoinColumn(name="user_id", nullable=false)
    private User user;

    @ManyToOne
    @JoinColumn(name="habit_id", nullable=false)
    private Habit habit;

    @Column(nullable = true)
    private String description;

    public UserHabit() {}
    public UserHabit(User user, Habit habit, String description) {
        this.user = user;
        this.habit = habit;
        this.description = description;
    }
    public long getId() {
        return id;
    }
    public void setId(long id) {
        this.id = id;
    }
    public User getUser() {
        return user;
    }
    public void setUser(User user) {
        this.user = user;
    }
    public Habit getHabit() {
        return habit;
    }
    public void setHabit(Habit habit) {
        this.habit = habit;
    }
    public String getDescription() {
        return description;
    }
    public void setDescription(String description) {
        this.description = description;
    }
}
