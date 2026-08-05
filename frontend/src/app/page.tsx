import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <main className="landing-page">
      <header className="glass-panel header-nav">
        <div className="container nav-container">
          <div className="logo-group">
            <div className="logo-icon"></div>
            <h1 className="logo-text">e-Tayo</h1>
          </div>
          <nav className="nav-links">
            <Link href="/applicant/track" className="nav-link">Track Permit</Link>
            <Link href="/login" className="btn-secondary">Log In</Link>
            <Link href="/applicant/apply" className="btn-primary">Apply Now</Link>
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
            <Link href="/applicant/apply" className="btn-primary btn-large">Start New Application</Link>
            <Link href="/applicant/track" className="btn-secondary btn-large">Track Existing Permit</Link>
          </div>
        </div>
      </section>

      {/* Landing page specific layout classes that extend the global CSS */}
      <style>{`
        .landing-page {
          min-height: 100vh;
          background-color: var(--bg-main);
          position: relative;
        }

        .header-nav {
          position: fixed;
          top: 1.5rem;
          left: 50%;
          transform: translateX(-50%);
          width: 90%;
          max-width: 1200px;
          z-index: 50;
          padding: 0;
          border-radius: 99px; /* Pill shape for modern look */
        }
        
        .nav-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1.5rem;
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
          padding-top: 12rem;
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
