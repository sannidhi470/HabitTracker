package com.habittracker.habitTracker.Habit.Model;

import jakarta.persistence.*;

@Entity
@Table(name="Habits")
public class Habit {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long habitId;
    @Column(nullable = false)
    private String key;

    public Habit() {}
    public Habit(long habit_id, String key) {
        this.habitId = habit_id;
        this.key = key;
    }

    public long getHabit_id() {
        return habitId;
    }
    public void setHabit_id(long habit_id) {
        this.habitId = habit_id;
    }
    public String getKey() {
        return key;
    }

    public void setKey(String key) {
        this.key = key;
    }
}
