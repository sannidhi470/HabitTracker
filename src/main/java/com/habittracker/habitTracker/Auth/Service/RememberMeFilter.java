package com.habittracker.habitTracker.Auth.Service;

import com.habittracker.habitTracker.Auth.Controller.HashUtil;
import com.habittracker.habitTracker.Auth.Model.User;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;

@Component
public class RememberMeFilter extends OncePerRequestFilter {
    @Autowired
    private remebberMeService remebberMeService;

    @Autowired
    private userService userService;

    @Autowired
    private sessionService sessionService;

    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        try {
            if (SecurityContextHolder.getContext().getAuthentication() == null) {
                Cookie[] cookies = request.getCookies();
                if (cookies != null) {
                    for (Cookie c : cookies) {
                        if ("remember_me".equals(c.getName())) {
                            String rawToken = c.getValue();
                            String hash = HashUtil.sha256Hex(rawToken);

                            var optToken = remebberMeService.findByTokenHash(hash);

                            if (optToken.isPresent() &&
                                    optToken.get().getExpiresAt().isAfter(LocalDateTime.now())) {

                                User u = userService.getUserById(optToken.get().getUserId());

                                UsernamePasswordAuthenticationToken auth =
                                        new UsernamePasswordAuthenticationToken(u, null, new ArrayList<>());

                                SecurityContextHolder.getContext().setAuthentication(auth);
                                break;
                            }
                        }
                        if ("session_token".equals(c.getName())) {
                            String raw = c.getValue();
                            String hash = HashUtil.sha256Hex(raw);

                            var opt = sessionService.findByTokenHash(hash);

                            if (opt.isPresent() &&
                                    opt.get().getExpiresAt().isAfter(LocalDateTime.now())) {

                                User u = userService.getUserById(opt.get().getUserId());

                                UsernamePasswordAuthenticationToken auth =
                                        new UsernamePasswordAuthenticationToken(u, null, new ArrayList<>());

                                SecurityContextHolder.getContext().setAuthentication(auth);
                                break;
                            }
                        }
                    }
                }
            }
        } finally {
            chain.doFilter(request, response);
        }
    }
}
