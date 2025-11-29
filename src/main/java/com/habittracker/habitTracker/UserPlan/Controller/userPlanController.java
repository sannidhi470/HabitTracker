package com.habittracker.habitTracker.UserPlan.Controller;

import com.habittracker.habitTracker.Auth.Model.User;
import com.habittracker.habitTracker.Auth.Service.userService;
import com.habittracker.habitTracker.Auth.repository.userRepo;
import com.habittracker.habitTracker.Habit.Model.Habit;
import com.habittracker.habitTracker.Habit.Service.habitService;
import com.habittracker.habitTracker.UserPlan.DTO.addPlanBody;
import com.habittracker.habitTracker.UserPlan.DTO.getPlanBody;
import com.habittracker.habitTracker.UserPlan.DTO.getPlanResponse;
import com.habittracker.habitTracker.UserPlan.Model.userPlan;
import com.habittracker.habitTracker.UserPlan.Service.userPlanService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/plan")
public class userPlanController {
    @Autowired
    private userPlanService userPlanService;

    @Autowired
    private habitService habitService;
    @Autowired
    private userService userService;

    @PostMapping("/addPlan")
    public ResponseEntity<?> addPlan(@RequestBody addPlanBody planbody)
    {
        User user = userService.getUserById(planbody.getUserId());
        Habit habit =habitService.getHabitById(planbody.getHabitId());
        String unit = habit.getUnit();
       userPlan userPlan = new userPlan(user,habit,planbody.getPlanType(),planbody.getStartDate(),planbody.getEndDate(),planbody.getPlanLength(),planbody.getPerDay(),unit);

        try{
            userPlanService.addUserPlan(userPlan);
            return ResponseEntity.ok().body("Successfully added plan");
        }
        catch(Exception e){
            return ResponseEntity
                    .badRequest()
                    .body("Error: " + e.getMessage());
        }

    }

    @PostMapping("/getPlan")
    public ResponseEntity<?> getPlan(@RequestBody getPlanBody getPlanBody)
    {
        try {
            userPlan userPlan = userPlanService.getUserPlan(getPlanBody.getUserId(), getPlanBody.getHabitId());

            getPlanResponse response = new getPlanResponse();
            response.setUserId(getPlanBody.getUserId());
            response.setHabitId(getPlanBody.getHabitId());
            response.setPlanLength(userPlan.getPlan_length());
            response.setPlanType(userPlan.getPlanType().name());
            response.setEndDate(userPlan.getEnd_date());
            response.setStartDate(userPlan.getStart_date());
            response.setHabitUnit(userPlan.getHabit_unit());
            response.setPerDay(userPlan.getPer_day());

            return ResponseEntity.ok().body(response);
        }
        catch(Exception e){
            return ResponseEntity
                    .badRequest()
                    .body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/getPlansByUserId")
        public ResponseEntity<?> getPlansByUserId(@RequestParam Long userId)
        {
            try {
                List<userPlan> plans = userPlanService.getUserPlans(userId);
                return ResponseEntity.ok().body(plans);
            }
            catch(Exception e){
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Error: " + e.getMessage());
            }

        }
    @DeleteMapping("/deletePlan")
    public ResponseEntity<?> deleteUserPlan(@RequestBody getPlanBody getPlanBody)
    {

            userPlanService.deleteUserPlan(getPlanBody.getUserId(), getPlanBody.getHabitId());
            return ResponseEntity.ok().body("Successfully deleted plan");

    }


}
