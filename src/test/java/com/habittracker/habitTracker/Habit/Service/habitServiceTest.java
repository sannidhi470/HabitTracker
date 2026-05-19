package com.habittracker.habitTracker.Habit.Service;

import com.habittracker.habitTracker.Habit.Model.Habit;
import com.habittracker.habitTracker.Habit.repository.habitRepo;
import org.junit.jupiter.api.BeforeAll;
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
class habitServiceTest {
    static Habit habit = null;
    @BeforeAll
    static void setUp() {
         habit = new Habit();
        habit.setKey("habitKey");
        habit.setUnit("unit");
        habit.setHabit_id(1);
    }
    @Mock
    habitRepo habitRepo;
    @InjectMocks
    habitService habitService;

    @Test
    void addHabit() {
        Habit habit = new Habit();
        habit.setKey("habitKey");
        habit.setUnit("unit");
        Mockito.when(habitRepo.save(habit)).thenReturn(habit);
        habitService.addHabit(habit);
        Mockito.verify(habitRepo, Mockito.times(1)).save(habit);
    }

    @Test
    void getAllHabits() {
        Habit habit1 = new Habit();
        habit1.setKey("habitKey1");
        habit1.setUnit("unit1");
        Habit habit2 = new Habit();
        habit2.setKey("habitKey2");
        habit2.setUnit("unit2");
        ArrayList<Habit> habits = new ArrayList<>();
        habits.add(habit1);
        habits.add(habit2);
        Mockito.when(habitRepo.findAll()).thenReturn(habits);
        List<Habit> habits1 = habitService.getAllHabits();
        assertEquals(habits.size(), habits1.size());
        assertEquals(habits.get(0).getKey(), habits1.get(0).getKey());
    }

    @Test
    void getHabitById() {
        Mockito.when(habitRepo.findById(habit.getHabit_id())).thenReturn(Optional.of(habit));
        Habit habit1 = habitService.getHabitById(habit.getHabit_id());
        assertEquals(habit.getHabit_id(), habit1.getHabit_id());
    }

    @Test
    void getHabitByIdNegative() {
        Mockito.when(habitRepo.findById(habit.getHabit_id())).thenReturn(Optional.empty());
        RuntimeException exception = assertThrows(RuntimeException.class, () -> habitService.getHabitById(habit.getHabit_id()));
        assertEquals("Habit not found", exception.getMessage());
    }

    @Test
    void getHabitUnit() {
        Mockito.when(habitRepo.findById(habit.getHabit_id())).thenReturn(Optional.of(habit));
        String unit = habitService.getHabitUnit(habit.getHabit_id());
        assertEquals(habit.getUnit(), unit);
    }

    @Test
    void getHabitUnitNegative()
    {
        Mockito.when(habitRepo.findById(habit.getHabit_id())).thenReturn(Optional.empty());
        RuntimeException exception = assertThrows(RuntimeException.class, () -> habitService.getHabitUnit(habit.getHabit_id()));
        assertEquals("Habit not found", exception.getMessage());
    }

    @Test
    void getHabitId() {
        Mockito.when(habitRepo.findByKey(habit.getKey().toLowerCase())).thenReturn(Optional.of(habit));
        Long id = habitService.getHabitId(habit.getKey());
        assertEquals(habit.getHabit_id(), id);
    }

    @Test
    void getHabitIdNegative() {
        Mockito.when(habitRepo.findByKey(habit.getKey().toLowerCase())).thenReturn(Optional.empty());
        RuntimeException exception = assertThrows(RuntimeException.class, () -> habitService.getHabitId(habit.getKey()));
        assertEquals(exception.getMessage(), "Habit not found");
    }

    @Test
    void getHabitName() {
        Mockito.when(habitRepo.findByHabitId(habit.getHabit_id())).thenReturn(Optional.of(habit));
        String name = habitService.getHabitName(habit.getHabit_id());
        assertEquals(habit.getKey(),name);
    }

    @Test
    void getHabitNameNegative() {
        Mockito.when(habitRepo.findByHabitId(habit.getHabit_id())).thenReturn(Optional.empty());
        RuntimeException exception = assertThrows(RuntimeException.class, () -> habitService.getHabitName(habit.getHabit_id()));
        assertEquals(exception.getMessage(),"Habit not found");
    }

    @Test
    void deleteHabitById() {
        Mockito.when(habitRepo.existsById(habit.getHabit_id())).thenReturn(true);
        habitService.deleteHabitById(habit.getHabit_id());
        Mockito.verify(habitRepo, Mockito.times(1)).deleteById(habit.getHabit_id());
    }

    @Test
    void deleteHabitNegative() {
        Habit habit = new Habit();
        habit.setHabit_id(1);
        Mockito.when(habitRepo.existsById(habit.getHabit_id())).thenReturn(false);
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {habitService.deleteHabitById(habit.getHabit_id());});
        assertEquals(exception.getMessage(),"Habit not found");

    }
}