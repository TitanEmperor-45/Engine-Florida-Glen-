import React, { useState } from 'react';
import {
  StaffMember,
  ShiftSchedule,
  RosterShiftEntry,
  HolidayEvent,
  LeaveRequest,
} from '../types';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  Filter,
  Users,
  Clock,
  Sparkles,
  Printer,
  CalendarDays,
  Sun,
  Moon,
  Coffee,
  CheckCircle2,
  AlertCircle,
  Trash2,
  X,
  Palmtree,
  GraduationCap,
  Building2,
  Layers,
  Download,
  Edit2,
  Check,
  Banknote,
} from 'lucide-react';
import { EngenLogo } from './EngenLogo';

interface CalendarViewProps {
  staffList: StaffMember[];
  shifts: ShiftSchedule[];
  roster: RosterShiftEntry[];
  holidays: HolidayEvent[];
  leaves: LeaveRequest[];
  onSaveRosterEntry: (entry: Omit<RosterShiftEntry, 'id'>) => void;
  onDeleteRosterEntry: (entryId: string) => void;
  onBatchAutoRoster: (monthStr: string) => void;
  onAddHoliday: (holiday: HolidayEvent) => void;
  onDeleteHoliday: (holidayId: string) => void;
  onUpdateHourlyRate?: (staffId: string, rate: number) => void;
}

type ViewMode = 'month' | 'week' | 'matrix' | 'holidays';
type ShiftCategoryFilter = 'all' | 'forecourt' | 'cashier' | 'bakery' | 'general';

export const CalendarView: React.FC<CalendarViewProps> = ({
  staffList,
  shifts,
  roster,
  holidays,
  leaves,
  onSaveRosterEntry,
  onDeleteRosterEntry,
  onBatchAutoRoster,
  onAddHoliday,
  onDeleteHoliday,
  onUpdateHourlyRate,
}) => {
  // Navigation State: default to October 2026 (matching system context)
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonth, setCurrentMonth] = useState<number>(9); // 0-indexed: 9 = October
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [categoryFilter, setCategoryFilter] = useState<ShiftCategoryFilter>('all');

  // Toggle Overlays
  const [showPublicHolidays, setShowPublicHolidays] = useState<boolean>(true);
  const [showSchoolHolidays, setShowSchoolHolidays] = useState<boolean>(true);
  const [showRosterShifts, setShowRosterShifts] = useState<boolean>(true);
  const [showLeaves, setShowLeaves] = useState<boolean>(true);

  // Modals & Drawers
  const [selectedDateForDetail, setSelectedDateForDetail] = useState<string | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState<boolean>(false);
  const [assignDefaultDate, setAssignDefaultDate] = useState<string>('2026-10-08');
  const [assignStaffId, setAssignStaffId] = useState<string>(staffList[0]?.id || '');
  const [assignShiftId, setAssignShiftId] = useState<string>(shifts[0]?.id || '');
  const [assignEndDate, setAssignEndDate] = useState<string>('');
  const [assignNotes, setAssignNotes] = useState<string>('');

  // Add Holiday Modal
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState<boolean>(false);
  const [newHolTitle, setNewHolTitle] = useState<string>('');
  const [newHolStartDate, setNewHolStartDate] = useState<string>('2026-10-15');
  const [newHolEndDate, setNewHolEndDate] = useState<string>('2026-10-15');
  const [newHolType, setNewHolType] = useState<'public_holiday' | 'school_holiday'>('public_holiday');
  const [newHolDesc, setNewHolDesc] = useState<string>('');

  // Administrator Binnie Hourly Rate Editing State
  const [editingRateStaffId, setEditingRateStaffId] = useState<string | null>(null);
  const [editingRateValue, setEditingRateValue] = useState<string>('');
  const [isRateManagerModalOpen, setIsRateManagerModalOpen] = useState<boolean>(false);

  const handleSaveHourlyRate = (staffId: string) => {
    const val = parseFloat(editingRateValue);
    if (!isNaN(val) && val > 0 && onUpdateHourlyRate) {
      onUpdateHourlyRate(staffId, val);
    }
    setEditingRateStaffId(null);
  };

  // Month navigation helpers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleGoToday = () => {
    setCurrentYear(2026);
    setCurrentMonth(9); // October
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentMonthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

  // Days in selected month
  const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7; // 0 = Mon, 6 = Sun

  // Date formatted helper
  const formatDateStr = (day: number) => {
    return `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  // Find holidays that cover a date
  const getHolidaysForDate = (dateStr: string) => {
    return holidays.filter(
      (h) => dateStr >= h.startDate && dateStr <= h.endDate
    );
  };

  // Find approved leaves that cover a date
  const getLeavesForDate = (dateStr: string) => {
    return leaves.filter(
      (l) => l.status === 'approved' && dateStr >= l.startDate && dateStr <= l.endDate
    );
  };

  // Find roster entries for a date filtered by category
  const getRosterForDate = (dateStr: string) => {
    const entries = roster.filter((r) => r.date === dateStr);
    if (categoryFilter === 'all') return entries;

    return entries.filter((r) => {
      const shift = shifts.find((s) => s.id === r.shiftId);
      return shift?.category === categoryFilter;
    });
  };

  // Open assign modal for a specific date
  const handleOpenAssign = (dateStr?: string, staffIdPref?: string) => {
    setAssignDefaultDate(dateStr || formatDateStr(8));
    setAssignEndDate('');
    if (staffIdPref) {
      setAssignStaffId(staffIdPref);
      const staffObj = staffList.find((s) => s.id === staffIdPref);
      if (staffObj) setAssignShiftId(staffObj.shiftId);
    } else if (staffList.length > 0) {
      setAssignStaffId(staffList[0].id);
      setAssignShiftId(staffList[0].shiftId);
    }
    setAssignNotes('');
    setIsAssignModalOpen(true);
  };

  // Handle saving new roster entry / range
  const handleSaveRoster = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignStaffId || !assignShiftId || !assignDefaultDate) return;

    if (assignEndDate && assignEndDate > assignDefaultDate) {
      // Date range assignment
      const start = new Date(assignDefaultDate);
      const end = new Date(assignEndDate);
      const cur = new Date(start);

      while (cur <= end) {
        const dStr = cur.toISOString().slice(0, 10);
        onSaveRosterEntry({
          staffId: assignStaffId,
          date: dStr,
          shiftId: assignShiftId,
          notes: assignNotes || undefined,
        });
        cur.setDate(cur.getDate() + 1);
      }
    } else {
      onSaveRosterEntry({
        staffId: assignStaffId,
        date: assignDefaultDate,
        shiftId: assignShiftId,
        notes: assignNotes || undefined,
      });
    }

    setIsAssignModalOpen(false);
  };

  // Handle adding custom holiday
  const handleSaveHoliday = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHolTitle.trim() || !newHolStartDate) return;

    const newHol: HolidayEvent = {
      id: `hol-custom-${Date.now()}`,
      title: newHolTitle.trim(),
      startDate: newHolStartDate,
      endDate: newHolEndDate || newHolStartDate,
      type: newHolType,
      jurisdiction:
        newHolType === 'public_holiday'
          ? 'South Africa National'
          : 'Gauteng / Inland Schools',
      description: newHolDesc || undefined,
    };

    onAddHoliday(newHol);
    setIsHolidayModalOpen(false);
    setNewHolTitle('');
    setNewHolDesc('');
  };

  // Print function
  const handlePrint = () => {
    window.print();
  };

  const exportRosterCsv = () => {
    const headers = [
      'Date',
      'Day of Week',
      'Staff Name',
      'Biometric ID',
      'Department',
      'Shift Name',
      'Category',
      'Start Time',
      'End Time',
      'Expected Hours',
      'Public Holiday Status',
      'School Holiday Status',
      'Operational Notes',
    ];

    const sortedRoster = [...roster].sort((a, b) => a.date.localeCompare(b.date));

    const rows = sortedRoster.map((entry) => {
      const staff = staffList.find((s) => s.id === entry.staffId);
      const shift = shifts.find((sh) => sh.id === entry.shiftId);
      const dateHols = getHolidaysForDate(entry.date);
      const pubHol = dateHols.find((h) => h.type === 'public_holiday')?.title || 'No';
      const schHol = dateHols.find((h) => h.type === 'school_holiday')?.title || 'No';
      const dayName = new Date(entry.date).toLocaleDateString('en-ZA', { weekday: 'long' });

      return [
        entry.date,
        dayName,
        `"${staff?.name || 'Unknown'}"`,
        staff?.biometricId || '',
        `"${staff?.department || 'N/A'}"`,
        `"${shift?.name || 'Assigned Shift'}"`,
        shift?.category || 'general',
        shift?.startTime || '--:--',
        shift?.endTime || '--:--',
        shift?.expectedHours || 0,
        `"${pubHol}"`,
        `"${schHol}"`,
        `"${entry.notes || ''}"`,
      ];
    });

    const content = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `engen_florida_glen_roster_${currentMonthStr}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Printable Title Bar (hidden on screen, visible when printing) */}
      <div className="hidden print:block pb-4 mb-4 border-b-2 border-slate-900">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-blue-900">
              Engen Florida-Glen Garage
            </h1>
            <p className="text-sm font-semibold text-slate-700">
              Official Shift Schedule & Monthly Operational Roster · {monthNames[currentMonth]} {currentYear}
            </p>
            <p className="text-xs text-slate-500">
              Forecourt (24h) · Cashiers & QuickShop · Fresh Bakery Deli · Workshop Service
            </p>
          </div>
          <div className="text-right text-xs text-slate-600">
            <div>Printed on: {new Date().toLocaleDateString('en-ZA')}</div>
            <div>Supervisor: Bennie Mengoai</div>
          </div>
        </div>
      </div>

      {/* Top Banner & Control Zone (Highlighted area from diagram: Red square logo with blue X + Florida-Glen: Service Station and Convenient Store) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          {/* Highlighted Area: Red Box Logo + Florida-Glen: Service Station and Convenient Store Title */}
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
                <span className="text-xs font-bold uppercase tracking-wider text-blue-900 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                  Shift Schedule & Operational Roster
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  {monthNames[currentMonth]} {currentYear}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                24/7 Forecourt, QuickShop & Corner Bakery schedules integrated with SA Public & School Holidays
              </p>
            </div>
          </div>

          {/* View Mode Switcher - Segmented Pill (Cleanly fitted) */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 self-start xl:self-auto shrink-0">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                viewMode === 'month'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Month View
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                viewMode === 'week'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Week View
            </button>
            <button
              onClick={() => setViewMode('matrix')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 ${
                viewMode === 'matrix'
                  ? 'bg-white text-blue-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Roster Matrix with editable hourly rates"
            >
              <span>Roster Matrix</span>
              <span className="text-[10px] px-1 py-0.2 rounded bg-blue-100 text-blue-800 font-mono font-bold">R/hr</span>
            </button>
            <button
              onClick={() => setViewMode('holidays')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 ${
                viewMode === 'holidays'
                  ? 'bg-white text-amber-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Palmtree className="w-3.5 h-3.5 text-amber-600" />
              <span>Holidays ({holidays.length})</span>
            </button>
          </div>
        </div>

        {/* Action Controls Toolbar - Responsive, balanced & perfectly fitted */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleOpenAssign()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors shadow-2xs"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Assign Shift</span>
            </button>

            <button
              onClick={() => onBatchAutoRoster(currentMonthStr)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors shadow-2xs"
              title="Auto-generate monthly shift roster from staff base shift assignments"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Auto-Roster Month</span>
            </button>

            {/* Binnie: Quick Hourly Rate Amendment Button */}
            <button
              type="button"
              onClick={() => setIsRateManagerModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors shadow-2xs"
              title="Administrator Binnie: Amend hourly rates (ZAR R/hr) for staff"
            >
              <Banknote className="w-3.5 h-3.5 text-emerald-600" />
              <span>Binnie: Amend Hourly Rates</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportRosterCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors shadow-2xs"
              title="Export monthly shift roster to CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors shadow-2xs"
              title="Print schedule for notice board"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Print</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation & Filter Bar (Organized into 2 clean tiers so all options fit perfectly) */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-4 shadow-2xs space-y-3">
        {/* Tier 1: Month Selector on Left, Calendar Layer Overlays on Right */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          {/* Month Picker / Navigator */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-0.5 shadow-2xs">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 hover:bg-slate-200 text-slate-700 rounded-md transition-colors"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 font-bold text-sm text-slate-900 min-w-36 text-center">
                {monthNames[currentMonth]} {currentYear}
              </span>
              <button
                onClick={handleNextMonth}
                className="p-1.5 hover:bg-slate-200 text-slate-700 rounded-md transition-colors"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleGoToday}
              className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors shadow-2xs"
            >
              Today (Oct 8)
            </button>
          </div>

          {/* Overlays Toggle Badges (Clean aligned interactive pills) */}
          <div className="flex flex-wrap items-center gap-2">
            <label
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg border transition-all cursor-pointer select-none ${
                showPublicHolidays
                  ? 'bg-amber-50/80 border-amber-300 text-amber-900 font-medium shadow-2xs'
                  : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
              }`}
            >
              <input
                type="checkbox"
                checked={showPublicHolidays}
                onChange={(e) => setShowPublicHolidays(e.target.checked)}
                className="rounded text-amber-600 focus:ring-amber-500 w-3.5 h-3.5"
              />
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span>Public Holidays</span>
            </label>

            <label
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg border transition-all cursor-pointer select-none ${
                showSchoolHolidays
                  ? 'bg-purple-50/80 border-purple-300 text-purple-900 font-medium shadow-2xs'
                  : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
              }`}
            >
              <input
                type="checkbox"
                checked={showSchoolHolidays}
                onChange={(e) => setShowSchoolHolidays(e.target.checked)}
                className="rounded text-purple-600 focus:ring-purple-500 w-3.5 h-3.5"
              />
              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
              <span>School Holidays</span>
            </label>

            <label
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg border transition-all cursor-pointer select-none ${
                showRosterShifts
                  ? 'bg-blue-50/80 border-blue-300 text-blue-900 font-medium shadow-2xs'
                  : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
              }`}
            >
              <input
                type="checkbox"
                checked={showRosterShifts}
                onChange={(e) => setShowRosterShifts(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
              />
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              <span>Staff Roster</span>
            </label>

            <label
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg border transition-all cursor-pointer select-none ${
                showLeaves
                  ? 'bg-rose-50/80 border-rose-300 text-rose-900 font-medium shadow-2xs'
                  : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
              }`}
            >
              <input
                type="checkbox"
                checked={showLeaves}
                onChange={(e) => setShowLeaves(e.target.checked)}
                className="rounded text-rose-600 focus:ring-rose-500 w-3.5 h-3.5"
              />
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span>Approved Leaves</span>
            </label>
          </div>
        </div>

        {/* Tier 2: Department & Shift Filter Pills (With ample room to fit comfortably) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-0.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>Shift Filter:</span>
            </span>

            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                categoryFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Shifts
            </button>

            <button
              onClick={() => setCategoryFilter('forecourt')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors border ${
                categoryFilter === 'forecourt'
                  ? 'bg-blue-700 text-white border-blue-700 shadow-2xs'
                  : 'bg-blue-50/80 text-blue-700 hover:bg-blue-100 border-blue-200'
              }`}
            >
              Forecourt (5 Shifts)
            </button>

            <button
              onClick={() => setCategoryFilter('cashier')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors border ${
                categoryFilter === 'cashier'
                  ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                  : 'bg-emerald-50/80 text-emerald-700 hover:bg-emerald-100 border-emerald-200'
              }`}
            >
              Cashiers (Day & Night)
            </button>

            <button
              onClick={() => setCategoryFilter('bakery')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors border ${
                categoryFilter === 'bakery'
                  ? 'bg-rose-700 text-white border-rose-700 shadow-2xs'
                  : 'bg-rose-50/80 text-rose-700 hover:bg-rose-100 border-rose-200'
              }`}
            >
              Bakery (06:00–15:00)
            </button>

            <button
              onClick={() => setCategoryFilter('general')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors border ${
                categoryFilter === 'general'
                  ? 'bg-slate-800 text-white border-slate-800 shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200'
              }`}
            >
              Workshop & Admin
            </button>
          </div>

          <div className="text-[11px] text-slate-500 font-medium shrink-0">
            <span>Roster Active · {staffList.length} Demo Staff Scheduled</span>
          </div>
        </div>
      </div>

      {/* VIEW 1: MONTH VIEW */}
      {viewMode === 'month' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          {/* Days of the Week Header */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-bold text-slate-700 py-2.5">
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div className="text-amber-700">Sat</div>
            <div className="text-amber-700">Sun</div>
          </div>

          {/* Month Days Grid */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100">
            {/* Blank cells for offset */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`blank-${i}`} className="min-h-28 bg-slate-50/50 p-2 text-slate-300 select-none"></div>
            ))}

            {/* Days in Month */}
            {Array.from({ length: daysInCurrentMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = formatDateStr(dayNum);
              const isToday = currentYear === 2026 && currentMonth === 9 && dayNum === 8;
              const dayHolidays = getHolidaysForDate(dateStr);
              const publicHols = dayHolidays.filter((h) => h.type === 'public_holiday');
              const schoolHols = dayHolidays.filter((h) => h.type === 'school_holiday');
              const dayLeaves = getLeavesForDate(dateStr);
              const dayRoster = getRosterForDate(dateStr);

              // Breakdown of crew by department
              const forecourtCount = dayRoster.filter((r) => {
                const s = shifts.find((sh) => sh.id === r.shiftId);
                return s?.category === 'forecourt';
              }).length;

              const cashierCount = dayRoster.filter((r) => {
                const s = shifts.find((sh) => sh.id === r.shiftId);
                return s?.category === 'cashier';
              }).length;

              const bakeryCount = dayRoster.filter((r) => {
                const s = shifts.find((sh) => sh.id === r.shiftId);
                return s?.category === 'bakery';
              }).length;

              const generalCount = dayRoster.filter((r) => {
                const s = shifts.find((sh) => sh.id === r.shiftId);
                return s?.category === 'general';
              }).length;

              return (
                <div
                  key={`day-${dayNum}`}
                  onClick={() => setSelectedDateForDetail(dateStr)}
                  className={`min-h-28 sm:min-h-32 p-1.5 sm:p-2 cursor-pointer transition-colors flex flex-col justify-between group ${
                    isToday
                      ? 'bg-blue-50/40 ring-2 ring-inset ring-blue-500'
                      : publicHols.length > 0 && showPublicHolidays
                      ? 'bg-amber-50/30 hover:bg-amber-50/60'
                      : 'hover:bg-slate-50/80'
                  }`}
                >
                  {/* Date Number & Top Flags */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-xs sm:text-sm font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                          isToday
                            ? 'bg-blue-700 text-white font-black shadow-xs'
                            : 'text-slate-900 group-hover:text-blue-700'
                        }`}
                      >
                        {dayNum}
                      </span>

                      {/* Total scheduled badge */}
                      {showRosterShifts && dayRoster.length > 0 && (
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {dayRoster.length} on duty
                        </span>
                      )}
                    </div>

                    {/* Public Holiday Banner */}
                    {showPublicHolidays &&
                      publicHols.map((hol) => (
                        <div
                          key={hol.id}
                          className="mb-1 px-1.5 py-0.5 bg-amber-500 text-white rounded text-[10px] font-bold leading-tight truncate shadow-2xs"
                          title={`${hol.title}: ${hol.description || 'South African Public Holiday'}`}
                        >
                          🇿🇦 {hol.title}
                        </div>
                      ))}

                    {/* School Holiday Ribbon */}
                    {showSchoolHolidays &&
                      schoolHols.map((sch) => (
                        <div
                          key={sch.id}
                          className="mb-1 px-1.5 py-0.5 bg-purple-100 border border-purple-200 text-purple-800 rounded text-[10px] font-semibold leading-tight truncate"
                          title={`${sch.title} (${sch.jurisdiction})`}
                        >
                          🎒 {sch.title.replace(' School Holidays', '')}
                        </div>
                      ))}

                    {/* Approved Leaves Warning */}
                    {showLeaves && dayLeaves.length > 0 && (
                      <div className="mb-1 px-1.5 py-0.5 bg-rose-50 border border-rose-200 text-rose-700 rounded text-[10px] font-medium leading-tight truncate">
                        🏖️ {dayLeaves.length} on leave
                      </div>
                    )}
                  </div>

                  {/* Shift Crew Badges */}
                  {showRosterShifts && (
                    <div className="space-y-0.5 pt-1 border-t border-slate-100 text-[10px]">
                      {forecourtCount > 0 && (
                        <div className="flex items-center justify-between text-blue-700 font-semibold bg-blue-50/70 px-1 py-0.5 rounded">
                          <span className="truncate">Forecourt</span>
                          <span className="font-mono ml-1">{forecourtCount}</span>
                        </div>
                      )}
                      {cashierCount > 0 && (
                        <div className="flex items-center justify-between text-emerald-700 font-semibold bg-emerald-50/70 px-1 py-0.5 rounded">
                          <span className="truncate">Cashiers</span>
                          <span className="font-mono ml-1">{cashierCount}</span>
                        </div>
                      )}
                      {bakeryCount > 0 && (
                        <div className="flex items-center justify-between text-rose-700 font-semibold bg-rose-50/70 px-1 py-0.5 rounded">
                          <span className="truncate">Bakery</span>
                          <span className="font-mono ml-1">{bakeryCount}</span>
                        </div>
                      )}
                      {generalCount > 0 && categoryFilter !== 'forecourt' && (
                        <div className="flex items-center justify-between text-slate-700 font-medium bg-slate-100 px-1 py-0.5 rounded">
                          <span className="truncate">Workshop</span>
                          <span className="font-mono ml-1">{generalCount}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: WEEK VIEW */}
      {viewMode === 'week' && (
        <div className="space-y-4">
          <div className="text-xs text-slate-500 flex items-center justify-between">
            <span>Showing detailed 7-day schedule blocks around current selection.</span>
            <span>Click any day to manage staff rosters.</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            {/* Generate 7 days starting from Oct 05 (Monday) to Oct 11 (Sunday) */}
            {Array.from({ length: 7 }).map((_, i) => {
              const dayNum = 5 + i; // Monday Oct 05 to Sunday Oct 11
              const dateStr = formatDateStr(dayNum);
              const isToday = dayNum === 8;
              const dayHols = getHolidaysForDate(dateStr);
              const dayRoster = getRosterForDate(dateStr);
              const dayLeaves = getLeavesForDate(dateStr);

              const dateObj = new Date(2026, 9, dayNum);
              const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });

              return (
                <div
                  key={`week-day-${dayNum}`}
                  className={`bg-white border rounded-xl overflow-hidden shadow-2xs flex flex-col ${
                    isToday ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-200'
                  }`}
                >
                  {/* Day Column Header */}
                  <div
                    className={`p-3 text-center border-b ${
                      isToday
                        ? 'bg-blue-700 text-white'
                        : dayHols.some((h) => h.type === 'public_holiday')
                        ? 'bg-amber-100 text-amber-900 border-amber-200'
                        : 'bg-slate-50 text-slate-900 border-slate-200'
                    }`}
                  >
                    <div className="text-xs font-semibold uppercase">{dayName}</div>
                    <div className="text-lg font-black">{dayNum} Oct</div>
                    {dayHols.map((h) => (
                      <div
                        key={h.id}
                        className="text-[10px] font-bold px-1 py-0.5 rounded mt-1 bg-amber-500 text-white truncate"
                      >
                        {h.title}
                      </div>
                    ))}
                  </div>

                  {/* Day Roster Cards */}
                  <div className="p-2.5 flex-1 space-y-2 overflow-y-auto max-h-96">
                    {/* Forecourt Section */}
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-blue-800 mb-1 flex items-center justify-between">
                        <span>Forecourt</span>
                        <span className="text-slate-400">24h</span>
                      </div>
                      {dayRoster
                        .filter((r) => {
                          const s = shifts.find((sh) => sh.id === r.shiftId);
                          return s?.category === 'forecourt';
                        })
                        .map((entry) => {
                          const staff = staffList.find((st) => st.id === entry.staffId);
                          const shift = shifts.find((sh) => sh.id === entry.shiftId);
                          return (
                            <div
                              key={entry.id}
                              className="p-1.5 rounded-lg border border-blue-200 bg-blue-50/60 mb-1.5 text-xs text-blue-900 group relative"
                            >
                              <div className="font-semibold text-slate-900 truncate">
                                {staff?.name}
                              </div>
                              <div className="text-[10px] text-blue-700 flex items-center gap-1 font-mono">
                                <Clock className="w-2.5 h-2.5" />
                                <span>{shift?.startTime} - {shift?.endTime}</span>
                              </div>
                              <button
                                onClick={() => onDeleteRosterEntry(entry.id)}
                                className="absolute right-1 top-1 p-0.5 text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Remove from roster"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          );
                        })}
                    </div>

                    {/* Cashiers Section */}
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 mb-1 flex items-center justify-between">
                        <span>Cashiers</span>
                        <span className="text-slate-400">Day/Night</span>
                      </div>
                      {dayRoster
                        .filter((r) => {
                          const s = shifts.find((sh) => sh.id === r.shiftId);
                          return s?.category === 'cashier';
                        })
                        .map((entry) => {
                          const staff = staffList.find((st) => st.id === entry.staffId);
                          const shift = shifts.find((sh) => sh.id === entry.shiftId);
                          return (
                            <div
                              key={entry.id}
                              className="p-1.5 rounded-lg border border-emerald-200 bg-emerald-50/60 mb-1.5 text-xs text-emerald-900 group relative"
                            >
                              <div className="font-semibold text-slate-900 truncate">
                                {staff?.name}
                              </div>
                              <div className="text-[10px] text-emerald-700 flex items-center gap-1 font-mono">
                                <Clock className="w-2.5 h-2.5" />
                                <span>{shift?.startTime} - {shift?.endTime}</span>
                              </div>
                              <button
                                onClick={() => onDeleteRosterEntry(entry.id)}
                                className="absolute right-1 top-1 p-0.5 text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Remove from roster"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          );
                        })}
                    </div>

                    {/* Bakery Section */}
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-rose-800 mb-1 flex items-center justify-between">
                        <span>Bakery Staff</span>
                        <span className="text-slate-400">06:00-15:00</span>
                      </div>
                      {dayRoster
                        .filter((r) => {
                          const s = shifts.find((sh) => sh.id === r.shiftId);
                          return s?.category === 'bakery';
                        })
                        .map((entry) => {
                          const staff = staffList.find((st) => st.id === entry.staffId);
                          const shift = shifts.find((sh) => sh.id === entry.shiftId);
                          return (
                            <div
                              key={entry.id}
                              className="p-1.5 rounded-lg border border-rose-200 bg-rose-50/60 mb-1.5 text-xs text-rose-900 group relative"
                            >
                              <div className="font-semibold text-slate-900 truncate">
                                {staff?.name}
                              </div>
                              <div className="text-[10px] text-rose-700 flex items-center gap-1 font-mono">
                                <Clock className="w-2.5 h-2.5" />
                                <span>{shift?.startTime} - {shift?.endTime}</span>
                              </div>
                              <button
                                onClick={() => onDeleteRosterEntry(entry.id)}
                                className="absolute right-1 top-1 p-0.5 text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Remove from roster"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          );
                        })}
                    </div>

                    {/* Leaves & Exceptions */}
                    {dayLeaves.map((l) => {
                      const staff = staffList.find((st) => st.id === l.staffId);
                      return (
                        <div
                          key={l.id}
                          className="p-1.5 rounded-lg border border-amber-200 bg-amber-50 text-[11px] text-amber-800"
                        >
                          <span className="font-bold">{staff?.name}</span> (On {l.type} leave)
                        </div>
                      );
                    })}
                  </div>

                  {/* Day Footer Action */}
                  <div className="p-2 border-t border-slate-100 bg-slate-50 text-center">
                    <button
                      onClick={() => handleOpenAssign(dateStr)}
                      className="text-xs font-semibold text-blue-700 hover:text-blue-900 hover:underline inline-flex items-center gap-1"
                    >
                      <PlusCircle className="w-3 h-3" />
                      <span>Add to Roster</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 3: ROSTER MATRIX (MONTHLY STAFF PLANNER) */}
      {viewMode === 'matrix' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Staff Roster Matrix Planner · {monthNames[currentMonth]} {currentYear}
              </h3>
              <p className="text-xs text-slate-500">
                Click any cell to assign or change a shift for that staff member.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold">
                FC: Forecourt
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                CSH: Cashier
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-semibold">
                BAK: Bakery
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="sticky left-0 bg-slate-50 z-10 px-3 py-2 border-r border-slate-200 min-w-44">
                    Staff Member
                  </th>
                  <th className="px-2 py-2 border-r border-slate-200 min-w-28">
                    Role / Dept
                  </th>
                  <th className="px-2.5 py-2 border-r border-slate-200 min-w-32 text-right">
                    Hourly Wage (ZAR)
                  </th>
                  {Array.from({ length: daysInCurrentMonth }).map((_, i) => {
                    const d = i + 1;
                    const dStr = formatDateStr(d);
                    const isHol = holidays.some(
                      (h) => h.type === 'public_holiday' && dStr >= h.startDate && dStr <= h.endDate
                    );
                    const isToday = currentYear === 2026 && currentMonth === 9 && d === 8;

                    return (
                      <th
                        key={`m-head-${d}`}
                        className={`px-1.5 py-2 text-center border-r border-slate-100 font-mono ${
                          isToday
                            ? 'bg-blue-600 text-white font-black'
                            : isHol
                            ? 'bg-amber-100 text-amber-900'
                            : ''
                        }`}
                      >
                        {d}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staffList.map((staff) => {
                  return (
                    <tr key={staff.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Fixed Staff Name */}
                      <td className="sticky left-0 bg-white hover:bg-slate-50 z-10 px-3 py-2 border-r border-slate-200 font-semibold text-slate-900 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {staff.avatarUrl ? (
                            <img
                              src={staff.avatarUrl}
                              alt={staff.name}
                              referrerPolicy="no-referrer"
                              className="w-5 h-5 rounded-full object-cover shrink-0"
                            />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-slate-200 text-[10px] flex items-center justify-center font-bold">
                              {staff.name.slice(0, 1)}
                            </div>
                          )}
                          <span className="truncate">{staff.name}</span>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="px-2 py-2 border-r border-slate-200 text-slate-500 whitespace-nowrap text-[11px]">
                        {staff.role}
                      </td>

                      {/* Hourly Wage editable by Administrator Binnie */}
                      <td className="px-2.5 py-2 border-r border-slate-200 text-slate-900 whitespace-nowrap text-right font-mono text-[11px]">
                        {editingRateStaffId === staff.id ? (
                          <div className="flex items-center justify-end gap-1">
                            <span className="text-[10px] text-slate-500 font-bold">R</span>
                            <input
                              type="number"
                              step="0.5"
                              value={editingRateValue}
                              onChange={(e) => setEditingRateValue(e.target.value)}
                              className="w-14 px-1 py-0.5 text-[11px] font-bold border border-blue-500 rounded bg-white text-slate-900"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveHourlyRate(staff.id)}
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                              title="Save rate"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => setEditingRateStaffId(null)}
                              className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                              title="Cancel"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            <span className="font-bold">R {staff.hourlyRate.toFixed(2)}/hr</span>
                            {onUpdateHourlyRate && (
                              <button
                                onClick={() => {
                                  setEditingRateStaffId(staff.id);
                                  setEditingRateValue(String(staff.hourlyRate));
                                }}
                                className="p-0.5 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                                title="Binnie: Amend hourly wage"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Day Cells */}
                      {Array.from({ length: daysInCurrentMonth }).map((_, i) => {
                        const d = i + 1;
                        const dateStr = formatDateStr(d);
                        const entry = roster.find((r) => r.staffId === staff.id && r.date === dateStr);
                        const assignedShift = entry ? shifts.find((s) => s.id === entry.shiftId) : null;
                        const isLeave = leaves.some(
                          (l) => l.staffId === staff.id && l.status === 'approved' && dateStr >= l.startDate && dateStr <= l.endDate
                        );

                        let badgeCode = '—';
                        let badgeClass = 'text-slate-300';

                        if (isLeave) {
                          badgeCode = 'LV';
                          badgeClass = 'bg-rose-100 text-rose-800 font-bold';
                        } else if (assignedShift) {
                          if (assignedShift.id === 'shift-fc-m12') {
                            badgeCode = 'FC-M12';
                            badgeClass = 'bg-blue-600 text-white font-bold';
                          } else if (assignedShift.id === 'shift-fc-m8') {
                            badgeCode = 'FC-M8';
                            badgeClass = 'bg-sky-500 text-white font-bold';
                          } else if (assignedShift.id === 'shift-fc-a6a') {
                            badgeCode = 'FC-A6a';
                            badgeClass = 'bg-amber-500 text-white font-bold';
                          } else if (assignedShift.id === 'shift-fc-a6b') {
                            badgeCode = 'FC-A6b';
                            badgeClass = 'bg-orange-500 text-white font-bold';
                          } else if (assignedShift.id === 'shift-fc-n12') {
                            badgeCode = 'FC-N12';
                            badgeClass = 'bg-indigo-700 text-white font-bold';
                          } else if (assignedShift.id === 'shift-csh-d12') {
                            badgeCode = 'CSH-D';
                            badgeClass = 'bg-emerald-600 text-white font-bold';
                          } else if (assignedShift.id === 'shift-csh-n12') {
                            badgeCode = 'CSH-N';
                            badgeClass = 'bg-purple-700 text-white font-bold';
                          } else if (assignedShift.id === 'shift-bak-d9') {
                            badgeCode = 'BAK-9';
                            badgeClass = 'bg-rose-600 text-white font-bold';
                          } else {
                            badgeCode = 'WRK';
                            badgeClass = 'bg-slate-700 text-white font-bold';
                          }
                        }

                        return (
                          <td
                            key={`cell-${staff.id}-${d}`}
                            onClick={() => handleOpenAssign(dateStr, staff.id)}
                            className="p-1 text-center border-r border-slate-100 cursor-pointer hover:bg-blue-50/60"
                            title={`${staff.name} on ${dateStr}: ${assignedShift?.name || 'Off'}`}
                          >
                            <span
                              className={`inline-block px-1 py-0.5 text-[9px] rounded font-mono ${badgeClass}`}
                            >
                              {badgeCode}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 4: HOLIDAYS & SCHOOL TERMS DIRECTORY */}
      {viewMode === 'holidays' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Official 2026 South African Holidays & School Calendar
              </h2>
              <p className="text-xs text-slate-500">
                National Public Holidays and Inland (Gauteng) school holiday terms for Engen Florida-Glen operational planning.
              </p>
            </div>
            <button
              onClick={() => setIsHolidayModalOpen(true)}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors shadow-2xs flex items-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Add Custom Holiday / Closure</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* South African Public Holidays 2026 */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                  <Palmtree className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    South Africa National Public Holidays (2026)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Statutory paid public holidays under the Public Holidays Act
                  </p>
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {holidays
                  .filter((h) => h.type === 'public_holiday')
                  .sort((a, b) => a.startDate.localeCompare(b.startDate))
                  .map((hol) => (
                    <div key={hol.id} className="py-2.5 flex items-start justify-between gap-3 group">
                      <div>
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                          <span>{hol.title}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-semibold">
                            {hol.startDate}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {hol.description || 'National Public Holiday in South Africa'}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        {hol.id.startsWith('hol-custom') && (
                          <button
                            onClick={() => onDeleteHoliday(hol.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded"
                            title="Delete custom holiday"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Gauteng / Inland School Holidays 2026 */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Gauteng / Inland School Vacations (2026)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Department of Basic Education school terms and closures
                  </p>
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {holidays
                  .filter((h) => h.type === 'school_holiday')
                  .sort((a, b) => a.startDate.localeCompare(b.startDate))
                  .map((sch) => (
                    <div key={sch.id} className="py-3 flex items-start justify-between gap-3 group">
                      <div>
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                          <span>{sch.title}</span>
                        </div>
                        <div className="text-xs text-purple-700 font-mono font-semibold mt-0.5">
                          {sch.startDate} → {sch.endDate}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {sch.description || 'Inland province school holidays'}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        {sch.id.startsWith('hol-custom') && (
                          <button
                            onClick={() => onDeleteHoliday(sch.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded"
                            title="Delete custom holiday"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: DAY DETAIL MODAL */}
      {selectedDateForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-2xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                    {new Date(selectedDateForDetail + 'T00:00:00').toLocaleDateString('en-ZA', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Engen Florida-Glen Daily Crew Roster
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDateForDetail(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Holidays on this date */}
              {getHolidaysForDate(selectedDateForDetail).map((hol) => (
                <div
                  key={hol.id}
                  className={`p-3 rounded-xl border text-xs flex items-center gap-2.5 ${
                    hol.type === 'public_holiday'
                      ? 'bg-amber-50 border-amber-200 text-amber-900 font-semibold'
                      : 'bg-purple-50 border-purple-200 text-purple-900 font-semibold'
                  }`}
                >
                  <Palmtree className="w-4 h-4 shrink-0" />
                  <div>
                    <div>{hol.title}</div>
                    <div className="text-[11px] font-normal text-slate-600">
                      {hol.description || hol.jurisdiction}
                    </div>
                  </div>
                </div>
              ))}

              {/* Roster Entries for this day */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Rostered Staff ({getRosterForDate(selectedDateForDetail).length})
                  </h4>
                  <button
                    onClick={() => {
                      setSelectedDateForDetail(null);
                      handleOpenAssign(selectedDateForDetail);
                    }}
                    className="text-xs font-semibold text-blue-700 hover:underline flex items-center gap-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>+ Add Staff to Date</span>
                  </button>
                </div>

                {getRosterForDate(selectedDateForDetail).length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400 border border-dashed rounded-xl">
                    No staff rostered yet for this date.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {getRosterForDate(selectedDateForDetail).map((entry) => {
                      const staff = staffList.find((s) => s.id === entry.staffId);
                      const shift = shifts.find((s) => s.id === entry.shiftId);

                      return (
                        <div
                          key={entry.id}
                          className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between hover:border-slate-300 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {staff?.avatarUrl ? (
                              <img
                                src={staff.avatarUrl}
                                alt={staff.name}
                                referrerPolicy="no-referrer"
                                className="w-8 h-8 rounded-full object-cover shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-slate-100 font-bold text-xs text-slate-700 flex items-center justify-center shrink-0">
                                {staff?.name.slice(0, 1)}
                              </div>
                            )}
                            <div>
                              <div className="text-xs font-bold text-slate-900">
                                {staff?.name}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {staff?.role} · Bio #{staff?.biometricId}
                              </div>
                              {staff && (
                                <div className="text-[11px] font-mono text-emerald-700 font-semibold flex items-center gap-1.5 mt-0.5">
                                  <span>R {staff.hourlyRate.toFixed(2)}/hr</span>
                                  {onUpdateHourlyRate && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newRateStr = prompt(
                                          `Administrator Binnie: Amend hourly rate (ZAR) for ${staff.name}:`,
                                          String(staff.hourlyRate)
                                        );
                                        if (newRateStr && !isNaN(parseFloat(newRateStr))) {
                                          onUpdateHourlyRate(staff.id, parseFloat(newRateStr));
                                        }
                                      }}
                                      className="text-blue-700 hover:text-blue-900 font-sans text-[10px] font-bold px-1.5 py-0.2 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
                                      title="Binnie: Amend hourly rate"
                                    >
                                      Amend Rate
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <span
                                className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded ${
                                  shift?.category === 'forecourt'
                                    ? 'bg-blue-100 text-blue-800'
                                    : shift?.category === 'cashier'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : shift?.category === 'bakery'
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-slate-100 text-slate-800'
                                }`}
                              >
                                {shift?.name}
                              </span>
                              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                {shift?.startTime} - {shift?.endTime} ({shift?.expectedHours}h)
                              </div>
                            </div>

                            <button
                              onClick={() => onDeleteRosterEntry(entry.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Remove from roster"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Leaves on this date */}
              {getLeavesForDate(selectedDateForDetail).length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-rose-700 mb-2">
                    Staff on Approved Leave
                  </h4>
                  <div className="space-y-1.5">
                    {getLeavesForDate(selectedDateForDetail).map((l) => {
                      const staff = staffList.find((s) => s.id === l.staffId);
                      return (
                        <div
                          key={l.id}
                          className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-center justify-between"
                        >
                          <span className="font-semibold">{staff?.name}</span>
                          <span className="capitalize">{l.type} Leave ({l.daysCount} days)</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedDateForDetail(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ASSIGN SHIFT MODAL */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-2xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                    Assign Staff Shift
                  </h3>
                  <p className="text-xs text-slate-500">
                    Engen Florida-Glen Garage Roster
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRoster} className="p-6 space-y-4">
              {/* Select Staff Member */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Staff Member
                </label>
                <select
                  value={assignStaffId}
                  onChange={(e) => {
                    setAssignStaffId(e.target.value);
                    const selected = staffList.find((s) => s.id === e.target.value);
                    if (selected) setAssignShiftId(selected.shiftId);
                  }}
                  className="w-full text-xs font-medium px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {staffList.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} — {st.department} ({st.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Hourly Wage & Amendment control for Administrator Binnie */}
              {(() => {
                const selectedStaff = staffList.find((s) => s.id === assignStaffId);
                if (!selectedStaff) return null;
                return (
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Hourly Wage (ZAR):</span>
                      <span className="font-mono font-bold text-slate-900">
                        R {selectedStaff.hourlyRate.toFixed(2)}/hr
                      </span>
                    </div>
                    {onUpdateHourlyRate && (
                      <button
                        type="button"
                        onClick={() => {
                          const newRateStr = prompt(
                            `Administrator Binnie: Amend hourly rate (ZAR) for ${selectedStaff.name}:`,
                            String(selectedStaff.hourlyRate)
                          );
                          if (newRateStr && !isNaN(parseFloat(newRateStr))) {
                            onUpdateHourlyRate(selectedStaff.id, parseFloat(newRateStr));
                          }
                        }}
                        className="px-2 py-0.5 text-[11px] font-semibold text-blue-700 hover:bg-blue-50 border border-blue-200 rounded transition-colors"
                      >
                        Amend Rate
                      </button>
                    )}
                  </div>
                );
              })()}

              {/* Select Shift */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Shift Period & Working Hours
                </label>
                <select
                  value={assignShiftId}
                  onChange={(e) => setAssignShiftId(e.target.value)}
                  className="w-full text-xs font-medium px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <optgroup label="Forecourt Shifts (24h)">
                    {shifts
                      .filter((s) => s.category === 'forecourt')
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} [{s.startTime} - {s.endTime}] ({s.expectedHours}h)
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="Cashiers Shifts">
                    {shifts
                      .filter((s) => s.category === 'cashier')
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} [{s.startTime} - {s.endTime}] ({s.expectedHours}h)
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="Bakery Staff">
                    {shifts
                      .filter((s) => s.category === 'bakery')
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} [{s.startTime} - {s.endTime}] ({s.expectedHours}h)
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="Workshop & Management">
                    {shifts
                      .filter((s) => s.category === 'general')
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} [{s.startTime} - {s.endTime}] ({s.expectedHours}h)
                        </option>
                      ))}
                  </optgroup>
                </select>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Date / Start Date
                  </label>
                  <input
                    type="date"
                    value={assignDefaultDate}
                    onChange={(e) => setAssignDefaultDate(e.target.value)}
                    className="w-full text-xs font-medium px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    End Date (Optional Range)
                  </label>
                  <input
                    type="date"
                    value={assignEndDate}
                    onChange={(e) => setAssignEndDate(e.target.value)}
                    min={assignDefaultDate}
                    placeholder="Single day if empty"
                    className="w-full text-xs font-medium px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Roster Notes / Station Instructions
                </label>
                <input
                  type="text"
                  value={assignNotes}
                  onChange={(e) => setAssignNotes(e.target.value)}
                  placeholder="e.g. Forecourt pump supervisor, peak fuel intake"
                  className="w-full text-xs font-medium px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors shadow-2xs"
                >
                  Confirm Shift Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD CUSTOM HOLIDAY / CLOSURE */}
      {isHolidayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-2xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                  <Palmtree className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                    Add Holiday / Station Closure
                  </h3>
                  <p className="text-xs text-slate-500">
                    Engen Florida-Glen Operations Calendar
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsHolidayModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveHoliday} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Holiday / Event Name
                </label>
                <input
                  type="text"
                  value={newHolTitle}
                  onChange={(e) => setNewHolTitle(e.target.value)}
                  placeholder="e.g. Engen Annual Forecourt Maintenance, Local Election"
                  className="w-full text-xs font-medium px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Category
                </label>
                <select
                  value={newHolType}
                  onChange={(e) =>
                    setNewHolType(e.target.value as 'public_holiday' | 'school_holiday')
                  }
                  className="w-full text-xs font-medium px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="public_holiday">Public Holiday (National)</option>
                  <option value="school_holiday">School Holiday / Vacation Term</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={newHolStartDate}
                    onChange={(e) => setNewHolStartDate(e.target.value)}
                    className="w-full text-xs font-medium px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={newHolEndDate}
                    onChange={(e) => setNewHolEndDate(e.target.value)}
                    min={newHolStartDate}
                    className="w-full text-xs font-medium px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Description / Operational Notes
                </label>
                <input
                  type="text"
                  value={newHolDesc}
                  onChange={(e) => setNewHolDesc(e.target.value)}
                  placeholder="e.g. Fuel forecourt operates on holiday rotation"
                  className="w-full text-xs font-medium px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsHolidayModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors shadow-2xs"
                >
                  Save Holiday
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: BINNIE HOURLY RATE AMENDMENT MANAGER */}
      {isRateManagerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-2xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-emerald-50/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 leading-tight">
                      Administrator Binnie · Hourly Wage Controller
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Currency: ZAR (R)
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Edit, change and amend hourly rates for all Forecourt, Cashier, Bakery and Workshop staff.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsRateManagerModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto space-y-3">
              <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                <span>Changes are applied immediately and sync live to Google Cloud SQL.</span>
                <span className="font-semibold text-slate-700">{staffList.length} staff members</span>
              </div>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                {staffList.map((st) => (
                  <div key={st.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors">
                    <div className="flex items-center gap-3">
                      {st.avatarUrl ? (
                        <img src={st.avatarUrl} alt={st.name} className="w-9 h-9 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                          {st.name.slice(0, 1)}
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <span>{st.name}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 font-semibold">
                            PIN #{st.biometricId}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500">
                          {st.role} · {st.department}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
                        <span className="text-xs font-bold text-slate-500 font-mono">R</span>
                        <input
                          type="number"
                          step="0.5"
                          min="1"
                          defaultValue={st.hourlyRate}
                          id={`rate-input-${st.id}`}
                          className="w-20 px-2 py-1 text-xs font-mono font-bold bg-white border border-slate-300 rounded focus:border-blue-500 focus:outline-none text-slate-900"
                        />
                        <span className="text-xs text-slate-500 font-medium">/hr</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const inputEl = document.getElementById(`rate-input-${st.id}`) as HTMLInputElement;
                          if (inputEl) {
                            const val = parseFloat(inputEl.value);
                            if (!isNaN(val) && val > 0 && onUpdateHourlyRate) {
                              onUpdateHourlyRate(st.id, val);
                            }
                          }
                        }}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-2xs flex items-center gap-1"
                        title="Save amended rate"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Save</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setIsRateManagerModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
