import React, { useState } from 'react';
import { Search, Plus, ExternalLink, Filter, HelpCircle, Bell, User, Clock, FileCheck, CheckCircle2, AlertTriangle } from 'lucide-react';
import { PermitApplication, ViewFrame } from '../types';

interface ApplicantDashboardViewProps {
  applications: PermitApplication[];
  onNavigate: (view: ViewFrame) => void;
  onSelectApplication: (id: string) => void;
  unreadNotificationsCount?: number;
}

export default function ApplicantDashboardView({
  applications,
  onNavigate,
  onSelectApplication,
  unreadNotificationsCount = 2
}: ApplicantDashboardViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Interactive notification state with persistence
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    title: string;
    message: string;
    time: string;
    read: boolean;
    type: 'info' | 'success' | 'warning' | 'alert';
    appId?: string;
  }>>(() => {
    const saved = localStorage.getItem('etayo_notifications');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback below
      }
    }
    return [
      {
        id: 'notif-1',
        title: 'Evaluation Status Update',
        message: 'Your Dela Cruz Warehouse application (LC-2025-0001) has advanced to Technical Plan Evaluation.',
        time: '2 hours ago',
        read: false,
        type: 'info',
        appId: 'LC-2025-0001'
      },
      {
        id: 'notif-2',
        title: 'Building Permit Verified',
        message: 'Unified Building Permit checklist has been fully verified and approved for 2-Storey Residence (BP-2025-0005).',
        time: '5 hours ago',
        read: false,
        type: 'success',
        appId: 'BP-2025-0005'
      },
      {
        id: 'notif-3',
        title: 'Zoning Fee Calculation',
        message: 'Zoning clearance processing fee for LC-2025-0001 has been computed. Review and confirm settlement.',
        time: '1 day ago',
        read: true,
        type: 'warning',
        appId: 'LC-2025-0001'
      },
      {
        id: 'notif-4',
        title: 'OBO Sto. Tomas Portal Live',
        message: 'Welcome to eTAYO Tomasino! You can now file, pay, and track building permits online.',
        time: '3 days ago',
        read: true,
        type: 'success'
      }
    ];
  });

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const saveNotifications = (updated: typeof notifications) => {
    setNotifications(updated);
    localStorage.setItem('etayo_notifications', JSON.stringify(updated));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // Filter applications belonging to Juan Dela Cruz (for applicant dashboard)
  const applicantApps = applications.filter(
    (app) => app.applicantName === 'Juan Dela Cruz'
  );

  // Apply search & status filter
  const filteredApps = applicantApps.filter((app) => {
    const matchesSearch =
      app.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.projectAddress.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate dynamic stats based on Juan's applications
  const totalCount = applicantApps.length;
  const pendingCount = applicantApps.filter((a) => a.status === 'pending').length;
  const underReviewCount = applicantApps.filter((a) => a.status === 'under_review').length;
  const approvedCount = applicantApps.filter((a) => a.status === 'approved' || a.status === 'released').length;

  const getStatusBadgeStyles = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'under_review':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'approved':
      case 'released':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'incomplete_requirements':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'rejected':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatPermitType = (type: string) => {
    return type
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  return (
    <div id="applicant-dashboard-root" className="flex-1 bg-[#F5F8FC] min-h-screen font-sans flex flex-col">
      {/* Top Bar Component */}
      <header className="bg-white px-8 py-4 border-b border-blue-100 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono bg-blue-50 text-blue-800 px-2.5 py-1 rounded-md border border-blue-200 font-semibold uppercase">
            Applicant Portal
          </span>
          <span className="text-gray-400 text-sm">/</span>
          <span className="text-xs text-gray-600 font-medium font-mono">Sto. Tomas, Pampanga</span>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Notification Bell with Dropdown */}
          <div className="relative z-40">
            <button
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className="relative cursor-pointer hover:bg-blue-50 p-2 rounded-full transition-colors group focus:outline-none focus:ring-2 focus:ring-blue-600/20 flex items-center justify-center"
              id="applicant-bell-btn"
              title="View Notifications"
            >
              <Bell className="h-5 w-5 text-blue-850" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-[10px] text-white font-bold rounded-full flex items-center justify-center border border-white animate-pulse" id="applicant-bell-badge">
                  {unreadCount}
                </span>
              )}
            </button>
            
            {/* Notifications Dropdown Panel */}
            {isNotificationOpen && (
              <>
                {/* Backdrop overlay to close when clicking outside */}
                <div 
                  className="fixed inset-0 z-30" 
                  onClick={() => setIsNotificationOpen(false)}
                />
                
                <div 
                  className="absolute right-0 mt-2.5 w-80 md:w-96 bg-white rounded-2xl border border-blue-100 shadow-xl z-40 overflow-hidden animate-in fade-in slide-in-from-top-3 duration-200 text-left"
                  id="notifications-dropdown-panel"
                >
                  {/* Header */}
                  <div className="p-4 bg-blue-50/50 border-b border-blue-100 flex justify-between items-center">
                    <div>
                      <h4 className="font-display font-extrabold text-xs text-gray-900 flex items-center gap-1.5">
                        <Bell className="h-4 w-4 text-[#0038A8]" />
                        Inbox Notifications
                      </h4>
                      <p className="text-[9px] text-gray-500 font-mono mt-0.5">Sto. Tomas OBO Portal</p>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={() => {
                          const updated = notifications.map(n => ({ ...n, read: true }));
                          saveNotifications(updated);
                        }}
                        className="text-[10px] text-[#0038A8] hover:text-[#002D86] font-bold hover:underline"
                        id="notif-mark-all-btn"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  {/* Body List */}
                  <div className="max-h-[300px] overflow-y-auto divide-y divide-blue-50/70" id="notifications-list-container">
                    {notifications.length > 0 ? (
                      notifications.map((notif) => {
                        let iconColor = 'text-blue-500 bg-blue-50';
                        let Icon = HelpCircle;
                        if (notif.type === 'success') {
                          iconColor = 'text-emerald-600 bg-emerald-50 border-emerald-100';
                          Icon = CheckCircle2;
                        } else if (notif.type === 'warning') {
                          iconColor = 'text-amber-600 bg-amber-50 border-amber-100';
                          Icon = AlertTriangle;
                        } else if (notif.type === 'info') {
                          iconColor = 'text-blue-600 bg-blue-50 border-blue-100';
                          Icon = Clock;
                        }

                        return (
                          <div
                            key={notif.id}
                            onClick={() => {
                              // Mark as read
                              const updated = notifications.map(n => n.id === notif.id ? { ...n, read: true } : n);
                              saveNotifications(updated);
                              setIsNotificationOpen(false);
                              
                              // If there is an appId, let's select that application and track progress
                              if (notif.appId) {
                                onSelectApplication(notif.appId);
                                onNavigate('tracking_details');
                              }
                            }}
                            className={`p-4 flex gap-3 cursor-pointer transition-colors duration-150 relative text-left ${
                              notif.read ? 'hover:bg-gray-50/50' : 'bg-blue-50/20 hover:bg-blue-50/40'
                            }`}
                            id={`notification-item-${notif.id}`}
                          >
                            {/* Blue dot indicator for unread */}
                            {!notif.read && (
                              <span className="absolute top-4 right-4 w-1.5 h-1.5 bg-[#0038A8] rounded-full" />
                            )}
                            
                            {/* Custom Notification Icon */}
                            <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${iconColor}`}>
                              <Icon className="h-4 w-4" />
                            </div>

                            {/* Text message details */}
                            <div className="space-y-0.5">
                              <h5 className={`text-xs ${notif.read ? 'text-gray-700 font-medium' : 'text-gray-950 font-bold'}`}>
                                {notif.title}
                              </h5>
                              <p className="text-[11px] text-gray-600 leading-normal">
                                {notif.message}
                              </p>
                              <span className="text-[9px] text-gray-400 font-mono block pt-0.5">
                                {notif.time}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-8 text-center text-gray-400 space-y-1">
                        <p className="text-xs font-bold">No notifications</p>
                        <p className="text-[10px]">Your inbox is clean!</p>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="p-2.5 bg-gray-50 border-t border-blue-100 text-center">
                    <button
                      onClick={() => {
                        const updated = notifications.map(n => ({ ...n, read: true }));
                        saveNotifications(updated);
                        setIsNotificationOpen(false);
                      }}
                      className="text-[10px] text-gray-500 hover:text-gray-900 font-bold tracking-wide uppercase font-mono block w-full py-1"
                      id="notif-close-footer"
                    >
                      Clear / Close Window
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
          
          {/* User Profile Chip */}
          <div className="flex items-center gap-2.5 pl-3 border-l border-blue-200">
            <div className="w-8.5 h-8.5 rounded-full bg-gradient-to-tr from-[#0038A8] to-[#CE1126] flex items-center justify-center text-white font-display font-bold text-sm shadow-sm">
              JD
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-bold text-gray-800 leading-none">Juan Dela Cruz</div>
              <div className="text-[10px] text-gray-500 font-mono mt-0.5">juan.delacruz@email.com</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="p-8 max-w-6xl mx-auto w-full space-y-8 flex-grow">
        
        {/* Welcome Banner */}
        <section className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-display font-extrabold text-gray-900 tracking-tight">
              My Permit Applications
            </h1>
            <p className="text-sm text-gray-600">
              View your submitted applications, monitor progress, and continue pending transactions.
            </p>
          </div>
          <button
            id="new-application-btn-primary"
            onClick={() => onNavigate('new_application')}
            className="bg-[#0038A8] hover:bg-[#002D86] text-white font-medium px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center gap-2 text-sm shrink-0"
          >
            <Plus className="h-4.5 w-4.5" />
            + New Application
          </button>
        </section>

        {/* Dynamic Summary Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* Total */}
          <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-xs hover:shadow-sm transition-all duration-200 relative overflow-hidden group text-left">
            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50 rounded-bl-full -z-0 opacity-40 group-hover:scale-110 transition-transform"></div>
            <div className="relative z-10 space-y-2">
              <span className="text-[10px] uppercase tracking-wider text-blue-800 font-mono font-semibold">Total Applications</span>
              <div className="text-3xl font-display font-extrabold text-gray-900">{totalCount}</div>
              <span className="text-[11px] text-[#0038A8] font-medium cursor-pointer hover:underline block" onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}>
                View all entries →
              </span>
            </div>
          </div>

          {/* Pending */}
          <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-xs hover:shadow-sm transition-all duration-200 relative overflow-hidden group text-left">
            <div className="absolute top-0 right-0 w-16 h-16 bg-yellow-50 rounded-bl-full -z-0 opacity-40 group-hover:scale-110 transition-transform"></div>
            <div className="relative z-10 space-y-2">
              <span className="text-[10px] uppercase tracking-wider text-yellow-800 font-mono font-semibold">Pending Review</span>
              <div className="text-3xl font-display font-extrabold text-yellow-600">{pendingCount}</div>
              <span className="text-[11px] text-yellow-700 block">
                Awaiting initial check
              </span>
            </div>
          </div>

          {/* Under Review */}
          <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-xs hover:shadow-sm transition-all duration-200 relative overflow-hidden group text-left">
            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50 rounded-bl-full -z-0 opacity-40 group-hover:scale-110 transition-transform"></div>
            <div className="relative z-10 space-y-2">
              <span className="text-[10px] uppercase tracking-wider text-blue-800 font-mono font-semibold">Under Evaluation</span>
              <div className="text-3xl font-display font-extrabold text-blue-600">{underReviewCount}</div>
              <span className="text-[11px] text-blue-700 block">
                Being evaluated by OBO
              </span>
            </div>
          </div>

          {/* Approved / Released */}
          <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-xs hover:shadow-sm transition-all duration-200 relative overflow-hidden group text-left">
            <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-100 rounded-bl-full -z-0 opacity-40 group-hover:scale-110 transition-transform"></div>
            <div className="relative z-10 space-y-2">
              <span className="text-[10px] uppercase tracking-wider text-emerald-800 font-mono font-semibold">Approved / Released</span>
              <div className="text-3xl font-display font-extrabold text-emerald-600">{approvedCount}</div>
              <span className="text-[11px] text-emerald-700 block">
                Completed transactions
              </span>
            </div>
          </div>

        </section>

        {/* Filters and List table area */}
        <section className="bg-white rounded-2xl border border-blue-100 overflow-hidden shadow-xs">
          
          {/* Controls header */}
          <div className="p-6 border-b border-blue-100 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
            
            <div className="flex items-center gap-2 text-left">
              <div className="p-1.5 bg-blue-50 rounded-lg text-[#0038A8]">
                <FileCheck className="h-5 w-5" />
              </div>
              <h2 className="font-display font-bold text-lg text-gray-900">
                Recent Submissions
              </h2>
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              
              {/* Search bar */}
              <div className="relative max-w-xs w-full min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search project name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white text-xs py-2 pl-9 pr-4 rounded-xl border border-blue-200 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-400 transition-all duration-200"
                />
              </div>

              {/* Status Selector */}
              <div className="relative flex items-center">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-white text-xs py-2 pl-8 pr-4 rounded-xl border border-blue-200 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-700 cursor-pointer transition-all duration-200"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="under_review">Under Review</option>
                  <option value="incomplete_requirements">Incomplete</option>
                  <option value="approved">Approved</option>
                  <option value="released">Released</option>
                </select>
              </div>

            </div>

          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            {filteredApps.length > 0 ? (
              <table className="min-w-[900px] w-full text-left border-collapse">
                <thead>
                  <tr className="bg-blue-50/50 border-b border-blue-100 text-[10px] text-[#0038A8] uppercase tracking-wider font-mono font-bold">
                    <th className="py-3.5 px-6">Application No.</th>
                    <th className="py-3.5 px-6">Permit Type</th>
                    <th className="py-3.5 px-6">Project Name</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6">Date Submitted</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-100 text-xs">
                  {filteredApps.map((app) => (
                    <tr
                      key={app.id}
                      onClick={() => {
                        onSelectApplication(app.id);
                        onNavigate('tracking_details');
                      }}
                      className="hover:bg-blue-50/20 transition-all duration-150 cursor-pointer group"
                    >
                      {/* App Number */}
                      <td className="py-4 px-6 font-mono font-bold text-blue-950 group-hover:text-[#CE1126] transition-colors">
                        {app.id}
                      </td>
                      
                      {/* Permit Type */}
                      <td className="py-4 px-6 text-gray-700 font-medium">
                        {formatPermitType(app.permitType)}
                      </td>
                      
                      {/* Project Name */}
                      <td className="py-4 px-6">
                        <div className="font-semibold text-gray-900">{app.projectName}</div>
                        <div className="text-[10px] text-gray-500 font-mono truncate max-w-xs">{app.projectAddress}</div>
                      </td>
                      
                      {/* Status */}
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-[10px] font-semibold border uppercase tracking-wider ${getStatusBadgeStyles(app.status)}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 shrink-0"></span>
                          {app.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      
                      {/* Date Submitted */}
                      <td className="py-4 px-6 text-gray-600 font-mono font-medium">
                        {app.dateSubmitted}
                      </td>

                      {/* Action buttons */}
                      <td className="py-4 px-6 text-right">
                        <button
                          id={`action-btn-${app.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectApplication(app.id);
                            onNavigate('tracking_details');
                          }}
                          className="text-[#0038A8] hover:text-[#002D86] font-semibold flex items-center gap-1.5 justify-end ml-auto text-xs hover:underline transition-all"
                        >
                          Track Progress
                          <ExternalLink className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-12 text-center space-y-2">
                <p className="text-gray-500 font-semibold text-sm">No submissions match the filters.</p>
                <p className="text-xs text-gray-400">Try adjusting your search criteria or register a new building official application.</p>
                <button 
                  onClick={() => { setSearchTerm(''); setStatusFilter('all'); }} 
                  className="text-xs text-[#0038A8] font-semibold underline hover:text-[#002D86]"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>

          {/* Footer of Table */}
          <div className="p-4 bg-blue-50/20 border-t border-blue-100 flex justify-between items-center text-[11px] text-gray-500 font-mono font-medium">
            <span>Showing {filteredApps.length} of {applicantApps.length} entries</span>
            <span className="text-[#0038A8] font-semibold">Sto. Tomas OBO Portal Registry v2.0</span>
          </div>

        </section>

        {/* Helpful Capstone Guidelines or Notices */}
        <section className="bg-gradient-to-r from-white to-blue-50/30 p-6 rounded-2xl border border-blue-100 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="space-y-1.5">
            <h4 className="font-display font-bold text-xs text-[#CE1126] uppercase tracking-wider">Local Building Code</h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              Ensure all plan sets uploaded are fully signed and sealed by the respective structural, architectural, electrical, or plumbing professional with valid PRC credentials.
            </p>
          </div>
          <div className="space-y-1.5">
            <h4 className="font-display font-bold text-xs text-[#CE1126] uppercase tracking-wider">Zoning Boundaries</h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              The Municipality of Sto. Tomas implements strict alignment with the CLUP (Comprehensive Land Use Plan) to verify residential, industrial, and agricultural clusters.
            </p>
          </div>
          <div className="space-y-1.5">
            <h4 className="font-display font-bold text-xs text-[#CE1126] uppercase tracking-wider">Estimated Timeline</h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              Locational clearances take 3-5 working days. Building permits take 7-10 working days, subject to compliance on architectural, electrical, and structural evaluations.
            </p>
          </div>
        </section>

      </main>
    </div>
  );
}
