import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Building2, Mail, MapPin, Phone, ShieldCheck, Clock, ExternalLink } from "lucide-react";

export default function Footer() {
  return (
    <footer className="etayo-footer">
      {/* Official Government Municipal Header Banner */}
      <div className="footer-gov-banner">
        <div className="gov-banner-container">
          <div className="gov-branding-left">
            {/* Bagong Pilipinas Logo on the left */}
            <div className="logo-box">
              <Image
                src="/bagong-pilipinas.png"
                alt="Bagong Pilipinas Logo"
                width={85}
                height={85}
                className="gov-logo-img"
                priority
              />
            </div>

            {/* Municipality of Sto. Tomas Official Seal beside it */}
            <div className="logo-box">
              <Image
                src="/sto-tomas-logo.png"
                alt="Bayan ng Sto. Tomas Pampanga Seal"
                width={85}
                height={85}
                className="gov-logo-img"
                priority
              />
            </div>

            {/* Official Titles (Without "Gusto ko Progreso!") */}
            <div className="gov-text-group">
              <span className="gov-republic-text">Republic of the Philippines</span>
              <div className="gov-accent-line" />
              <h2 className="gov-municipality-title">Municipality of Sto. Tomas</h2>
              <span className="gov-district-text">4th District of Pampanga</span>
            </div>
          </div>

          <div className="gov-portal-tag">
            <span className="portal-badge">Official Permitting Portal</span>
            <span className="portal-sub">LGU Sto. Tomas • e-Tayo System</span>
          </div>
        </div>
      </div>

      {/* Main Footer Links & Information Grid */}
      <div className="footer-content-section">
        <div className="footer-grid-container">
          {/* Column 1: About Sto. Tomas Digital Permitting */}
          <div className="footer-col">
            <div className="footer-brand-title">
              <span className="footer-etayo-mark">e-Tayo</span>
              <span className="footer-submark">Digital Municipal Services</span>
            </div>
            <p className="footer-desc">
              The official online regulatory and permitting platform of the Municipality of Sto. Tomas, Pampanga. Streamlining building permits, locational clearances, and occupancy approvals for residents and businesses.
            </p>
            <div className="footer-security-pill">
              <ShieldCheck size={16} className="text-emerald-400" />
              <span>Compliant with RA 11032 (Ease of Doing Business Act)</span>
            </div>
          </div>

          {/* Column 2: Permitting Services */}
          <div className="footer-col">
            <h3 className="footer-col-title">Municipal Permits</h3>
            <ul className="footer-links">
              <li>
                <Link href="/applicant/apply">Locational Clearance (Zoning)</Link>
              </li>
              <li>
                <Link href="/applicant/apply">Building Permit (Architectural & Civil)</Link>
              </li>
              <li>
                <Link href="/applicant/apply">Electrical & Mechanical Permits</Link>
              </li>
              <li>
                <Link href="/applicant/apply">Sanitary & Plumbing Permits</Link>
              </li>
              <li>
                <Link href="/applicant/apply">Certificate of Occupancy</Link>
              </li>
              <li>
                <Link href="/applicant/track">Track Application Status</Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Regulatory Offices */}
          <div className="footer-col">
            <h3 className="footer-col-title">Offices & Departments</h3>
            <ul className="footer-links">
              <li>
                <span>Office of the Building Official (OBO)</span>
              </li>
              <li>
                <span>Municipal Planning & Development Office (MPDO)</span>
              </li>
              <li>
                <span>Municipal Engineering Office (MEO)</span>
              </li>
              <li>
                <span>Bureau of Fire Protection (BFP Sto. Tomas)</span>
              </li>
              <li>
                <span>Municipal Assessor&apos;s Office</span>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact & Public Assistance */}
          <div className="footer-col">
            <h3 className="footer-col-title">Public Assistance</h3>
            <div className="footer-contact-list">
              <div className="footer-contact-item">
                <MapPin size={18} className="contact-icon" />
                <span>Sto. Tomas Municipal Hall, San Vicente, Sto. Tomas, Pampanga 2020</span>
              </div>
              <div className="footer-contact-item">
                <Clock size={18} className="contact-icon" />
                <span>Monday – Friday: 8:00 AM – 5:00 PM</span>
              </div>
              <div className="footer-contact-item">
                <Mail size={18} className="contact-icon" />
                <span>engineering@stotomaspampanga.gov.ph</span>
              </div>
              <div className="footer-contact-item">
                <Phone size={18} className="contact-icon" />
                <span>(045) 434-1234 / LGU Hotline 911</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Legal & Copyright Bar */}
      <div className="footer-bottom-bar">
        <div className="bottom-bar-container">
          <div className="bottom-left">
            <span>© {new Date().getFullYear()} Republic of the Philippines • Municipality of Sto. Tomas, Pampanga.</span>
          </div>
          <div className="bottom-right">
            <span>Powered by <strong>e-Tayo</strong> Unified Permitting & Licensing System</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .etayo-footer {
          width: 100%;
          background: #0f172a;
          color: #f1f5f9;
          font-family: inherit;
          margin-top: auto;
          position: relative;
          z-index: 10;
        }

        /* Top Government Banner */
        .footer-gov-banner {
          background: linear-gradient(135deg, #044e29 0%, #065f46 50%, #02381e 100%);
          border-top: 3px solid #10b981;
          border-bottom: 1px solid rgba(255, 255, 255, 0.15);
          padding: 1.5rem 3.5rem;
        }

        .gov-banner-container {
          max-width: 1400px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1.5rem;
        }

        .gov-branding-left {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          flex-wrap: wrap;
        }

        .logo-box {
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.25);
          padding: 6px;
          border-radius: 12px;
          backdrop-filter: blur(8px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .gov-logo-img {
          width: 68px;
          height: 68px;
          object-fit: contain;
          display: block;
        }

        .gov-text-group {
          display: flex;
          flex-direction: column;
        }

        .gov-republic-text {
          font-size: 0.95rem;
          font-weight: 600;
          color: #ecfdf5;
          letter-spacing: 0.02em;
          text-transform: uppercase;
        }

        .gov-accent-line {
          height: 3px;
          width: 100%;
          max-width: 320px;
          background: #f87171; /* Coral line matching original banner */
          margin: 4px 0 6px 0;
          border-radius: 2px;
        }

        .gov-municipality-title {
          font-size: 1.75rem;
          font-weight: 900;
          color: #ffffff;
          letter-spacing: -0.02em;
          margin: 0;
          line-height: 1.15;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .gov-district-text {
          font-size: 1rem;
          font-weight: 700;
          color: #d1fae5;
          margin-top: 2px;
          letter-spacing: 0.01em;
        }

        .gov-portal-tag {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
        }

        .portal-badge {
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.35);
          color: #ffffff;
          font-size: 0.75rem;
          font-weight: 800;
          padding: 4px 12px;
          border-radius: 999px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .portal-sub {
          font-size: 0.82rem;
          color: #a7f3d0;
          font-weight: 600;
        }

        /* Middle Grid Section */
        .footer-content-section {
          padding: 3.5rem 3.5rem 2.5rem 3.5rem;
          max-width: 1400px;
          margin: 0 auto;
        }

        .footer-grid-container {
          display: grid;
          grid-template-columns: 1.4fr 1fr 1fr 1.2fr;
          gap: 2.5rem;
        }

        .footer-col {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
        }

        .footer-brand-title {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .footer-etayo-mark {
          font-size: 1.6rem;
          font-weight: 900;
          letter-spacing: -0.03em;
          background: linear-gradient(135deg, #60a5fa, #38bdf8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .footer-submark {
          font-size: 0.8rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #94a3b8;
        }

        .footer-desc {
          font-size: 0.9rem;
          line-height: 1.65;
          color: #94a3b8;
          margin: 0;
        }

        .footer-security-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.25);
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 0.78rem;
          color: #34d399;
          font-weight: 600;
          margin-top: 0.5rem;
        }

        .footer-col-title {
          font-size: 0.95rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #f8fafc;
          margin: 0 0 0.5rem 0;
          position: relative;
          padding-bottom: 8px;
        }

        .footer-col-title::after {
          content: "";
          position: absolute;
          bottom: 0;
          left: 0;
          width: 32px;
          height: 2px;
          background: #38bdf8;
          border-radius: 2px;
        }

        .footer-links {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
        }

        .footer-links li a {
          color: #94a3b8;
          font-size: 0.88rem;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .footer-links li a:hover {
          color: #38bdf8;
          transform: translateX(4px);
        }

        .footer-links li span {
          color: #94a3b8;
          font-size: 0.88rem;
        }

        .footer-contact-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .footer-contact-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-size: 0.86rem;
          color: #94a3b8;
          line-height: 1.5;
        }

        .contact-icon {
          color: #38bdf8;
          flex-shrink: 0;
          margin-top: 2px;
        }

        /* Bottom Copyright Bar */
        .footer-bottom-bar {
          background: #090d16;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          padding: 1.25rem 3.5rem;
          font-size: 0.82rem;
          color: #64748b;
        }

        .bottom-bar-container {
          max-width: 1400px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .bottom-right strong {
          color: #94a3b8;
        }

        /* Responsive Breakpoints */
        @media (max-width: 1024px) {
          .footer-grid-container {
            grid-template-columns: 1fr 1fr;
            gap: 2rem;
          }
          .footer-gov-banner,
          .footer-content-section,
          .footer-bottom-bar {
            padding-left: 2rem;
            padding-right: 2rem;
          }
        }

        @media (max-width: 768px) {
          .footer-gov-banner {
            padding: 1.25rem 1.25rem;
          }
          .footer-content-section {
            padding: 2rem 1.25rem 1.5rem 1.25rem;
          }
          .footer-bottom-bar {
            padding: 1rem 1.25rem;
          }
          .footer-grid-container {
            grid-template-columns: 1fr;
            gap: 2rem;
          }
          .gov-portal-tag {
            align-items: flex-start;
          }
          .gov-municipality-title {
            font-size: 1.4rem;
          }
          .gov-logo-img {
            width: 54px;
            height: 54px;
          }
          .bottom-bar-container {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </footer>
  );
}
