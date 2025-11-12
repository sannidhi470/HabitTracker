package com.habittracker.habitTracker.Habit.Controller;

import com.habittracker.habitTracker.Habit.Model.Habit;
import com.habittracker.habitTracker.Habit.Service.habitService;
import com.habittracker.habitTracker.Habit.repository.habitRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/habit")
public class habitController {
    @Autowired
    private habitService habitService;

    @PostMapping("/addHabit")
    public ResponseEntity<Void> addHabit(@RequestBody Habit habit){
        try
        {
            habitService.addHabit(habit);
            return ResponseEntity.status(HttpStatus.OK).build();
        }
        catch (RuntimeException e)
        {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }

    }

    @GetMapping("/getAllHabits")
    public List<Habit> getAllHabits(){
        return habitService.getAllHabits();
    }

    @GetMapping("/getHabitId")
    public Long getHabitById(@RequestParam String name){
        return habitService.getHabitId(name);
    }

    @GetMapping("/getHabitName")
    public String getHabitName(@RequestParam Long id){
        return habitService.getHabitName(id);
    }

    @DeleteMapping("/deleteHabit")
    public void deleteHabit(@RequestParam Long id){
        habitService.deleteHabitById(id);
    }

}
