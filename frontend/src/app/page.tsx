"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X, ClipboardList, LogIn, ArrowRight } from "lucide-react";
import Footer from "../components/layout/Footer";
import MangTomasBot from "../components/chat/MangTomasBot";
import { useLanguage } from "../context/LanguageContext";

export default function Home() {
  const router = useRouter();
  const { language, setLanguage } = useLanguage();
  const isFil = language === "fil";

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginAlert, setShowLoginAlert] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Floating Action Widgets state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("token"));
  }, []);

  // Prevent background scroll when mobile navigation is open
  useEffect(() => {
    if (isMobileNavOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileNavOpen]);

  // Track scroll progress for the circular back to top button
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setScrollProgress(progress);
      setShowBackToTop(scrollTop > 60);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
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

          {/* Desktop Navigation Links */}
          <nav className="nav-links" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {/* Language Toggle on Homepage */}
            <div className="landing-lang-toggle" style={{ display: "inline-flex", alignItems: "center", background: "#f1f5f9", borderRadius: "10px", padding: "3px", gap: "2px" }}>
              <button
                type="button"
                onClick={() => setLanguage("en")}
                style={{
                  padding: "4px 8px",
                  fontSize: "0.78rem",
                  fontWeight: language === "en" ? "700" : "500",
                  background: language === "en" ? "#0038A8" : "transparent",
                  color: language === "en" ? "#ffffff" : "#64748b",
                  border: "none",
                  borderRadius: "7px",
                  cursor: "pointer"
                }}
              >
                🇺🇸 EN
              </button>
              <button
                type="button"
                onClick={() => setLanguage("fil")}
                style={{
                  padding: "4px 8px",
                  fontSize: "0.78rem",
                  fontWeight: language === "fil" ? "700" : "500",
                  background: language === "fil" ? "#0038A8" : "transparent",
                  color: language === "fil" ? "#ffffff" : "#64748b",
                  border: "none",
                  borderRadius: "7px",
                  cursor: "pointer"
                }}
              >
                🇵🇭 FIL
              </button>
            </div>

            <Link href="/applicant/track" className="nav-link">
              {isFil ? "Katayuan ng Aplikasyon" : "Application Status"}
            </Link>
            <Link href="/login" className="btn-secondary">
              {isFil ? "Mag-log In" : "Log In"}
            </Link>
            <Link href="/applicant/apply" onClick={handleApplyClick} className="btn-primary">
              {isFil ? "Mag-apply Ngayon" : "Apply Now"}
            </Link>
          </nav>

          {/* Mobile Hamburger Toggle Button */}
          <button 
            type="button"
            className="landing-mobile-toggle"
            onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
            aria-label={isMobileNavOpen ? "Close menu" : "Open menu"}
          >
            {isMobileNavOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile Slide-Down Menu Drawer */}
        <div className={`landing-mobile-menu ${isMobileNavOpen ? "open" : ""}`}>
          <div className="landing-mobile-menu-inner">
            <div style={{ display: "flex", justifyContent: "center", padding: "0.5rem 0", marginBottom: "0.5rem" }}>
              <div style={{ display: "inline-flex", background: "#f1f5f9", borderRadius: "10px", padding: "4px", gap: "4px" }}>
                <button
                  type="button"
                  onClick={() => setLanguage("en")}
                  style={{
                    padding: "6px 12px",
                    fontSize: "0.85rem",
                    fontWeight: language === "en" ? "700" : "500",
                    background: language === "en" ? "#0038A8" : "transparent",
                    color: language === "en" ? "#ffffff" : "#64748b",
                    border: "none",
                    borderRadius: "7px",
                    cursor: "pointer"
                  }}
                >
                  🇺🇸 English
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage("fil")}
                  style={{
                    padding: "6px 12px",
                    fontSize: "0.85rem",
                    fontWeight: language === "fil" ? "700" : "500",
                    background: language === "fil" ? "#0038A8" : "transparent",
                    color: language === "fil" ? "#ffffff" : "#64748b",
                    border: "none",
                    borderRadius: "7px",
                    cursor: "pointer"
                  }}
                >
                  🇵🇭 Filipino
                </button>
              </div>
            </div>

            <Link 
              href="/applicant/track" 
              className="mobile-nav-item"
              onClick={() => setIsMobileNavOpen(false)}
            >
              <ClipboardList size={18} />
              <span>{isFil ? "Katayuan ng Aplikasyon" : "Application Status"}</span>
            </Link>
            <Link 
              href="/login" 
              className="mobile-nav-item"
              onClick={() => setIsMobileNavOpen(false)}
            >
              <LogIn size={18} />
              <span>{isFil ? "Mag-log In" : "Log In"}</span>
            </Link>
            <Link 
              href="/applicant/apply" 
              className="mobile-nav-item mobile-nav-btn-highlight"
              onClick={(e) => {
                setIsMobileNavOpen(false);
                handleApplyClick(e);
              }}
            >
              <span>{isFil ? "Mag-apply Ngayon" : "Apply Now"}</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>

        {/* Mobile Backdrop */}
        {isMobileNavOpen && (
          <div 
            className="landing-nav-backdrop"
            onClick={() => setIsMobileNavOpen(false)}
            aria-hidden="true"
          />
        )}
      </header>

      <section className="hero-section">
        <div className="hero-bg-wrapper">
          <div className="hero-bg-image"></div>
          <div className="hero-bg-overlay"></div>
          <div className="hero-bg-glow"></div>
        </div>
        <div className="container hero-container">
          {/* Construction Stage 1: Crane Lowering the Office of the Building Official Badge */}
          <div className="crane-badge-stage">
            {/* Crane Rigging with steel hoist cable, hazard pulley block, and steel hook */}
            <div className="crane-rigging" aria-hidden="true">
              <div className="crane-cable"></div>
              <svg className="crane-hook-svg" viewBox="0 0 40 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Pulley block with safety yellow & hazard stripes */}
                <rect x="8" y="2" width="24" height="18" rx="3" fill="#eab308" stroke="#ca8a04" strokeWidth="1.5"/>
                <path d="M12 2L8 8M18 2L10 14M24 2L12 20M30 2L18 20M32 8L24 20M32 14L28 20" stroke="#1e293b" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="20" cy="11" r="4" fill="#334155" stroke="#f8fafc" strokeWidth="1.2"/>
                <circle cx="20" cy="11" r="1.5" fill="#f8fafc"/>
                {/* Steel swivel ring & heavy-duty hook */}
                <path d="M20 20V26" stroke="#475569" strokeWidth="3" strokeLinecap="round"/>
                <path d="M20 26C15 26 12 30 12 36C12 43 19 46 25 44C29 42.5 31 38 29 34C28 32 25 32 24.5 33.5C24 35 25.5 37 24 38C22 39 17 38.5 17 35C17 31 20 29 22 29" stroke="#334155" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                <path d="M17 30L22 35" stroke="#eab308" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              {/* Rigging Slings */}
              <svg className="crane-slings-svg" viewBox="0 0 120 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M60 0L8 25" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="3 2"/>
                <path d="M60 0L112 25" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="3 2"/>
              </svg>
            </div>

            <div className="hero-badge crane-delivered-badge">
              <span className="badge-pulse"></span>
              {isFil ? "TANGGAPAN NG OPISYAL NG GUSALI" : "OFFICE OF THE BUILDING OFFICIAL"}
            </div>
          </div>

          {/* GPS Pin Drawing & Location Marking Stage */}
          <div className="gps-drawing-stage">
            {/* The Moving GPS Pin with laser tracer, radar wave, and coordinates tag */}
            <div className="gps-pin-carrier" aria-hidden="true">
              <div className="gps-pin-body">
                {/* SVG GPS Pin Marker */}
                <svg className="gps-pin-icon" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 0C5.37 0 0 5.37 0 12C0 21 11.1 31.2 11.55 31.6C11.8 31.85 12.2 31.85 12.45 31.6C12.9 31.2 24 21 24 12C24 5.37 18.63 0 12 0Z" fill="url(#pinGrad)" filter="url(#pinGlow)"/>
                  <circle cx="12" cy="11.5" r="5" fill="#ffffff"/>
                  <circle cx="12" cy="11.5" r="3" fill="#0038A8"/>
                  <defs>
                    <linearGradient id="pinGrad" x1="0" y1="0" x2="24" y2="32" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#ff4d4d"/>
                      <stop offset="0.6" stopColor="#dc2626"/>
                      <stop offset="1" stopColor="#991b1b"/>
                    </linearGradient>
                    <filter id="pinGlow" x="-2" y="-2" width="28" height="36" filterUnits="userSpaceOnUse">
                      <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#ef4444" floodOpacity="0.8"/>
                    </filter>
                  </defs>
                </svg>
                {/* Needle beam & laser tip spark */}
                <div className="gps-laser-spark"></div>
                {/* Expanding GPS Location Radar Ring */}
                <div className="gps-radar-wave"></div>
                {/* Geodetic Coordinate Tooltip Badge */}
                <div className="gps-coord-tag">
                  <span>GPS: 15.0032° N, 120.7123° E</span>
                </div>
              </div>
            </div>

            {/* Layer 1: Geospatial Laser / Cadastral Wireframe Markings (Being drawn in real-time) */}
            <div className="hero-title-blueprint" aria-hidden="true">
              eTAYO TOMASINO
            </div>

            {/* Layer 2: Final Official Philippine Flag Waving Title */}
            <h1 className="hero-title hero-title-revealed">
              <span className="philippine-flag-waving-text">eTAYO TOMASINO</span>
            </h1>
          </div>

          {/* Construction Stage 2: Subtitle Delivered by Construction Flatbed Truck */}
          <div className="truck-delivery-stage">
            <div className="delivery-truck-carrier" aria-hidden="true">
              <svg className="delivery-truck-svg" viewBox="0 0 160 65" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Flatbed Trailer / Chassis */}
                <rect x="6" y="36" width="108" height="9" rx="2" fill="#334155" stroke="#1e293b" strokeWidth="1.5"/>
                {/* Hazard striping on bed */}
                <rect x="10" y="38" width="98" height="5" fill="#f59e0b"/>
                <path d="M15 43L20 38M25 43L30 38M35 43L40 38M45 43L50 38M55 43L60 38M65 43L70 38M75 43L80 38M85 43L90 38M95 43L100 38" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round"/>
                {/* Cab Body */}
                <path d="M114 20H134L148 36V48H114V20Z" fill="#f59e0b" stroke="#b45309" strokeWidth="1.5"/>
                {/* Cab Window */}
                <path d="M118 23H131L141 36H118V23Z" fill="#e0f2fe" stroke="#0284c7" strokeWidth="1"/>
                {/* Amber Warning Beacon */}
                <rect x="123" y="15" width="8" height="5" rx="1.5" fill="#f97316"/>
                <circle cx="127" cy="17.5" r="4" fill="#fde047" opacity="0.8"/>
                {/* Front Bumper & Headlight */}
                <rect x="144" y="42" width="8" height="6" rx="1" fill="#475569"/>
                <circle cx="148" cy="40" r="3.5" fill="#fef08a"/>
                {/* Wheels */}
                <circle cx="26" cy="48" r="9" fill="#1e293b" stroke="#475569" strokeWidth="2"/>
                <circle cx="26" cy="48" r="3.5" fill="#94a3b8"/>
                <circle cx="50" cy="48" r="9" fill="#1e293b" stroke="#475569" strokeWidth="2"/>
                <circle cx="50" cy="48" r="3.5" fill="#94a3b8"/>
                <circle cx="132" cy="48" r="9" fill="#1e293b" stroke="#475569" strokeWidth="2"/>
                <circle cx="132" cy="48" r="3.5" fill="#94a3b8"/>
              </svg>
              {/* Delivery Dust Puff */}
              <div className="truck-dust-puff"></div>
            </div>

            <p className="hero-subtitle truck-delivered-subtitle">
              {isFil
                ? "Isang Geospatially Enabled na Sistema ng Pamamahala ng Permit at Pagsubaybay sa Gusali para sa Pamahalaang Bayan ng Sto. Tomas, Pampanga."
                : "A Geospatially Enabled Permit Management and Building Monitoring System for the Local Government Unit of Sto. Tomas, Pampanga."}
            </p>
          </div>

          {/* Construction Stage 3 & 4: Action Buttons (Excavator-delivered & Drilled into place) */}
          <div className="hero-actions">
            {/* Button 1: Start New Application (Carried and placed by Excavator) */}
            <div className="excavator-button-stage">
              <div className="excavator-carrier" aria-hidden="true">
                <svg className="excavator-svg" viewBox="0 0 100 85" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Hydraulic boom/arm */}
                  <path d="M12 80L36 40L68 46" stroke="#eab308" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 80L36 40L68 46" stroke="#ca8a04" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  {/* Hydraulic cylinder */}
                  <path d="M18 72L46 45" stroke="#64748b" strokeWidth="3.5" strokeLinecap="round"/>
                  <path d="M46 45L58 46" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round"/>
                  {/* Pivot joints */}
                  <circle cx="36" cy="40" r="3" fill="#1e293b" stroke="#f8fafc" strokeWidth="1"/>
                  <circle cx="68" cy="46" r="3" fill="#1e293b" stroke="#f8fafc" strokeWidth="1"/>
                  {/* Excavator Bucket with teeth */}
                  <path d="M68 46C72 42 80 42 86 46L94 62C92 68 82 74 72 70L66 54Z" fill="#ca8a04" stroke="#854d0e" strokeWidth="2"/>
                  <polygon points="94,62 100,66 96,70" fill="#1e293b"/>
                  <polygon points="88,66 93,71 87,73" fill="#1e293b"/>
                  <polygon points="80,69 84,75 78,76" fill="#1e293b"/>
                </svg>
              </div>
              <Link href="/applicant/apply" onClick={handleApplyClick} className="btn-primary btn-large excavator-delivered-btn">
                {isFil ? "Magsimula ng Bagong Aplikasyon" : "Start New Application"}
              </Link>
            </div>

            {/* Button 2: Application Status (Drilled into foundation) */}
            <div className="drill-button-stage">
              <div className="drill-rig" aria-hidden="true">
                <svg className="drill-svg" viewBox="0 0 34 54" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Pneumatic drill body */}
                  <rect x="9" y="2" width="16" height="22" rx="3" fill="#ea580c" stroke="#9a3412" strokeWidth="1.5"/>
                  <rect x="11" y="6" width="12" height="4" fill="#1e293b"/>
                  {/* Twin rubber grip handles */}
                  <path d="M3 9H9M25 9H31" stroke="#1e293b" strokeWidth="3" strokeLinecap="round"/>
                  {/* Steel chuck & bit */}
                  <rect x="13" y="24" width="8" height="7" fill="#475569" stroke="#1e293b" strokeWidth="1"/>
                  <path d="M15 31V48M19 31V48" stroke="#94a3b8" strokeWidth="2.5"/>
                  <path d="M14 34L20 38M14 40L20 44" stroke="#cbd5e1" strokeWidth="1.5"/>
                  <polygon points="17,52 13,47 21,47" fill="#334155"/>
                </svg>
                {/* Drilling sparks */}
                <div className="drill-sparks">
                  <span className="spark sp1"></span>
                  <span className="spark sp2"></span>
                  <span className="spark sp3"></span>
                  <span className="spark sp4"></span>
                </div>
              </div>
              <Link href="/applicant/track" className="btn-secondary btn-large drilled-btn">
                {isFil ? "Katayuan ng Aplikasyon" : "Application Status"}
              </Link>
            </div>
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
            
            <h3 style={{ margin: "0 0 0.75rem 0", fontSize: "1.5rem", fontWeight: "800", color: "#0f172a", letterSpacing: "-0.02em" }}>
              {isFil ? "Kailangan ang Pagpapatotoo" : "Authentication Required"}
            </h3>
            <p style={{ margin: "0 0 2rem 0", color: "#64748b", lineHeight: "1.6", fontSize: "1.05rem" }}>
              {isFil 
                ? "Kailangan mong mag-log in upang mag-apply para sa permit. Mangyaring mag-log in sa iyong account upang magpatuloy." 
                : "You need to be logged in to apply for a permit. Please log in to your account to continue."}
            </p>
            
            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={() => setShowLoginAlert(false)} style={{ flex: 1, padding: "0.875rem", borderRadius: "14px", border: "1px solid #e2e8f0", background: "white", color: "#64748b", fontWeight: "700", cursor: "pointer", transition: "all 0.2s" }} onMouseEnter={(e) => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.color = "#0f172a"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "white"; e.currentTarget.style.color = "#64748b"; }}>
                {isFil ? "Kanselahin" : "Cancel"}
              </button>
              <button onClick={() => router.push("/login")} style={{ flex: 1, padding: "0.875rem", borderRadius: "14px", border: "none", background: "linear-gradient(135deg, #0038A8, #021a4f)", color: "white", fontWeight: "700", cursor: "pointer", transition: "all 0.2s", boxShadow: "0 4px 12px rgba(0,56,168,0.35)" }} onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"} onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}>
                {isFil ? "Mag-log In Ngayon" : "Log In Now"}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Official Municipal Footer */}
      <Footer />

      {/* Floating Action Buttons: FAQ / Mang Tomas & Back to Top */}
      <div className="floating-widgets-dock">
        {/* Button: Message or FAQ that links to Mang Tomas */}
        <button
          type="button"
          onClick={() => setIsChatOpen((prev) => !prev)}
          className="dock-circle-btn msg-fab"
          aria-label="Ask Mang Tomas FAQ & Virtual Assistant"
          title="Ask Mang Tomas AI / FAQ"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 3C6.5 3 2 6.8 2 11.5C2 14.2 3.4 16.6 5.6 18.1C5.4 19.3 4.8 20.6 3.7 21.6C3.5 21.8 3.6 22.2 3.9 22.2C5.8 22.2 7.7 21.3 9 20.3C10 20.7 11 20.9 12 20.9C17.5 20.9 22 17.1 22 12.4C22 7.7 17.5 3 12 3Z" fill="#000000"/>
            <circle cx="8" cy="12" r="1.5" fill="#ffffff"/>
            <circle cx="12" cy="12" r="1.5" fill="#ffffff"/>
            <circle cx="16" cy="12" r="1.5" fill="#ffffff"/>
          </svg>
          <span className="dock-tooltip">Ask Mang Tomas (FAQ & AI)</span>
        </button>

        {/* Button: Back to Top with Circular Scroll Progress */}
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className={`dock-circle-btn back-to-top-fab ${showBackToTop ? "is-visible" : ""}`}
          aria-label="Scroll back to top"
          title="Back to Top"
        >
          <svg className="scroll-progress-svg" width="50" height="50" viewBox="0 0 50 50">
            {/* Background ring */}
            <circle
              cx="25"
              cy="25"
              r="21.5"
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="2.75"
            />
            {/* Active progress ring */}
            <circle
              cx="25"
              cy="25"
              r="21.5"
              fill="none"
              stroke="#000000"
              strokeWidth="2.75"
              strokeDasharray={135.09}
              strokeDashoffset={135.09 - (scrollProgress / 100) * 135.09}
              strokeLinecap="round"
              style={{
                transform: "rotate(-90deg)",
                transformOrigin: "50% 50%",
                transition: "stroke-dashoffset 0.1s ease-out"
              }}
            />
          </svg>
          <svg className="chevron-up-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="18 15 12 9 6 15" />
          </svg>
        </button>
      </div>

      {/* Mang Tomas Virtual Assistant / FAQ Dialog */}
      <MangTomasBot externalOpen={isChatOpen} setExternalOpen={setIsChatOpen} hideFab={true} />

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

        .landing-mobile-toggle {
          display: none;
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          color: #0f172a;
          padding: 8px;
          border-radius: 10px;
          cursor: pointer;
          align-items: center;
          justify-content: center;
          min-width: 44px;
          min-height: 44px;
          transition: background 0.2s;
        }

        .landing-mobile-toggle:hover {
          background: #e2e8f0;
        }

        .landing-mobile-menu {
          display: none;
        }

        .landing-nav-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.55);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          z-index: 48;
        }

        @media (max-width: 768px) {
          .nav-container {
            padding: max(0.65rem, env(safe-area-inset-top)) max(1rem, env(safe-area-inset-right)) 0.65rem max(1rem, env(safe-area-inset-left));
          }

          .nav-links {
            display: none;
          }

          .landing-mobile-toggle {
            display: flex;
          }

          .landing-mobile-menu {
            display: block;
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: #ffffff;
            border-bottom: 1px solid #e2e8f0;
            box-shadow: 0 16px 32px rgba(0, 0, 0, 0.12);
            overflow: hidden;
            max-height: 0;
            opacity: 0;
            visibility: hidden;
            transition: max-height 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease, visibility 0.25s;
            z-index: 49;
          }

          .landing-mobile-menu.open {
            max-height: 380px;
            opacity: 1;
            visibility: visible;
          }

          .landing-mobile-menu-inner {
            padding: 1.25rem 1.25rem calc(1.5rem + env(safe-area-inset-bottom)) 1.25rem;
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
          }

          .mobile-nav-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 16px;
            border-radius: 12px;
            background: #f8fafc;
            color: #0f172a;
            font-size: 0.95rem;
            font-weight: 700;
            text-decoration: none;
            transition: background 0.15s;
            min-height: 48px;
          }

          .mobile-nav-item:hover, .mobile-nav-item:active {
            background: #f1f5f9;
          }

          .mobile-nav-btn-highlight {
            background: linear-gradient(135deg, #0038A8 0%, #021a4f 100%) !important;
            color: #ffffff !important;
            justify-content: space-between;
            box-shadow: 0 4px 14px rgba(0, 56, 168, 0.35);
          }
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

        /* ========================================================
           CONSTRUCTION SITE ENTRANCE ANIMATIONS (Intro only)
           1. Crane lowers Office of the Building Official badge
           2. Flatbed Truck delivers the geospatial subtitle
           3. Excavator brings in and places "Start New Application"
           4. Pneumatic Drill hammers "Application Status" into bedrock
           After intro completes, all elements stay in original states!
           ======================================================== */

        /* Stage 1: Tower Crane Lowering Badge */
        .crane-badge-stage {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 1.6rem;
          z-index: 5;
        }

        .crane-rigging {
          position: absolute;
          bottom: calc(100% - 2px);
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          pointer-events: none;
          z-index: 10;
          animation: craneHoistSequence 2.3s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          will-change: transform, opacity;
        }

        .crane-cable {
          width: 3px;
          height: 180px;
          background: repeating-linear-gradient(
            to bottom,
            #94a3b8 0px,
            #94a3b8 4px,
            #334155 4px,
            #334155 8px
          );
          box-shadow: 0 0 6px rgba(0, 0, 0, 0.6);
        }

        .crane-hook-svg {
          width: 36px;
          height: 46px;
          margin-top: -2px;
          filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.5));
        }

        .crane-slings-svg {
          width: 140px;
          height: 22px;
          margin-top: -3px;
        }

        .crane-delivered-badge {
          animation: badgeCraneDescent 2.3s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          will-change: transform, opacity;
          margin-bottom: 0 !important;
        }

        @keyframes craneHoistSequence {
          0% {
            transform: translateX(-50%) translateY(-200px);
            opacity: 1;
          }
          65% {
            transform: translateX(-50%) translateY(0px);
            opacity: 1;
          }
          75% {
            transform: translateX(-50%) translateY(0px);
            opacity: 1;
          }
          85% {
            transform: translateX(-50%) translateY(-25px);
            opacity: 1;
          }
          96% {
            transform: translateX(-50%) translateY(-220px);
            opacity: 0;
          }
          100% {
            transform: translateX(-50%) translateY(-260px);
            opacity: 0;
            visibility: hidden;
            pointer-events: none;
            display: none;
          }
        }

        @keyframes badgeCraneDescent {
          0% {
            transform: translateY(-200px) rotate(-1.5deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          65% {
            transform: translateY(0px) rotate(1deg);
            opacity: 1;
          }
          75% {
            transform: translateY(2px) rotate(-0.5deg);
            opacity: 1;
          }
          85% {
            transform: translateY(0px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: none !important;
            opacity: 1;
          }
        }

        /* Stage 2: Subtitle Delivered by Construction Flatbed Truck */
        .truck-delivery-stage {
          position: relative;
          width: 100%;
          max-width: 800px;
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: 2.75rem;
        }

        .delivery-truck-carrier {
          position: absolute;
          bottom: -10px;
          left: 0;
          transform: translateX(-160%);
          pointer-events: none;
          z-index: 10;
          animation: truckDeliverSequence 3.0s cubic-bezier(0.25, 1, 0.5, 1) forwards;
          will-change: transform, opacity;
        }

        .delivery-truck-svg {
          width: 150px;
          height: 62px;
          filter: drop-shadow(0 6px 14px rgba(0, 0, 0, 0.6));
        }

        .truck-dust-puff {
          position: absolute;
          bottom: 2px;
          left: -15px;
          width: 25px;
          height: 12px;
          border-radius: 50%;
          background: radial-gradient(ellipse at center, rgba(203, 213, 225, 0.45) 0%, transparent 70%);
          animation: dustPuffing 0.25s ease-out infinite;
        }

        @keyframes dustPuffing {
          0% { transform: scale(0.6); opacity: 0.8; }
          100% { transform: scale(1.6); opacity: 0; }
        }

        .truck-delivered-subtitle {
          margin-bottom: 0 !important;
          animation: subtitleTruckUnload 3.0s cubic-bezier(0.25, 1, 0.5, 1) forwards;
          will-change: transform, opacity;
        }

        @keyframes truckDeliverSequence {
          0%, 50% {
            transform: translateX(-160%);
            opacity: 0;
          }
          58% {
            transform: translateX(-40%);
            opacity: 1;
          }
          74% {
            transform: translateX(10%);
            opacity: 1;
          }
          85% {
            transform: translateX(60%);
            opacity: 1;
          }
          95% {
            transform: translateX(180%);
            opacity: 0;
          }
          100% {
            transform: translateX(200%);
            opacity: 0;
            visibility: hidden;
            pointer-events: none;
            display: none;
          }
        }

        @keyframes subtitleTruckUnload {
          0%, 55% {
            opacity: 0;
            transform: translateX(-50px) translateY(12px);
          }
          74% {
            opacity: 0.9;
            transform: translateX(0) translateY(0);
          }
          88% {
            opacity: 1;
            transform: none;
          }
          100% {
            opacity: 1;
            transform: none !important;
          }
        }

        /* Stage 3: Excavator Delivering "Start New Application" Button */
        .excavator-button-stage {
          position: relative;
          display: inline-flex;
          justify-content: center;
          align-items: center;
        }

        .excavator-carrier {
          position: absolute;
          bottom: 10px;
          left: -40px;
          pointer-events: none;
          z-index: 10;
          animation: excavatorArmSequence 3.3s cubic-bezier(0.25, 1, 0.5, 1) forwards;
          will-change: transform, opacity;
        }

        .excavator-svg {
          width: 90px;
          height: 75px;
          filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.65));
        }

        .excavator-delivered-btn {
          animation: excavatorButtonDrop 3.3s cubic-bezier(0.25, 1, 0.5, 1) forwards;
          will-change: transform, opacity;
        }

        @keyframes excavatorArmSequence {
          0%, 60% {
            transform: translate(-60px, 90px) rotate(-16deg);
            opacity: 0;
          }
          68% {
            transform: translate(-10px, -8px) rotate(4deg);
            opacity: 1;
          }
          78% {
            transform: translate(0px, 0px) rotate(0deg);
            opacity: 1;
          }
          85% {
            transform: translate(15px, -15px) rotate(-8deg);
            opacity: 1;
          }
          95% {
            transform: translate(-30px, 120px) rotate(-15deg);
            opacity: 0;
          }
          100% {
            transform: translate(-30px, 140px);
            opacity: 0;
            visibility: hidden;
            pointer-events: none;
            display: none;
          }
        }

        @keyframes excavatorButtonDrop {
          0%, 60% {
            opacity: 0;
            transform: translate(-25px, 25px) rotate(-3deg);
          }
          68% {
            opacity: 0.9;
            transform: translate(-5px, -4px) rotate(1deg);
          }
          78% {
            opacity: 1;
            transform: translate(0, 2px);
          }
          86% {
            opacity: 1;
            transform: translate(0, 0);
          }
          100% {
            opacity: 1;
            transform: none !important;
          }
        }

        /* Stage 4: Drilling "Application Status" into foundation */
        .drill-button-stage {
          position: relative;
          display: inline-flex;
          justify-content: center;
          align-items: center;
        }

        .drill-rig {
          position: absolute;
          top: -46px;
          left: 50%;
          transform: translateX(-50%);
          pointer-events: none;
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: center;
          animation: drillRigSequence 3.3s cubic-bezier(0.25, 1, 0.5, 1) forwards;
          will-change: transform, opacity;
        }

        .drill-svg {
          width: 32px;
          height: 50px;
          filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.5));
          animation: drillHammering 0.08s ease-in-out infinite alternate;
        }

        @keyframes drillHammering {
          0% { transform: translateY(0px); }
          100% { transform: translateY(-3.5px); }
        }

        .drill-sparks {
          position: absolute;
          bottom: 2px;
          left: 50%;
          transform: translateX(-50%);
          width: 20px;
          height: 10px;
          pointer-events: none;
        }

        .drill-sparks .spark {
          position: absolute;
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: #fde047;
          box-shadow: 0 0 6px #f59e0b, 0 0 10px #ffffff;
          animation: sparkFly 0.15s ease-out infinite;
        }

        .drill-sparks .sp1 { left: 0px; animation-delay: 0.02s; }
        .drill-sparks .sp2 { left: 6px; animation-delay: 0.07s; }
        .drill-sparks .sp3 { left: 12px; animation-delay: 0.11s; }
        .drill-sparks .sp4 { left: 18px; animation-delay: 0.04s; }

        @keyframes sparkFly {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(calc((var(--i, 0.5) - 0.5) * 20px), -12px) scale(0.3); opacity: 0; }
        }

        .drilled-btn {
          animation: drilledButtonSequence 3.3s cubic-bezier(0.25, 1, 0.5, 1) forwards;
          will-change: transform, opacity;
        }

        @keyframes drillRigSequence {
          0%, 62% {
            transform: translateX(-50%) translateY(-70px);
            opacity: 0;
          }
          68% {
            transform: translateX(-50%) translateY(0px);
            opacity: 1;
          }
          82% {
            transform: translateX(-50%) translateY(0px);
            opacity: 1;
          }
          92% {
            transform: translateX(-50%) translateY(-60px);
            opacity: 0;
          }
          100% {
            transform: translateX(-50%) translateY(-80px);
            opacity: 0;
            visibility: hidden;
            pointer-events: none;
            display: none;
          }
        }

        @keyframes drilledButtonSequence {
          0%, 62% {
            opacity: 0;
            transform: translateY(20px) scale(0.96);
          }
          68% {
            opacity: 1;
            transform: translateY(0px);
          }
          70%, 74%, 78%, 82% {
            transform: translate(0.8px, -0.8px);
          }
          72%, 76%, 80% {
            transform: translate(-0.8px, 0.8px);
          }
          86% {
            transform: translate(0, 0);
            opacity: 1;
          }
          100% {
            transform: none !important;
            opacity: 1;
          }
        }

        /* GPS Pin Drawing & Location Marking Stage */
        .gps-drawing-stage {
          position: relative;
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: 1.4rem;
        }

        /* Carrier that moves the GPS Pin horizontally across the text */
        .gps-pin-carrier {
          position: absolute;
          top: 50%;
          left: 0%;
          transform: translate(-50%, -60%);
          pointer-events: none;
          z-index: 10;
          animation: moveGpsPin 2.6s cubic-bezier(0.25, 1, 0.5, 1) forwards;
          will-change: left, transform, opacity;
        }

        .gps-pin-body {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .gps-pin-icon {
          width: 36px;
          height: 48px;
          filter: drop-shadow(0 4px 14px rgba(0, 0, 0, 0.7)) drop-shadow(0 0 12px rgba(239, 68, 68, 0.7));
          transform-origin: 50% 100%;
          animation: pinDrawingBob 0.32s ease-in-out infinite alternate;
        }

        @keyframes pinDrawingBob {
          0% {
            transform: translateY(0px) rotate(-1.5deg);
          }
          100% {
            transform: translateY(-4px) rotate(1.5deg);
          }
        }

        /* Laser spark emitter at the pin tip */
        .gps-laser-spark {
          position: absolute;
          bottom: 0px;
          left: 50%;
          transform: translate(-50%, 50%);
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #ffffff;
          box-shadow: 0 0 10px #38bdf8, 0 0 20px #facc15, 0 0 30px #ffffff;
          animation: laserSparkle 0.15s ease-in-out infinite alternate;
        }

        @keyframes laserSparkle {
          0% {
            transform: translate(-50%, 50%) scale(0.8);
            opacity: 0.85;
          }
          100% {
            transform: translate(-50%, 50%) scale(1.3);
            opacity: 1;
          }
        }

        /* Pulsing GPS radar wave around the needle */
        .gps-radar-wave {
          position: absolute;
          bottom: -4px;
          left: 50%;
          transform: translate(-50%, 50%);
          width: 32px;
          height: 16px;
          border-radius: 50%;
          border: 1.5px solid #38bdf8;
          background: radial-gradient(ellipse at center, rgba(56, 189, 248, 0.35) 0%, transparent 70%);
          animation: radarWaveExpand 0.7s ease-out infinite;
        }

        @keyframes radarWaveExpand {
          0% {
            width: 10px;
            height: 5px;
            opacity: 1;
            border-color: #facc15;
          }
          100% {
            width: 50px;
            height: 25px;
            opacity: 0;
            border-color: #38bdf8;
          }
        }

        /* GPS Coordinates Tooltip Badge floating above the pin */
        .gps-coord-tag {
          position: absolute;
          bottom: calc(100% + 6px);
          left: 50%;
          transform: translateX(-50%);
          background: rgba(15, 23, 42, 0.92);
          border: 1px solid #38bdf8;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.5), 0 0 10px rgba(56, 189, 248, 0.4);
          backdrop-filter: blur(6px);
          color: #7dd3fc;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 0.7rem;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 6px;
          white-space: nowrap;
          letter-spacing: 0.04em;
        }

        /* Animation moving the GPS pin from left to right */
        @keyframes moveGpsPin {
          0% {
            left: 2%;
            opacity: 0;
            transform: translate(-50%, -120%) scale(0.5);
          }
          10% {
            left: 2%;
            opacity: 1;
            transform: translate(-50%, -60%) scale(1);
          }
          22% {
            left: 18%;
            transform: translate(-50%, -60%);
          }
          42% {
            left: 48%;
            transform: translate(-50%, -60%);
          }
          62% {
            left: 78%;
            transform: translate(-50%, -60%);
          }
          72% {
            left: 98%;
            opacity: 1;
            transform: translate(-50%, -60%) scale(1.15);
          }
          78% {
            left: 98%;
            opacity: 1;
            transform: translate(-50%, -60%) scale(1.3);
            filter: drop-shadow(0 0 25px #fde047);
          }
          88% {
            left: 98%;
            opacity: 0;
            transform: translate(-50%, -100%) scale(0.7);
          }
          100% {
            left: 98%;
            opacity: 0;
            transform: translate(-50%, -120%) scale(0.4);
          }
        }

        /* Layer 1: Glowing Wireframe / Blueprint Markings drawn by the GPS pin */
        .hero-title-blueprint {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          font-size: clamp(3rem, 6.5vw, 4.8rem);
          font-weight: 900;
          line-height: 1.1;
          letter-spacing: -0.03em;
          text-align: center;
          margin: 0;
          color: transparent;
          -webkit-text-stroke: 1.5px #38bdf8;
          text-shadow: 0 0 10px rgba(56, 189, 248, 0.85);
          pointer-events: none;
          z-index: 2;
          animation: drawBlueprintMarkings 2.6s cubic-bezier(0.25, 1, 0.5, 1) forwards;
          will-change: clip-path, opacity;
        }

        @keyframes drawBlueprintMarkings {
          0% {
            clip-path: inset(0 100% 0 0);
            opacity: 0;
            visibility: visible;
          }
          10% {
            clip-path: inset(0 98% 0 0);
            opacity: 1;
            visibility: visible;
          }
          70% {
            clip-path: inset(0 0% 0 0);
            opacity: 1;
            visibility: visible;
          }
          78% {
            clip-path: inset(0 0% 0 0);
            opacity: 0.3;
            visibility: visible;
          }
          85%, 100% {
            clip-path: inset(0 0% 0 0);
            opacity: 0;
            visibility: hidden;
            pointer-events: none;
          }
        }

        /* Layer 2: Final Official Philippine Flag Title */
        .hero-title {
          font-size: clamp(3rem, 6.5vw, 4.8rem);
          font-weight: 900;
          line-height: 1.1;
          letter-spacing: -0.03em;
          margin: 0;
          text-align: center;
        }

        .hero-title-revealed {
          position: relative;
          z-index: 3;
          animation: revealFinalFlagTitle 2.6s cubic-bezier(0.25, 1, 0.5, 1) forwards;
          will-change: opacity;
          transform: none !important;
        }

        @keyframes revealFinalFlagTitle {
          0%, 70% {
            opacity: 0;
          }
          82% {
            opacity: 1;
          }
          100% {
            opacity: 1;
          }
        }

        /* Philippine Flag Waving Effect: Only the colors move; text stays stationary; thin black outer glow */
        .philippine-flag-waving-text {
          display: inline-block;
          position: relative;
          background: linear-gradient(
            115deg,
            #ffffff 0%,
            #e0f2fe 8%,
            #7dd3fc 18%,
            #38bdf8 26%,
            #93c5fd 34%,
            #ffffff 42%,
            #fef08a 48%,
            #fde047 52%,
            #fef08a 56%,
            #ffffff 62%,
            #fca5a5 70%,
            #ff7675 78%,
            #f87171 86%,
            #fed7aa 92%,
            #ffffff 100%
          );
          background-size: 320% 320%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          color: transparent;
          transform: none !important;
          -webkit-text-stroke: 0.8px rgba(0, 0, 0, 0.35);
          filter: drop-shadow(0 0 1px rgba(0, 0, 0, 0.7))
                  drop-shadow(0 1px 2px rgba(0, 0, 0, 0.35));
          animation: flagWindBreeze 7s ease-in-out infinite;
          will-change: background-position;
        }

        @keyframes flagWindBreeze {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
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
          background: linear-gradient(135deg, #0038A8 0%, #021a4f 100%);
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 10px 30px rgba(0, 56, 168, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.15) inset;
          transition: all var(--transition-fast);
        }

        .hero-actions .btn-primary:hover {
          transform: translateY(-2px) !important;
          box-shadow: 0 14px 35px rgba(0, 56, 168, 0.7);
          background: linear-gradient(135deg, #0044cc 0%, #002575 100%);
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
          transform: translateY(-2px) !important;
          box-shadow: 0 14px 35px rgba(0, 0, 0, 0.35);
        }

        .btn-large {
          padding: 1rem 2.25rem;
          font-size: 1.1rem;
          border-radius: 14px;
        }

        /* Floating Action Widgets (FAQ / Mang Tomas & Back to Top) */
        .floating-widgets-dock {
          position: fixed;
          bottom: 78px;
          right: 26px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          z-index: 9999;
        }

        .dock-circle-btn {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: #ffffff;
          border: 1px solid rgba(226, 232, 240, 0.8);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12), 0 1px 3px rgba(0, 0, 0, 0.06);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          position: relative;
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease, opacity 0.25s ease;
          padding: 0;
          outline: none;
        }

        .dock-circle-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 22px rgba(0, 0, 0, 0.18);
        }

        .dock-circle-btn:active {
          transform: translateY(0) scale(0.96);
        }

        .dock-tooltip {
          position: absolute;
          right: calc(100% + 12px);
          top: 50%;
          transform: translateY(-50%) translateX(6px);
          background: #0f172a;
          color: #ffffff;
          font-size: 0.78rem;
          font-weight: 700;
          padding: 6px 12px;
          border-radius: 8px;
          white-space: nowrap;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.2s ease, transform 0.2s ease;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
        }

        .dock-tooltip::after {
          content: '';
          position: absolute;
          left: 100%;
          top: 50%;
          transform: translateY(-50%);
          border-width: 5px 0 5px 6px;
          border-style: solid;
          border-color: transparent transparent transparent #0f172a;
        }

        .dock-circle-btn:hover .dock-tooltip {
          opacity: 1;
          transform: translateY(-50%) translateX(0);
        }

        .back-to-top-fab {
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
          transform: translateY(8px);
          transition: opacity 0.25s ease, transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.25s;
        }

        .back-to-top-fab.is-visible {
          opacity: 1;
          visibility: visible;
          pointer-events: auto;
          transform: translateY(0);
        }

        .back-to-top-fab.is-visible:hover {
          transform: translateY(-2px);
        }

        .scroll-progress-svg {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .chevron-up-icon {
          position: relative;
          z-index: 1;
          transition: transform 0.2s ease;
        }

        .back-to-top-fab:hover .chevron-up-icon {
          transform: translateY(-2px);
        }

        @media (max-width: 640px) {
          .hero-title,
          .hero-title-blueprint {
            font-size: clamp(2.2rem, 8vw, 2.75rem) !important;
            letter-spacing: -0.02em;
          }
          .hero-subtitle {
            font-size: 0.98rem !important;
            line-height: 1.55 !important;
            margin-bottom: 1.75rem !important;
          }
          .hero-actions {
            flex-direction: column;
            width: 100%;
            max-width: 340px;
            gap: 0.75rem;
          }
          .excavator-button-stage,
          .drill-button-stage {
            width: 100%;
            display: flex;
            justify-content: center;
          }
          .hero-actions .btn-primary,
          .hero-actions .btn-secondary {
            width: 100%;
            padding: 0.95rem 1.5rem;
            font-size: 1rem;
            text-align: center;
            justify-content: center;
            border-radius: 12px;
          }
          .floating-widgets-dock {
            bottom: calc(20px + env(safe-area-inset-bottom, 0px));
            right: calc(16px + env(safe-area-inset-right, 0px));
          }
          .dock-tooltip {
            display: none !important;
          }
        }
      `}</style>
    </main>
  );
}
