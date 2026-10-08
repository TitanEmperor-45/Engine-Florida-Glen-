import React, { useState } from 'react';
import {
  StaffMember,
  PunchRecord,
  ShiftSchedule,
  LeaveRequest,
  RosterShiftEntry,
  AdminProfile,
} from '../types';
import {
  calculateAttLogAnalytics,
  generateAccountantExportCsv,
  generateAttLogDailyCsv,
  generateAttLogWeeklyCsv,
  generateAttLogMonthlyCsv,
  triggerCsvDownload,
  formatZAR,
} from '../utils/attLogAnalytics';
import {
  Fingerprint,
  Calendar,
  Clock,
  Download,
  AlertTriangle,
  UserCheck,
  CheckCircle,
  FileSpreadsheet,
  Edit2,
  Check,
  X,
  HardDriveDownload,
  ShieldAlert,
  ChevronDown,
} from 'lucide-react';
import { EngenLogo } from './EngenLogo';

interface BiometricAnalyticsViewProps {
  staffList: StaffMember[];
  punches: PunchRecord[];
  shifts: ShiftSchedule[];
  leaves: LeaveRequest[];
  roster: RosterShiftEntry[];
  adminProfile: AdminProfile;
  openUsbImport: () => void;
  onUpdateHourlyRate: (staffId: string, newRate: number) => void;
}

export const BiometricAnalyticsView: React.FC<BiometricAnalyticsViewProps> = ({
  staffList,
  punches,
  shifts,
  leaves,
  roster,
  adminProfile,
  openUsbImport,
  onUpdateHourlyRate,
}) => {
  const [periodTab, setPeriodTab] = useState<'day' | 'week' | 'month' | 'accountant'>('day');
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [tempRate, setTempRate] = useState<string>('');
  const [searchFilter, setSearchFilter] = useState<string>('');

  const analytics = calculateAttLogAnalytics(punches, staffList, shifts, leaves, roster);

  const handleStartEditRate = (staff: StaffMember) => {
    setEditingStaffId(staff.id);
    setTempRate(String(staff.hourlyRate));
  };

  const handleSaveRate = (staffId: string) => {
    const val = parseFloat(tempRate);
    if (!isNaN(val) && val > 0) {
      onUpdateHourlyRate(staffId, val);
    }
    setEditingStaffId(null);
  };

  const renderEditableRate = (pinOrId: string, currentRate: number) => {
    const staff = staffList.find((s) => s.biometricId === pinOrId || s.id === pinOrId);
    if (!staff) {
      return <span className="font-mono font-medium text-slate-800">{formatZAR(currentRate)}/hr</span>;
    }
    const isEditing = editingStaffId === staff.id;
    if (isEditing) {
      return (
        <div className="flex items-center justify-end gap-1">
          <span className="text-[11px] font-bold text-slate-500">R</span>
          <input
            type="number"
            step="0.5"
            value={tempRate}
            onChange={(e) => setTempRate(e.target.value)}
            className="w-16 px-1.5 py-0.5 text-xs font-mono font-bold bg-white border border-blue-500 rounded text-slate-900 shadow-2xs"
            autoFocus
          />
          <button
            type="button"
            onClick={() => handleSaveRate(staff.id)}
            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
            title="Save amended rate"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setEditingStaffId(null)}
            className="p-1 text-rose-600 hover:bg-rose-50 rounded"
            title="Cancel"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-end gap-1.5">
        <span className="font-mono font-bold text-slate-900 text-xs">
          {formatZAR(staff.hourlyRate)}/hr
        </span>
        <button
          type="button"
          onClick={() => handleStartEditRate(staff)}
          className="p-1 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
          title={`Administrator Binnie: Amend hourly rate for ${staff.name}`}
        >
          <Edit2 className="w-3 h-3" />
        </button>
      </div>
    );
  };

  const handleExportAccountant = () => {
    const period = new Date().toISOString().slice(0, 7);
    const csv = generateAccountantExportCsv(analytics.accountantSummary, adminProfile, period);
    triggerCsvDownload(csv, `engen_accountant_payroll_pack_${period}.csv`);
  };

  const handleExportCurrent = () => {
    const today = new Date().toISOString().slice(0, 10);
    if (periodTab === 'day') {
      const csv = generateAttLogDailyCsv(analytics.daily);
      triggerCsvDownload(csv, `attlog_daily_hours_${today}.csv`);
    } else if (periodTab === 'week') {
      const csv = generateAttLogWeeklyCsv(analytics.weekly);
      triggerCsvDownload(csv, `attlog_weekly_hours_${today}.csv`);
    } else if (periodTab === 'month') {
      const csv = generateAttLogMonthlyCsv(analytics.monthly);
      triggerCsvDownload(csv, `attlog_monthly_hours_${today}.csv`);
    } else {
      handleExportAccountant();
    }
  };

  // Filter lists
  const filteredDaily = analytics.daily.filter((d) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      d.pin.includes(q) ||
      d.userName.toLowerCase().includes(q) ||
      d.date.includes(q) ||
      d.department.toLowerCase().includes(q)
    );
  });

  const filteredWeekly = analytics.weekly.filter((w) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return w.pin.includes(q) || w.userName.toLowerCase().includes(q) || w.weekRange.includes(q);
  });

  const filteredMonthly = analytics.monthly.filter((m) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return m.pin.includes(q) || m.userName.toLowerCase().includes(q) || m.month.includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Top Brand Banner: Red Square Logo with Blue X + Florida-Glen: Service Station and Convenient Store */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <EngenLogo
              size="lg"
              redBox={true}
              showSubtitle={true}
              subtitleText="Florida-Glen : Service Station and Convenient Store"
            />
            <div className="hidden sm:block h-10 w-px bg-slate-200 mx-1"></div>
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                  <Fingerprint className="w-3.5 h-3.5 text-blue-600" />
                  ERS Bio-Matrix Q24PC Scanner Hub
                </span>
                <span className="text-xs text-slate-400 font-mono">att.log Parser Engine</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Calculates real hours worked from scanner punches, accounting for late coming, absents, approved leave, and rates amended by Binnie.
              </p>
            </div>
          </div>

          {/* Global Export & Upload Actions - Scaled to fit */}
          <div className="flex flex-wrap items-center gap-2 self-start xl:self-auto shrink-0">
            <button
              type="button"
              onClick={openUsbImport}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <HardDriveDownload className="w-4 h-4 text-blue-600" />
              <span>Upload att.log</span>
            </button>

            <button
              type="button"
              onClick={handleExportCurrent}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
              title="Download CSV for currently selected period"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Export Period CSV</span>
            </button>

            <button
              type="button"
              onClick={handleExportAccountant}
              className="px-4 py-1.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
              title="Export complete payroll breakdown for the accountant in South African Rands"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
              <span>Export to Accountant (CSV)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hourly Rate Quick Set Strip by Administrator Binnie */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <span>Administrator Hourly Wage Controller</span>
              <span className="text-[10px] font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                Manager: Binnie
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Set and update hourly rates (in South African Rands R/hr) for all staff. Updates immediately calculate labor costs.
            </p>
          </div>
          <span className="text-xs font-mono font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
            Currency: ZAR (R)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
          {staffList.map((staff) => {
            const isEditing = editingStaffId === staff.id;
            return (
              <div
                key={staff.id}
                className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-2"
              >
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
                    <span>{staff.name}</span>
                    <span className="font-mono text-[10px] text-blue-700 font-semibold">
                      #{staff.biometricId}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500">{staff.department}</div>
                </div>

                <div className="text-right">
                  {isEditing ? (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-slate-500 font-semibold">R</span>
                      <input
                        type="number"
                        step="0.5"
                        value={tempRate}
                        onChange={(e) => setTempRate(e.target.value)}
                        className="w-16 px-1.5 py-0.5 text-xs font-mono font-bold bg-white border border-blue-500 rounded text-slate-900"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveRate(staff.id)}
                        className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingStaffId(null)}
                        className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-sm font-bold text-slate-900">
                        {formatZAR(staff.hourlyRate)}/hr
                      </span>
                      <button
                        type="button"
                        onClick={() => handleStartEditRate(staff)}
                        className="p-1 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                        title="Edit hourly rate"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Period Selection Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
          <button
            type="button"
            onClick={() => setPeriodTab('day')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${
              periodTab === 'day'
                ? 'border-blue-700 text-blue-700 bg-white font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            1. Per Day Breakdown ({analytics.daily.length} Days Logged)
          </button>

          <button
            type="button"
            onClick={() => setPeriodTab('week')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${
              periodTab === 'week'
                ? 'border-blue-700 text-blue-700 bg-white font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            2. Per Week Breakdown ({analytics.weekly.length} Weeks)
          </button>

          <button
            type="button"
            onClick={() => setPeriodTab('month')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${
              periodTab === 'month'
                ? 'border-blue-700 text-blue-700 bg-white font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            3. Per Month Breakdown ({analytics.monthly.length} Months)
          </button>

          <button
            type="button"
            onClick={() => setPeriodTab('accountant')}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${
              periodTab === 'accountant'
                ? 'border-emerald-600 text-emerald-700 bg-white font-bold'
                : 'border-transparent text-emerald-600/80 hover:text-emerald-700'
            }`}
          >
            ★ Accountant Payroll Summary
          </button>
        </div>

        <div className="mb-2">
          <input
            type="text"
            placeholder="Search PIN, staff name, date..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
          />
        </div>
      </div>

      {/* VIEW 1: PER DAY BREAKDOWN */}
      {periodTab === 'day' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Daily Biometric Scanner Punches & Calculated Hours Worked
              </h3>
              <p className="text-xs text-slate-500">
                Directly matches PIN from att.log, verifies first clock-in / last clock-out, computes regular vs overtime, and flags late coming and absents.
              </p>
            </div>
            <button
              type="button"
              onClick={handleExportCurrent}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Daily CSV</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">PIN</th>
                  <th className="py-2.5 px-3">Staff Name</th>
                  <th className="py-2.5 px-3">First In</th>
                  <th className="py-2.5 px-3">Last Out</th>
                  <th className="py-2.5 px-3">Punches in att.log</th>
                  <th className="py-2.5 px-3 text-right">Hours Worked</th>
                  <th className="py-2.5 px-3 text-right">Overtime</th>
                  <th className="py-2.5 px-3 text-right">Hourly Wage (R)</th>
                  <th className="py-2.5 px-3">Attendance Status</th>
                  <th className="py-2.5 px-3 text-right">Est. Daily Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {filteredDaily.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-8 text-center text-slate-400">
                      No biometric log records found.
                    </td>
                  </tr>
                ) : (
                  filteredDaily.map((row, idx) => (
                    <tr key={`${row.pin}-${row.date}-${idx}`} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-slate-700">{row.date}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-700 bg-blue-50/50">
                        #{row.pin}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-900">
                        <div>{row.userName}</div>
                        <div className="text-[10px] text-slate-400">{row.department}</div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-800">
                        {row.firstIn ? (
                          <span className={row.isLate ? 'text-amber-700 font-bold' : 'text-slate-800'}>
                            {row.firstIn}
                          </span>
                        ) : (
                          <span className="text-slate-400">--</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-800">
                        {row.lastOut || <span className="text-slate-400">--</span>}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-500 max-w-xs truncate">
                        {row.rawTimes.length > 0 ? row.rawTimes.join(', ') : <span className="text-slate-400 italic">No scanner punches</span>}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        {row.hoursWorked.toFixed(2)}h
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                        {row.overtimeHours > 0 ? (
                          <span className="text-amber-700 font-bold">+{row.overtimeHours.toFixed(2)}h</span>
                        ) : (
                          '0.00h'
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        {renderEditableRate(row.pin, row.hourlyRate)}
                      </td>
                      <td className="py-2.5 px-3">
                        {row.onLeave ? (
                          <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                            LEAVE: {row.leaveType}
                          </span>
                        ) : row.isAbsent ? (
                          <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                            ABSENT
                          </span>
                        ) : row.isLate ? (
                          <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                            LATE ({row.lateMinutes}m)
                          </span>
                        ) : (
                          <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            ON TIME
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                        {formatZAR(row.dailyCost)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: PER WEEK BREAKDOWN */}
      {periodTab === 'week' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Weekly Aggregated Hours, Late Incidents & Gross Pay
              </h3>
              <p className="text-xs text-slate-500">
                Calculates weekly totals per employee (Mon-Sun), showing days present, overtime, and late occurrences.
              </p>
            </div>
            <button
              type="button"
              onClick={handleExportCurrent}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Weekly CSV</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                <tr>
                  <th className="py-2.5 px-3">Week</th>
                  <th className="py-2.5 px-3">Date Range</th>
                  <th className="py-2.5 px-3">PIN</th>
                  <th className="py-2.5 px-3">Staff Name</th>
                  <th className="py-2.5 px-3 text-right">Days Worked</th>
                  <th className="py-2.5 px-3 text-right">Total Hours</th>
                  <th className="py-2.5 px-3 text-right">Regular</th>
                  <th className="py-2.5 px-3 text-right">Overtime</th>
                  <th className="py-2.5 px-3 text-center">Late / Absents</th>
                  <th className="py-2.5 px-3 text-right">Hourly Rate</th>
                  <th className="py-2.5 px-3 text-right">Est. Weekly Pay</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {filteredWeekly.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-8 text-center text-slate-400">
                      No weekly logs recorded yet.
                    </td>
                  </tr>
                ) : (
                  filteredWeekly.map((wk, idx) => (
                    <tr key={`${wk.pin}-${wk.weekNumber}-${idx}`} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-slate-900">Week {wk.weekNumber}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{wk.weekRange}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-700 bg-blue-50/50">
                        #{wk.pin}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{wk.userName}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-800">
                        {wk.daysWorked} days
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        {wk.totalHoursWorked.toFixed(2)}h
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                        {wk.regularHours.toFixed(2)}h
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-amber-700 font-semibold">
                        +{wk.overtimeHours.toFixed(2)}h
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="text-[11px] text-slate-600">
                          {wk.lateIncidents} late ({wk.totalLateMinutes}m) · {wk.absentDays} absent
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        {renderEditableRate(wk.pin, wk.hourlyRate)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                        {formatZAR(wk.estimatedGrossPay)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: PER MONTH BREAKDOWN */}
      {periodTab === 'month' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Monthly Attendance & Payroll Calculation (Rands - ZAR)
              </h3>
              <p className="text-xs text-slate-500">
                Monthly total hours worked, statutory UIF deductions, and estimated net pay in South African Rands.
              </p>
            </div>
            <button
              type="button"
              onClick={handleExportCurrent}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Monthly CSV</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                <tr>
                  <th className="py-2.5 px-3">Month</th>
                  <th className="py-2.5 px-3">PIN</th>
                  <th className="py-2.5 px-3">Staff Name</th>
                  <th className="py-2.5 px-3 text-right">Days Present</th>
                  <th className="py-2.5 px-3 text-right">Total Hours</th>
                  <th className="py-2.5 px-3 text-right">Normal Hours</th>
                  <th className="py-2.5 px-3 text-right">Overtime</th>
                  <th className="py-2.5 px-3 text-right">Hourly Wage</th>
                  <th className="py-2.5 px-3 text-right">Gross Pay</th>
                  <th className="py-2.5 px-3 text-right">UIF (1%)</th>
                  <th className="py-2.5 px-3 text-right">Net Payable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {filteredMonthly.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-8 text-center text-slate-400">
                      No monthly logs recorded yet.
                    </td>
                  </tr>
                ) : (
                  filteredMonthly.map((mo, idx) => (
                    <tr key={`${mo.pin}-${mo.month}-${idx}`} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 font-bold font-mono text-slate-900">{mo.month}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-700 bg-blue-50/50">
                        #{mo.pin}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{mo.userName}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700">{mo.daysWorked} days</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        {mo.totalHoursWorked.toFixed(2)}h
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                        {mo.regularHours.toFixed(2)}h
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-amber-700 font-bold">
                        +{mo.overtimeHours.toFixed(2)}h
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        {renderEditableRate(mo.pin, mo.hourlyRate)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        {formatZAR(mo.totalGrossPay)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                        -{formatZAR(mo.uifDeduction)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                        {formatZAR(mo.netPay)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 4: OFFICIAL ACCOUNTANT SUMMARY PACK */}
      {periodTab === 'accountant' && (
        <div className="bg-white border-2 border-emerald-500/40 rounded-xl overflow-hidden shadow-md">
          <div className="bg-emerald-50/70 px-6 py-5 border-b border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-600 text-white rounded">
                  Official Copy
                </span>
                <span className="text-xs font-semibold text-emerald-900">
                  Ready to share with Station Accountant
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-1">
                Accountant Payroll Pack · Engen Florida-Glen Garage
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Authorized by Administrator Binnie ({adminProfile.email} · {adminProfile.cellPhone}). Currency: South African Rands (ZAR).
              </p>
            </div>

            <button
              type="button"
              onClick={handleExportAccountant}
              className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl flex items-center gap-2 shadow-sm transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Download Official Accountant CSV Pack</span>
            </button>
          </div>

          <div className="overflow-x-auto p-5">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase">
                <tr>
                  <th className="py-3 px-3">PIN</th>
                  <th className="py-3 px-3">Employee Name</th>
                  <th className="py-3 px-3">Department</th>
                  <th className="py-3 px-3 text-right">Hourly Wage (R)</th>
                  <th className="py-3 px-3 text-right">Total Hours</th>
                  <th className="py-3 px-3 text-right">Normal Hours</th>
                  <th className="py-3 px-3 text-right">Overtime</th>
                  <th className="py-3 px-3 text-right">Gross Pay (R)</th>
                  <th className="py-3 px-3 text-right">UIF 1%</th>
                  <th className="py-3 px-3 text-right">Net Payable (R)</th>
                  <th className="py-3 px-3 text-center">Audit Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {analytics.accountantSummary.map((rec) => (
                  <tr key={rec.pin} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-blue-700 bg-blue-50/30">
                      #{rec.pin}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900">
                      <div>{rec.name}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{rec.role}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-600">{rec.department}</td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      {renderEditableRate(rec.pin, rec.hourlyRate)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      {rec.totalHoursWorked.toFixed(2)}h
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-600">
                      {rec.regularHours.toFixed(2)}h
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-amber-700 font-bold">
                      +{rec.overtimeHours.toFixed(2)}h
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      {formatZAR(rec.grossPay)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-rose-600">
                      -{formatZAR(rec.uifDeduction)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-extrabold text-emerald-700 text-sm">
                      {formatZAR(rec.netPay)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                        <CheckCircle className="w-3 h-3 text-emerald-600" />
                        Signed by Binnie
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
