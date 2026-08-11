"use client";

import React from "react";
import Sidebar from "../../components/layout/Sidebar";
import MangTomasBot from "../../components/chat/MangTomasBot";
import { usePermitContext } from "../../context/PermitContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userRole } = usePermitContext();

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main">
        <div className="dashboard-content">
          {children}
        </div>
      </main>
      
      {/* Render the chat bot only for applicants */}
      {userRole === "applicant" && <MangTomasBot />}
    </div>
  );
}
