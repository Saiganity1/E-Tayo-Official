"use client";

import React, { useState } from "react";
import { usePermitContext } from "../../../../context/PermitContext";
import { ShieldAlert, Activity, Settings, Database, Trash2 } from "lucide-react";

export default function AdminDashboard() {
  const { systemLogs, feeStructures, updateFeeMultiplier, clearLogs } = usePermitContext();

  return (
    <div className="dashboard-page animate-fade-in-up">
      <header className="page-header">
        <div>
          <h1 className="page-title">Admin Portal</h1>
          <p className="page-subtitle">System overview, logs, and fee configuration.</p>
        </div>
      </header>

      <div className="admin-grid">
        <section className="glass-panel admin-section">
          <div className="section-header">
            <h2 className="flex items-center gap-2"><Activity size={20} /> System Logs</h2>
            <button className="btn-outline btn-sm" onClick={clearLogs}>
              <Trash2 size={14} /> Clear
            </button>
          </div>
          <div className="log-container">
            {systemLogs.length === 0 ? (
              <p className="empty-text">No system logs available.</p>
            ) : (
              <div className="log-list">
                {systemLogs.map(log => (
                  <div key={log.id} className={`log-item ${log.status}`}>
                    <div className="log-time">{log.timestamp}</div>
                    <div className="log-message">{log.message}</div>
                    <div className="log-user">{log.user}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="glass-panel admin-section">
          <div className="section-header">
            <h2 className="flex items-center gap-2"><Settings size={20} /> Fee Multipliers</h2>
          </div>
          <div className="fee-list">
            {feeStructures.map(fee => (
              <div key={fee.id} className="fee-item">
                <div className="fee-info">
                  <h3>{fee.name}</h3>
                  <p>Base Amount: ₱{fee.baseAmount}</p>
                </div>
                {fee.multiplierName && (
                  <div className="fee-input-group">
                    <label>{fee.multiplierName}</label>
                    <input 
                      type="number" 
                      value={fee.multiplierValue || 0}
                      onChange={(e) => updateFeeMultiplier(fee.id, parseFloat(e.target.value))}
                      className="form-input"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>

    </div>
  );
}
