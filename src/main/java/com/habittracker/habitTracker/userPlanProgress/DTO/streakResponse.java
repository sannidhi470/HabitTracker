package com.habittracker.habitTracker.userPlanProgress.DTO;

public class streakResponse {
    private Long userId;
    private Long habitId;
    private int currentStreak;
    private int longestStreak;

    public streakResponse() {
    }

    public streakResponse(Long userId, Long habitId, int currentStreak, int longestStreak) {
        this.userId = userId;
        this.habitId = habitId;
        this.currentStreak = currentStreak;
        this.longestStreak = longestStreak;
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

    public int getCurrentStreak() {
        return currentStreak;
    }

    public void setCurrentStreak(int currentStreak) {
        this.currentStreak = currentStreak;
    }

    public int getLongestStreak() {
        return longestStreak;
    }

    public void setLongestStreak(int longestStreak) {
        this.longestStreak = longestStreak;
    }
}
