package com.habittracker.habitTracker.userPlanProgress.Model;

import com.habittracker.habitTracker.Auth.Model.User;
import com.habittracker.habitTracker.Habit.Model.Habit;
import org.hibernate.annotations.CreationTimestamp;
import jakarta.persistence.*;

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

    @CreationTimestamp
    @Column(nullable=false)
    private Date timestamp;

    @Column(nullable=false)
    private int logValue;

    public planProgress() {}
    public planProgress(User user, Habit habit, int logValue) {
        this.user = user;
        this.habit = habit;
        this.logValue = logValue;
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
    public Date getTimestamp() {
        return timestamp;
    }
    public void setTimestamp(Date timestamp) {
        this.timestamp = timestamp;
    }
    public int getLogValue() {
        return logValue;
    }
    public void setLogValue(int logValue) {
        this.logValue = logValue;
    }

}
