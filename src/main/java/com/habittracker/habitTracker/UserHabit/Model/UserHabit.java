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

    public UserHabit() {}
    public UserHabit(User user, Habit habit) {
        this.user = user;
        this.habit = habit;
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
}
