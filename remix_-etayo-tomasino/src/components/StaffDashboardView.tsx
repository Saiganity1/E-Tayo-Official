import React, { useState } from 'react';
import { Search, Filter, FileText, CheckCircle2, AlertTriangle, Clock, Calendar, User, ArrowRight, ClipboardCheck, Briefcase, RefreshCw, FileCheck } from 'lucide-react';
import { PermitApplication, ViewFrame, ApplicationStatus } from '../types';
import StaffChat from './StaffChat';

interface StaffDashboardViewProps {
  applications: PermitApplication[];
  onUpdateApplication: (updated: PermitApplication) => void;
  onNavigate: (view: ViewFrame) => void;
  onSelectApplication: (id: string) => void;
}

export default function StaffDashboardView({
  applications,
  onNavigate,
  onSelectApplication
}: StaffDashboardViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Compute stats for overview metrics
  const totalCount = applications.length;
  const pendingCount = applications.filter(a => a.status === 'pending').length;
  const underReviewCount = applications.filter(a => a.status === 'under_review').length;
  const completedCount = applications.filter(a => a.status === 'approved' || a.status === 'released').length;

  const handleSelectApp = (app: PermitApplication) => {
    onSelectApplication(app.id);
    onNavigate('evaluate_project');
  };

  const getStatusBadgeStyles = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'under_review':
        return 'bg-orange-50 text-orange-800 border-orange-200';
      case 'approved':
      case 'released':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'incomplete_requirements':
        return 'bg-red-50 text-red-800 border-red-200';
      case 'rejected':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      default:
        return 'bg-gray-50 text-gray-800 border-gray-200';
    }
  };

  const formatPermitType = (type: string) => {
    return type
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  // Filter application list
  const filteredApps = applications.filter(app => {
    const matchesSearch =
      app.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (app.assignedStaff && app.assignedStaff.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div id="staff-dashboard-root" className="flex-grow bg-[#F5F8FC] min-h-screen font-sans flex flex-col pb-12">
      {/* Top Welcome Header */}
      <header className="bg-white px-8 py-4 border-b border-blue-100 flex justify-between items-center shrink-0 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono bg-[#0038A8] text-white px-2.5 py-1 rounded-md border border-blue-900 font-semibold uppercase">
            OBO Staff Evaluator Area
          </span>
          <span className="text-gray-400 text-sm">/</span>
          <span className="text-xs text-gray-600 font-medium font-mono">Sto. Tomas Technical Evaluation Hub</span>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="w-8.5 h-8.5 rounded-full bg-[#0038A8] text-white flex items-center justify-center font-display font-bold text-sm shadow-sm">
            E
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-xs font-bold text-gray-800 leading-none">Evaluator Panel</div>
            <div className="text-[10px] text-blue-700 font-mono mt-0.5">Civil & Zoning Engineer</div>
          </div>
        </div>
      </header>

      {/* Main content wrapper */}
      <div className="p-8 max-w-7xl mx-auto w-full flex-1 space-y-8">
        
        {/* Hub Header Block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
          <div className="space-y-1">
            <h1 className="text-3xl font-display font-extrabold text-gray-900 tracking-tight">
              Review & Clearance Hub
            </h1>
            <p className="text-sm text-gray-500">
              Technical evaluation queue, real-time zoning compliance files check, and site inspection scheduling.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs bg-blue-50/50 text-blue-800 font-mono px-3 py-2 rounded-xl border border-blue-100 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            Real-Time Queue Active
          </div>
        </div>

        {/* Dynamic Metric Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-xs flex items-center gap-4 text-left">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-[#0038A8]">
              <Briefcase className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider font-bold">Total Portfolios</span>
              <h4 className="text-2xl font-bold text-gray-900 mt-0.5">{totalCount} dossiers</h4>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-xs flex items-center gap-4 text-left">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider font-bold">Pending Clearance</span>
              <h4 className="text-2xl font-bold text-gray-900 mt-0.5">{pendingCount} dossiers</h4>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-xs flex items-center gap-4 text-left">
            <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
              <RefreshCw className="h-6 w-6 animate-spin-slow" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider font-bold">Under Review</span>
              <h4 className="text-2xl font-bold text-gray-900 mt-0.5">{underReviewCount} dossiers</h4>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-xs flex items-center gap-4 text-left">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <FileCheck className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider font-bold">Released Clearances</span>
              <h4 className="text-2xl font-bold text-gray-900 mt-0.5">{completedCount} dossiers</h4>
            </div>
          </div>
        </div>

        {/* Folder Submissions Registry (Maximized 100% Width Layout) */}
        <div className="space-y-4 text-left">
          
          {/* Filters and Search Action Bar */}
          <div className="bg-white p-4 rounded-2xl border border-blue-150 flex flex-wrap gap-4 items-center justify-between shadow-2xs">
            <div className="relative flex-1 min-w-[280px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by ID, project name, applicant, or assigned lead expert..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-50/50 hover:bg-gray-50 text-xs py-2.5 pl-10 pr-4 rounded-xl border border-blue-150 focus:outline-none focus:ring-1 focus:ring-[#0038A8] transition-all"
              />
            </div>

            <div className="flex items-center gap-2.5">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white text-xs py-2 px-3.5 rounded-xl border border-blue-200 focus:outline-none text-gray-700 font-semibold cursor-pointer"
              >
                <option value="all">All Registries</option>
                <option value="pending">Pending Review</option>
                <option value="under_review">Under Active Review</option>
                <option value="incomplete_requirements">Incomplete Requirements</option>
                <option value="approved">Approved</option>
                <option value="released">Issued & Released</option>
              </select>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-2xl border border-blue-100 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="min-w-[1000px] w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-blue-50/20 border-b border-blue-100 text-[10px] text-[#0038A8] font-mono font-bold uppercase tracking-wider">
                    <th className="p-4 pl-6">Dossier ID</th>
                    <th className="p-4">Project Scope & Location</th>
                    <th className="p-4">Applicant Specifications</th>
                    <th className="p-4">Date Filed</th>
                    <th className="p-4">Lead Evaluator</th>
                    <th className="p-4">Review Status</th>
                    <th className="p-4 text-right pr-6">Workflow Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-50/60">
                  {filteredApps.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-gray-400 font-sans">
                        <ClipboardCheck className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                        <h5 className="font-bold text-gray-700">No Dossiers Found</h5>
                        <p className="text-xs text-gray-500 mt-1">No building clearance submissions match your current search parameters.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredApps.map((app) => (
                      <tr
                        key={app.id}
                        onClick={() => handleSelectApp(app)}
                        className="hover:bg-blue-50/10 transition-colors cursor-pointer"
                      >
                        {/* ID Code */}
                        <td className="p-4 pl-6 font-mono font-bold text-blue-950 whitespace-nowrap">
                          {app.id}
                        </td>

                        {/* Project Scope & Location */}
                        <td className="p-4 max-w-[280px]">
                          <div className="font-extrabold text-gray-900 leading-snug truncate">
                            {app.projectName}
                          </div>
                          <div className="text-[10px] text-[#0038A8] font-mono font-semibold mt-0.5">
                            {formatPermitType(app.permitType)}
                          </div>
                          <div className="text-[10px] text-gray-500 font-mono truncate mt-0.5">
                            {app.projectAddress}
                          </div>
                        </td>

                        {/* Applicant Specifications */}
                        <td className="p-4 whitespace-nowrap">
                          <div className="font-semibold text-gray-800 flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5 text-blue-800" />
                            {app.applicantName}
                          </div>
                          <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                            {app.applicantPhone}
                          </div>
                        </td>

                        {/* Date Filed */}
                        <td className="p-4 font-mono text-gray-600 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-gray-400" />
                            {app.dateSubmitted}
                          </div>
                        </td>

                        {/* Lead Evaluator */}
                        <td className="p-4 font-mono text-gray-600 whitespace-nowrap">
                          <span className="bg-gray-100 text-gray-700 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-gray-200">
                            {app.assignedStaff || 'Unassigned'}
                          </span>
                        </td>

                        {/* Review Status */}
                        <td className="p-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-bold border uppercase tracking-wider ${getStatusBadgeStyles(app.status)}`}>
                            {app.status.replace(/_/g, ' ')}
                          </span>
                        </td>

                        {/* Workflow Action */}
                        <td className="p-4 text-right pr-6 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <button
                            id={`select-row-btn-${app.id}`}
                            onClick={() => handleSelectApp(app)}
                            className="bg-[#0038A8] hover:bg-[#002D86] text-white text-[10px] font-bold px-4 py-2 rounded-xl transition-all shadow-2xs hover:shadow-xs hover:scale-102 flex items-center gap-1 ml-auto cursor-pointer"
                          >
                            <span>Evaluate Folder</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>
      
      {/* Real-Time Team Coordination Chat Drawer */}
      <StaffChat />
    </div>
  );
}
