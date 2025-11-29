package com.habittracker.habitTracker.Habit.Model;

import jakarta.persistence.*;

@Entity
@Table(name="Habits")
public class Habit {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long habitId;
    @Column(nullable = false, unique = true)
    private String key;
    @Column(nullable = false)
    private String unit;

    public Habit() {}
    public Habit(long habit_id, String key, String unit) {
        this.habitId = habit_id;
        this.key = key;
        this.unit = unit;
    }

    public String getUnit() {
        return unit;
    }
    public void setUnit(String unit) {
        this.unit = unit;
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
