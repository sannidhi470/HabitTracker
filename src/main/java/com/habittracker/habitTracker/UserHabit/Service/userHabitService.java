package com.habittracker.habitTracker.UserHabit.Service;

import com.habittracker.habitTracker.Auth.Model.User;
import com.habittracker.habitTracker.Auth.Service.userService;
import com.habittracker.habitTracker.Habit.Model.Habit;
import com.habittracker.habitTracker.Habit.Service.habitService;
import com.habittracker.habitTracker.UserHabit.Model.UserHabit;
import com.habittracker.habitTracker.UserHabit.repository.userHabitRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class userHabitService {

    @Autowired
    private userHabitRepo userHabitRepo;
    @Autowired
    private userService userService;
    @Autowired
    private habitService habitService;

    public UserHabit addUserHabit(Long user_id, Long habit_id)
    {

        User user = userService.getUserById(user_id);
        Habit habit = habitService.getHabitById(habit_id);
        boolean not_exists= userHabitRepo.findByUserIdAndHabitHabitId(user_id, habit_id).isEmpty();
        if(not_exists) {
            UserHabit userHabit = new UserHabit(user, habit,"");
            userHabitRepo.save(userHabit);
            return userHabit;
        }
        else {
            throw new RuntimeException("Habit already attached to user");
        }
    }

    public List<String> getHabitForUserId(Long user_id)
    {  // use habitId in the function getHabitIdsForUsers to get names
        List<UserHabit> userHabits = userHabitRepo.findByUserId(user_id);
        if(userHabits.isEmpty())
        {
            throw new RuntimeException("Habit not found for the user");
        }
        List<String> habitnames = new ArrayList<>();
        for(UserHabit userHabit : userHabits)
        {
            Habit habit = userHabit.getHabit();
            String habitname = habit.getKey();
            habitnames.add(habitname);
        }
        return habitnames;
    }
    public void deleteUserHabit(Long user_id, Long habit_id)
    {
        Optional<UserHabit> userhabit = userHabitRepo.findByUserIdAndHabitHabitId(user_id, habit_id);
        if(userhabit.isPresent())
        {
            userHabitRepo.delete(userhabit.get());
        }
        else {
            return;
        }
    }
    public List<Long> getHabitIdsForUserId(Long user_id)
    {
        List<UserHabit> userHabits = userHabitRepo.findByUserId(user_id);
        if(userHabits.isEmpty())
        {
            throw new RuntimeException("Habit not found for the user");
        }
        List<Long> habitIds = new ArrayList<>();
        for(UserHabit userHabit : userHabits)
        {   //Habit object is not neede as you can use the Habit DB directly
            Habit habit = userHabit.getHabit();
            Long habitId = habit.getHabit_id();
            habitIds.add(habitId);
        }
        return habitIds;
    }

    public List<UserHabit> getAllUserHabits()
    {
        List<UserHabit> userHabits = userHabitRepo.findAll();
        return userHabits;
    }

}
