package com.habittracker.habitTracker.userPlanProgress.Service;

import com.habittracker.habitTracker.Auth.Model.User;
import com.habittracker.habitTracker.Auth.Service.userService;
import com.habittracker.habitTracker.Habit.Model.Habit;
import com.habittracker.habitTracker.Habit.Service.habitService;
import com.habittracker.habitTracker.UserHabit.Service.userHabitService;
import com.habittracker.habitTracker.userPlanProgress.Model.planProgress;
import com.habittracker.habitTracker.userPlanProgress.Repository.planProgressRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Date;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

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
    }









