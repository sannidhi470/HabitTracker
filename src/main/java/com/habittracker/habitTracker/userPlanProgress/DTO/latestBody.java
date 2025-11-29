package com.habittracker.habitTracker.userPlanProgress.DTO;

import java.time.LocalDate;

public class latestBody {
    private Long userId;
    private Long habitId;
    private LocalDate timestamp;
    public latestBody(Long userId, Long habitId, LocalDate timestamp) {
        this.userId = userId;
        this.habitId = habitId;
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
    public LocalDate getTimestamp() {
        return timestamp;
    }
    public void setTimestamp(LocalDate timestamp) {
        this.timestamp = timestamp;
    }

}
