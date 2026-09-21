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
        <div className="hero-background"></div>
        <div className="container hero-container animate-fade-in-up">
          <div className="hero-badge">Modernizing Local Governance</div>
          <h2 className="hero-title">Streamlining Your Building & Occupancy Permits</h2>
          <p className="hero-subtitle">
            The official fast, secure, and accessible portal for Locational Clearances, Building Permits, and Occupancy Certificates. Track your progress in real-time.
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
          padding-top: 8.5rem;
          padding-bottom: 8rem;
          text-align: center;
          position: relative;
          overflow: hidden;
        }

        .hero-background {
          position: absolute;
          top: -50%;
          left: 50%;
          transform: translateX(-50%);
          width: 200%;
          height: 150%;
          background: radial-gradient(circle at center, rgba(37, 99, 235, 0.08) 0%, transparent 60%);
          z-index: -1;
          pointer-events: none;
        }

        .hero-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          max-width: 800px;
        }

        .hero-badge {
          background: rgba(37, 99, 235, 0.1);
          color: var(--color-primary);
          padding: 0.5rem 1rem;
          border-radius: var(--radius-pill);
          font-weight: 700;
          font-size: 0.85rem;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          margin-bottom: 2rem;
        }

        .hero-title {
          font-size: 4rem;
          font-weight: 800;
          line-height: 1.1;
          color: var(--text-primary);
          margin-bottom: 1.5rem;
          letter-spacing: -0.03em;
        }

        .hero-subtitle {
          font-size: 1.25rem;
          color: var(--text-secondary);
          max-width: 600px;
          margin-bottom: 3rem;
          line-height: 1.6;
        }

        .hero-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
        }

        .btn-large {
          padding: 1rem 2rem;
          font-size: 1.1rem;
        }
      `}</style>
    </main>
  );
}
