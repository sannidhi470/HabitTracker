package com.habittracker.habitTracker.userPlanProgress.Repository;

import com.habittracker.habitTracker.Habit.Model.Habit;
import com.habittracker.habitTracker.userPlanProgress.Model.planProgress;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Date;
import java.util.List;
import java.util.Optional;

public interface planProgressRepo extends JpaRepository<planProgress, Long> {

    List<planProgress> findByUserIdAndHabitHabitId(long userId, long habitId);
    List<planProgress> findByUserId(long userId);
    List<planProgress> findByUserIdAndHabitHabitIdOrderByTimestampDesc(Long userId, Long habitId);
    Optional<planProgress> findTopByUserIdAndHabitHabitIdAndTimestampOrderByIdDesc(Long userId, Long habitId, LocalDate timestamp);
    List<planProgress> findByUserIdAndHabitHabitIdAndTimestampBetweenOrderByTimestampAsc(Long userId, Long habitId, LocalDate start, LocalDate end);
}
