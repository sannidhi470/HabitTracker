package com.habittracker.habitTracker.userPlanProgress.Service;

import com.habittracker.habitTracker.Auth.Model.User;
import com.habittracker.habitTracker.Auth.Service.userService;
import com.habittracker.habitTracker.Habit.Model.Habit;
import com.habittracker.habitTracker.Habit.Service.habitService;
import com.habittracker.habitTracker.UserHabit.Service.userHabitService;
import com.habittracker.habitTracker.UserPlan.Model.userPlan;
import com.habittracker.habitTracker.UserPlan.Service.userPlanService;
import com.habittracker.habitTracker.userPlanProgress.DTO.streakResponse;
import com.habittracker.habitTracker.userPlanProgress.Model.planProgress;
import com.habittracker.habitTracker.userPlanProgress.Repository.planProgressRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cglib.core.Local;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;

@Service
public class planProgressService {

    @Autowired
    private planProgressRepo planProgressRepo;

    @Autowired
    private userService userService;

    @Autowired
    private habitService habitService;

    @Autowired
    private userHabitService userHabitService;

    @Autowired
    private userPlanService userPlanService;

    public planProgress GetLatestProgress(Long userId, Long habitId, LocalDate timestamp) {
        Optional<planProgress> latest= planProgressRepo.findTopByUserIdAndHabitHabitIdAndTimestampOrderByIdDesc(userId, habitId, timestamp);
        if(userService.getUserById(userId)==null){
            throw new RuntimeException("User not found");
        }
        if(habitService.getHabitById(habitId)==null){
            throw new RuntimeException("Habit not found");
        }
        if(latest.isPresent())
        {
            return latest.get();
        }
        else
        {
            return null;

        }
    }

    public List<planProgress> getProgress(Long userId, Long habitId) {
        List<planProgress> list = planProgressRepo.findByUserIdAndHabitHabitIdOrderByTimestampDesc(userId, habitId);
        if(list.isEmpty()){
            return null;
        }
        return list;
    }

    public List<planProgress> getProgressForUserId(Long userId)
    {
        if(userService.getUserById(userId)==null){
            throw new RuntimeException("User not found");
        }
        List<planProgress> planlist = planProgressRepo.findByUserId(userId);
        if(planlist.isEmpty()){
            return null;
        }
        return planlist;
    }




    public void deleteProgress(Long userId, Long habitId){
        List<planProgress> plans = planProgressRepo.findByUserIdAndHabitHabitId(userId, habitId);
        if(plans.isEmpty()){
            return;
        }
        else {
            for(planProgress pl : plans){
                planProgressRepo.delete(pl);
            }
        }
    }
    public void addProgress(Long userId, Long habitId, int logValue, LocalDate date){
        int modifiedLogValue=0;
            planProgress latest = GetLatestProgress(userId, habitId, date);
            if(latest!=null){
                modifiedLogValue=latest.getLogValue()+logValue;
            }
            else
            {
                modifiedLogValue=logValue;
            }
            User user = userService.getUserById(userId);
            if(user == null){
                throw new RuntimeException("User not found");
            }
            Habit habit = habitService.getHabitById(habitId);
            if(habit == null){
                throw new RuntimeException("Habit with id " + habitId + " does not exist");
            }
            boolean habitExistsForUser = false;
            for (Long id : userHabitService.getHabitIdsForUserId(userId)) {
                if (Objects.equals(id, habitId)) {
                    habitExistsForUser = true;
                    break;
                }
            }
            if(habitExistsForUser){
                planProgress planProgress = new planProgress(user, habit, modifiedLogValue,date);
                planProgressRepo.save(planProgress);
            } else {
                throw new RuntimeException("Habit with id " + habitId + " does not exist for this user");
            }



        }

        public streakResponse getStreak(Long userId, Long habitId, LocalDate referenceDate){
            if (referenceDate == null) {
                referenceDate = LocalDate.now(ZoneId.systemDefault());
            }
            if(userService.getUserById(userId)==null){
                throw new RuntimeException("User not found");
            }
            if(habitService.getHabitById(habitId)==null){
                throw new RuntimeException("Habit not found");
            }
            userPlan plan = userPlanService.getUserPlan(userId, habitId);
            LocalDate planStart = plan.getStart_date()
                    .toInstant()
                    .atZone(ZoneId.systemDefault())
                    .toLocalDate();
            LocalDate planEnd = plan.getEnd_date()
                    .toInstant()
                    .atZone(ZoneId.systemDefault())
                    .toLocalDate();
            if(referenceDate.isBefore(planStart)){
                return new streakResponse(userId,habitId,0,0);
            }
            LocalDate effectiveEnd = referenceDate.isAfter(planEnd) ? planEnd : referenceDate;
            List<planProgress> entries = planProgressRepo.findByUserIdAndHabitHabitIdAndTimestampBetweenOrderByTimestampAsc(userId, habitId, planStart, effectiveEnd);

            Map<LocalDate,Integer> totals = new HashMap<>();
            for(planProgress entry : entries){
                LocalDate d = entry.getDate();
                if(totals.containsKey(d)){
                    totals.put(d,totals.get(d)+entry.getLogValue());
                }
                else {
                    totals.put(d,entry.getLogValue());
                }
            }

            int targetPerDay = plan.getPer_day();
            //Walk backwards
            int currentStreak=0;
            LocalDate day = effectiveEnd;
            while(day.isAfter(planStart) || day.isEqual(planStart)){
                int value = totals.getOrDefault(day, 0);
                if(value>=targetPerDay){
                    currentStreak++;
                    day = day.minusDays(1);
                }
                else
                {
                    break;
                }
            }

            int longestStreak=0;
            int running=0;

            for(LocalDate d = planStart;  !d.isAfter(effectiveEnd); d = d.plusDays(1)) {
                int value = totals.getOrDefault(d, 0);
                if(value>=targetPerDay){
                    running++;
                    if(running>longestStreak)
                    {
                        longestStreak=running;
                    }

                }
                else
                {
                    running=0;
                }
            }
            return new streakResponse(userId,habitId,currentStreak,longestStreak);
        }
    }









