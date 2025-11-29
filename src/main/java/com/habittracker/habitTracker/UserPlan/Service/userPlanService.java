package com.habittracker.habitTracker.UserPlan.Service;

import com.habittracker.habitTracker.Auth.Model.User;
import com.habittracker.habitTracker.Auth.Service.userService;
import com.habittracker.habitTracker.Auth.repository.userRepo;
import com.habittracker.habitTracker.Habit.Model.Habit;
import com.habittracker.habitTracker.Habit.Service.habitService;
import com.habittracker.habitTracker.Habit.repository.habitRepo;
import com.habittracker.habitTracker.UserPlan.Model.userPlan;
import com.habittracker.habitTracker.UserPlan.Repository.userPlanRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class userPlanService {

    @Autowired
    private userPlanRepo userPlanRepo;

    @Autowired
    private userService userService;

    @Autowired
    private habitService habitService;
    public void addUserPlan(userPlan userPlan){
        User user = userPlan.getUser();
        Habit habit = userPlan.getHabit();
        userPlan.PlanType planType = userPlan.getPlanType();
        Long userId = user.getId();
        Long habitId =habit.getHabit_id();
        boolean exists = !userPlanRepo.findByUserIdAndHabitHabitIdAndPlanType(userId, habitId, planType).isEmpty();
        if(exists){
            throw new RuntimeException("You already have this habit assigned");
        }
        else {
            userPlanRepo.save(userPlan);
        }


    }

//    public userPlan.PlanType getPlanType(Long userId)
//    {
//
//       if(userPlanRepo.findByUserId(userId).isPresent())
//       {
//           return userPlanRepo.findByUserId(userId).get().getPlanType();
//       }
//       else
//       {
//           throw new RuntimeException("User not found");
//       }
//    }

    public userPlan getUserPlan(Long userId, Long habitId)
    {
        if(userPlanRepo.findByUserIdAndHabitHabitId(userId,habitId).isPresent())
        {
            return userPlanRepo.findByUserIdAndHabitHabitId(userId,habitId).get();
        }
        else
        {
            throw new RuntimeException("User not found");
        }
    }

    public void deleteUserPlan(Long userId, Long habitId)
    {
        Optional<userPlan> userplan = userPlanRepo.findByUserIdAndHabitHabitId(userId,habitId);
        if(userplan.isPresent())
        {
            userPlanRepo.delete(userplan.get());
        }
        else
        {
            return;
        }
    }

    public List<userPlan> getUserPlans(Long userId)
    {
        if(userService.getUserById(userId)==null)
        {
            throw new RuntimeException("User not found");
        }
        List<userPlan> userPlans = userPlanRepo.findByUserId(userId);
        if(userPlans.isEmpty())
        {
            return null;
        }
        else
        {
            return userPlans;
        }
    }
}
