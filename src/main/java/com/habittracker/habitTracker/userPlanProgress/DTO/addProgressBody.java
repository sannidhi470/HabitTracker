package com.habittracker.habitTracker.userPlanProgress.DTO;

import java.time.LocalDate;
import java.util.Date;

public class addProgressBody {

    private Long userId;
    private Long habitId;
    private int logValue;
    private LocalDate timestamp;
    public addProgressBody() {}
    public addProgressBody(Long userId, Long habitId, int logValue, LocalDate timestamp) {
        this.userId = userId;
        this.habitId = habitId;
        this.logValue = logValue;
        this.timestamp = timestamp;
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
    public LocalDate getTimestamp() {
        return timestamp;
    }
    public void setTimestamp(LocalDate timestamp) {
        this.timestamp = timestamp;
    }

}
