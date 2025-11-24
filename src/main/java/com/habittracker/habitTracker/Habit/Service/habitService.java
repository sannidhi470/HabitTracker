package com.habittracker.habitTracker.Habit.Service;

import com.habittracker.habitTracker.Habit.Model.Habit;
import com.habittracker.habitTracker.Habit.repository.habitRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class habitService {

    @Autowired
    private habitRepo habitRepo;

    public void  addHabit(Habit habit){
        habitRepo.save(habit);
    }
    public List<Habit> getAllHabits(){
        return habitRepo.findAll();

    }

    public Habit getHabitById(Long id){
        Optional<Habit> habit = habitRepo.findById(id);
        if(habit.isEmpty()){
            throw new RuntimeException("Habit not found");
        }
        return habit.get();
    }

    public String getHabitUnit(Long id){
        Optional<Habit> habit = habitRepo.findById(id);
        if(habit.isEmpty()){
            throw new RuntimeException("Habit not found");
        }
        return habit.get().getUnit();
    }

    public Long getHabitId(String name)
    {
            Optional<Habit> habit = habitRepo.findByKey(name);
            if(habit.isPresent())
            {
                return habit.get().getHabit_id();
            }
            else {
                throw new RuntimeException("Habit not found");
            }
    }

    public String getHabitName(Long id)
    {
        Optional<Habit> habit = habitRepo.findByHabitId(id);
        if(habit.isPresent())
        {
            return habit.get().getKey();
        }
        else {
           throw new RuntimeException("Habit not found");
        }
    }

    public void deleteHabitById(Long id) {
        if (habitRepo.existsById(id)) {
            habitRepo.deleteById(id);
        }
        else {
            throw new RuntimeException("Habit not found");
        }

    }
}
