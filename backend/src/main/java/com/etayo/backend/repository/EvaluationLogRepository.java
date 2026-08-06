package com.etayo.backend.repository;

import com.etayo.backend.model.EvaluationLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EvaluationLogRepository extends JpaRepository<EvaluationLog, Long> {
    List<EvaluationLog> findByStaffEmailOrderByTimestampDesc(String staffEmail);
}
