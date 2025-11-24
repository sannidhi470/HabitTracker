package com.habittracker.habitTracker.UserPlan.DTO;

public class getPlanBody {
    private Long userId;
    private Long habitId;

    public getPlanBody(Long userId, Long habitId) {
        this.userId = userId;
        this.habitId = habitId;
    }
    public getPlanBody() {

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
