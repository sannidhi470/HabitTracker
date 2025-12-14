package com.habittracker.habitTracker.UserHabit.Controller;

import com.habittracker.habitTracker.UserHabit.DTO.addRequest;
import com.habittracker.habitTracker.UserHabit.Model.UserHabit;
import com.habittracker.habitTracker.UserHabit.Service.userHabitService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/userhabit")
public class userHabitController {

    @Autowired
    private userHabitService userHabitService;

    @PostMapping("/addHabitToUser")
    public ResponseEntity addHabitToUser(@RequestBody addRequest  addRequest) {
        try {
           UserHabit userHabit= userHabitService.addUserHabit(addRequest.getUserId(), addRequest.getHabitId());
           return ResponseEntity.status(HttpStatus.CREATED).build();
        }
        catch(RuntimeException e){
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }
    @DeleteMapping("/deleteUserHabit")
    public ResponseEntity<?>  deleteUserHabit(@RequestBody addRequest  addRequest){

            userHabitService.deleteUserHabit(addRequest.getUserId(), addRequest.getHabitId());
            return ResponseEntity.ok().build();

    }
    @GetMapping("/getHabits")
    public ResponseEntity<List<String>> getAllHabits(@RequestParam Long userId) {
        try
        {
            List<String> habitnames = userHabitService.getHabitForUserId(userId);
            return ResponseEntity.ok(habitnames);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(List.of("Error: " + e.getMessage()));
        }
    }

    @GetMapping("/getAllUserHabits")
    public ResponseEntity<List<UserHabit>> getAllUserHabits() {
        List<UserHabit>  userHabits = userHabitService.getAllUserHabits();
        return ResponseEntity.ok(userHabits);
    }
}
