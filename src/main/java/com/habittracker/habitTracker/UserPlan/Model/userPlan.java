package com.habittracker.habitTracker.UserPlan.Model;

import com.habittracker.habitTracker.Auth.Model.User;
import com.habittracker.habitTracker.Habit.Model.Habit;
import jakarta.persistence.*;
import org.springframework.stereotype.Component;

import java.util.Date;

@Component
@Entity
@Table(name="userplan")
public class userPlan {
    public enum PlanType {
        FIXED,
        DEADLINE
    }
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name="user_id", nullable=false)
    private User user;

    @ManyToOne
    @JoinColumn(name="habit_id", nullable=false)
    private Habit habit;


    @Enumerated(EnumType.STRING)
    @Column(nullable=false)
    private PlanType planType;

    @Column(nullable=false)
    private Date start_date;
    @Column(nullable=false)
    private Date end_date;

    @Column(nullable=false)
    private int plan_length;

    @Column(nullable=false)
    private int per_day;

    @Column(nullable=false)
    private String habit_unit;

    public Date getEnd_date() {
        return end_date;
    }
    public void setEnd_date(Date end_date) {
        this.end_date = end_date;
    }
    public Date getStart_date() {
        return start_date;
    }
    public void setStart_date(Date start_date) {
        this.start_date = start_date;
    }
    public Long getId() {
        return id;
    }
    public void setId(Long id) {
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
    public PlanType getPlanType() {
        return planType;
    }
    public void setPlanType(PlanType planType) {
        this.planType = planType;
    }
    public int getPlan_length() {
        return plan_length;
    }
    public void setPlan_length(int plan_length) {
        this.plan_length = plan_length;
    }
    public int getPer_day() {
        return per_day;
    }
    public void setPer_day(int per_day) {
        this.per_day = per_day;
    }
    public String getHabit_unit() {
        return habit_unit;
    }
    public void setHabit_unit(String habit_unit) {
        this.habit_unit = habit_unit;
    }

    public userPlan() {}
    public userPlan(User user, Habit habit, PlanType planType, Date start_date, Date end_date, int plan_length, int per_day, String habit_unit) {
        this.user = user;
        this.habit = habit;
        this.planType = planType;
        this.start_date = start_date;
        this.end_date = end_date;
        this.plan_length = plan_length;
        this.per_day = per_day;
        this.habit_unit = habit_unit;
    }
}
