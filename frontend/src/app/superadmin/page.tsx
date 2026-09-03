"use client";

import React from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const AdminApp = dynamic(() => import("../../components/AdminApp"), {
  ssr: false,
  loading: () => (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '1rem', background: '#0f172a' }}>
      <Loader2 className="animate-spin" size={48} color="#7c3aed" />
      <p style={{ color: '#a5b4fc', fontSize: '1.1rem', fontWeight: 600 }}>Loading SuperAdmin Control Center...</p>
    </div>
  )
});

export default function SuperadminPage() {
  return <AdminApp />;
}
