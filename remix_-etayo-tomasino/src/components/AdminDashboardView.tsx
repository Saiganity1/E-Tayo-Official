import React, { useState } from 'react';
import { ShieldCheck, Settings, Activity, Users, DollarSign, Calendar, Lock, AlertOctagon, HelpCircle, RefreshCw, BarChart2, Plus, Sliders } from 'lucide-react';
import { PermitApplication, SystemLog, FeeStructure, ViewFrame } from '../types';

interface AdminDashboardViewProps {
  applications: PermitApplication[];
  systemLogs: SystemLog[];
  feeStructures: FeeStructure[];
  onUpdateFeeMultiplier: (id: string, newValue: number) => void;
  onClearLogs?: () => void;
  onNavigate: (view: ViewFrame) => void;
}

export default function AdminDashboardView({
  applications,
  systemLogs,
  feeStructures,
  onUpdateFeeMultiplier,
  onClearLogs,
  onNavigate
}: AdminDashboardViewProps) {
  const [activeLogTab, setActiveLogTab] = useState<string>('all');
  const [editingFeeId, setEditingFeeId] = useState<string | null>(null);
  const [editingFeeVal, setEditingFeeVal] = useState<number>(0);

  // Filtered system logs
  const filteredLogs = systemLogs.filter((log) => {
    if (activeLogTab === 'all') return true;
    return log.category === activeLogTab;
  });

  // Calculate high level admin metrics
  const totalAppsCount = applications.length;
  
  // Total verified requirements across all submissions
  const totalVerifiedDocs = applications.reduce(
    (sum, app) => sum + app.requirements.filter(r => r.status === 'approved').length,
    0
  );

  // Compliance percentage (approved or released folders)
  const approvedReleasedCount = applications.filter(a => a.status === 'approved' || a.status === 'released').length;
  const compliancePercentage = totalAppsCount > 0 
    ? Math.round((approvedReleasedCount / totalAppsCount) * 100) 
    : 0;

  // Average processing duration simulation (mock data or calculated)
  const avgProcessingDays = 4.2;

  const handleStartEditMultiplier = (fee: FeeStructure) => {
    setEditingFeeId(fee.id);
    setEditingFeeVal(fee.multiplierValue || 0);
  };

  const handleSaveMultiplier = (id: string) => {
    onUpdateFeeMultiplier(id, editingFeeVal);
    setEditingFeeId(null);
    alert('Municipal ordinance fee structures and multipliers updated successfully.');
  };

  const getLogCategoryColor = (category: string) => {
    switch (category) {
      case 'security':
        return 'bg-rose-100 text-rose-850 border-rose-300 font-bold';
      case 'setting':
        return 'bg-amber-100 text-amber-850 border-amber-300';
      case 'application':
        return 'bg-emerald-100 text-emerald-850 border-emerald-300';
      default:
        return 'bg-orange-100 text-orange-850 border-orange-300';
    }
  };

  const getLogStatusDot = (status: string) => {
    switch (status) {
      case 'error': return 'bg-red-600';
      case 'warning': return 'bg-amber-500';
      case 'info': return 'bg-sky-500';
      default: return 'bg-emerald-600';
    }
  };

  return (
    <div id="admin-dashboard-root" className="flex-1 bg-[#F5F8FC] min-h-screen font-sans flex flex-col">
      {/* Top Welcome Bar */}
      <header className="bg-white px-8 py-4 border-b border-blue-100 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono bg-[#0038A8] text-white px-2.5 py-1 rounded-md border border-blue-900 font-semibold uppercase flex items-center gap-1.5">
            <Lock className="h-3 w-3 text-blue-300" />
            System Administration Command Center
          </span>
          <span className="text-gray-400 text-sm">/</span>
          <span className="text-xs text-gray-600 font-medium font-mono">Ordinance & Security Control</span>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="w-8.5 h-8.5 rounded-full bg-[#0038A8] text-white flex items-center justify-center font-display font-bold text-sm shadow-sm border border-blue-800">
            A
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-xs font-bold text-gray-800 leading-none">Super Administrator</div>
            <div className="text-[10px] text-blue-700 font-mono mt-0.5">Municipal Tech Architect</div>
          </div>
        </div>
      </header>

      <div className="p-8 max-w-7xl mx-auto w-full space-y-8 flex-grow">
        
        {/* Title hud */}
        <section className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-left">
          <div className="space-y-1">
            <h1 className="text-2xl font-display font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-[#0038A8]" />
              eTAYO Administrative Command Panel
            </h1>
            <p className="text-xs text-gray-500">
              Oversee local permit compliance, view technical guidelines, and audit municipal staff activity logs.
            </p>
          </div>
          <button
            id="go-reviewer-workspace-btn"
            onClick={() => onNavigate('staff_dashboard')}
            className="bg-[#0038A8] hover:bg-[#002D86] text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            Open Review Workspace →
          </button>
        </section>

        {/* Dynamic Analytics Hud */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 text-left">
          
          {/* Total Documents Verified */}
          <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-xs hover:shadow-sm transition-all duration-200">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-mono font-bold text-[#0038A8] uppercase tracking-wider">Verified Documents</span>
              <div className="bg-blue-100 p-1.5 rounded-lg text-[#0038A8]">
                <ShieldCheck className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 space-y-1">
              <div className="text-2xl font-display font-extrabold text-gray-900">
                {totalVerifiedDocs} Items
              </div>
              <p className="text-[10px] text-gray-500">Approved checklist attachments</p>
            </div>
          </div>

          {/* Submissions queue */}
          <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-xs hover:shadow-sm transition-all duration-200">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider">Active Folders</span>
              <div className="bg-blue-50 p-1.5 rounded-lg text-blue-800">
                <BarChart2 className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 space-y-1">
              <div className="text-2xl font-display font-extrabold text-gray-900">
                {totalAppsCount} Submissions
              </div>
              <p className="text-[10px] text-gray-500">Total folders registered in portal</p>
            </div>
          </div>

          {/* Compliance Ratio */}
          <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-xs hover:shadow-sm transition-all duration-200">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-mono font-bold text-emerald-800 uppercase tracking-wider">Compliance Rate</span>
              <div className="bg-emerald-100 p-1.5 rounded-lg text-emerald-800">
                <Activity className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 space-y-1">
              <div className="text-2xl font-display font-extrabold text-gray-900">
                {compliancePercentage}%
              </div>
              <p className="text-[10px] text-gray-500">Folders fully evaluated and released</p>
            </div>
          </div>

          {/* Processing Latency */}
          <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-xs hover:shadow-sm transition-all duration-200">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider">OBO Evaluation Latency</span>
              <div className="bg-blue-50 p-1.5 rounded-lg text-blue-800">
                <Calendar className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 space-y-1">
              <div className="text-2xl font-display font-extrabold text-gray-900">
                {avgProcessingDays} Days
              </div>
              <p className="text-[10px] text-gray-500">Average duration to sign dossiers</p>
            </div>
          </div>

        </section>

        {/* Configurations & Audit Trail layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left: Ordinance Clearance Guidelines (Col 6) */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <div className="bg-white p-6 rounded-3xl border border-blue-100 shadow-xs space-y-6">
              <div className="flex justify-between items-center border-b border-blue-100 pb-3">
                <div className="space-y-0.5">
                  <h3 className="font-display font-extrabold text-sm text-[#0038A8] flex items-center gap-1.5">
                    <Sliders className="h-4 w-4 text-[#0038A8]" />
                    Permit Compliance Guidelines
                  </h3>
                  <p className="text-[11px] text-gray-500">Official OBO structural standard checklist references for Sto. Tomas, Pampanga.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-3.5 bg-blue-50/10 rounded-xl border border-blue-100 space-y-2">
                  <div className="text-xs font-bold text-[#0038A8]">1. Locational Clearance (Zoning)</div>
                  <p className="text-[11px] text-gray-600 leading-normal">
                    Must comply with the Municipal Comprehensive Land Use Plan (CLUP). Industrial zones require specialized environmental clearance certificates.
                  </p>
                </div>
                <div className="p-3.5 bg-blue-50/10 rounded-xl border border-blue-100 space-y-2">
                  <div className="text-xs font-bold text-[#0038A8]">2. Building Permit Standards</div>
                  <p className="text-[11px] text-gray-600 leading-normal">
                    All blueprints must feature a wet seal and dry-stamp of duly registered Civil/Structural Engineers. Design parameters must withstand regional seismic activity factors.
                  </p>
                </div>
                <div className="p-3.5 bg-blue-50/10 rounded-xl border border-blue-100 space-y-2">
                  <div className="text-xs font-bold text-[#0038A8]">3. Occupancy Permit Requirements</div>
                  <p className="text-[11px] text-gray-600 leading-normal">
                    Requires a Fire Safety Inspection Certificate (FSIC) from the BFP and a Certificate of Completion signed by the construction supervisor.
                  </p>
                </div>
              </div>

              {/* Ordinance guide info footer */}
              <div className="bg-blue-50/20 p-4 rounded-xl border border-blue-100 flex gap-2.5 text-xs text-gray-600 leading-relaxed">
                <HelpCircle className="h-5 w-5 text-[#0038A8] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-blue-950 font-semibold block">Automatic Verification Routing:</strong>
                  The portal ensures that applications with missing, incomplete, or rejected document checklists are immediately flagged for revision.
                </div>
              </div>

            </div>
          </div>

          {/* Right: Security Auditor & System Logs (Col 6) */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <div className="bg-white p-6 rounded-3xl border border-blue-100 shadow-xs space-y-5">
              <div className="flex justify-between items-center border-b border-blue-100 pb-3">
                <div className="space-y-0.5">
                  <h3 className="font-display font-extrabold text-sm text-[#0038A8] flex items-center gap-1.5">
                    <Activity className="h-4 w-4 text-[#0038A8]" />
                    Portal Security Audit Trail
                  </h3>
                  <p className="text-[11px] text-gray-500">Live transaction, configuration edits, and login telemetry stream.</p>
                </div>
              </div>

              {/* Logs Tabs */}
              <div className="flex flex-wrap gap-1.5 border-b border-blue-100 pb-2">
                {['all', 'application', 'security', 'setting', 'system'].map((category) => (
                  <button
                    key={category}
                    id={`log-tab-${category}`}
                    onClick={() => setActiveLogTab(category)}
                    className={`text-[10px] font-bold py-1.5 px-3 rounded-lg capitalize transition-colors cursor-pointer ${
                      activeLogTab === category
                        ? 'bg-[#0038A8] text-white shadow-2xs'
                        : 'text-gray-500 hover:bg-blue-100/50 hover:text-gray-800'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>

              {/* Logs List representation */}
              <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                {filteredLogs.map((log) => (
                  <div key={log.id} className="p-3 bg-white border border-blue-100 rounded-xl text-xs space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className={`px-2 py-0.5 rounded border ${getLogCategoryColor(log.category)}`}>
                        {log.category}
                      </span>
                      <span className="text-gray-400 font-medium">{log.timestamp}</span>
                    </div>

                    <p className="text-gray-800 leading-normal font-mono font-medium">
                      {log.message}
                    </p>

                    <div className="flex justify-between items-center text-[9px] text-gray-500 font-mono pt-1 border-t border-blue-100/40">
                      <span>User: <strong className="text-gray-700">{log.user}</strong></span>
                      <span className="flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${getLogStatusDot(log.status)}`}></span>
                        {log.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
