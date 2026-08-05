import React from 'react';
import { Building2, Home, PlusCircle, Search, FileCheck, CreditCard, MessageSquare, User, LogOut, ShieldAlert, Settings, Activity, X, Map } from 'lucide-react';
import { ViewFrame } from '../types';
import Logo from './Logo';

interface SidebarProps {
  currentView: ViewFrame;
  onNavigate: (view: ViewFrame) => void;
  userRole: 'public' | 'applicant' | 'staff' | 'admin';
  onChangeRole: (role: 'public' | 'applicant' | 'staff' | 'admin') => void;
  unreadNotificationsCount?: number;
  isMobileSidebarOpen?: boolean;
  onCloseMobileSidebar?: () => void;
}

export default function Sidebar({
  currentView,
  onNavigate,
  userRole,
  onChangeRole,
  unreadNotificationsCount = 2,
  isMobileSidebarOpen = false,
  onCloseMobileSidebar
}: SidebarProps) {
  
  // Choose sidebar items based on the active role
  const getNavItems = () => {
    switch (userRole) {
      case 'public':
        return [
          { id: 'landing' as ViewFrame, label: 'Home', icon: Home },
          { id: 'new_application' as ViewFrame, label: 'Apply Online', icon: PlusCircle },
          { id: 'tracking_details' as ViewFrame, label: 'Track Application', icon: Search },
        ];
      case 'applicant':
        return [
          { id: 'applicant_dashboard' as ViewFrame, label: 'Dashboard', icon: Home },
          { id: 'new_application' as ViewFrame, label: 'New Application', icon: PlusCircle },
          { id: 'tracking_details' as ViewFrame, label: 'Track Application', icon: Search },
          { id: 'interactive_map' as ViewFrame, label: 'Map', icon: Map },
          { id: 'messages' as ViewFrame, label: 'Messages', icon: MessageSquare, badge: 3 },
        ];
      case 'staff':
        return [
          { id: 'staff_dashboard' as ViewFrame, label: 'Review Hub', icon: FileCheck },
          { id: 'tracking_details' as ViewFrame, label: 'Query & Inspect', icon: Search },
          { id: 'interactive_map' as ViewFrame, label: 'Map', icon: Map },
          { id: 'messages' as ViewFrame, label: 'Messages', icon: MessageSquare, badge: 5 },
        ];
      case 'admin':
        return [
          { id: 'admin_dashboard' as ViewFrame, label: 'Admin Portal', icon: ShieldAlert },
          { id: 'staff_dashboard' as ViewFrame, label: 'Review Workspaces', icon: FileCheck },
          { id: 'tracking_details' as ViewFrame, label: 'Search Registry', icon: Search },
          { id: 'interactive_map' as ViewFrame, label: 'Map', icon: Map },
        ];
    }
  };

  const navItems = getNavItems();

  return (
    <aside 
      id="sidebar-container" 
      className={`fixed inset-y-0 left-0 lg:sticky lg:flex w-72 text-white flex flex-col shrink-0 h-screen border-r border-blue-100/20 z-50 shadow-2xl lg:shadow-xl font-sans transition-transform duration-300 ease-in-out ${
        isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
      style={{
        background: 'linear-gradient(180deg, #FFFFFF 0%, #F1F5F9 20%, #0038A8 40%, #002266 100%)'
      }}
    >
      {/* Brand Header */}
      <div className="p-6 border-b border-blue-100/60 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Logo height={44} />
        </div>

        {onCloseMobileSidebar && (
          <button
            onClick={onCloseMobileSidebar}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors lg:hidden"
            id="mobile-close-sidebar-btn"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Role Selector Card */}
      <div className="p-4 mx-3 my-4 bg-white/90 rounded-2xl border border-blue-100/80 shadow-xs backdrop-blur-xs">
        <label className="text-[10px] text-[#0038A8] font-mono uppercase font-bold tracking-wider block mb-1">
          Demo Role Switcher
        </label>
        <select
          value={userRole}
          onChange={(e) => {
            const newRole = e.target.value as any;
            onChangeRole(newRole);
            if (newRole === 'public') onNavigate('landing');
            else if (newRole === 'applicant') onNavigate('applicant_dashboard');
            else if (newRole === 'staff') onNavigate('staff_dashboard');
            else if (newRole === 'admin') onNavigate('admin_dashboard');
          }}
          className="w-full bg-blue-50/50 hover:bg-blue-50 text-blue-950 text-xs font-semibold py-1.5 px-2 rounded-lg border border-blue-100/80 focus:outline-none focus:ring-1 focus:ring-blue-400 cursor-pointer transition-all duration-200"
        >
          <option value="public" className="bg-white text-gray-900">Public Guest</option>
          <option value="applicant" className="bg-white text-gray-900">Juan (Applicant)</option>
          <option value="staff" className="bg-white text-gray-900">OBO Staff Evaluator</option>
          <option value="admin" className="bg-white text-gray-900">System Admin</option>
        </select>
        <div className="mt-1.5 flex justify-between items-center text-[10px] text-gray-500 font-mono">
          <span>Active Area:</span>
          <span className="capitalize text-[#0038A8] font-bold">{userRole}</span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        <div className="text-[10px] px-3 mb-2 text-white/50 font-mono uppercase tracking-widest">
          Main Menu
        </div>
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              id={`nav-item-${item.id}`}
              onClick={() => {
                onNavigate(item.id);
                if (onCloseMobileSidebar) onCloseMobileSidebar();
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                isActive
                  ? 'bg-[#CE1126] text-white shadow-md border-l-4 border-[#FCD116]'
                  : 'text-blue-100 hover:bg-blue-800/40 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-4.5 w-4.5 transition-colors ${isActive ? 'text-white' : 'text-blue-200 group-hover:text-white'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="bg-[#FCD116] text-[#0038A8] text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Requirements & Fee quick links (Static/Interactive) */}
      <div className="p-4 m-3 bg-blue-900/30 rounded-xl border border-blue-800/40 space-y-2">
        <h4 className="text-[10px] text-blue-300/80 font-mono uppercase tracking-widest">
          Quick Informational Guides
        </h4>
        <button 
          onClick={() => {
            onNavigate('landing');
            setTimeout(() => {
              document.getElementById('how-it-works-sec')?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
          }}
          className="w-full text-left text-xs text-blue-200 hover:text-white flex items-center gap-2"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#FCD116]"></span>
          Document Requirements
        </button>
        <button 
          onClick={() => {
            onNavigate('landing');
            setTimeout(() => {
              document.getElementById('permit-types-sec')?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
          }}
          className="w-full text-left text-xs text-blue-200 hover:text-white flex items-center gap-2"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#FCD116]"></span>
          Local Zoning Guide
        </button>
      </div>

      {/* Footer Branding */}
      <div className="p-5 border-t border-blue-900 bg-blue-950/20 text-center">
        <p className="text-[11px] text-blue-200 font-medium">
          Sto. Tomas, Pampanga
        </p>
        <p className="text-[9px] text-blue-300/60 font-mono mt-0.5">
          © 2026 eTAYO Capstone v2.1
        </p>
      </div>
    </aside>
  );
}
