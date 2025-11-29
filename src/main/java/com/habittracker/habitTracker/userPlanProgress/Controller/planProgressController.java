package com.habittracker.habitTracker.userPlanProgress.Controller;

import com.habittracker.habitTracker.userPlanProgress.DTO.addProgressBody;
import com.habittracker.habitTracker.userPlanProgress.DTO.latestBody;
import com.habittracker.habitTracker.userPlanProgress.Model.planProgress;
import com.habittracker.habitTracker.userPlanProgress.Service.planProgressService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("api/progress")
public class planProgressController {

    @Autowired
    private planProgressService planProgressService;


    @PostMapping("/addProgress")
    public ResponseEntity<?> addProgress(@RequestBody addProgressBody progressBody) {
        try {
            planProgressService.addProgress(progressBody.getUserId(), progressBody.getHabitId(), progressBody.getLogValue(),progressBody.getTimestamp());
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }

    }

    @PostMapping("/latest")
    public ResponseEntity<?> getLatestProgress(@RequestBody latestBody latestBody) {
        try {
            planProgress latest = planProgressService.GetLatestProgress(latestBody.getUserId(), latestBody.getHabitId(), latestBody.getTimestamp());
            if(latest != null){
                return ResponseEntity.ok().body(latest);
            }
            else {
                return ResponseEntity.status(499).body("Custom client error");
            }
        } catch (RuntimeException e) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    @PostMapping("/getRecords")
    public ResponseEntity<?> getProgress(@RequestBody latestBody latestBody) {
        List<planProgress> records = new ArrayList<planProgress>();
        try {
            records = planProgressService.getProgress(latestBody.getUserId(), latestBody.getHabitId());
            return ResponseEntity.ok().body(records);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();

        }
    }

    @GetMapping("/getRecordsBuUserId")
    public ResponseEntity<?> getRecordsBuUserId(@RequestParam Long userId) {
        try {
            List<planProgress> records = planProgressService.getProgressForUserId(userId);
            return ResponseEntity.ok().body(records);
        }
        catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }

    }
    @DeleteMapping("/deleteRecords")
    public ResponseEntity<?> deleteProgress(@RequestBody latestBody latestBody) {

            planProgressService.deleteProgress(latestBody.getUserId(), latestBody.getHabitId());
            return ResponseEntity.ok().build();

    }




}
