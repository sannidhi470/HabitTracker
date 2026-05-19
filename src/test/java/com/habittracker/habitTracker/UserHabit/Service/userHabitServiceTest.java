package com.habittracker.habitTracker.UserHabit.Service;

import com.habittracker.habitTracker.Auth.Model.User;
import com.habittracker.habitTracker.Auth.Service.userService;
import com.habittracker.habitTracker.Auth.repository.userRepo;
import com.habittracker.habitTracker.Habit.Model.Habit;
import com.habittracker.habitTracker.Habit.Service.habitService;
import com.habittracker.habitTracker.Habit.repository.habitRepo;
import com.habittracker.habitTracker.UserHabit.Model.UserHabit;
import com.habittracker.habitTracker.UserHabit.repository.userHabitRepo;
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
class userHabitServiceTest {
    @Mock
    userHabitRepo userHabitRepo;
    @Mock
    userRepo userrepo;
    @Mock
    habitRepo habitRepo;
    @Mock
    userService userService;
    @Mock
    habitService habitService;
    @InjectMocks
    userHabitService userHabitService;
    @Test
    void addUserHabit() {
        User user = new User();
        user.setId(1);
        Habit habit = new Habit();
        habit.setHabit_id(2);
        Mockito.when(userService.getUserById(user.getId())).thenReturn(user);
        Mockito.when(habitService.getHabitById(habit.getHabit_id())).thenReturn(habit);
        Mockito.when(userHabitRepo.findByUserIdAndHabitHabitId(user.getId(),habit.getHabit_id())).thenReturn(Optional.empty());
        UserHabit userHabit = new UserHabit(user, habit,"");
        Mockito.when(userHabitRepo.save(Mockito.any(UserHabit.class))).thenReturn(userHabit);
        UserHabit userHabit1 = userHabitService.addUserHabit(user.getId(),habit.getHabit_id());
        assertEquals(user, userHabit1.getUser());
        assertEquals(habit, userHabit1.getHabit());


    }

    @Test
    void getHabitForUserId() {
        Habit habit1 = new Habit();
        habit1.setHabit_id(1);
        habit1.setKey("key1");
        Habit habit2 = new Habit();
        habit2.setHabit_id(2);
        habit2.setKey("key2");
        User  user = new User();
        user.setId(1);
        UserHabit userHabit1 = new UserHabit(user, habit1,"");
        UserHabit userHabit2 = new UserHabit(user, habit2,"");
        ArrayList<UserHabit> userHabits = new ArrayList<>();
        userHabits.add(userHabit1);
        userHabits.add(userHabit2);
        Mockito.when(userHabitRepo.findByUserId(user.getId())).thenReturn(userHabits);
        List<String> habitnames = userHabitService.getHabitForUserId(user.getId());
        assertTrue(habitnames.contains("key1"));
        assertTrue(habitnames.contains("key2"));

    }

    @Test
    void deleteUserHabit() {
        Habit habit1 = new Habit();
        habit1.setHabit_id(1);
        habit1.setKey("key1");
        User  user = new User();
        user.setId(1);
        UserHabit userHabit1 = new UserHabit(user, habit1,"");
        Mockito.when(userHabitRepo.findByUserIdAndHabitHabitId(user.getId(), habit1.getHabit_id())).thenReturn(Optional.of(userHabit1));
        userHabitService.deleteUserHabit(user.getId(),habit1.getHabit_id());
        Mockito.verify(userHabitRepo,Mockito.times(1)).delete(userHabit1);
    }

    @Test
    void getHabitIdsForUserId() {
        Habit habit1 = new Habit();
        habit1.setHabit_id(1L);
        habit1.setKey("key1");
        Habit habit2 = new Habit();
        habit2.setHabit_id(2L);
        habit2.setKey("key2");
        User  user = new User();
        user.setId(1);
        UserHabit userHabit1 = new UserHabit(user, habit1,"");
        UserHabit userHabit2 = new UserHabit(user, habit2,"");
        ArrayList<UserHabit> userHabits = new ArrayList<>();
        userHabits.add(userHabit1);
        userHabits.add(userHabit2);
        Mockito.when(userHabitRepo.findByUserId(user.getId())).thenReturn(userHabits);
        List<Long> habitIds = userHabitService.getHabitIdsForUserId(user.getId());
        assertTrue(habitIds.contains(1L));
        assertTrue(habitIds.contains(2l));
    }

    @Test
    void getAllUserHabits() {
        Habit habit1 = new Habit();
        habit1.setHabit_id(1L);
        habit1.setKey("key1");
        Habit habit2 = new Habit();
        habit2.setHabit_id(2L);
        habit2.setKey("key2");
        User  user = new User();
        user.setId(1);
        UserHabit userHabit1 = new UserHabit(user, habit1,"");
        UserHabit userHabit2 = new UserHabit(user, habit2,"");
        ArrayList<UserHabit> userHabits = new ArrayList<>();
        userHabits.add(userHabit1);
        userHabits.add(userHabit2);
        Mockito.when(userHabitRepo.findAll()).thenReturn(userHabits);
        List<UserHabit> userHabits1 = userHabitService.getAllUserHabits();
        assertEquals(userHabits1.get(0).getHabit().getKey(),userHabits.get(0).getHabit().getKey());
    }
}