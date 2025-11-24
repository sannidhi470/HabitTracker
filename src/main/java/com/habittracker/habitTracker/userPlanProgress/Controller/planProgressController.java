package com.habittracker.habitTracker.userPlanProgress.Controller;

import com.habittracker.habitTracker.userPlanProgress.DTO.addProgressBody;
import com.habittracker.habitTracker.userPlanProgress.DTO.latestBody;
import com.habittracker.habitTracker.userPlanProgress.Model.planProgress;
import com.habittracker.habitTracker.userPlanProgress.Service.planProgressService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("api/progress")
public class planProgressController {

    @Autowired
    private planProgressService planProgressService;


    @PostMapping("/addProgress")
    public ResponseEntity<?> addProgress(@RequestBody addProgressBody progressBody){
        try {
            planProgressService.addProgress(progressBody.getUserId(),progressBody.getHabitId(),progressBody.getLogValue());
            return ResponseEntity.ok().build();
        }
        catch (Exception e){
            return ResponseEntity.badRequest().body(e.getMessage());
        }

    }

    @PostMapping("/latest")
    public ResponseEntity<?> getLatestProgress(@RequestBody latestBody latestBody){
        planProgress latest = planProgressService.GetLatestProgress(latestBody.getUserId(),latestBody.getHabitId());
        if(latest == null){
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok().body(latest);
    }
}
