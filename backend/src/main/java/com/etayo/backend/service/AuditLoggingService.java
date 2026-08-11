package com.etayo.backend.service;

import com.etayo.backend.model.SystemAuditLog;
import com.etayo.backend.repository.SystemAuditLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class AuditLoggingService {

    @Autowired
    private SystemAuditLogRepository auditLogRepository;

    @Autowired
    private HttpServletRequest request;

    public void logAction(String action, String userEmail, String details) {
        String ipAddress = getClientIp();
        SystemAuditLog log = new SystemAuditLog(action, userEmail, details, ipAddress);
        auditLogRepository.save(log);
    }

    private String getClientIp() {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        return ip;
    }
}
