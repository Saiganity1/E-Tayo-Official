import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Globe, MapPin, Clock, Mail, Phone, ShieldCheck, ExternalLink, ChevronRight } from "lucide-react";

export default function Footer() {
  return (
    <footer className="etayo-white-footer">
      {/* Main Content Grid */}
      <div className="footer-container">
        <div className="footer-grid">
          {/* Column 1: Official Municipal Identity & Republic of the Philippines */}
          <div className="footer-col col-identity">
            {/* Logos: Bagong Pilipinas on left, Sto. Tomas seal beside it (NO background box) */}
            <div className="footer-logos-row">
              <Image
                src="/bagong-pilipinas.png"
                alt="Bagong Pilipinas Logo"
                width={70}
                height={70}
                className="gov-clean-logo"
                priority
              />
              <Image
                src="/sto-tomas-logo.png"
                alt="Municipality of Sto. Tomas Seal"
                width={70}
                height={70}
                className="gov-clean-logo"
                priority
              />
            </div>

            <div className="republic-header">
              <span className="republic-sub">REPUBLIC OF THE PHILIPPINES</span>
              <h2 className="municipality-title">Municipality of Sto. Tomas</h2>
              <span className="district-tag">4th District of Pampanga</span>
            </div>

            <p className="footer-lead-text">
              The official online regulatory and permitting platform of the Municipality of Sto. Tomas, Pampanga. Streamlining building permits, locational clearances, and occupancy approvals for residents and businesses.
            </p>

            <div className="compliance-badge">
              <ShieldCheck size={16} className="badge-icon" />
              <span>Compliant with RA 11032 (Ease of Doing Business Act)</span>
            </div>
          </div>

          {/* Column 2: About Us (What is e-Tayo) */}
          <div className="footer-col col-about">
            <h3 className="footer-heading">ABOUT US</h3>
            <div className="heading-line" />
            <p className="about-text">
              <strong>e-Tayo</strong> is the official digital municipal governance and online permitting portal of the <strong>Municipality of Sto. Tomas, Pampanga</strong>.
            </p>
            <p className="about-text">
              Built to modernize local public service, it empowers citizens, architects, engineers, and property developers with a transparent, efficient, and 100% online gateway to apply for municipal permits without in-person queueing.
            </p>
            <ul className="about-highlights">
              <li>
                <ChevronRight size={14} className="list-icon" />
                <span>Locational &amp; Zoning Clearances</span>
              </li>
              <li>
                <ChevronRight size={14} className="list-icon" />
                <span>National Building Code Permits</span>
              </li>
              <li>
                <ChevronRight size={14} className="list-icon" />
                <span>Digital Evaluation &amp; Approvals</span>
              </li>
              <li>
                <ChevronRight size={14} className="list-icon" />
                <span>Real-time QR Verification &amp; Tracking</span>
              </li>
            </ul>
          </div>

          {/* Column 3: Regulatory Offices & Departments */}
          <div className="footer-col col-offices">
            <h3 className="footer-heading">OFFICES &amp; DEPARTMENTS</h3>
            <div className="heading-line" />
            <ul className="footer-links-list">
              <li>
                <span>Office of the Building Official (OBO)</span>
              </li>
              <li>
                <span>Municipal Planning &amp; Development Office (MPDO)</span>
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
              <li>
                <span>Office of the Municipal Mayor</span>
              </li>
            </ul>
          </div>

          {/* Column 4: Public Assistance & Official Website Link */}
          <div className="footer-col col-assistance">
            <h3 className="footer-heading">PUBLIC ASSISTANCE</h3>
            <div className="heading-line" />

            {/* Official Municipal Website Link */}
            <a
              href="https://stotomaspampangagov.ph/"
              target="_blank"
              rel="noopener noreferrer"
              className="official-portal-link"
              title="Visit the Official Website of Municipality of Sto. Tomas, Pampanga"
            >
              <div className="portal-icon-wrap">
                <Globe size={18} />
              </div>
              <div className="portal-text-wrap">
                <span className="portal-label">Official LGU Website</span>
                <span className="portal-url">
                  stotomaspampangagov.ph
                  <ExternalLink size={12} className="ext-icon" />
                </span>
              </div>
            </a>

            <div className="contact-details">
              <div className="contact-item">
                <MapPin size={17} className="info-icon" />
                <span>Sto. Tomas Municipal Hall, San Vicente, Sto. Tomas, Pampanga 2020</span>
              </div>
              <div className="contact-item">
                <Clock size={17} className="info-icon" />
                <span>Monday – Friday: 8:00 AM – 5:00 PM</span>
              </div>
              <div className="contact-item">
                <Mail size={17} className="info-icon" />
                <span>engineering@stotomaspampanga.gov.ph</span>
              </div>
              <div className="contact-item">
                <Phone size={17} className="info-icon" />
                <span>(045) 434-1234 / LGU Public Helpdesk</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Copyright & Legal Strip */}
      <div className="footer-bottom-strip">
        <div className="bottom-content">
          <div className="copy-left">
            <span>© {new Date().getFullYear()} Republic of the Philippines • Municipality of Sto. Tomas, Pampanga.</span>
          </div>
          <div className="copy-right">
            <span>Powered by <strong>Niceone Solutions</strong></span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .etayo-white-footer {
          width: 100%;
          background: #ffffff;
          color: #334155;
          font-family: inherit;
          margin-top: auto;
          position: relative;
          z-index: 10;
          border-top: 1px solid #e2e8f0;
        }

        /* Container */
        .footer-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 3.5rem 3.5rem 3rem 3.5rem;
        }

        /* Grid */
        .footer-grid {
          display: grid;
          grid-template-columns: 1.35fr 1.15fr 1fr 1.15fr;
          gap: 3rem;
        }

        .footer-col {
          display: flex;
          flex-direction: column;
        }

        /* Logos Row (NO background boxes) */
        .footer-logos-row {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.25rem;
        }

        .gov-clean-logo {
          width: 60px;
          height: 60px;
          object-fit: contain;
          display: block;
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }

        /* Republic Header */
        .republic-header {
          display: flex;
          flex-direction: column;
          margin-bottom: 1rem;
        }

        .republic-sub {
          font-size: 0.76rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: #64748b;
          text-transform: uppercase;
        }

        .municipality-title {
          font-size: 1.45rem;
          font-weight: 900;
          color: #0f172a;
          letter-spacing: -0.02em;
          margin: 3px 0 2px 0;
          line-height: 1.2;
        }

        .district-tag {
          font-size: 0.85rem;
          font-weight: 700;
          color: #2563eb;
          letter-spacing: 0.01em;
        }

        .footer-lead-text {
          font-size: 0.88rem;
          line-height: 1.65;
          color: #475569;
          margin: 0 0 1.25rem 0;
        }

        /* Compliance Badge */
        .compliance-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 0.78rem;
          color: #334155;
          font-weight: 600;
          width: fit-content;
        }

        .badge-icon {
          color: #2563eb;
          flex-shrink: 0;
        }

        /* Headings */
        .footer-heading {
          font-size: 0.85rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #0f172a;
          margin: 0 0 0.5rem 0;
        }

        .heading-line {
          width: 32px;
          height: 2.5px;
          background: #2563eb;
          border-radius: 2px;
          margin-bottom: 1.25rem;
        }

        /* About Us Column */
        .about-text {
          font-size: 0.88rem;
          line-height: 1.65;
          color: #475569;
          margin: 0 0 0.75rem 0;
        }

        .about-highlights {
          list-style: none;
          padding: 0;
          margin: 0.5rem 0 0 0;
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
        }

        .about-highlights li {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.84rem;
          color: #334155;
          font-weight: 500;
        }

        .list-icon {
          color: #2563eb;
          flex-shrink: 0;
        }

        /* Offices Column */
        .footer-links-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.7rem;
        }

        .footer-links-list li span {
          font-size: 0.88rem;
          color: #475569;
          line-height: 1.45;
          transition: color 0.15s ease;
        }

        .footer-links-list li span:hover {
          color: #0f172a;
        }

        /* Official Portal Link */
        .official-portal-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          text-decoration: none;
          margin-bottom: 1.25rem;
          transition: all 0.2s ease;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.02);
        }

        .official-portal-link:hover {
          border-color: #2563eb;
          background: #f8fafc;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.1);
        }

        .portal-icon-wrap {
          width: 36px;
          height: 36px;
          background: #eff6ff;
          color: #2563eb;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .portal-text-wrap {
          display: flex;
          flex-direction: column;
        }

        .portal-label {
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #2563eb;
        }

        .portal-url {
          font-size: 0.88rem;
          font-weight: 800;
          color: #0f172a;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .ext-icon {
          color: #3b82f6;
        }

        /* Contact Details */
        .contact-details {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
        }

        .contact-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-size: 0.86rem;
          color: #475569;
          line-height: 1.5;
        }

        .info-icon {
          color: #2563eb;
          flex-shrink: 0;
          margin-top: 2px;
        }

        /* Bottom Legal Strip */
        .footer-bottom-strip {
          background: #f8fafc;
          border-top: 1px solid #e2e8f0;
          padding: 1.25rem 3.5rem;
          font-size: 0.83rem;
          color: #64748b;
        }

        .bottom-content {
          max-width: 1400px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .copy-right strong {
          color: #0f172a;
        }

        /* Responsive Breakpoints */
        @media (max-width: 1100px) {
          .footer-grid {
            grid-template-columns: 1fr 1fr;
            gap: 2.5rem;
          }
          .footer-container,
          .footer-bottom-strip {
            padding-left: 2rem;
            padding-right: 2rem;
          }
        }

        @media (max-width: 768px) {
          .footer-container {
            padding: 2.5rem 1.25rem 2rem 1.25rem;
          }
          .footer-bottom-strip {
            padding: 1rem 1.25rem;
          }
          .footer-grid {
            grid-template-columns: 1fr;
            gap: 2.25rem;
          }
          .bottom-content {
            flex-direction: column;
            align-items: flex-start;
          }
          .gov-clean-logo {
            width: 52px;
            height: 52px;
          }
        }
      `}</style>
    </footer>
  );
}
