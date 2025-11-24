package com.habittracker.habitTracker.userPlanProgress.DTO;

public class latestBody {
    private Long userId;
    private Long habitId;
    public latestBody(Long userId, Long habitId) {
        this.userId = userId;
        this.habitId = habitId;
    }
    public Long getUserId() {
        return userId;
    }
    public void setUserId(Long userId) {
        this.userId = userId;
    }
    public Long getHabitId() {
        return habitId;
    }
    public void setHabitId(Long habitId) {
        this.habitId = habitId;
    }

}
