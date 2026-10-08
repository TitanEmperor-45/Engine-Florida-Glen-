import React, { useState } from 'react';
import { StaffMember, PunchRecord, ShiftSchedule, PunchType } from '../types';
import {
  Clock,
  Fingerprint,
  HardDriveDownload,
  PlusCircle,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Coffee,
  LogOut,
  LogIn,
  SlidersHorizontal,
  Download,
} from 'lucide-react';

interface TimeClockingViewProps {
  staffList: StaffMember[];
  punches: PunchRecord[];
  shifts: ShiftSchedule[];
  onRecordPunch: (punch: Omit<PunchRecord, 'id'>) => void;
  onDeletePunch: (punchId: string) => void;
  openUsbImport: () => void;
  openManualPunchModal: () => void;
}

export const TimeClockingView: React.FC<TimeClockingViewProps> = ({
  staffList,
  punches,
  shifts,
  onRecordPunch,
  onDeletePunch,
  openUsbImport,
  openManualPunchModal,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('today');

  const todayStr = new Date().toISOString().slice(0, 10);

  // Compute status for all staff members today
  const getStaffLiveStatus = (staff: StaffMember) => {
    const todayPunches = punches
      .filter((p) => p.staffId === staff.id && p.timestamp.startsWith(todayStr))
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const lastPunch = todayPunches[todayPunches.length - 1];
    const clockIn = todayPunches.find((p) => p.type === 'clock_in');

    let state: 'in' | 'break' | 'out' = 'out';
    if (lastPunch) {
      if (lastPunch.type === 'clock_in' || lastPunch.type === 'break_end') {
        state = 'in';
      } else if (lastPunch.type === 'break_start') {
        state = 'break';
      } else {
        state = 'out';
      }
    }

    return {
      state,
      lastPunchTime: lastPunch ? lastPunch.timestamp.slice(11, 16) : null,
      clockInTime: clockIn ? clockIn.timestamp.slice(11, 16) : null,
      punchCountToday: todayPunches.length,
      isLate: clockIn?.isLate || false,
    };
  };

  const staffStatuses = staffList.map((s) => ({
    staff: s,
    ...getStaffLiveStatus(s),
  }));

  const inCount = staffStatuses.filter((s) => s.state === 'in').length;
  const breakCount = staffStatuses.filter((s) => s.state === 'break').length;
  const outCount = staffStatuses.filter((s) => s.state === 'out' && s.staff.status === 'active').length;
  const lateCount = staffStatuses.filter((s) => s.isLate).length;

  const handleQuickAction = (staff: StaffMember, type: PunchType) => {
    onRecordPunch({
      staffId: staff.id,
      biometricId: staff.biometricId,
      timestamp: new Date().toISOString(),
      type,
      source: 'web_portal',
      deviceName: 'Admin Dashboard Quick Punch',
      verifiedMethod: 'manual',
      notes: `Quick action by administrator for ${staff.name}`,
    });
  };

  // Filter punch logs
  const filteredPunches = punches
    .filter((p) => {
      // Date filter
      if (filterDate === 'today' && !p.timestamp.startsWith(todayStr)) {
        return false;
      }
      // Type filter
      if (filterType !== 'all' && p.type !== filterType) {
        return false;
      }
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const staff = staffList.find((s) => s.id === p.staffId);
        const nameMatch = staff?.name.toLowerCase().includes(query);
        const bioMatch = p.biometricId.includes(query);
        const deptMatch = staff?.department.toLowerCase().includes(query);
        if (!nameMatch && !bioMatch && !deptMatch) return false;
      }
      return true;
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const exportPunchesCsv = () => {
    const headers = [
      'Timestamp',
      'Staff Name',
      'Biometric ID',
      'Department',
      'Punch Type',
      'Device Source',
      'Verification Method',
      'Late Flag',
      'Overtime Flag',
      'Audit Notes',
    ];

    const rows = filteredPunches.map((p) => {
      const staff = staffList.find((s) => s.id === p.staffId);
      return [
        p.timestamp.replace('T', ' '),
        `"${staff?.name || 'Unknown'}"`,
        p.biometricId,
        `"${staff?.department || 'N/A'}"`,
        p.type.toUpperCase(),
        `"${p.deviceName || 'ERS Bio-Matrix Q24PC'}"`,
        p.verifiedMethod || 'fingerprint',
        p.isLate ? 'YES' : 'NO',
        p.isOvertime ? 'YES' : 'NO',
        `"${p.notes || ''}"`,
      ];
    });

    const content = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `punch_log_audit_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Metric Strip - High Legibility */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Currently Clocked In</span>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {inCount}
            </span>
            <span className="text-xs text-slate-500">of {staffList.length} staff</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>On Active Break</span>
            <Coffee className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {breakCount}
            </span>
            <span className="text-xs text-slate-500">paused shifts</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Late Arrivals Today</span>
            <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {lateCount}
            </span>
            <span className="text-xs text-slate-500">grace period exceeded</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Clocked Out / Off Duty</span>
            <LogOut className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {outCount}
            </span>
            <span className="text-xs text-slate-500">available</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Staff Presence Board & Recent Punches */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Active Staff Shift Roster (8 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Engen Florida-Glen · Shift Attendance
              </h2>
              <div className="text-xs text-slate-500">
                Live forecourt, shop & workshop clocking status for today ({todayStr})
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={openUsbImport}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 transition-colors shadow-2xs rounded-lg"
              >
                <HardDriveDownload className="w-3.5 h-3.5 text-blue-200" />
                <span>Import Q24PC USB</span>
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {staffStatuses.map(({ staff, state, lastPunchTime, clockInTime, isLate }) => {
              const assignedShift = shifts.find((s) => s.id === staff.shiftId) || shifts[0];

              return (
                <div
                  key={staff.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors gap-3 bg-white"
                >
                  <div className="flex items-center gap-3">
                    {staff.avatarUrl ? (
                      <img
                        src={staff.avatarUrl}
                        alt={staff.name}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-200"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 font-semibold text-xs flex items-center justify-center shrink-0 border border-slate-200">
                        {staff.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900">
                          {staff.name}
                        </span>
                        {isLate && (
                          <span className="text-[10px] font-medium text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded">
                            Late ({clockInTime})
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-2">
                        <span>Bio ID #{staff.biometricId}</span>
                        <span>·</span>
                        <span>{staff.department}</span>
                        <span>·</span>
                        <span className="text-slate-400">{assignedShift.name.split('(')[0]}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="text-left sm:text-right">
                      <div className="flex items-center gap-1.5 sm:justify-end">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            state === 'in'
                              ? 'bg-emerald-500'
                              : state === 'break'
                              ? 'bg-amber-500'
                              : 'bg-slate-400'
                          }`}
                        ></span>
                        <span className="text-xs font-semibold capitalize text-slate-800">
                          {state === 'in'
                            ? 'Clocked In'
                            : state === 'break'
                            ? 'On Break'
                            : staff.status === 'on_leave'
                            ? 'On Leave'
                            : 'Clocked Out'}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono tabular-nums text-slate-400">
                        {lastPunchTime ? `Last: ${lastPunchTime}` : 'No punch today'}
                      </div>
                    </div>

                    {/* Quick Punch action triggers */}
                    <div className="flex items-center gap-1">
                      {state === 'out' && (
                        <button
                          type="button"
                          onClick={() => handleQuickAction(staff, 'clock_in')}
                          className="px-2.5 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200 flex items-center gap-1"
                          title="Clock In"
                        >
                          <LogIn className="w-3.5 h-3.5" />
                          <span>In</span>
                        </button>
                      )}

                      {state === 'in' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleQuickAction(staff, 'break_start')}
                            className="px-2 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors border border-amber-200"
                            title="Start Break"
                          >
                            <Coffee className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickAction(staff, 'clock_out')}
                            className="px-2.5 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors border border-rose-200 flex items-center gap-1"
                            title="Clock Out"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            <span>Out</span>
                          </button>
                        </>
                      )}

                      {state === 'break' && (
                        <button
                          type="button"
                          onClick={() => handleQuickAction(staff, 'break_end')}
                          className="px-2.5 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200 flex items-center gap-1"
                          title="End Break"
                        >
                          <LogIn className="w-3.5 h-3.5" />
                          <span>End Break</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Quick Actions & Biometric USB Sync Card (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
            <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
              <span>Punch Management Actions</span>
            </h3>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={openUsbImport}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 group-hover:scale-105 transition-transform">
                    <HardDriveDownload className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-900">
                      Import Biometric USB File
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Read attlog.dat or CSV directly from flash drive
                    </div>
                  </div>
                </div>
                <span className="text-xs font-medium text-indigo-600 group-hover:underline">
                  Launch →
                </span>
              </button>

              <button
                type="button"
                onClick={openManualPunchModal}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 group-hover:scale-105 transition-transform">
                    <PlusCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-900">
                      Manual Punch Adjustment
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Add supervisor corrected punch with audit trail
                    </div>
                  </div>
                </div>
                <span className="text-xs font-medium text-slate-700 group-hover:underline">
                  Add +
                </span>
              </button>

              <button
                type="button"
                onClick={openUsbImport}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 group-hover:scale-105 transition-transform">
                    <Fingerprint className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-900">
                      ERS Bio-Matrix Device Model Q24PC
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Hardware fingerprint scanner · Exports att.log via USB
                    </div>
                  </div>
                </div>
                <span className="text-xs font-medium text-blue-700 group-hover:underline">
                  Sync USB →
                </span>
              </button>
            </div>
          </div>

          {/* ERS Bio-Matrix Q24PC Hardware Integration Callout */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600">
            <div className="font-semibold text-slate-800 mb-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              <span>ERS Bio-Matrix Q24PC Hardware Scanner</span>
            </div>
            <p className="leading-relaxed text-slate-500">
              Staff scan their fingerprints directly on the physical <strong>ERS Bio-Matrix Q24PC</strong> terminal at the station. To populate the attendance system, insert your USB drive into the Q24PC scanner, export <strong>att.log</strong>, and load it using the USB Importer.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Section: Comprehensive Punch Log Table */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Audit Punch History & Time Logs
            </h3>
            <div className="text-xs text-slate-500">
              Complete historical record of biometric and manual timestamps
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search staff, ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-44"
              />
            </div>

            {/* Date filter */}
            <select
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="text-xs rounded-lg border border-slate-300 py-1.5 px-2 bg-white text-slate-700 focus:outline-none"
            >
              <option value="today">Today ({todayStr})</option>
              <option value="all">All Dates</option>
            </select>

            {/* Type Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="text-xs rounded-lg border border-slate-300 py-1.5 px-2 bg-white text-slate-700 focus:outline-none"
            >
              <option value="all">All Punch Types</option>
              <option value="clock_in">Clock In</option>
              <option value="clock_out">Clock Out</option>
              <option value="break_start">Break Start</option>
              <option value="break_end">Break End</option>
            </select>

            <button
              onClick={openManualPunchModal}
              className="px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add Adjustment</span>
            </button>

            <button
              type="button"
              onClick={exportPunchesCsv}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
              title="Export filtered punch records as CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Staff Member</th>
                <th className="py-2.5 px-3">Bio ID</th>
                <th className="py-2.5 px-3">Punch Type</th>
                <th className="py-2.5 px-3">Source & Device</th>
                <th className="py-2.5 px-3">Audit Flags / Notes</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {filteredPunches.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No punch records found matching current filters.
                  </td>
                </tr>
              ) : (
                filteredPunches.map((punch) => {
                  const staff = staffList.find((s) => s.id === punch.staffId);
                  const isLate = punch.isLate;

                  return (
                    <tr key={punch.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 font-mono tabular-nums text-slate-900 font-medium">
                        {punch.timestamp.replace('T', ' ')}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-900">
                        {staff ? (
                          <div className="flex items-center gap-2">
                            <span>{staff.name}</span>
                            <span className="text-[11px] text-slate-500 font-normal">
                              ({staff.department})
                            </span>
                          </div>
                        ) : (
                          'Unknown Employee'
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">
                        #{punch.biometricId}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1 font-medium capitalize ${
                            punch.type === 'clock_in'
                              ? 'text-emerald-700'
                              : punch.type === 'clock_out'
                              ? 'text-rose-700'
                              : 'text-amber-700'
                          }`}
                        >
                          {punch.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        <div className="capitalize">{punch.source.replace('_', ' ')}</div>
                        <div className="text-[10px] text-slate-400">
                          {punch.deviceName || 'Hardware Sensor'} · {punch.verifiedMethod || 'fingerprint'}
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        {isLate ? (
                          <span className="text-rose-600 font-medium">
                            Late Arrival
                          </span>
                        ) : punch.isOvertime ? (
                          <span className="text-indigo-600 font-medium">
                            Overtime Triggered
                          </span>
                        ) : punch.notes ? (
                          <span className="text-slate-500 truncate max-w-xs block">
                            {punch.notes}
                          </span>
                        ) : (
                          <span className="text-slate-400">Standard</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => onDeletePunch(punch.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors text-xs"
                          title="Delete punch record"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
