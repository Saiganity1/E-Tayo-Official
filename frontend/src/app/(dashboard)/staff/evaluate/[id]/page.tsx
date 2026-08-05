"use client";
import React from "react";
export default function Page() {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center animate-fade-in-up">
      <div className="glass-panel p-8 max-w-md w-full mx-auto" style={{marginTop: "4rem"}}>
        <h1 className="text-2xl font-bold mb-4">Coming Soon</h1>
        <p className="mb-6 opacity-80">This page is currently being modernized and integrated with the new Next.js architecture.</p>
        <button onClick={() => window.history.back()} className="btn-primary w-full">Go Back</button>
      </div>
    </div>
  );
}
