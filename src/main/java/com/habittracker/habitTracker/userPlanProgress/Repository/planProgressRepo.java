package com.habittracker.habitTracker.userPlanProgress.Repository;

import com.habittracker.habitTracker.Habit.Model.Habit;
import com.habittracker.habitTracker.userPlanProgress.Model.planProgress;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface planProgressRepo extends JpaRepository<planProgress, Long> {

    Optional<planProgress> findByUserIdAndHabitHabitId(long userId, long habitId);

    List<planProgress> findByUserIdAndHabitHabitIdOrderByTimestampDesc(Long userId, Long habitId);
}
