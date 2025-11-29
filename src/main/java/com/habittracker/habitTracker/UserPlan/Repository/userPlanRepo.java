package com.habittracker.habitTracker.UserPlan.Repository;

import com.habittracker.habitTracker.UserPlan.Model.userPlan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface userPlanRepo extends JpaRepository<userPlan, Long> {

    Optional<userPlan> findByHabitHabitId(long habitId);
    List<userPlan> findByUserId(long userId);
    Optional<userPlan> findByUserIdAndHabitHabitId(long habitId, long userId);
    Optional<userPlan> findByUserIdAndHabitHabitIdAndPlanType(long userId, long habitId, userPlan.PlanType plantype);
}