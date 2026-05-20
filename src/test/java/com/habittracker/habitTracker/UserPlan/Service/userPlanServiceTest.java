package com.habittracker.habitTracker.UserPlan.Service;

import com.habittracker.habitTracker.Auth.Model.User;
import com.habittracker.habitTracker.Auth.Service.userService;
import com.habittracker.habitTracker.Habit.Model.Habit;
import com.habittracker.habitTracker.Habit.Service.habitService;
import com.habittracker.habitTracker.UserPlan.Model.userPlan;
import com.habittracker.habitTracker.UserPlan.Repository.userPlanRepo;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class userPlanServiceTest {

    @Mock
    userPlanRepo userPlanRepo;
    @Mock
    userService userService;
    @Mock
    habitService habitService;
    @InjectMocks
    userPlanService userPlanService;
    @Test
    void addUserPlan() {
        User user = new User();
        user.setId(1);
        Habit habit = new Habit();
        habit.setHabit_id(2);
        userPlan userPlan = new userPlan();
        userPlan.setUser(user);
        userPlan.setHabit(habit);
        userPlan.setPlanType(com.habittracker.habitTracker.UserPlan.Model.userPlan.PlanType.FIXED);
        Mockito.when(userPlanRepo.findByUserIdAndHabitHabitIdAndPlanType(user.getId(),habit.getHabit_id(),userPlan.getPlanType())).thenReturn(Optional.empty());
        userPlanService.addUserPlan(userPlan);
        Mockito.verify(userPlanRepo,Mockito.times(1)).save(userPlan);
    }

    @Test
    void addUserPlanNegative() {
        User user = new User();
        user.setId(1);
        Habit habit = new Habit();
        habit.setHabit_id(2);
        userPlan userPlan = new userPlan();
        userPlan.setUser(user);
        userPlan.setHabit(habit);
        userPlan.setPlanType(com.habittracker.habitTracker.UserPlan.Model.userPlan.PlanType.FIXED);
        Mockito.when(userPlanRepo.findByUserIdAndHabitHabitIdAndPlanType(user.getId(),habit.getHabit_id(),userPlan.getPlanType())).thenReturn(Optional.of(userPlan));
        RuntimeException exception = assertThrows(RuntimeException.class, () -> userPlanService.addUserPlan(userPlan));
        assertEquals("You already have this habit assigned", exception.getMessage());
    }

    @Test
    void getUserPlan() {
        User user = new User();
        user.setId(1);
        Habit habit = new Habit();
        habit.setHabit_id(2);
        userPlan userPlan = new userPlan();
        userPlan.setUser(user);
        userPlan.setHabit(habit);
        Mockito.when(userPlanRepo.findByUserIdAndHabitHabitId(user.getId(),habit.getHabit_id())).thenReturn(Optional.of(userPlan));
        userPlan userplan = userPlanService.getUserPlan(user.getId(),habit.getHabit_id());
        assertEquals(userPlan,userplan);

    }

    @Test
    void getUserPlanNegative() {
        User user = new User();
        user.setId(1);
        Habit habit = new Habit();
        habit.setHabit_id(2);
        Mockito.when(userPlanRepo.findByUserIdAndHabitHabitId(user.getId(),habit.getHabit_id())).thenReturn(Optional.empty());
        RuntimeException exception =assertThrows(RuntimeException.class, () -> userPlanService.getUserPlan(user.getId(),habit.getHabit_id()));
        assertEquals(exception.getMessage(),"User not found");


    }

    @Test
    void deleteUserPlan() {
        User user = new User();
        user.setId(1);
        Habit habit = new Habit();
        habit.setHabit_id(2);
        userPlan userPlan = new userPlan();
        userPlan.setUser(user);
        userPlan.setHabit(habit);
        Mockito.when(userPlanRepo.findByUserIdAndHabitHabitId(user.getId(),habit.getHabit_id())).thenReturn(Optional.of(userPlan));
        userPlanService.deleteUserPlan(user.getId(),habit.getHabit_id());
        Mockito.verify(userPlanRepo,Mockito.times(1)).delete(userPlan);
    }

    @Test
    void getUserPlans() {
        User user = new User();
        user.setId(1);
        Habit habit = new Habit();
        habit.setHabit_id(2);
        userPlan userPlan = new userPlan();
        userPlan.setUser(user);
        userPlan.setHabit(habit);

        Habit habit1 = new Habit();
        habit1.setHabit_id(3);
        userPlan userPlan1 = new userPlan();
        userPlan1.setUser(user);
        userPlan1.setHabit(habit1);

        ArrayList<userPlan> userPlans = new ArrayList<>();
        userPlans.add(userPlan);
        userPlans.add(userPlan1);

        Mockito.when(userService.getUserById(user.getId())).thenReturn(user);
        Mockito.when(userPlanRepo.findByUserId(user.getId())).thenReturn(userPlans);
        List<userPlan> userplans1=  userPlanService.getUserPlans(user.getId());
        assertEquals(userPlans,userplans1);


    }

    @Test
    void getUserPlansNegative() {
        User user = new User();
        user.setId(1);
        Mockito.when(userService.getUserById(user.getId())).thenReturn(null);
        RuntimeException exception = assertThrows(RuntimeException.class,() -> userPlanService.getUserPlans(user.getId()));
        assertEquals(exception.getMessage(),"User not found");
    }
}