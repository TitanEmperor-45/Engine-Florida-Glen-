/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  StaffMember,
  PunchRecord,
  ShiftSchedule,
  LeaveRequest,
  AutomatedReportSchedule,
  GeneratedReportSummary,
  LeaveStatus,
  AdminProfile,
  HolidayEvent,
  RosterShiftEntry,
} from './types';
import {
  loadAdminProfile,
  saveAdminProfile,
  loadStaff,
  saveStaff,
  loadShifts,
  loadPunches,
  savePunches,
  loadLeaves,
  saveLeaves,
  loadReportSchedules,
  saveReportSchedules,
  loadGeneratedReports,
  saveGeneratedReports,
  loadRoster,
  saveRoster,
  loadHolidays,
  saveHolidays,
  resetAllToDemoData,
} from './utils/storage';
import { Navbar, ActiveTab } from './components/Navbar';
import { TimeClockingView } from './components/TimeClockingView';
import { CalendarView } from './components/CalendarView';
import { StaffView } from './components/StaffView';
import { LeaveView } from './components/LeaveView';
import { ReportsView } from './components/ReportsView';
import { UsbImportModal } from './components/UsbImportModal';
import { ManualPunchModal } from './components/ManualPunchModal';
import { AdminProfileModal } from './components/AdminProfileModal';
import { RotateCcw, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('clock');

  // Core database state
  const [adminProfile, setAdminProfile] = useState<AdminProfile>(() => loadAdminProfile());
  const [staffList, setStaffList] = useState<StaffMember[]>(() => loadStaff());
  const [shifts, setShifts] = useState<ShiftSchedule[]>(() => loadShifts());
  const [punches, setPunches] = useState<PunchRecord[]>(() => loadPunches());
  const [leaves, setLeaves] = useState<LeaveRequest[]>(() => loadLeaves());
  const [reportSchedules, setReportSchedules] = useState<AutomatedReportSchedule[]>(() =>
    loadReportSchedules()
  );
  const [generatedReports, setGeneratedReports] = useState<GeneratedReportSummary[]>(() =>
    loadGeneratedReports()
  );
  const [roster, setRoster] = useState<RosterShiftEntry[]>(() => loadRoster());
  const [holidays, setHolidays] = useState<HolidayEvent[]>(() => loadHolidays());

  // Modals state
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);
  const [isUsbModalOpen, setIsUsbModalOpen] = useState<boolean>(false);
  const [isManualPunchOpen, setIsManualPunchOpen] = useState<boolean>(false);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // State persistence listeners
  const handleRecordPunch = (punchData: Omit<PunchRecord, 'id'>) => {
    const newRecord: PunchRecord = {
      ...punchData,
      id: `punch-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };

    const updated = [newRecord, ...punches];
    setPunches(updated);
    savePunches(updated);

    const staff = staffList.find((s) => s.id === punchData.staffId);
    showToast(`Punch recorded: ${staff?.name || 'Staff'} (${punchData.type.replace('_', ' ')})`);
  };

  const handleDeletePunch = (punchId: string) => {
    const updated = punches.filter((p) => p.id !== punchId);
    setPunches(updated);
    savePunches(updated);
    showToast('Punch record removed from audit history.');
  };

  const handleCommitUsbPunches = (newPunches: PunchRecord[]) => {
    const updated = [...newPunches, ...punches];
    setPunches(updated);
    savePunches(updated);
    showToast(`Successfully imported ${newPunches.length} punch records from USB flash drive.`);
  };

  const handleAddStaff = (newStaff: StaffMember) => {
    const updated = [...staffList, newStaff];
    setStaffList(updated);
    saveStaff(updated);
    showToast(`Staff member ${newStaff.name} registered (Bio ID #${newStaff.biometricId}).`);
  };

  const handleUpdateStaff = (updatedStaff: StaffMember) => {
    const updated = staffList.map((s) => (s.id === updatedStaff.id ? updatedStaff : s));
    setStaffList(updated);
    saveStaff(updated);
    showToast(`Staff profile for ${updatedStaff.name} updated.`);
  };

  const handleDeleteStaff = (staffId: string) => {
    const staff = staffList.find((s) => s.id === staffId);
    const updated = staffList.filter((s) => s.id !== staffId);
    setStaffList(updated);
    saveStaff(updated);
    showToast(`Staff member ${staff?.name || ''} removed.`);
  };

  const handleAddLeave = (newLeave: LeaveRequest) => {
    const updated = [newLeave, ...leaves];
    setLeaves(updated);
    saveLeaves(updated);
    showToast('Leave application submitted for approval.');
  };

  const handleUpdateLeaveStatus = (
    leaveId: string,
    status: LeaveStatus,
    reviewNotes?: string
  ) => {
    const leaveToUpdate = leaves.find((l) => l.id === leaveId);
    if (!leaveToUpdate) return;

    // If approved, deduct leave balance from employee
    if (status === 'approved' && leaveToUpdate.status !== 'approved') {
      const staff = staffList.find((s) => s.id === leaveToUpdate.staffId);
      if (staff) {
        let updatedBalances = { ...staff.leaveBalances };
        if (leaveToUpdate.type === 'annual') {
          updatedBalances.annual = Math.max(0, updatedBalances.annual - leaveToUpdate.daysCount);
        } else if (leaveToUpdate.type === 'sick') {
          updatedBalances.sick = Math.max(0, updatedBalances.sick - leaveToUpdate.daysCount);
        } else if (leaveToUpdate.type === 'casual') {
          updatedBalances.casual = Math.max(0, updatedBalances.casual - leaveToUpdate.daysCount);
        }

        const updatedStaffList = staffList.map((s) =>
          s.id === staff.id ? { ...s, leaveBalances: updatedBalances } : s
        );
        setStaffList(updatedStaffList);
        saveStaff(updatedStaffList);
      }
    }

    const updatedLeaves = leaves.map((l) =>
      l.id === leaveId
        ? {
            ...l,
            status,
            reviewedBy: 'Operations Administrator',
            reviewedAt: new Date().toISOString(),
            reviewNotes: reviewNotes || l.reviewNotes,
          }
        : l
    );

    setLeaves(updatedLeaves);
    saveLeaves(updatedLeaves);
    showToast(`Leave request marked as ${status}.`);
  };

  const handleUpdateSchedules = (updatedSchedules: AutomatedReportSchedule[]) => {
    setReportSchedules(updatedSchedules);
    saveReportSchedules(updatedSchedules);
  };

  const handleAddGeneratedReport = (newRep: GeneratedReportSummary) => {
    const updated = [newRep, ...generatedReports];
    setGeneratedReports(updated);
    saveGeneratedReports(updated);
  };

  const handleSaveRosterEntry = (entry: Omit<RosterShiftEntry, 'id'>) => {
    // Check if entry already exists for this staff on this date
    const existingIndex = roster.findIndex(
      (r) => r.staffId === entry.staffId && r.date === entry.date
    );

    let updated: RosterShiftEntry[];
    if (existingIndex >= 0) {
      updated = [...roster];
      updated[existingIndex] = {
        ...entry,
        id: roster[existingIndex].id,
      };
    } else {
      const newEntry: RosterShiftEntry = {
        ...entry,
        id: `rst-${entry.date}-${entry.staffId}-${Math.random().toString(36).slice(2, 6)}`,
      };
      updated = [newEntry, ...roster];
    }

    setRoster(updated);
    saveRoster(updated);
    const staff = staffList.find((s) => s.id === entry.staffId);
    showToast(`Roster updated: ${staff?.name || 'Staff'} on ${entry.date}`);
  };

  const handleDeleteRosterEntry = (entryId: string) => {
    const updated = roster.filter((r) => r.id !== entryId);
    setRoster(updated);
    saveRoster(updated);
    showToast('Shift removed from roster schedule.');
  };

  const handleBatchAutoRoster = (monthStr: string) => {
    // monthStr is e.g. "2026-10"
    const [yStr, mStr] = monthStr.split('-');
    const year = parseInt(yStr, 10);
    const month = parseInt(mStr, 10);
    const daysInMonth = new Date(year, month, 0).getDate();

    const newEntries: RosterShiftEntry[] = [...roster.filter((r) => !r.date.startsWith(monthStr))];

    for (let d = 1; d <= daysInMonth; d++) {
      const dayStr = String(d).padStart(2, '0');
      const date = `${monthStr}-${dayStr}`;
      const dateObj = new Date(year, month - 1, d);
      const dayOfWeek = dateObj.getDay();

      staffList.forEach((staff) => {
        // Respect approved leaves
        const isLeave = leaves.some(
          (l) => l.staffId === staff.id && l.status === 'approved' && date >= l.startDate && date <= l.endDate
        );
        if (isLeave) return;

        // Workshop & Admin off on Sundays
        if (staff.department === 'Administration & Management' || staff.department === 'Workshop & Service') {
          if (dayOfWeek === 0) return;
        }

        newEntries.push({
          id: `rst-${date}-${staff.id}`,
          staffId: staff.id,
          date,
          shiftId: staff.shiftId,
          notes: 'Standard shift rotation',
        });
      });
    }

    setRoster(newEntries);
    saveRoster(newEntries);
    showToast(`Auto-generated monthly roster for ${monthStr} (${newEntries.length} assignments).`);
  };

  const handleAddHoliday = (newHol: HolidayEvent) => {
    const updated = [newHol, ...holidays];
    setHolidays(updated);
    saveHolidays(updated);
    showToast(`Calendar updated: ${newHol.title}`);
  };

  const handleDeleteHoliday = (holidayId: string) => {
    const updated = holidays.filter((h) => h.id !== holidayId);
    setHolidays(updated);
    saveHolidays(updated);
    showToast('Holiday removed from calendar.');
  };

  const handleResetDemoData = () => {
    if (confirm('Reset all punches, staff, leaves, roster, and report schedules to factory demo data?')) {
      resetAllToDemoData();
      setStaffList(loadStaff());
      setShifts(loadShifts());
      setPunches(loadPunches());
      setLeaves(loadLeaves());
      setReportSchedules(loadReportSchedules());
      setGeneratedReports(loadGeneratedReports());
      setRoster(loadRoster());
      setHolidays(loadHolidays());
      showToast('All system records restored to clean demo state.');
    }
  };

  // Clocked in calculation for top bar counter
  const todayStr = new Date().toISOString().slice(0, 10);
  const clockedInCount = staffList.filter((s) => {
    const todayPunches = punches
      .filter((p) => p.staffId === s.id && p.timestamp.startsWith(todayStr))
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const last = todayPunches[todayPunches.length - 1];
    return last && (last.type === 'clock_in' || last.type === 'break_end');
  }).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased">
      {/* Toast message popup */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 3-Zone Top Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openUsbImport={() => setIsUsbModalOpen(true)}
        adminProfile={adminProfile}
        openAdminModal={() => setIsAdminModalOpen(true)}
        clockedInCount={clockedInCount}
        totalStaffCount={staffList.filter((s) => s.status === 'active').length}
      />

      {/* Main Workspace Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'clock' && (
          <TimeClockingView
            staffList={staffList}
            punches={punches}
            shifts={shifts}
            onRecordPunch={handleRecordPunch}
            onDeletePunch={handleDeletePunch}
            openUsbImport={() => setIsUsbModalOpen(true)}
            openManualPunchModal={() => setIsManualPunchOpen(true)}
          />
        )}

        {activeTab === 'calendar' && (
          <CalendarView
            staffList={staffList}
            shifts={shifts}
            roster={roster}
            holidays={holidays}
            leaves={leaves}
            onSaveRosterEntry={handleSaveRosterEntry}
            onDeleteRosterEntry={handleDeleteRosterEntry}
            onBatchAutoRoster={handleBatchAutoRoster}
            onAddHoliday={handleAddHoliday}
            onDeleteHoliday={handleDeleteHoliday}
          />
        )}

        {activeTab === 'staff' && (
          <StaffView
            staffList={staffList}
            shifts={shifts}
            onAddStaff={handleAddStaff}
            onUpdateStaff={handleUpdateStaff}
            onDeleteStaff={handleDeleteStaff}
          />
        )}

        {activeTab === 'usb_import' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900">
                  ERS Bio-Matrix Q24PC · USB Import Hub
                </h1>
                <div className="text-xs text-slate-500 mt-0.5">
                  Populate attendance punches from USB stick exported by your ERS Bio-Matrix finger print scan device (Model Q24PC)
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsUsbModalOpen(true)}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors shadow-2xs"
              >
                Launch att.log USB Importer
              </button>
            </div>

            {/* Hub info panel */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 mb-3">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  1. Export from Model Q24PC
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Insert your USB drive into the ERS Bio-Matrix Q24PC terminal and select <strong>Download Glog / Att.log</strong> from the admin menu.
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-3">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  2. Auto Biometric Mapping
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Engen Florida-Glen reads <span className="font-mono font-bold text-blue-700">att.log</span> and automatically matches each fingerprint ID to employee shift schedules.
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-3">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  3. Duplicate Protection
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Punches already logged in the system are skipped so employee regular hours and overtime are always clean.
                </p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 text-center space-y-3">
              <h3 className="text-base font-semibold text-slate-900">
                Ready to import att.log from USB?
              </h3>
              <p className="text-xs text-slate-500 max-w-lg mx-auto">
                Insert your USB stick from the ERS Bio-Matrix Model Q24PC hardware device and click below to process punch records into Engen Florida-Glen timesheets.
              </p>
              <button
                type="button"
                onClick={() => setIsUsbModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-xl transition-all shadow-md"
              >
                <span>Select or Drop att.log File</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'leaves' && (
          <LeaveView
            staffList={staffList}
            leaves={leaves}
            onAddLeave={handleAddLeave}
            onUpdateLeaveStatus={handleUpdateLeaveStatus}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsView
            staffList={staffList}
            punches={punches}
            shifts={shifts}
            leaves={leaves}
            reportSchedules={reportSchedules}
            generatedReports={generatedReports}
            onUpdateSchedules={handleUpdateSchedules}
            onAddGeneratedReport={handleAddGeneratedReport}
          />
        )}
      </main>

      {/* Global Interactive Modals */}
      <AdminProfileModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        adminProfile={adminProfile}
        onUpdateAdmin={(updated) => {
          setAdminProfile(updated);
          saveAdminProfile(updated);
          showToast(`Admin profile updated for ${updated.name}`);
        }}
      />

      <UsbImportModal
        isOpen={isUsbModalOpen}
        onClose={() => setIsUsbModalOpen(false)}
        staffList={staffList}
        existingPunches={punches}
        onCommitImport={handleCommitUsbPunches}
        onQuickAddStaff={(bioId) => {
          setIsUsbModalOpen(false);
          setActiveTab('staff');
        }}
      />

      <ManualPunchModal
        isOpen={isManualPunchOpen}
        onClose={() => setIsManualPunchOpen(false)}
        staffList={staffList}
        onAddManualPunch={handleRecordPunch}
      />

      {/* Quiet Footer */}
      <footer className="no-print mt-auto border-t border-slate-200 bg-white py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">Engen Florida-Glen Garage</span>
            <span>·</span>
            <span>Biometric USB Attendance & Shift Clocking</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleResetDemoData}
              className="text-slate-400 hover:text-slate-700 flex items-center gap-1 transition-colors"
              title="Reset records to default demo data"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Demo Data</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
