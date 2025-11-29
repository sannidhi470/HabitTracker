package com.habittracker.habitTracker.Auth.Controller;

import com.habittracker.habitTracker.Auth.DTO.GetIdRequest;
import com.habittracker.habitTracker.Auth.DTO.LoginRequest;
import com.habittracker.habitTracker.Auth.Model.User;
import com.habittracker.habitTracker.Auth.Service.remebberMeService;
import com.habittracker.habitTracker.Auth.Service.userService;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.util.DigestUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/user")
public class userController {
    @Autowired
    private userService userService;

    @Autowired
    private remebberMeService remebberMeService;

    @PostMapping("/google")
    public ResponseEntity<?> googleLogin(@RequestBody Map<String, String> body) {
        String idToken = body.get("idToken");

        try {
            // Call Google's token info endpoint
            RestTemplate restTemplate = new RestTemplate();
            String url = "https://oauth2.googleapis.com/tokeninfo?id_token=" + idToken;
            Map<String, String> googleResponse = restTemplate.getForObject(url, Map.class);

            // Validate audience
            String clientId = "1069499229387-s8p28ijht9559oc1oo465ot36rrgmrr6.apps.googleusercontent.com";
            if (!clientId.equals(googleResponse.get("aud"))) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Invalid ID token audience"));
            }

            String email = googleResponse.get("email");
            String name = googleResponse.get("name");

            // Check if user exists
            User user = userService.getUserByEmail(email);
            if (user == null) {
                user = new User();
                user.setEmail(email);
                user.setFullName(name);
                userService.saveUser(user);
            }

            Map<String, Object> response = new HashMap<>();
            response.put("email", user.getEmail());
            response.put("userId", user.getId());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    @PostMapping("/signup")
    public ResponseEntity<Void> signup(@RequestBody User user){
        try{
            User newuser = userService.signup(user);
            return ResponseEntity.status(HttpStatus.CREATED).build();
        }
        catch(RuntimeException e){
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @PostMapping("/login")
    public ResponseEntity<Void> login(@RequestBody LoginRequest loginRequest, HttpServletResponse response) {
        try{
            User user=userService.login(loginRequest.getEmail(), loginRequest.getPassword());
            if(loginRequest.isRememberMe())
            {
                String token= UUID.randomUUID().toString();
                String tokenHash = HashUtil.sha256Hex(token);
                remebberMeService.saveToken(user.getId(), tokenHash);
                ResponseCookie cookie = ResponseCookie.from("remember_me", token)
                        .httpOnly(true)
                        .secure(true)
                        .path("/")
                        .maxAge(60 * 60 * 24 * 30)   // 30 days
                        .sameSite("Lax")
                        .build();
                response.addHeader("Set-Cookie", cookie.toString());
            }
            return ResponseEntity.status(HttpStatus.OK).build();
        }
        catch(RuntimeException e){
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @GetMapping("/getUsers")
    public ResponseEntity<List<User>> getUsers(){
        List<User> users = userService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    @PostMapping("/getUserId")
    public ResponseEntity<?> getUserId(@RequestBody GetIdRequest getIdRequest){
        try
        {
            Long id = userService.getUserId(getIdRequest.getEmail());
            return ResponseEntity.ok(id);
        }
        catch(RuntimeException e){
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(List.of("Error: " + e.getMessage()));
        }

    }
}
