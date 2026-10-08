import React, { useState } from 'react';
import {
  StaffMember,
  PunchRecord,
  ShiftSchedule,
  LeaveRequest,
  AutomatedReportSchedule,
  GeneratedReportSummary,
} from '../types';
import {
  calculateDailyRecords,
  generateCsvTimesheet,
  generatePayrollSummaryCsv,
  generateExceptionsCsv,
  formatZAR,
  downloadCsv,
  executeAutomatedSchedule,
} from '../utils/reportGenerator';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Play,
  Calendar,
  Banknote,
  Clock,
  AlertTriangle,
  PlusCircle,
  CheckCircle2,
  Settings,
  Mail,
  FileText,
  X,
  History,
} from 'lucide-react';

interface ReportsViewProps {
  staffList: StaffMember[];
  punches: PunchRecord[];
  shifts: ShiftSchedule[];
  leaves: LeaveRequest[];
  reportSchedules: AutomatedReportSchedule[];
  generatedReports: GeneratedReportSummary[];
  onUpdateSchedules: (schedules: AutomatedReportSchedule[]) => void;
  onAddGeneratedReport: (report: GeneratedReportSummary) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  staffList,
  punches,
  shifts,
  leaves,
  reportSchedules,
  generatedReports,
  onUpdateSchedules,
  onAddGeneratedReport,
}) => {
  const [datePreset, setDatePreset] = useState<'today' | 'week' | 'month' | 'custom'>('week');
  const [customStart, setCustomStart] = useState<string>('2026-10-01');
  const [customEnd, setCustomEnd] = useState<string>('2026-10-08');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [activeReportSubTab, setActiveReportSubTab] = useState<'timesheet' | 'exceptions' | 'payroll' | 'schedules' | 'history'>('timesheet');

  // New Schedule Modal
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newFrequency, setNewFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [newReportType, setNewReportType] = useState<'timesheet_summary' | 'attendance_exceptions' | 'payroll_breakdown'>('timesheet_summary');
  const [newEmail, setNewEmail] = useState<string>('Valerie.ajtransportcater@gmail.com');
  const [newTime, setNewTime] = useState<string>('08:00');

  // Trigger feedback
  const [runFeedback, setRunFeedback] = useState<string | null>(null);

  // Compute date range
  const todayStr = '2026-10-08';
  let startDate = todayStr;
  let endDate = todayStr;

  if (datePreset === 'today') {
    startDate = todayStr;
    endDate = todayStr;
  } else if (datePreset === 'week') {
    // Current week: 2026-10-05 to 2026-10-08
    startDate = '2026-10-05';
    endDate = todayStr;
  } else if (datePreset === 'month') {
    startDate = '2026-10-01';
    endDate = todayStr;
  } else {
    startDate = customStart;
    endDate = customEnd;
  }

  const allRecords = calculateDailyRecords(staffList, punches, shifts, leaves, startDate, endDate);

  const filteredRecords = allRecords.filter((r) => {
    if (selectedDept !== 'all' && r.staff.department !== selectedDept) return false;
    return true;
  });

  // Calculate metrics
  const totalHoursWorked = parseFloat(
    filteredRecords.reduce((acc, r) => acc + r.totalHours, 0).toFixed(1)
  );
  const totalOvertimeHours = parseFloat(
    filteredRecords.reduce((acc, r) => acc + r.overtimeHours, 0).toFixed(1)
  );
  const lateIncidents = filteredRecords.filter((r) => r.isLate).length;
  const totalPayrollEst = parseFloat(
    filteredRecords.reduce((acc, r) => acc + r.estimatedLaborCost, 0).toFixed(2)
  );
  const onTimeCount = filteredRecords.filter((r) => r.clockInTime && !r.isLate).length;
  const totalPresent = filteredRecords.filter((r) => r.clockInTime).length;
  const punctualityRate = totalPresent > 0 ? Math.round((onTimeCount / totalPresent) * 100) : 100;

  const handleExportCsv = () => {
    const csvContent = generateCsvTimesheet(filteredRecords);
    const filename = `timesheet_${startDate}_to_${endDate}.csv`;
    downloadCsv(filename, csvContent);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleTriggerScheduleNow = (sched: AutomatedReportSchedule) => {
    const summary = executeAutomatedSchedule(sched, staffList, punches, shifts, leaves);
    onAddGeneratedReport(summary);

    // Update schedule's lastGeneratedAt
    const updated = reportSchedules.map((s) =>
      s.id === sched.id ? { ...s, lastGeneratedAt: new Date().toISOString() } : s
    );
    onUpdateSchedules(updated);

    setRunFeedback(`Automated report "${sched.title}" executed! Stored in History and available for download.`);
    setTimeout(() => setRunFeedback(null), 4500);
  };

  const handleToggleScheduleActive = (id: string) => {
    const updated = reportSchedules.map((s) =>
      s.id === id ? { ...s, isActive: !s.isActive } : s
    );
    onUpdateSchedules(updated);
  };

  const handleSaveNewSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    const newSched: AutomatedReportSchedule = {
      id: `sched-${Date.now()}`,
      title: newTitle || `${newFrequency.toUpperCase()} ${newReportType.replace('_', ' ')}`,
      frequency: newFrequency,
      reportType: newReportType,
      recipientEmail: newEmail,
      executionTime: newTime,
      isActive: true,
      lastGeneratedAt: undefined,
    };
    onUpdateSchedules([...reportSchedules, newSched]);
    setIsScheduleModalOpen(false);
    setNewTitle('');
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls (Hidden in Print) */}
      <div className="no-print space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Automated Reports & Timesheet Analytics
            </h1>
            <div className="text-xs text-slate-500 mt-0.5">
              Generate scheduled attendance logs, calculate payroll hours, and export audit sheets
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Print / Save PDF</span>
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Trigger feedback toast */}
        {runFeedback && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{runFeedback}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveReportSubTab('timesheet')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeReportSubTab === 'timesheet'
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Timesheet Summary
            </button>
            <button
              type="button"
              onClick={() => setActiveReportSubTab('exceptions')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeReportSubTab === 'exceptions'
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Attendance & Exceptions
            </button>
            <button
              type="button"
              onClick={() => setActiveReportSubTab('payroll')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeReportSubTab === 'payroll'
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Payroll Hours & Cost
            </button>
            <button
              type="button"
              onClick={() => setActiveReportSubTab('schedules')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                activeReportSubTab === 'schedules'
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-indigo-700 hover:bg-indigo-50'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Automated Schedules ({reportSchedules.filter((s) => s.isActive).length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveReportSubTab('history')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                activeReportSubTab === 'history'
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Report Archive ({generatedReports.length})</span>
            </button>
          </div>

          {/* Date Presets and Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={datePreset}
              onChange={(e) => setDatePreset(e.target.value as 'today' | 'week' | 'month' | 'custom')}
              className="text-xs rounded-lg border border-slate-300 py-1.5 px-2 bg-white text-slate-800 focus:outline-none"
            >
              <option value="today">Today ({todayStr})</option>
              <option value="week">Current Week (Oct 05 - Oct 08)</option>
              <option value="month">Month to Date (Oct 2026)</option>
              <option value="custom">Custom Date Range</option>
            </select>

            {datePreset === 'custom' && (
              <div className="flex items-center gap-1 text-xs">
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="rounded border border-slate-300 py-1 px-1.5 font-mono"
                />
                <span>to</span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="rounded border border-slate-300 py-1 px-1.5 font-mono"
                />
              </div>
            )}

            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="text-xs rounded-lg border border-slate-300 py-1.5 px-2 bg-white text-slate-800 focus:outline-none"
            >
              <option value="all">All Garage Departments</option>
              <option value="Fuel Forecourt">Fuel Forecourt</option>
              <option value="QuickShop & Retail">QuickShop & Retail</option>
              <option value="Workshop & Service">Workshop & Service</option>
              <option value="Car Wash & Valet">Car Wash & Valet</option>
              <option value="Administration & HR">Administration & HR</option>
              <option value="Stock & Inventory">Stock & Inventory</option>
            </select>
          </div>
        </div>
      </div>

      {/* Printable Report Header (Visible in print) */}
      <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#004899] shrink-0 border border-blue-900 flex items-center justify-center">
              <img
                src="/src/assets/images/engen_florida_glen_logo_1791460528638.jpg"
                alt="Engen Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">
                ENGEN Florida-Glen Garage
              </h1>
              <p className="text-sm font-medium text-slate-700 mt-0.5">
                Official Staff Timesheet & Biometric Attendance Audit
              </p>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Period: {startDate} to {endDate} · Department: {selectedDept}
              </p>
            </div>
          </div>
          <div className="text-right text-xs text-slate-500 font-mono">
            <div>Generated: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</div>
            <div>Station ID: ENGEN-FG-8802</div>
            <div>Bio-Matrix USB Terminal 01</div>
          </div>
        </div>
      </div>

      {/* Aggregate KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Total Regular Hours</span>
            <Clock className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {totalHoursWorked}h
            </span>
            <span className="text-xs text-slate-500">worked</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Overtime Accumulated</span>
            <Clock className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-amber-700">
              +{totalOvertimeHours}h
            </span>
            <span className="text-xs text-slate-500">at 1.5x rate</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Punctuality Rate</span>
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {punctualityRate}%
            </span>
            <span className="text-xs text-slate-500">{lateIncidents} late punches</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Est. Gross Labor Cost (ZAR)</span>
            <Banknote className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-emerald-700">
              R {Number(totalPayrollEst).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-slate-500">calculated</span>
          </div>
        </div>
      </div>

      {/* View 1: Timesheet Summary Table */}
      {activeReportSubTab === 'timesheet' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Detailed Employee Timesheets
              </h3>
              <div className="text-xs text-slate-500">
                Clock in/out pairs, break deductions, and daily hours
              </div>
            </div>
          </div>

          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Staff Name</th>
                  <th className="py-2.5 px-3">Bio ID</th>
                  <th className="py-2.5 px-3">Clock In</th>
                  <th className="py-2.5 px-3">Clock Out</th>
                  <th className="py-2.5 px-3">Break</th>
                  <th className="py-2.5 px-3 text-right">Regular</th>
                  <th className="py-2.5 px-3 text-right">Overtime</th>
                  <th className="py-2.5 px-3 text-right">Total Hours</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400">
                      No timesheet records found for this period.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50/70">
                      <td className="py-2 px-3 font-mono text-slate-600">{r.date}</td>
                      <td className="py-2 px-3 font-medium text-slate-900">
                        {r.staff.name}
                        <span className="text-[11px] text-slate-400 block font-normal">
                          {r.staff.department}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-500">
                        #{r.staff.biometricId}
                      </td>
                      <td className="py-2 px-3 font-mono tabular-nums">
                        {r.clockInTime ? (
                          <span className={r.isLate ? 'text-rose-600 font-medium' : 'text-slate-800'}>
                            {r.clockInTime} {r.isLate && `(+${r.lateMinutes}m)`}
                          </span>
                        ) : (
                          <span className="text-slate-300">--:--</span>
                        )}
                      </td>
                      <td className="py-2 px-3 font-mono tabular-nums text-slate-800">
                        {r.clockOutTime || <span className="text-slate-300">--:--</span>}
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-500">
                        {r.breakDurationMinutes > 0 ? `${r.breakDurationMinutes}m` : '0m'}
                      </td>
                      <td className="py-2 px-3 text-right font-mono tabular-nums text-slate-700">
                        {r.regularHours.toFixed(1)}h
                      </td>
                      <td className="py-2 px-3 text-right font-mono tabular-nums text-amber-600 font-medium">
                        {r.overtimeHours > 0 ? `+${r.overtimeHours.toFixed(1)}h` : '0.0h'}
                      </td>
                      <td className="py-2 px-3 text-right font-mono tabular-nums font-bold text-slate-900">
                        {r.totalHours.toFixed(1)}h
                      </td>
                      <td className="py-2 px-3 text-right">
                        {r.onLeave ? (
                          <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[11px] font-medium border border-amber-200">
                            On Leave
                          </span>
                        ) : r.isAbsent ? (
                          <span className="text-slate-400 bg-slate-50 px-2 py-0.5 rounded text-[11px] border border-slate-200">
                            Off Duty
                          </span>
                        ) : r.isLate ? (
                          <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded text-[11px] font-medium border border-rose-200">
                            Late
                          </span>
                        ) : (
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-medium border border-emerald-200">
                            On Time
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View 2: Attendance Exceptions */}
      {activeReportSubTab === 'exceptions' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Punctuality & Attendance Exceptions Report
              </h3>
              <div className="text-xs text-slate-500">
                Flags staff arriving past schedule grace periods or clocking early departures
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const csv = generateExceptionsCsv(filteredRecords);
                downloadCsv(`attendance_exceptions_${startDate}_${endDate}.csv`, csv);
              }}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs self-start sm:self-auto"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Exceptions CSV</span>
            </button>
          </div>

          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Staff Member</th>
                  <th className="py-2.5 px-3">Biometric ID</th>
                  <th className="py-2.5 px-3">Scheduled Shift</th>
                  <th className="py-2.5 px-3">Actual Clock In</th>
                  <th className="py-2.5 px-3">Variance</th>
                  <th className="py-2.5 px-3">Exception Category</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {filteredRecords.filter((r) => r.isLate || r.isEarlyDeparture || r.isAbsent).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No attendance exceptions recorded for this date filter!
                    </td>
                  </tr>
                ) : (
                  filteredRecords
                    .filter((r) => r.isLate || r.isEarlyDeparture || r.isAbsent)
                    .map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-3 font-mono text-slate-600">{r.date}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {r.staff.name}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-500">
                          #{r.staff.biometricId}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {shifts.find((s) => s.id === r.staff.shiftId)?.name}
                        </td>
                        <td className="py-2.5 px-3 font-mono tabular-nums text-rose-600 font-medium">
                          {r.clockInTime || 'No Punch'}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-rose-700">
                          {r.lateMinutes > 0 ? `+${r.lateMinutes} mins late` : '--'}
                        </td>
                        <td className="py-2.5 px-3">
                          {r.isLate && (
                            <span className="text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded text-[11px] font-medium mr-1">
                              Late Arrival
                            </span>
                          )}
                          {r.isEarlyDeparture && (
                            <span className="text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[11px] font-medium mr-1">
                              Early Departure
                            </span>
                          )}
                          {r.isAbsent && !r.onLeave && (
                            <span className="text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[11px]">
                              Absent / No Punch
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View 3: Payroll Hours Breakdown */}
      {activeReportSubTab === 'payroll' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Gross Labor Cost & Payroll Hours Estimation (Rands - ZAR)
              </h3>
              <div className="text-xs text-slate-500">
                Billable wage calculation based on base hourly rate + 1.5x overtime multiplier in South African Rands
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const csv = generatePayrollSummaryCsv(staffList, filteredRecords);
                downloadCsv(`payroll_summary_${startDate}_${endDate}.csv`, csv);
              }}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs self-start sm:self-auto"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Payroll CSV</span>
            </button>
          </div>

          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                <tr>
                  <th className="py-2.5 px-3">Staff Member</th>
                  <th className="py-2.5 px-3">Biometric ID</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3 text-right">Base Hourly</th>
                  <th className="py-2.5 px-3 text-right">Regular Hrs</th>
                  <th className="py-2.5 px-3 text-right">Overtime Hrs</th>
                  <th className="py-2.5 px-3 text-right">Base Pay (R)</th>
                  <th className="py-2.5 px-3 text-right">OT Pay (R)</th>
                  <th className="py-2.5 px-3 text-right">Estimated Gross (R)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {staffList.map((staff) => {
                  const staffRows = filteredRecords.filter((r) => r.staff.id === staff.id);
                  const regHours = staffRows.reduce((a, b) => a + b.regularHours, 0);
                  const otHours = staffRows.reduce((a, b) => a + b.overtimeHours, 0);
                  const rate = staff.hourlyRate || 30;
                  const basePay = regHours * rate;
                  const otPay = otHours * (rate * 1.5);
                  const gross = basePay + otPay;

                  return (
                    <tr key={staff.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        {staff.name}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">
                        #{staff.biometricId}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{staff.department}</td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700">
                        R {rate.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700">
                        {regHours.toFixed(1)}h
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-amber-600 font-medium">
                        {otHours > 0 ? `+${otHours.toFixed(1)}h` : '0.0h'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700">
                        R {basePay.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-amber-600">
                        R {otPay.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-emerald-700">
                        R {gross.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View 4: Automated Schedules Configuration */}
      {activeReportSubTab === 'schedules' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Automated Report Scheduling Engine
              </h3>
              <div className="text-xs text-slate-500">
                Configure recurrent cron-style report triggers and automatic timesheet dispatches
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsScheduleModalOpen(true)}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Schedule Rule</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {reportSchedules.map((sched) => (
              <div
                key={sched.id}
                className="border border-slate-200 hover:border-slate-300 rounded-xl p-4 bg-slate-50/50 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {sched.frequency} Trigger
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleScheduleActive(sched.id)}
                      className={`text-xs font-medium px-2 py-0.5 rounded ${
                        sched.isActive
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                      }`}
                    >
                      {sched.isActive ? 'Active' : 'Paused'}
                    </button>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 leading-snug">
                    {sched.title}
                  </h4>
                  <div className="text-xs text-slate-500 mt-1 capitalize">
                    Type: {sched.reportType.replace('_', ' ')}
                  </div>

                  <div className="mt-3 text-xs text-slate-600 space-y-1 bg-white p-2.5 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Executes at: <strong className="font-mono text-slate-800">{sched.executionTime}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500 truncate">
                      <Mail className="w-3.5 h-3.5" />
                      <span className="truncate">{sched.recipientEmail}</span>
                    </div>
                    {sched.lastGeneratedAt && (
                      <div className="text-[11px] text-slate-400 font-mono">
                        Last run: {sched.lastGeneratedAt.slice(0, 10)}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Automated Dispatch</span>
                  <button
                    type="button"
                    onClick={() => handleTriggerScheduleNow(sched)}
                    className="px-2.5 py-1 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors flex items-center gap-1 border border-indigo-200"
                  >
                    <Play className="w-3 h-3 text-indigo-600" />
                    <span>Run Now</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* View 5: Report Archive & History */}
      {activeReportSubTab === 'history' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
          <div className="pb-4 border-b border-slate-100">
            <h3 className="text-base font-semibold text-slate-900">
              Generated Reports Archive
            </h3>
            <div className="text-xs text-slate-500">
              Download historical batches created by automated schedules
            </div>
          </div>

          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                <tr>
                  <th className="py-2.5 px-3">Report Title</th>
                  <th className="py-2.5 px-3">Generated At</th>
                  <th className="py-2.5 px-3">Date Range</th>
                  <th className="py-2.5 px-3 text-right">Staff Covered</th>
                  <th className="py-2.5 px-3 text-right">Total Hours</th>
                  <th className="py-2.5 px-3 text-right">Overtime</th>
                  <th className="py-2.5 px-3 text-right">Labor Cost (ZAR)</th>
                  <th className="py-2.5 px-3 text-right">Download</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {generatedReports.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No reports generated yet. Click "Run Now" in Automated Schedules!
                    </td>
                  </tr>
                ) : (
                  generatedReports.map((rep) => (
                    <tr key={rep.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-3 font-semibold text-slate-900 flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{rep.title}</span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">
                        {rep.generatedAt.slice(0, 16).replace('T', ' ')}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">
                        {rep.dateRange.start} to {rep.dateRange.end}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700">
                        {rep.totalEmployees}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-900 font-semibold">
                        {rep.totalHoursWorked}h
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-amber-600">
                        +{rep.totalOvertimeHours}h
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-emerald-700">
                        R {rep.estimatedLaborCost.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            const csvContent = generateCsvTimesheet(allRecords);
                            downloadCsv(rep.fileDownloadName, csvContent);
                          }}
                          className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors inline-flex items-center gap-1"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>CSV</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Printable Authorization Footer */}
      <div className="hidden print:block mt-12 pt-8 border-t border-slate-300">
        <div className="grid grid-cols-2 gap-12 text-xs text-slate-700">
          <div>
            <div className="border-b border-slate-400 pb-1 mb-2 font-mono font-medium">
              Prepared By: Bennie Mengoai (Station Administrator)
            </div>
            <p className="text-[11px] text-slate-500 mb-1">Cell: 076 010 7489 · Valerie.ajtransportcater@gmail.com</p>
            <p>Signature: ___________________________ Date: ____________</p>
          </div>
          <div>
            <div className="border-b border-slate-400 pb-1 mb-2 font-mono font-medium">
              Hardware Biometric Verification: ERS Bio-Matrix Model Q24PC
            </div>
            <p className="text-[11px] text-slate-500 mb-1">Source: att.log USB Import · Engen Florida-Glen Garage</p>
            <p>Approved By: _________________________ Date: ____________</p>
          </div>
        </div>
      </div>

      {/* New Schedule Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-2xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden my-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-semibold text-slate-900">
                  New Automated Report Schedule
                </h3>
              </div>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewSchedule} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Schedule Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Weekly Operations Overtime Audit"
                  className="w-full text-sm rounded-lg border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Frequency
                  </label>
                  <select
                    value={newFrequency}
                    onChange={(e) => setNewFrequency(e.target.value as 'daily' | 'weekly' | 'monthly')}
                    className="w-full text-sm rounded-lg border border-slate-300 py-2 px-3 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Time (HH:MM)
                  </label>
                  <input
                    type="time"
                    required
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full text-sm rounded-lg border border-slate-300 py-2 px-3 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Report Type
                </label>
                <select
                  value={newReportType}
                  onChange={(e) => setNewReportType(e.target.value as 'timesheet_summary' | 'attendance_exceptions' | 'payroll_breakdown')}
                  className="w-full text-sm rounded-lg border border-slate-300 py-2 px-3 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="timesheet_summary">Timesheet & Regular Hours Summary</option>
                  <option value="attendance_exceptions">Attendance Exceptions & Late Arrivals</option>
                  <option value="payroll_breakdown">Gross Payroll & Labor Cost</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Recipient Dispatch Email
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-2xs"
                >
                  Save Schedule Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
