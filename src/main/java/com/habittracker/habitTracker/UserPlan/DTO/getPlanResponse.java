package com.habittracker.habitTracker.UserPlan.DTO;

import java.util.Date;

public class getPlanResponse {

    private Long userId;
    private Long habitId;
    private String planType;
    private Date startDate;
    private Date endDate;
    private int planLength;
    private int perDay;
    private String habitUnit;

    public getPlanResponse() {

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
    public String getPlanType() {
        return planType;
    }
    public void setPlanType(String planType) {
        this.planType = planType;
    }
    public Date getStartDate() {
        return startDate;
    }
    public void setStartDate(Date startDate) {
        this.startDate = startDate;
    }
    public Date getEndDate() {
        return endDate;
    }
    public void setEndDate(Date endDate) {
        this.endDate = endDate;
    }
    public int getPlanLength() {
        return planLength;
    }
    public void setPlanLength(int planLength) {
        this.planLength = planLength;
    }
    public int getPerDay() {
        return perDay;
    }
    public void setPerDay(int perDay) {
        this.perDay = perDay;
    }
    public String getHabitUnit() {
        return habitUnit;
    }
    public void setHabitUnit(String habitUnit) {
        this.habitUnit = habitUnit;
    }

}
