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

    @Autowired(required = false)
    private HttpServletRequest request;

    public void logAction(String action, String userEmail, String details) {
        try {
            String ipAddress = getClientIp();
            SystemAuditLog log = new SystemAuditLog(action, userEmail, details, ipAddress);
            auditLogRepository.save(log);
        } catch (Exception e) {
            System.err.println("AuditLoggingService error (safely ignored): " + e.getMessage());
        }
    }

    private String getClientIp() {
        try {
            if (request != null) {
                String ip = request.getHeader("X-Forwarded-For");
                if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
                    ip = request.getRemoteAddr();
                }
                return ip;
            }
        } catch (Exception e) {
            // ignore
        }
        return "127.0.0.1";
    }
}
