import React from 'react';
import {
  Clock,
  Calendar,
  Users,
  HardDriveDownload,
  CalendarDays,
  FileSpreadsheet,
  Fingerprint,
  Bell,
  Download,
  Database,
  CheckCircle2,
} from 'lucide-react';
import { EngenLogo } from './EngenLogo';
import { AdminProfile } from '../types';

export type ActiveTab =
  | 'clock'
  | 'biometric_analytics'
  | 'calendar'
  | 'staff'
  | 'usb_import'
  | 'leaves'
  | 'reports';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  openUsbImport: () => void;
  adminProfile: AdminProfile;
  openAdminModal: () => void;
  clockedInCount: number;
  totalStaffCount: number;
  unreadNotificationsCount?: number;
  openNotificationsModal?: () => void;
  onExportAccountantCsv?: () => void;
  isDbSynced?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  openUsbImport,
  adminProfile,
  openAdminModal,
  clockedInCount,
  totalStaffCount,
  unreadNotificationsCount = 0,
  openNotificationsModal,
  onExportAccountantCsv,
  isDbSynced = true,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Zone 1: Brand title wordmark with Engen logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('clock')}
              className="text-left focus:outline-none hover:opacity-90 transition-opacity"
            >
              <EngenLogo size="md" showSubtitle={true} />
            </button>

            {/* Live Database Status Indicator */}
            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Live DB Active</span>
            </div>

            <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-500 pl-3 border-l border-slate-200">
              <span className="font-mono tabular-nums font-semibold text-emerald-600">
                {clockedInCount}/{totalStaffCount}
              </span>
              <span>staff on duty</span>
            </div>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => setActiveTab('clock')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs lg:text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'clock'
                  ? 'text-slate-900 bg-slate-100 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Clock className="w-4 h-4 text-slate-500" />
              <span>Time Clock</span>
            </button>

            <button
              onClick={() => setActiveTab('biometric_analytics')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs lg:text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'biometric_analytics'
                  ? 'text-blue-700 bg-blue-50 font-bold border border-blue-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
              title="Scanner Hours Breakdown (Day/Week/Month)"
            >
              <Fingerprint className="w-4 h-4 text-blue-600" />
              <span>att.log Hours</span>
            </button>

            <button
              onClick={() => setActiveTab('leaves')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs lg:text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'leaves'
                  ? 'text-slate-900 bg-slate-100 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <CalendarDays className="w-4 h-4 text-slate-500" />
              <span>Leave Requests</span>
            </button>

            <button
              onClick={() => setActiveTab('staff')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs lg:text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'staff'
                  ? 'text-slate-900 bg-slate-100 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Users className="w-4 h-4 text-slate-500" />
              <span>Staff & Rates</span>
            </button>

            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs lg:text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'calendar'
                  ? 'text-slate-900 bg-slate-100 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>Roster</span>
            </button>

            <button
              onClick={() => setActiveTab('usb_import')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs lg:text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'usb_import'
                  ? 'text-slate-900 bg-slate-100 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <HardDriveDownload className="w-4 h-4 text-blue-600" />
              <span>USB Import</span>
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs lg:text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'reports'
                  ? 'text-slate-900 bg-slate-100 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-slate-500" />
              <span>Reports</span>
            </button>
          </nav>

          {/* Zone 3: Primary Actions, Open-WA Notification Bell & Admin Profile */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Quick Export to Accountant Button */}
            {onExportAccountantCsv && (
              <button
                type="button"
                onClick={onExportAccountantCsv}
                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors whitespace-nowrap shadow-2xs"
                title="Export complete payroll breakdown for the accountant in South African Rands"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Accountant CSV</span>
              </button>
            )}

            {/* Open-WA / Notification Bell */}
            {openNotificationsModal && (
              <button
                type="button"
                onClick={openNotificationsModal}
                className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                title="Open-WA, Email & SMS Notification Center"
              >
                <Bell className="w-4 h-4" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-rose-600 text-white font-bold text-[9px] rounded-full flex items-center justify-center animate-bounce">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>
            )}

            {/* Admin User Button */}
            <button
              onClick={openAdminModal}
              className="flex items-center gap-2 px-2.5 py-1 text-left rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors"
              title={`Admin: ${adminProfile.name} (${adminProfile.cellPhone} · ${adminProfile.email})`}
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
            className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap ${
              activeTab === 'clock' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Clock
          </button>
          <button
            onClick={() => setActiveTab('biometric_analytics')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap ${
              activeTab === 'biometric_analytics' ? 'bg-blue-700 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            att.log Hours
          </button>
          <button
            onClick={() => setActiveTab('leaves')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap ${
              activeTab === 'leaves' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Leaves
          </button>
          <button
            onClick={() => setActiveTab('staff')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap ${
              activeTab === 'staff' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Staff & Rates
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap ${
              activeTab === 'calendar' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Roster
          </button>
          <button
            onClick={() => setActiveTab('usb_import')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap ${
              activeTab === 'usb_import' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            USB
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap ${
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
