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

    public planProgress GetLatestProgress(Long userId, Long habitId) {
        List<planProgress> list = planProgressRepo.findByUserIdAndHabitHabitIdOrderByTimestampDesc(userId, habitId);
        if(list.isEmpty()){
            return null;
        }
        return list.get(0);
    }

    public List<planProgress> getProgress(Long userId, Long habitId) {
        List<planProgress> list = planProgressRepo.findByUserIdAndHabitHabitIdOrderByTimestampDesc(userId, habitId);
        if(list.isEmpty()){
            return null;
        }
        return list;
    }

    public int getLoggedValue(Long user_id, Long habit_id){
        planProgress latest = GetLatestProgress(user_id, habit_id);
        if(latest == null){
            return 0;
        }
        else {
            return latest.getLogValue();
        }
    }

    public void addProgress(Long userId, Long habitId, int logValue){
        int modifiedLogValue=0;
        planProgress latest = GetLatestProgress(userId, habitId);
        if(latest != null) {
            LocalDate latestDate = latest.getTimestamp()
                    .toInstant()
                    .atZone(ZoneId.systemDefault())
                    .toLocalDate();

            LocalDate today = LocalDate.now();
            if (latestDate.equals(today)) {
                modifiedLogValue = getLoggedValue(userId, habitId) + logValue;
            }
            else {
                modifiedLogValue = logValue;
            }
        }
        else
        {
            modifiedLogValue = logValue;
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
            planProgress planProgress = new planProgress(user, habit, modifiedLogValue);
            planProgressRepo.save(planProgress);
        } else {
                throw new RuntimeException("Habit with id " + habitId + " does not exist for this user");
            }

        }



    }


