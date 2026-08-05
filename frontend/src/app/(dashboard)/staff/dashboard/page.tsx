"use client";

import React, { useState } from "react";
import { usePermitContext } from "../../../../context/PermitContext";
import { Search, Filter, AlertCircle, FileCheck, MapPin, Eye } from "lucide-react";
import Link from "next/link";

export default function StaffDashboard() {
  const { applications } = usePermitContext();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredApps = applications.filter(app => 
    app.projectName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    app.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.applicantName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="dashboard-page animate-fade-in-up">
      <header className="page-header">
        <div>
          <h1 className="page-title">Staff Evaluation Hub</h1>
          <p className="page-subtitle">Review, process, and approve pending permit applications.</p>
        </div>
      </header>

      <section className="glass-panel main-section">
        <div className="section-header">
          <div className="search-bar">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search by ID, applicant, or project..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn-outline">
            <Filter size={18} /> Filters
          </button>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>App ID</th>
                <th>Applicant</th>
                <th>Project Details</th>
                <th>Type</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredApps.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center empty-cell">No applications found.</td>
                </tr>
              ) : (
                filteredApps.map(app => (
                  <tr key={app.id}>
                    <td><span className="badge-id">{app.id}</span></td>
                    <td>
                      <div className="font-medium">{app.applicantName}</div>
                      <div className="text-sm text-muted">{app.applicantPhone}</div>
                    </td>
                    <td>
                      <div className="font-medium">{app.projectName}</div>
                      <div className="text-sm text-muted flex items-center gap-1">
                        <MapPin size={12} /> {app.projectAddress}
                      </div>
                    </td>
                    <td className="capitalize">{app.permitType.replace("_", " ")}</td>
                    <td>
                      <span className={`status-badge ${app.status}`}>
                        {app.status.replace("_", " ")}
                      </span>
                    </td>
                    <td>
                      <Link href={`/staff/evaluate/${app.id}`} className="btn-icon">
                        <Eye size={18} /> Evaluate
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
}
