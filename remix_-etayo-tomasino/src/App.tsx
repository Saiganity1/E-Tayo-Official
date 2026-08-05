import React, { useState, useEffect } from 'react';
import { Menu, Building2 } from 'lucide-react';
import Sidebar from './components/Sidebar';
import LandingView from './components/LandingView';
import ApplicantDashboardView from './components/ApplicantDashboardView';
import NewApplicationView from './components/NewApplicationView';
import TrackingView from './components/TrackingView';
import StaffDashboardView from './components/StaffDashboardView';
import AdminDashboardView from './components/AdminDashboardView';
import EvaluateProjectView from './components/EvaluateProjectView';
import MessagesView from './components/MessagesView';
import InteractiveMapView from './components/InteractiveMapView';
import Logo from './components/Logo';
import AuthModal from './components/AuthModal';

import { INITIAL_APPLICATIONS, INITIAL_SYSTEM_LOGS, FEE_STRUCTURES } from './data';
import { PermitApplication, SystemLog, FeeStructure, ViewFrame, PermitType } from './types';

export default function App() {
  // Navigation states
  const [currentView, setCurrentView] = useState<ViewFrame>('landing');
  const [userRole, setUserRole] = useState<'public' | 'applicant' | 'staff' | 'admin'>('public');
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  const [selectedPermitType, setSelectedPermitType] = useState<PermitType>('building_permit');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Navigation interceptor for public guests attempting to apply online
  const handleNavigate = (view: ViewFrame) => {
    if (view === 'new_application' && userRole === 'public') {
      setIsAuthModalOpen(true);
      return;
    }
    setCurrentView(view);
  };

  const handleAuthSuccess = (newRole: 'applicant') => {
    setUserRole(newRole);
    setCurrentView('new_application');
  };

  // Main synchronized states backed by localStorage
  const [applications, setApplications] = useState<PermitApplication[]>(() => {
    const saved = localStorage.getItem('etayo_applications');
    return saved ? JSON.parse(saved) : INITIAL_APPLICATIONS;
  });

  const [systemLogs, setSystemLogs] = useState<SystemLog[]>(() => {
    const saved = localStorage.getItem('etayo_system_logs');
    return saved ? JSON.parse(saved) : INITIAL_SYSTEM_LOGS;
  });

  const [feeMultiplierStructures, setFeeMultiplierStructures] = useState<FeeStructure[]>(() => {
    const saved = localStorage.getItem('etayo_fee_structures');
    return saved ? JSON.parse(saved) : FEE_STRUCTURES;
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('etayo_applications', JSON.stringify(applications));
  }, [applications]);

  useEffect(() => {
    localStorage.setItem('etayo_system_logs', JSON.stringify(systemLogs));
  }, [systemLogs]);

  useEffect(() => {
    localStorage.setItem('etayo_fee_structures', JSON.stringify(feeMultiplierStructures));
  }, [feeMultiplierStructures]);

  // Handle adding a new application
  const handleAddApplication = (newApp: PermitApplication) => {
    setApplications((prev) => [newApp, ...prev]);

    // Insert system logs
    const newLog: SystemLog = {
      id: `LOG-${Math.floor(100 + Math.random() * 900)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      category: 'application',
      message: `Created digital dossier ${newApp.id} for "${newApp.projectName}"`,
      user: newApp.applicantName,
      status: 'success'
    };
    setSystemLogs((prev) => [newLog, ...prev]);
  };

  // Handle updating an application
  const handleUpdateApplication = (updatedApp: PermitApplication) => {
    setApplications((prev) =>
      prev.map((app) => (app.id === updatedApp.id ? updatedApp : app))
    );

    // Register a setting/application audit log
    const newLog: SystemLog = {
      id: `LOG-${Math.floor(100 + Math.random() * 900)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      category: 'application',
      message: `Permit folder ${updatedApp.id} status modified to ${updatedApp.status.toUpperCase()}`,
      user: userRole === 'staff' ? 'OBO Reviewer Staff' : updatedApp.applicantName,
      status: updatedApp.status === 'incomplete_requirements' ? 'warning' : 'info'
    };
    setSystemLogs((prev) => [newLog, ...prev]);
  };

  // Handle updating fee multiplier values (Admin)
  const handleUpdateFeeMultiplier = (id: string, newValue: number) => {
    setFeeMultiplierStructures((prev) =>
      prev.map((fee) => (fee.id === id ? { ...fee, multiplierValue: newValue } : fee))
    );

    // Register setting audit log
    const newLog: SystemLog = {
      id: `LOG-${Math.floor(100 + Math.random() * 900)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      category: 'setting',
      message: `Modified ordinance assessment factor for fee ID ${id} to ${newValue}`,
      user: 'Super Admin',
      status: 'warning'
    };
    setSystemLogs((prev) => [newLog, ...prev]);
  };

  const handleClearLogs = () => {
    setSystemLogs([]);
  };

  // Switch rendered view frame dynamically
  const renderView = () => {
    switch (currentView) {
      case 'landing':
        return (
          <LandingView
            onNavigate={handleNavigate}
            onSetSelectedPermitType={setSelectedPermitType}
          />
        );
      case 'applicant_dashboard':
        return (
          <ApplicantDashboardView
            applications={applications}
            onNavigate={handleNavigate}
            onSelectApplication={setSelectedApplicationId}
          />
        );
      case 'new_application':
        return (
          <NewApplicationView
            onAddApplication={handleAddApplication}
            onNavigate={handleNavigate}
            onSelectApplication={setSelectedApplicationId}
            selectedPermitType={selectedPermitType}
            onSetSelectedPermitType={setSelectedPermitType}
          />
        );
      case 'tracking_details':
        return (
          <TrackingView
            applications={applications}
            selectedApplicationId={selectedApplicationId}
            onSelectApplication={setSelectedApplicationId}
            onNavigate={handleNavigate}
            onUpdateApplication={handleUpdateApplication}
          />
        );
      case 'staff_dashboard':
        return (
          <StaffDashboardView
            applications={applications}
            onUpdateApplication={handleUpdateApplication}
            onNavigate={handleNavigate}
            onSelectApplication={setSelectedApplicationId}
          />
        );
      case 'admin_dashboard':
        return (
          <AdminDashboardView
            applications={applications}
            systemLogs={systemLogs}
            feeStructures={feeMultiplierStructures}
            onUpdateFeeMultiplier={handleUpdateFeeMultiplier}
            onClearLogs={handleClearLogs}
            onNavigate={handleNavigate}
          />
        );
      case 'evaluate_project':
        return (
          <EvaluateProjectView
            applications={applications}
            selectedApplicationId={selectedApplicationId}
            onUpdateApplication={handleUpdateApplication}
            onNavigate={handleNavigate}
          />
        );
      case 'messages':
        return (
          <MessagesView
            userRole={userRole}
            onNavigate={handleNavigate}
          />
        );
      case 'interactive_map':
        return (
          <InteractiveMapView
            applications={applications}
            onNavigate={handleNavigate}
            onSelectApplication={setSelectedApplicationId}
          />
        );
      default:
        return (
          <LandingView
            onNavigate={handleNavigate}
            onSetSelectedPermitType={setSelectedPermitType}
          />
        );
    }
  };

  return (
    <div className="flex bg-[#F5F8FC] min-h-screen text-gray-800 w-full overflow-hidden relative">
      {/* Mobile Drawer Overlay Backdrop */}
      {isMobileSidebarOpen && (
        <div 
          onClick={() => setIsMobileSidebarOpen(false)} 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300"
          id="mobile-drawer-backdrop"
        />
      )}

      {/* Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        onNavigate={handleNavigate}
        userRole={userRole}
        onChangeRole={setUserRole}
        isMobileSidebarOpen={isMobileSidebarOpen}
        onCloseMobileSidebar={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main content frame panel */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto relative w-full">
        
        {/* Mobile Header Menu Bar */}
        <div className="lg:hidden sticky top-0 bg-[#0038A8] text-[#ffffff] px-6 py-3.5 flex items-center justify-between shadow-md shrink-0 z-30">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-2 -ml-2 rounded-xl hover:bg-white/10 text-[#FCD116] transition-colors focus:outline-none"
              id="mobile-hamburger-btn"
              aria-label="Open navigation menu"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="bg-white/95 px-2.5 py-1 rounded-xl shadow-inner border border-white/20 flex items-center">
              <Logo height={26} />
            </div>
          </div>
          <div className="text-[10px] bg-white/15 px-2.5 py-1 rounded-md border border-white/15 text-blue-100 font-mono">
            Role: <span className="capitalize font-bold text-white">{userRole}</span>
          </div>
        </div>

        {renderView()}
      </div>

      {/* Login or Sign Up popup modal for Guests trying to Apply Online */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}
