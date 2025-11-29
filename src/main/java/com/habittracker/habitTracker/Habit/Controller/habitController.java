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

            habitService.addHabit(habit);
            return ResponseEntity.status(HttpStatus.OK).build();


    }

    @GetMapping("/getAllHabits")
    public List<Habit> getAllHabits(){
        return habitService.getAllHabits();
    }

    //To better this make getHabit info first check what is needed and return the same
    @GetMapping("/getHabitId")
    public ResponseEntity<Long> getHabitById(@RequestParam String name){
        try {
            return ResponseEntity.status(HttpStatus.OK).body(habitService.getHabitId(name));
        }
        catch (RuntimeException e)
        {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @GetMapping("/getHabitName")
    public ResponseEntity<String> getHabitName(@RequestParam Long id){
        try
        {
            return ResponseEntity.status(HttpStatus.OK).body(habitService.getHabitName(id));
        }
        catch (RuntimeException e)
        {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @GetMapping("/getHabitUnit")
    public ResponseEntity<String> getHabitUnit(@RequestParam Long id){
        try {
            String unit = habitService.getHabitUnit(id);
            return ResponseEntity.status(HttpStatus.OK).body(unit);
        }
        catch (RuntimeException e)
        {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @DeleteMapping("/deleteHabit")
    public ResponseEntity<Void> deleteHabit(@RequestParam Long id){
        try{
            habitService.deleteHabitById(id);
            return ResponseEntity.status(HttpStatus.OK).build();
        }
        catch (RuntimeException e)
            {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }
    }

}
