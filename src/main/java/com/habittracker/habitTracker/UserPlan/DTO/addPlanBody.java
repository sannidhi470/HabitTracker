package com.habittracker.habitTracker.UserPlan.DTO;

import com.habittracker.habitTracker.UserPlan.Model.userPlan;

import java.util.Date;

public class addPlanBody {

    private Long  userId;
    private Long habitId;
    private userPlan.PlanType planType;
    private Date startDate;
    private Date endDate;
    private int planLength;
    private int perDay;
    private String unit;

    public addPlanBody() {

    }
   public addPlanBody(Long userId, Long habitId, userPlan.PlanType planType, Date startDate, Date endDate, int planLength, int perDay, String unit) {
        this.userId = userId;
        this.habitId = habitId;
        this.planType = planType;
        this.startDate = startDate;
        this.endDate = endDate;
        this.planLength = planLength;
        this.perDay = perDay;
        this.unit = unit;

   }
    public void setUserId(Long userId) {
        this.userId = userId;
    }
    public void setHabitId(Long habitId) {
        this.habitId = habitId;
    }
    public void setPlanType(userPlan.PlanType planType) {
        this.planType = planType;
    }
    public void setStartDate(Date startDate) {
        this.startDate = startDate;
    }
    public void setEndDate(Date endDate) {
        this.endDate = endDate;
    }
    public void setPlanLength(int planLength) {
        this.planLength = planLength;
    }
    public void setPerDay(int perDay) {
        this.perDay = perDay;
    }
    public void setUnit(String unit) {
        this.unit = unit;
    }
    public userPlan.PlanType getPlanType() {
        return planType;
    }
    public Date getStartDate() {
        return startDate;
    }
    public Date getEndDate() {
        return endDate;
    }
    public int getPlanLength() {
        return planLength;
    }
    public int getPerDay() {
        return perDay;
    }
    public String getUnit() {
        return unit;
    }
    public Long getUserId() {
        return userId;
    }
    public Long getHabitId() {
        return habitId;
    }


}
