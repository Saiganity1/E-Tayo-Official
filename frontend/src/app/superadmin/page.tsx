"use client";

import React from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

// React-Admin relies on window being defined, so it MUST be loaded dynamically with SSR disabled
const AdminApp = dynamic(() => import("../../components/AdminApp"), {
    ssr: false,
    loading: () => (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '1rem' }}>
            <Loader2 className="animate-spin" size={48} color="#1d4ed8" />
            <p style={{ color: '#64748b', fontSize: '1.2rem', fontWeight: 500 }}>Loading Database Control Panel...</p>
        </div>
    )
});

export default function SuperadminPage() {
    return (
        <div style={{ height: "100vh", margin: "-2rem" }}>
            <AdminApp />
        </div>
    );
}
