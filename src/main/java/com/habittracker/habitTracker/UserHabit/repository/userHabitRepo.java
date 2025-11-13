package com.habittracker.habitTracker.UserHabit.repository;

import com.habittracker.habitTracker.UserHabit.Model.UserHabit;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface userHabitRepo extends JpaRepository<UserHabit, Long> {

    List<UserHabit> findByUserId(long userId);
    Optional<UserHabit> findByHabitHabitId(long habitId);
    Optional<UserHabit> findByUserIdAndHabitHabitId(long userId, long habitId);
}
