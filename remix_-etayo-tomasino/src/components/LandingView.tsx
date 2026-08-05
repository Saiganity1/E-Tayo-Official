import React from 'react';
import { FileText, Home, ArrowRight, Upload, MapPin, CheckCircle, HelpCircle } from 'lucide-react';
import { ViewFrame } from '../types';
import Logo from './Logo';

interface LandingViewProps {
  onNavigate: (view: ViewFrame) => void;
  onSetSelectedPermitType?: (type: 'locational_clearance' | 'building_permit' | 'occupancy_permit') => void;
}

export default function LandingView({ onNavigate, onSetSelectedPermitType }: LandingViewProps) {
  
  const handlePermitCardClick = (type: 'locational_clearance' | 'building_permit' | 'occupancy_permit') => {
    if (onSetSelectedPermitType) {
      onSetSelectedPermitType(type);
    }
    onNavigate('new_application');
  };

  return (
    <div id="landing-view-root" className="flex-1 bg-[#F5F8FC] min-h-screen font-sans flex flex-col">
      {/* Top Welcome bar with Capstone Info */}
      <div className="bg-white px-8 py-3 border-b border-blue-100 flex justify-between items-center text-xs">
        <div className="flex items-center gap-2 text-[#0038A8] font-medium">
          <span className="w-2 h-2 rounded-full bg-[#CE1126] animate-pulse"></span>
          Republic of the Philippines • Municipality of Sto. Tomas, Pampanga
        </div>
        <div className="text-[#0038A8] font-mono text-[11px] font-medium">
          Office of the Building Official (OBO) Portal
        </div>
      </div>

      <div className="p-8 max-w-6xl mx-auto w-full space-y-12 flex-1">
        
        {/* Main Hero Section */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white p-8 lg:p-12 rounded-3xl border border-blue-100 shadow-sm relative overflow-hidden">
          
          {/* Subtle architectural background vectors using SVG */}
          <div className="absolute inset-0 opacity-5 pointer-events-none">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#0038A8" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          <div className="lg:col-span-7 space-y-6 relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-[#0038A8] text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#CE1126]"></span>
              Official Capstone Prototype
            </div>
            
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <Logo height={60} />
              </div>
              <p className="text-md lg:text-lg font-display font-semibold text-[#CE1126] pt-1">
                Paperless Application and Tracking System
              </p>
              <p className="text-xs text-[#0038A8] font-mono uppercase tracking-wider">
                Office of the Building Official, Sto. Tomas, Pampanga
              </p>
            </div>

            <p className="text-gray-600 leading-relaxed text-sm md:text-base max-w-xl">
              Apply for Locational Clearance, Building Permit, and Occupancy Permit online through a centralized digital platform. Skip the physical lines, submit documents securely, pinpoint locations digitally, and monitor evaluations in real time.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <button
                id="hero-apply-btn"
                onClick={() => {
                  if (onSetSelectedPermitType) onSetSelectedPermitType('building_permit');
                  onNavigate('new_application');
                }}
                className="bg-[#0038A8] hover:bg-[#002D86] text-white font-medium px-6 py-3 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center gap-2 text-sm"
              >
                Apply Online
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                id="hero-track-btn"
                onClick={() => onNavigate('tracking_details')}
                className="bg-white hover:bg-blue-50/50 text-[#0038A8] border border-blue-200 font-medium px-6 py-3 rounded-xl hover:shadow-sm active:translate-y-0 transition-all duration-200 text-sm flex items-center gap-2"
              >
                Track Application
              </button>
            </div>
          </div>

          {/* Hero Visual Mockup */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-[340px] aspect-square rounded-2xl bg-gradient-to-tr from-[#0038A8] to-[#CE1126] p-1 shadow-xl">
              <div className="w-full h-full bg-blue-950/40 backdrop-blur-xs rounded-2xl relative overflow-hidden flex flex-col justify-end p-6">
                
                {/* SVG Government Building Illustration */}
                <div className="absolute inset-0 flex items-center justify-center p-8 opacity-20">
                  <svg viewBox="0 0 100 100" className="w-full h-full text-white fill-current">
                    <path d="M50 10 L10 35 L15 35 L15 85 L85 85 L85 35 L90 35 Z M25 45 L35 45 L35 55 L25 55 Z M45 45 L55 45 L55 55 L45 55 Z M65 45 L75 45 L75 55 L65 55 Z M25 65 L35 65 L35 75 L25 75 Z M45 65 L55 65 L55 85 L45 85 Z M65 65 L75 65 L75 75 L65 75 Z" />
                  </svg>
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-blue-950 via-blue-950/20 to-transparent"></div>

                <div className="relative z-10 space-y-2 text-white">
                  <div className="text-[10px] uppercase font-mono tracking-widest text-[#FCD116]">
                    Sto. Tomas Pampanga Hall
                  </div>
                  <h3 className="font-display font-bold text-lg leading-tight">
                    Office of the Building Official
                  </h3>
                  <p className="text-xs text-blue-100/80">
                    Modernizing compliance and urban development services for general Sto. Tomas residents.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Permit Types Cards Section */}
        <section id="permit-types-sec" className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-display font-extrabold text-gray-900">
              Services Offered
            </h2>
            <p className="text-sm text-gray-600 max-w-xl mx-auto">
              Select one of the main clearances or building official permits below to start your paperless application.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card 1: Locational Clearance */}
            <div
              id="permit-card-lc"
              onClick={() => handlePermitCardClick('locational_clearance')}
              className="bg-white hover:bg-blue-50/10 p-6 rounded-2xl border border-blue-100 hover:border-blue-400 cursor-pointer shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex flex-col text-left group"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-5 border border-blue-100 group-hover:bg-[#0038A8] transition-colors duration-200">
                <Home className="h-6 w-6 text-[#0038A8] group-hover:text-white transition-colors duration-200" />
              </div>
              <h3 className="font-display font-bold text-lg text-gray-900 mb-2 group-hover:text-[#0038A8] transition-colors">
                Locational Clearance
              </h3>
              <p className="text-sm text-gray-600 mb-6 flex-grow">
                Submit location-related requirements for zoning and municipal project assessment. Required prior to construction plans approvals.
              </p>
              <div className="flex items-center gap-1.5 text-xs text-[#0038A8] font-semibold mt-auto">
                <span>Start application</span>
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Card 2: Building Permit */}
            <div
              id="permit-card-bp"
              onClick={() => handlePermitCardClick('building_permit')}
              className="bg-white hover:bg-blue-50/10 p-6 rounded-2xl border border-blue-100 hover:border-blue-400 cursor-pointer shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex flex-col text-left group"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-5 border border-blue-100 group-hover:bg-[#0038A8] transition-colors duration-200">
                <FileText className="h-6 w-6 text-[#0038A8] group-hover:text-white transition-colors duration-200" />
              </div>
              <h3 className="font-display font-bold text-lg text-gray-900 mb-2 group-hover:text-[#0038A8] transition-colors">
                Building Permit
              </h3>
              <p className="text-sm text-gray-600 mb-6 flex-grow">
                Apply for construction, renovation, structural alteration, electrical, plumbing, or sanitary approvals of major projects.
              </p>
              <div className="flex items-center gap-1.5 text-xs text-[#0038A8] font-semibold mt-auto">
                <span>Start application</span>
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Card 3: Occupancy Permit */}
            <div
              id="permit-card-op"
              onClick={() => handlePermitCardClick('occupancy_permit')}
              className="bg-white hover:bg-blue-50/10 p-6 rounded-2xl border border-blue-100 hover:border-blue-400 cursor-pointer shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex flex-col text-left group"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-5 border border-blue-100 group-hover:bg-[#0038A8] transition-colors duration-200">
                <CheckCircle className="h-6 w-6 text-[#0038A8] group-hover:text-white transition-colors duration-200" />
              </div>
              <h3 className="font-display font-bold text-lg text-gray-900 mb-2 group-hover:text-[#0038A8] transition-colors">
                Occupancy Permit
              </h3>
              <p className="text-sm text-gray-600 mb-6 flex-grow">
                Request official approval for safe, legal occupancy of completed structural properties following local inspector evaluation.
              </p>
              <div className="flex items-center gap-1.5 text-xs text-[#0038A8] font-semibold mt-auto">
                <span>Start application</span>
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works-sec" className="bg-white p-8 lg:p-10 rounded-2xl border border-blue-100 space-y-8">
          <div className="space-y-2">
            <h2 className="text-xl font-display font-extrabold text-gray-900 flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-[#0038A8]" />
              How eTAYO Works
            </h2>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-mono">
              Simplified 4-Step Paperless Compliance Streamlining
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Step 1 */}
            <div className="space-y-3 relative group">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#0038A8] font-display font-bold flex items-center justify-center text-sm border border-blue-100">
                1
              </div>
              <h4 className="font-display font-bold text-sm text-gray-900">
                Apply Online
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Fill out our intuitive form detailing applicant info, building description, and parameters.
              </p>
            </div>

            {/* Step 2 */}
            <div className="space-y-3 relative">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#0038A8] font-display font-bold flex items-center justify-center text-sm border border-blue-100">
                2
              </div>
              <h4 className="font-display font-bold text-sm text-gray-900">
                Upload Requirements
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Submit digital scans (PDF/JPEG) of proofs of ownership, architectural drawings, and clearances.
              </p>
            </div>

            {/* Step 3 */}
            <div className="space-y-3 relative">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#0038A8] font-display font-bold flex items-center justify-center text-sm border border-blue-100">
                3
              </div>
              <h4 className="font-display font-bold text-sm text-gray-900">
                Pin Project Site
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Mark coordinates and exact municipal boundaries using our digital GIS pinning system.
              </p>
            </div>

            {/* Step 4 */}
            <div className="space-y-3 relative">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#0038A8] font-display font-bold flex items-center justify-center text-sm border border-blue-100">
                4
              </div>
              <h4 className="font-display font-bold text-sm text-gray-900">
                OBO Review
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Track engineers' zoning assessment, monitor technical clearance evaluation, and download approved certificates.
              </p>
            </div>

          </div>
        </section>

        {/* Sto. Tomas Quick Facts banner */}
        <section className="bg-[#0038A8] p-6 rounded-2xl text-white flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="font-display font-bold text-sm text-[#FCD116] uppercase tracking-widest">
              STO. TOMAS PAMPANGA INFO
            </h4>
            <p className="text-xs text-blue-100/80">
              STO. TOMAS is known for its exquisite pottery, coffin crafting artistry, and resilient agricultural developments.
            </p>
          </div>
          <div className="shrink-0 flex gap-4 text-center font-mono">
            <div className="bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
              <div className="text-xs font-bold text-[#FCD116]">7,240m</div>
              <div className="text-[8px] text-white/50 uppercase">Service Bounds</div>
            </div>
            <div className="bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
              <div className="text-xs font-bold text-[#FCD116]">7 Barangays</div>
              <div className="text-[8px] text-white/50 uppercase">Compliance</div>
            </div>
          </div>
        </section>
      </div>

      {/* Landing Footer */}
      <footer className="bg-white border-t border-blue-100 py-6 px-8 text-center text-xs text-gray-500 mt-auto font-sans">
        <p className="font-medium text-gray-600">
          eTAYO Tomasino Capstone Project
        </p>
        <p className="mt-1">
          Building a better Sto. Tomas through innovation and efficient public service.
        </p>
        <div className="mt-2 flex justify-center gap-4 text-[#0038A8] font-medium">
          <a href="#" className="hover:underline">Requirements Checklist</a>
          <span>•</span>
          <a href="#" className="hover:underline">Zoning Regulations</a>
          <span>•</span>
          <a href="#" className="hover:underline">OBO Sto. Tomas Pampanga</a>
        </div>
      </footer>
    </div>
  );
}
