package com.habittracker.habitTracker.userPlanProgress.DTO;

public class addProgressBody {

    private Long userId;
    private Long habitId;
    private int logValue;
    public addProgressBody() {}
    public addProgressBody(Long userId, Long habitId, int logValue) {
        this.userId = userId;
        this.habitId = habitId;
        this.logValue = logValue;
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
    public int getLogValue() {
        return logValue;
    }
    public void setLogValue(int logValue) {
        this.logValue = logValue;
    }

}
