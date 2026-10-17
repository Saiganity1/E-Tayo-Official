import React from "react";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { 
  ShieldCheck, 
  Lock, 
  FileText, 
  Database, 
  Cookie, 
  UserCheck, 
  Mail, 
  MapPin, 
  ArrowLeft,
  Calendar,
  AlertCircle
} from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy | eTAYO - Sto. Tomas, Pampanga",
  description: "Official Privacy Policy of the eTAYO Government Permitting Portal under Republic Act No. 10173 (Data Privacy Act of 2012).",
};

export default function PrivacyPolicyPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", color: "#0f172a", fontFamily: "var(--font-plus-jakarta-sans), sans-serif" }}>
      {/* Top Header Bar */}
      <header style={{ background: "white", borderBottom: "1px solid #e2e8f0", padding: "1rem 2rem", position: "sticky", top: 0, zIndex: 40, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
            <Image src="/logo.png" alt="eTAYO" width={110} height={32} style={{ height: "28px", width: "auto", objectFit: "contain" }} priority />
            <div style={{ height: "20px", width: "1px", background: "#cbd5e1" }} />
            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#475569" }}>Sto. Tomas, Pampanga</span>
          </Link>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "0.88rem",
              fontWeight: 600,
              color: "#0038A8",
              textDecoration: "none",
              padding: "6px 14px",
              borderRadius: "8px",
              background: "#eff6ff"
            }}
          >
            <ArrowLeft size={16} />
            <span>Return to Home</span>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ background: "linear-gradient(135deg, #0038A8 0%, #1e40af 100%)", color: "white", padding: "3.5rem 1.5rem", textAlign: "center" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255, 255, 255, 0.15)", padding: "6px 16px", borderRadius: "999px", fontSize: "0.85rem", fontWeight: 700, letterSpacing: "0.05em", marginBottom: "1rem" }}>
            <ShieldCheck size={16} />
            <span>REPUBLIC ACT NO. 10173 COMPLIANT</span>
          </div>
          <h1 style={{ fontSize: "2.25rem", fontWeight: 800, marginBottom: "0.75rem", letterSpacing: "-0.02em" }}>
            eTAYO Privacy Policy
          </h1>
          <p style={{ fontSize: "1.05rem", opacity: 0.9, lineHeight: 1.6, maxWidth: "680px", margin: "0 auto 1.25rem auto" }}>
            The official data protection and privacy policy for the Municipal Government of Sto. Tomas, Pampanga Online Permitting & Regulatory Portal.
          </p>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", opacity: 0.8 }}>
            <Calendar size={14} />
            <span>Last Updated: October 18, 2026</span>
          </div>
        </div>
      </section>

      {/* Main Content Container */}
      <main style={{ maxWidth: "960px", margin: "-2rem auto 4rem auto", padding: "0 1.5rem" }}>
        <div style={{ background: "white", borderRadius: "20px", boxShadow: "0 10px 30px -5px rgba(0, 56, 168, 0.08), 0 0 0 1px #e2e8f0", padding: "3rem 2.5rem" }}>

          {/* Section 1: Overview & Statutory Framework */}
          <div style={{ marginBottom: "2.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "0.75rem" }}>
              <div style={{ background: "#eff6ff", color: "#0038A8", padding: "8px", borderRadius: "10px" }}>
                <FileText size={20} />
              </div>
              <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                1. Overview and Statutory Framework
              </h2>
            </div>
            <p style={{ color: "#475569", lineHeight: 1.7, fontSize: "0.96rem" }}>
              The Municipality of Sto. Tomas, Pampanga through the Office of the Building Official (OBO) and the Municipal Planning and Development Office (MPDO) is committed to protecting your personal data in full compliance with <strong>Republic Act No. 10173</strong>, also known as the <strong>Data Privacy Act of 2012 (DPA)</strong>, its Implementing Rules and Regulations (IRR), and all circulars issued by the National Privacy Commission (NPC).
            </p>
            <p style={{ color: "#475569", lineHeight: 1.7, fontSize: "0.96rem" }}>
              This policy describes how we collect, process, record, organize, store, update, use, consolidate, block, erase, and destroy your personal and project information when you access or file regulatory submissions through the eTAYO portal.
            </p>
          </div>

          {/* Section 2: Information We Collect */}
          <div style={{ marginBottom: "2.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "0.75rem" }}>
              <div style={{ background: "#eff6ff", color: "#0038A8", padding: "8px", borderRadius: "10px" }}>
                <Database size={20} />
              </div>
              <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                2. Information We Collect
              </h2>
            </div>
            <p style={{ color: "#475569", lineHeight: 1.7, fontSize: "0.96rem" }}>
              To process your municipal permits, locational clearances, and certificate applications, eTAYO collects the following categories of information:
            </p>
            <ul style={{ color: "#475569", lineHeight: 1.8, fontSize: "0.96rem", paddingLeft: "1.5rem" }}>
              <li><strong>Applicant Identification:</strong> Full legal name, residential/business address, email address, mobile number, Tax Identification Number (TIN), and government-issued identification cards.</li>
              <li><strong>Real Property & Land Titles:</strong> Transfer Certificate of Title (TCT) or Original Certificate of Title (OCT), Tax Declarations, Deed of Absolute Sale, Lease Contracts, or Authority to File.</li>
              <li><strong>Technical Engineering Documents:</strong> Architectural blueprints, structural plans, electrical specifications, sanitary diagrams, mechanical calculations, and cost estimates signed and sealed by licensed Filipino professionals (PRC registered).</li>
              <li><strong>Geospatial Data:</strong> Geographic coordinates (latitude/longitude), barangay location, lot/block numbers, and vicinity maps for zoning evaluation.</li>
              <li><strong>System Audit Logs:</strong> Timestamped IP addresses, browser user agent, login session duration, and administrative assessment notes for anti-corruption and traceability.</li>
            </ul>
          </div>

          {/* Section 3: Purpose of Data Processing */}
          <div style={{ marginBottom: "2.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "0.75rem" }}>
              <div style={{ background: "#eff6ff", color: "#0038A8", padding: "8px", borderRadius: "10px" }}>
                <Lock size={20} />
              </div>
              <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                3. Purpose of Processing
              </h2>
            </div>
            <p style={{ color: "#475569", lineHeight: 1.7, fontSize: "0.96rem" }}>
              All information submitted to eTAYO is strictly processed pursuant to official government duties and statutory mandates, including:
            </p>
            <ul style={{ color: "#475569", lineHeight: 1.8, fontSize: "0.96rem", paddingLeft: "1.5rem" }}>
              <li>Verification of zoning compliance and issuance of Locational Clearances.</li>
              <li>Assessment, technical evaluation, and approval of Building Permits in accordance with Presidential Decree No. 1096 (National Building Code of the Philippines).</li>
              <li>Conduct of joint fire safety evaluations with the Bureau of Fire Protection (BFP Sto. Tomas).</li>
              <li>Computation of municipal regulatory fees, building assessment dues, and issuance of Official Receipts.</li>
              <li>Generation of verifiable QR-coded permit credentials and Certificates of Occupancy.</li>
            </ul>
          </div>

          {/* Section 4: Cookies & Browser Storage */}
          <div style={{ marginBottom: "2.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "0.75rem" }}>
              <div style={{ background: "#eff6ff", color: "#0038A8", padding: "8px", borderRadius: "10px" }}>
                <Cookie size={20} />
              </div>
              <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                4. Cookies & Storage Policy
              </h2>
            </div>
            <p style={{ color: "#475569", lineHeight: 1.7, fontSize: "0.96rem" }}>
              eTAYO employs strictly necessary cookies and browser storage technologies to maintain platform security and user experience:
            </p>
            <div style={{ background: "#f8fafc", padding: "1.25rem", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "1rem" }}>
              <ul style={{ color: "#475569", lineHeight: 1.8, fontSize: "0.92rem", margin: 0, paddingLeft: "1.25rem" }}>
                <li><strong>Session & Auth Cookies:</strong> Cryptographically random session tokens (<code>token</code>, <code>role</code>) with <code>SameSite=Lax</code> and <code>max-age</code> limitations to gate role-specific administration views.</li>
                <li><strong>Local Storage Cache:</strong> Client-side preferences (such as language selection: English/Filipino) and active application references to prevent data loss during network hiccups.</li>
                <li><strong>Third-Party Trackers:</strong> eTAYO <em>does NOT use commercial advertising cookies, cross-site trackers, or data broker analytics</em>.</li>
              </ul>
            </div>
          </div>

          {/* Section 5: Data Subject Rights */}
          <div style={{ marginBottom: "2.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "0.75rem" }}>
              <div style={{ background: "#eff6ff", color: "#0038A8", padding: "8px", borderRadius: "10px" }}>
                <UserCheck size={20} />
              </div>
              <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                5. Your Rights as a Data Subject
              </h2>
            </div>
            <p style={{ color: "#475569", lineHeight: 1.7, fontSize: "0.96rem" }}>
              Under the Data Privacy Act of 2012, you possess the following rights regarding your personal information:
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem", marginTop: "1rem" }}>
              {[
                { title: "Right to be Informed", desc: "You have the right to know how your personal data is collected, handled, and stored." },
                { title: "Right of Access", desc: "You may access your dossier history and request copies of recorded data." },
                { title: "Right to Rectification", desc: "You may dispute inaccuracies and have erroneous personal records corrected." },
                { title: "Right to Erasure or Blocking", desc: "You may request withdrawal of data subject to mandatory statutory retention rules." },
                { title: "Right to Data Portability", desc: "You may obtain your digital application records in an electronic, interoperable format." },
                { title: "Right to Damages", desc: "You are entitled to indemnification for damages sustained due to inaccurate or unlawful data handling." }
              ].map((item, idx) => (
                <div key={idx} style={{ background: "#f8fafc", padding: "1rem", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                  <h3 style={{ fontSize: "0.92rem", fontWeight: 700, color: "#0038A8", margin: "0 0 4px 0" }}>{item.title}</h3>
                  <p style={{ fontSize: "0.85rem", color: "#64748b", margin: 0, lineHeight: 1.5 }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Section 6: Data Retention & Security */}
          <div style={{ marginBottom: "2.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "0.75rem" }}>
              <div style={{ background: "#eff6ff", color: "#0038A8", padding: "8px", borderRadius: "10px" }}>
                <ShieldCheck size={20} />
              </div>
              <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                6. Security Measures & Retention
              </h2>
            </div>
            <p style={{ color: "#475569", lineHeight: 1.7, fontSize: "0.96rem" }}>
              We enforce multi-tiered defense mechanisms including Transport Layer Security (TLS 1.3), end-to-end access control, automated session expiration (30-minute inactivity limit and 8-hour absolute lifetime), and continuous security logging. Engineering records and issued permits are archived in conformity with National Archives of the Philippines (NAP) General Records Schedules.
            </p>
          </div>

          {/* Section 7: Contact Our Data Protection Officer */}
          <div style={{ background: "#f0f7ff", border: "1.5px solid #bfdbfe", borderRadius: "14px", padding: "1.75rem" }}>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0038A8", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "8px" }}>
              <Mail size={18} /> Contact the Data Protection Officer (DPO)
            </h2>
            <p style={{ color: "#334155", fontSize: "0.92rem", lineHeight: 1.6, marginBottom: "1rem" }}>
              If you have inquiries, concerns, or requests concerning your data privacy rights, please reach out to our designated compliance unit:
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.9rem", color: "#1e293b" }}>
              <div><strong>Office:</strong> Office of the Building Official (OBO) & Municipal Data Protection Office</div>
              <div><strong>Address:</strong> Sto. Tomas Municipal Hall, San Vicente, Sto. Tomas, Pampanga 2020</div>
              <div><strong>Email:</strong> <a href="mailto:engineering@stotomaspampanga.gov.ph" style={{ color: "#0038A8", fontWeight: 600 }}>engineering@stotomaspampanga.gov.ph</a></div>
              <div><strong>Helpdesk Hotline:</strong> (045) 434-1234</div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer Return Navigation */}
      <footer style={{ borderTop: "1px solid #e2e8f0", background: "white", padding: "1.5rem", textAlign: "center" }}>
        <p style={{ color: "#64748b", fontSize: "0.85rem", margin: "0 0 0.5rem 0" }}>
          © {new Date().getFullYear()} Republic of the Philippines • Municipality of Sto. Tomas, Pampanga. All Rights Reserved.
        </p>
        <Link href="/" style={{ color: "#0038A8", fontSize: "0.85rem", fontWeight: 600, textDecoration: "none" }}>
          Return to Portal Homepage
        </Link>
      </footer>
    </div>
  );
}
