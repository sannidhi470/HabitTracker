package com.habittracker.habitTracker.Habit.repository;

import com.habittracker.habitTracker.Habit.Model.Habit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.Optional;

public interface habitRepo extends JpaRepository<Habit, Long> {

    Optional<Habit> findByKey(String name);
    Optional<Habit> findByHabitId(Long id);
}
