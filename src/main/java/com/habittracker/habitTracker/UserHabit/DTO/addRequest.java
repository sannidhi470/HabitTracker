package com.habittracker.habitTracker.UserHabit.DTO;

public class addRequest {
    private Long habitId;
    private Long userId;
    public addRequest() {}
    public addRequest(Long habitId, Long userId) {
        this.habitId = habitId;
        this.userId = userId;
    }
    public Long getHabitId() {
        return habitId;
    }
    public void setHabitId(Long habitId) {
        this.habitId = habitId;
    }
    public Long getUserId() {
        return userId;
    }
    public void setUserId(Long userId) {
        this.userId = userId;
    }
}
