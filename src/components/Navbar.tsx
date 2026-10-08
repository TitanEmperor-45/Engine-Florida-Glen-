import React from 'react';
import {
  Clock,
  Calendar,
  Users,
  HardDriveDownload,
  CalendarDays,
  FileSpreadsheet,
  ShieldCheck,
  User,
} from 'lucide-react';
import { EngenLogo } from './EngenLogo';
import { AdminProfile } from '../types';

export type ActiveTab = 'clock' | 'calendar' | 'staff' | 'usb_import' | 'leaves' | 'reports';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  openUsbImport: () => void;
  adminProfile: AdminProfile;
  openAdminModal: () => void;
  clockedInCount: number;
  totalStaffCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  openUsbImport,
  adminProfile,
  openAdminModal,
  clockedInCount,
  totalStaffCount,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Zone 1: Brand title wordmark with Engen logo */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab('clock')}
              className="text-left focus:outline-none hover:opacity-90 transition-opacity"
            >
              <EngenLogo size="md" showSubtitle={true} />
            </button>
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-500 pl-3 border-l border-slate-200">
              <span className="font-mono tabular-nums font-semibold text-emerald-600">
                {clockedInCount}/{totalStaffCount}
              </span>
              <span>staff on duty</span>
            </div>
          </div>

          {/* Zone 2: Navigation Links (Clean text with active indicator) */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => setActiveTab('clock')}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'clock'
                  ? 'text-slate-900 bg-slate-100 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Clock className="w-4 h-4 text-slate-500" />
              <span>Time Clock</span>
            </button>

            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'calendar'
                  ? 'text-slate-900 bg-slate-100 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>Shift Calendar</span>
            </button>

            <button
              onClick={() => setActiveTab('staff')}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'staff'
                  ? 'text-slate-900 bg-slate-100 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Users className="w-4 h-4 text-slate-500" />
              <span>Staff Members</span>
            </button>

            <button
              onClick={() => setActiveTab('usb_import')}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'usb_import'
                  ? 'text-slate-900 bg-slate-100 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <HardDriveDownload className="w-4 h-4 text-blue-600" />
              <span>Q24PC USB Import</span>
            </button>

            <button
              onClick={() => setActiveTab('leaves')}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'leaves'
                  ? 'text-slate-900 bg-slate-100 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <CalendarDays className="w-4 h-4 text-slate-500" />
              <span>Leave Requests</span>
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'reports'
                  ? 'text-slate-900 bg-slate-100 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-slate-500" />
              <span>Automated Reports</span>
            </button>
          </nav>

          {/* Zone 3: Primary Action & Admin Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={openUsbImport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 active:bg-blue-900 rounded-lg transition-colors whitespace-nowrap shadow-xs"
              title="Import att.log from ERS Bio-Matrix Q24PC USB"
            >
              <HardDriveDownload className="w-4 h-4 text-blue-100 shrink-0" />
              <span>Import Q24PC USB</span>
            </button>

            {/* Admin User Button */}
            <button
              onClick={openAdminModal}
              className="flex items-center gap-2 px-2.5 py-1 text-left rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors"
              title={`Admin: ${adminProfile.name} (${adminProfile.cellPhone})`}
            >
              <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
                BM
              </div>
              <div className="hidden sm:block leading-tight">
                <div className="text-xs font-bold text-slate-900">
                  {adminProfile.name}
                </div>
                <div className="text-[10px] text-slate-500">
                  Admin · {adminProfile.cellPhone}
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="flex md:hidden items-center justify-between border-t border-slate-100 py-2 overflow-x-auto gap-2">
          <button
            onClick={() => setActiveTab('clock')}
            className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap ${
              activeTab === 'clock' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Clock
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap ${
              activeTab === 'calendar' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Calendar
          </button>
          <button
            onClick={() => setActiveTab('staff')}
            className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap ${
              activeTab === 'staff' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Staff
          </button>
          <button
            onClick={() => setActiveTab('usb_import')}
            className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap ${
              activeTab === 'usb_import' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Q24PC USB
          </button>
          <button
            onClick={() => setActiveTab('leaves')}
            className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap ${
              activeTab === 'leaves' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Leaves
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap ${
              activeTab === 'reports' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Reports
          </button>
        </div>
      </div>
    </header>
  );
};
