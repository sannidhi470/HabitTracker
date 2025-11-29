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
    @Value("${openai.api.key}")
    private String apiKey;

    @PostMapping("/getAIHabits")
    public ResponseEntity<?> getAIHabits(@RequestBody Map<String, String> req){
        try {
            String description = req.get("description");
            String url = "https://api.openai.com/v1/chat/completions";

            String systemPrompt =
                    "You are a concise habit coach. Given a free-form goal, return ONLY a JSON array of up to 3 DISTINCT single-word habit keywords in Title Case. English letters only. No explanations. " +
                            "User: Goal: \"" + description + "\" " +
                            "Rules: 1-3 items, single word each, Title Case, no duplicates, no extra text.";

            RestTemplate restTemplate = new RestTemplate();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            Map<String, Object> body = new HashMap<>();
            body.put("model", "gpt-4o-mini");
            body.put("messages", List.of(
                    Map.of("role", "system", "content", systemPrompt),
                    Map.of("role", "user", "content", description)
            ));

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

            String response = restTemplate.postForObject(url, entity, String.class);

            return ResponseEntity.ok(response);
        }
        catch(Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
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
