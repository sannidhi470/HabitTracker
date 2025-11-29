package com.habittracker.habitTracker.userPlanProgress.Model;

import com.habittracker.habitTracker.Auth.Model.User;
import com.habittracker.habitTracker.Habit.Model.Habit;
import org.hibernate.annotations.CreationTimestamp;
import jakarta.persistence.*;

import java.time.LocalDate;
import java.util.Date;

@Entity
@Table(name="planprogress")
public class planProgress {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @ManyToOne
    @JoinColumn(name="user_id", nullable=false)
    private User user;

    @ManyToOne
    @JoinColumn(name="habit_id", nullable=false)
    private Habit habit;

    @Column(nullable=false)
    private LocalDate timestamp;

    @Column(nullable=false)
    private int logValue;

    public planProgress() {}
    public planProgress(User user, Habit habit, int logValue, LocalDate timestamp) {
        this.user = user;
        this.habit = habit;
        this.logValue = logValue;
        this.timestamp = timestamp;
    }

    public int getId() {
        return id;
    }
    public void setId(int id) {
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
    public int getLogValue() {
        return logValue;
    }
    public void setLogValue(int logValue) {
        this.logValue = logValue;
    }
    public LocalDate getDate() {
        return timestamp;
    }
    public void setDate(LocalDate date) {
        this.timestamp = date;
    }
}
