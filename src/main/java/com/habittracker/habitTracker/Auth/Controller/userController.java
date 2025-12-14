package com.habittracker.habitTracker.Auth.Controller;

import com.habittracker.habitTracker.Auth.DTO.GetIdRequest;
import com.habittracker.habitTracker.Auth.DTO.LoginRequest;
import com.habittracker.habitTracker.Auth.Model.User;
import com.habittracker.habitTracker.Auth.Service.remebberMeService;
import com.habittracker.habitTracker.Auth.Service.sessionService;
import com.habittracker.habitTracker.Auth.Service.userService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
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

    @Autowired
    private sessionService sessionService;

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
                boolean prod = true;
                ResponseCookie cookie = ResponseCookie.from("remember_me", token)
                        .httpOnly(true)
                        .secure(prod)
                        .path("/")
                        .maxAge(60 * 60 * 24 * 30)   // 30 days
                        .sameSite(prod ? "None" : "Lax")
                        .build();
                response.addHeader("Set-Cookie", cookie.toString());
            }
            else {
                String token = UUID.randomUUID().toString();
                String tokenHash = HashUtil.sha256Hex(token);
                sessionService.saveToken(user.getId(), tokenHash);

                // Session cookie = no maxAge set
                ResponseCookie cookie = ResponseCookie.from("session_token", token)
                        .httpOnly(true)
                        .secure(false) // use false on HTTP dev; set true in HTTPS prod
                        .path("/")
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

    @GetMapping("/me")
    public ResponseEntity<?> Me(){
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getPrincipal() == null || !(auth.getPrincipal() instanceof User)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        User u = (User) auth.getPrincipal();
        Map<String, Object> body = new HashMap<>();
        body.put("userId", u.getId());
        body.put("email", u.getEmail());
        body.put("fullName", u.getFullName());
        return ResponseEntity.ok(body);
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

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request, HttpServletResponse response) {
        String rawToken = null;
        String sessionRaw = null;
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie c : cookies) {
                if ("remember_me".equals(c.getName())) {
                    rawToken = c.getValue();
                    break;
                }
                if ("session_token".equals(c.getName())) {
                    sessionRaw = c.getValue();
                    break;
                }
            }
        }

        try {
            if (rawToken != null && !rawToken.isBlank()) {
                String hash = HashUtil.sha256Hex(rawToken);
                remebberMeService.deleteByTokenHash(hash);
            }
            if(sessionRaw != null && !sessionRaw.isBlank()) {
                String hash = HashUtil.sha256Hex(sessionRaw);
                sessionService.deleteByTokenHash(hash);
            }
        } catch (Exception ignored) {
        }
        boolean prod=true;
        ResponseCookie clearedSession = ResponseCookie.from("session_token", "")
                .httpOnly(true)
                .secure(prod) // same note as above
                .path("/")
                .maxAge(0)
                .sameSite(prod ? "None" : "Lax")
                .build();
        response.addHeader("Set-Cookie", clearedSession.toString());

        // Clear cookie (note: for HTTP localhost dev, use .secure(false))
        ResponseCookie cleared = ResponseCookie.from("remember_me", "")
                .httpOnly(true)
                .secure(false)
                .path("/")
                .maxAge(0)
                .sameSite("Lax")
                .build();
        response.addHeader("Set-Cookie", cleared.toString());

        SecurityContextHolder.clearContext();
        return ResponseEntity.ok().build();
    }
}
