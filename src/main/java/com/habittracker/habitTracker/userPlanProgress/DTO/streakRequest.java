package com.habittracker.habitTracker.userPlanProgress.DTO;

import java.time.LocalDate;

public class streakRequest {
    private Long userId;
    private Long habitId;
    private LocalDate referenceDate; // optional, null = today

    public streakRequest() {
    }

    public streakRequest(Long userId, Long habitId, LocalDate referenceDate) {
        this.userId = userId;
        this.habitId = habitId;
        this.referenceDate = referenceDate;
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

    public LocalDate getReferenceDate() {
        return referenceDate;
    }

    public void setReferenceDate(LocalDate referenceDate) {
        this.referenceDate = referenceDate;
    }
}
