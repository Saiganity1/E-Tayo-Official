"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Footer from "../components/layout/Footer";

export default function Home() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [showLoginAlert, setShowLoginAlert] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("token"));
  }, []);

  const handleApplyClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!isLoggedIn) {
      e.preventDefault();
      setShowLoginAlert(true);
    }
  };

  return (
    <main className="landing-page">
      <header className="header-nav">
        <div className="nav-container">
          <Link 
            href="/" 
            className="logo-group" 
            style={{ textDecoration: "none", display: "flex", alignItems: "center", marginBottom: 0, cursor: "pointer" }}
            onClick={(e) => {
              if (typeof window !== "undefined" && window.location.pathname === "/") {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
            title="Bumalik sa Homepage"
          >
            <Image src="/logo.png" alt="eTAYO" width={140} height={44} style={{ height: "40px", width: "auto", objectFit: "contain", cursor: "pointer" }} priority />
          </Link>
          <nav className="nav-links">
            <Link href="/applicant/track" className="nav-link">Application Status</Link>
            <Link href="/login" className="btn-secondary">Log In</Link>
            <Link href="/applicant/apply" onClick={handleApplyClick} className="btn-primary">Apply Now</Link>
          </nav>
        </div>
      </header>

      <section className="hero-section">
        <div className="hero-bg-wrapper">
          <div className="hero-bg-image"></div>
          <div className="hero-bg-overlay"></div>
          <div className="hero-bg-glow"></div>
        </div>
        <div className="container hero-container animate-fade-in-up">
          <div className="hero-badge">
            <span className="badge-pulse"></span>
            OFFICE OF THE BUILDING OFFICIAL
          </div>
          <h2 className="hero-title">eTAYO TOMASINO</h2>
          <p className="hero-subtitle">
            A Geospatially Enabled Permit Management and Building Monitoring System for the Local Government Unit of Sto. Tomas, Pampanga.
          </p>
          <div className="hero-actions">
            <Link href="/applicant/apply" onClick={handleApplyClick} className="btn-primary btn-large">Start New Application</Link>
            <Link href="/applicant/track" className="btn-secondary btn-large">Application Status</Link>
          </div>
        </div>
      </section>

      {/* Custom Login Alert Modal */}
      {showLoginAlert && (
        <div className="animate-fade-in" style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(15, 23, 42, 0.5)", backdropFilter: "blur(8px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div className="animate-fade-in-up" style={{ background: "white", padding: "2.5rem", borderRadius: "24px", width: "100%", maxWidth: "420px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.5) inset", textAlign: "center", position: "relative" }}>
            
            <div style={{ width: "64px", height: "64px", background: "linear-gradient(135deg, #fef2f2, #fee2e2)", color: "#ef4444", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem auto", boxShadow: "0 4px 10px rgba(239,68,68,0.15)" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="M12 8v4"></path><path d="M12 16h.01"></path></svg>
            </div>
            
            <h3 style={{ margin: "0 0 0.75rem 0", fontSize: "1.5rem", fontWeight: "800", color: "#0f172a", letterSpacing: "-0.02em" }}>Authentication Required</h3>
            <p style={{ margin: "0 0 2rem 0", color: "#64748b", lineHeight: "1.6", fontSize: "1.05rem" }}>You need to be logged in to apply for a permit. Please log in to your account to continue.</p>
            
            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={() => setShowLoginAlert(false)} style={{ flex: 1, padding: "0.875rem", borderRadius: "14px", border: "1px solid #e2e8f0", background: "white", color: "#64748b", fontWeight: "700", cursor: "pointer", transition: "all 0.2s" }} onMouseEnter={(e) => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.color = "#0f172a"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "white"; e.currentTarget.style.color = "#64748b"; }}>Cancel</button>
              <button onClick={() => router.push("/login")} style={{ flex: 1, padding: "0.875rem", borderRadius: "14px", border: "none", background: "linear-gradient(135deg, #3b82f6, #2563eb)", color: "white", fontWeight: "700", cursor: "pointer", transition: "all 0.2s", boxShadow: "0 4px 12px rgba(59,130,246,0.3)" }} onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"} onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}>Log In Now</button>
            </div>

          </div>
        </div>
      )}

      {/* Official Municipal Footer */}
      <Footer />

      {/* Landing page specific layout classes that extend the global CSS */}
      <style jsx global>{`
        .landing-page {
          min-height: 100vh;
          background-color: var(--bg-main);
          position: relative;
        }

        .header-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          width: 100%;
          z-index: 50;
          padding: 0;
          border-radius: 0;
          border-bottom: 1px solid rgba(226, 232, 240, 0.85);
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
        }
        
        .nav-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.85rem 3.5rem;
          width: 100%;
          box-sizing: border-box;
        }

        @media (max-width: 900px) {
          .nav-container {
            padding: 0.75rem 1.5rem;
          }
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          font-weight: 600;
        }

        .nav-link {
          color: var(--text-secondary);
          transition: color var(--transition-fast);
          font-size: 0.95rem;
        }

        .nav-link:hover {
          color: var(--color-primary);
        }

        .hero-section {
          min-height: 100vh;
          min-height: 100dvh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding-top: 5rem;
          padding-bottom: 3rem;
          text-align: center;
          position: relative;
          overflow: hidden;
          box-sizing: border-box;
        }

        .hero-bg-wrapper {
          position: absolute;
          inset: 0;
          overflow: hidden;
          z-index: 0;
          pointer-events: none;
        }

        .hero-bg-image {
          position: absolute;
          inset: -35px;
          background-image: url('/sto-tomas-hall.jpg');
          background-size: cover;
          background-position: center 35%;
          animation: slowZoom 24s ease-in-out infinite alternate;
          will-change: transform;
          filter: contrast(1.08) brightness(0.92);
        }

        @keyframes slowZoom {
          0% {
            transform: scale(1) translate3d(0, 0, 0);
          }
          100% {
            transform: scale(1.08) translate3d(0, -12px, 0);
          }
        }

        .hero-bg-overlay {
          position: absolute;
          inset: 0;
          background: 
            linear-gradient(180deg, rgba(0, 56, 168, 0.76) 0%, rgba(2, 22, 66, 0.88) 100%),
            radial-gradient(circle at 50% 30%, rgba(0, 56, 168, 0.55) 0%, rgba(1, 15, 48, 0.92) 80%);
        }

        .hero-bg-glow {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 50% 45%, rgba(0, 56, 168, 0.4) 0%, transparent 65%);
          animation: ambientPulse 8s ease-in-out infinite alternate;
          will-change: opacity;
        }

        @keyframes ambientPulse {
          0% {
            opacity: 0.65;
          }
          100% {
            opacity: 0.95;
          }
        }

        .hero-container {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          max-width: 960px;
          padding: 0 1.5rem;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.65rem;
          background: rgba(255, 255, 255, 0.14);
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.32);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          padding: 0.55rem 1.45rem;
          border-radius: var(--radius-pill);
          font-weight: 800;
          font-size: 0.88rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 1.6rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
        }

        .badge-pulse {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: #60a5fa;
          box-shadow: 0 0 10px #60a5fa;
          display: inline-block;
          animation: dotBlink 2s ease-in-out infinite;
        }

        @keyframes dotBlink {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.85); }
        }

        .hero-title {
          font-size: clamp(3rem, 6.5vw, 4.8rem);
          font-weight: 900;
          line-height: 1.1;
          color: #ffffff;
          margin-bottom: 1.4rem;
          letter-spacing: -0.03em;
          text-shadow: 0 4px 24px rgba(0, 0, 0, 0.45);
        }

        .hero-subtitle {
          font-size: 1.2rem;
          color: #f1f5f9;
          max-width: 800px;
          margin-bottom: 2.75rem;
          line-height: 1.65;
          text-shadow: 0 2px 14px rgba(0, 0, 0, 0.4);
        }

        .hero-actions {
          display: flex;
          gap: 1.25rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        .hero-actions .btn-primary {
          background: linear-gradient(135deg, #2563eb 0%, #0038A8 100%);
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 10px 30px rgba(0, 56, 168, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.15) inset;
          transition: all var(--transition-fast);
        }

        .hero-actions .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 35px rgba(0, 56, 168, 0.7);
          background: linear-gradient(135deg, #3b82f6 0%, #002e8c 100%);
        }

        .hero-actions .btn-secondary {
          background: #ffffff;
          color: #0038A8;
          font-weight: 700;
          border: 1px solid #ffffff;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
          transition: all var(--transition-fast);
        }

        .hero-actions .btn-secondary:hover {
          background: #f8fafc;
          color: #002575;
          transform: translateY(-2px);
          box-shadow: 0 14px 35px rgba(0, 0, 0, 0.35);
        }

        .btn-large {
          padding: 1rem 2.25rem;
          font-size: 1.1rem;
          border-radius: 14px;
        }
      `}</style>
    </main>
  );
}
