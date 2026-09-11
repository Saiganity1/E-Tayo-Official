package com.etayo.backend.repository;

import com.etayo.backend.model.SystemAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SystemAuditLogRepository extends JpaRepository<SystemAuditLog, Long> {
    List<SystemAuditLog> findAllByOrderByTimestampDesc();
}
