import {
  StaffMember,
  ShiftSchedule,
  PunchRecord,
  LeaveRequest,
  AutomatedReportSchedule,
  GeneratedReportSummary,
  AdminProfile,
  HolidayEvent,
  RosterShiftEntry,
  NotificationItem,
  OpenWaConfig,
} from '../types';

export const INITIAL_ADMIN: AdminProfile = {
  name: 'Binnie',
  cellPhone: '+27 010 7489',
  email: 'valerie.ajtransportcater@gmail.com',
  role: 'Station Administrator & General Manager',
  password: 'admin',
  isLoggedIn: true,
};

export const INITIAL_OPENWA_CONFIG: OpenWaConfig = {
  gatewayUrl: 'http://localhost:2785',
  apiKey: '',
  sessionStatus: 'connected',
  defaultRecipientPhone: '+27 010 7489',
  adminEmail: 'valerie.ajtransportcater@gmail.com',
  lastPing: '2026-10-08T08:00:00Z',
  autoDispatchWhatsapp: true,
  autoDispatchEmail: true,
  autoDispatchSms: true,
};

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    channel: 'whatsapp',
    recipient: '+27 010 7489',
    recipientName: 'Binnie',
    title: 'Open-WA WhatsApp Gateway Connected',
    message: 'Open-WA API is active and synchronized for Engen Florida-Glen Garage alerts.',
    timestamp: '2026-10-08T06:00:00Z',
    status: 'delivered',
    type: 'system',
    isRead: false,
  },
  {
    id: 'notif-2',
    channel: 'email',
    recipient: 'valerie.ajtransportcater@gmail.com',
    recipientName: 'Binnie',
    title: 'Pending Leave Request: Amara Chen',
    message: 'Amara Chen requested 2 days casual leave for 2026-10-15 to 2026-10-16. Awaiting approval from Binnie.',
    timestamp: '2026-10-08T07:15:00Z',
    status: 'delivered',
    type: 'leave_request',
    isRead: false,
  },
  {
    id: 'notif-3',
    channel: 'sms',
    recipient: '+27 010 7489',
    recipientName: 'Binnie',
    title: 'Late Clock-in Detected',
    message: 'Amara Chen clocked in at 06:12 (12 mins late) on Model Q24PC biometric device.',
    timestamp: '2026-10-08T06:12:00Z',
    status: 'delivered',
    type: 'late_coming',
    isRead: true,
  },
  {
    id: 'notif-4',
    channel: 'in_app',
    recipient: 'Binnie',
    recipientName: 'Administrator Binnie',
    title: 'Biometric att.log Ready',
    message: 'att.log attendance records ready for daily/weekly/monthly hours calculation and accountant export.',
    timestamp: '2026-10-08T08:00:00Z',
    status: 'delivered',
    type: 'attlog_upload',
    isRead: false,
  },
];

export const INITIAL_SHIFTS: ShiftSchedule[] = [
  // Forecourt Shift Periods
  {
    id: 'shift-fc-m12',
    name: 'Forecourt Morning Shift (06:00 - 18:00)',
    category: 'forecourt',
    startTime: '06:00',
    endTime: '18:00',
    expectedHours: 12,
    graceMinutes: 15,
    badgeColor: 'border-blue-500 bg-blue-50 text-blue-700',
  },
  {
    id: 'shift-fc-m8',
    name: 'Forecourt Morning Shift (06:00 - 14:00)',
    category: 'forecourt',
    startTime: '06:00',
    endTime: '14:00',
    expectedHours: 8,
    graceMinutes: 10,
    badgeColor: 'border-sky-500 bg-sky-50 text-sky-700',
  },
  {
    id: 'shift-fc-a6a',
    name: 'Forecourt Afternoon Shift (14:00 - 20:00)',
    category: 'forecourt',
    startTime: '14:00',
    endTime: '20:00',
    expectedHours: 6,
    graceMinutes: 15,
    badgeColor: 'border-amber-500 bg-amber-50 text-amber-700',
  },
  {
    id: 'shift-fc-a6b',
    name: 'Forecourt Afternoon Shift (15:00 - 21:00)',
    category: 'forecourt',
    startTime: '15:00',
    endTime: '21:00',
    expectedHours: 6,
    graceMinutes: 15,
    badgeColor: 'border-orange-500 bg-orange-50 text-orange-700',
  },
  {
    id: 'shift-fc-n12',
    name: 'Forecourt Night Shift (18:00 - 06:00)',
    category: 'forecourt',
    startTime: '18:00',
    endTime: '06:00',
    expectedHours: 12,
    graceMinutes: 15,
    badgeColor: 'border-indigo-600 bg-indigo-50 text-indigo-700',
  },

  // Cashiers Shifts
  {
    id: 'shift-csh-d12',
    name: 'Cashiers Day Shift (06:00 - 18:00)',
    category: 'cashier',
    startTime: '06:00',
    endTime: '18:00',
    expectedHours: 12,
    graceMinutes: 15,
    badgeColor: 'border-emerald-600 bg-emerald-50 text-emerald-700',
  },
  {
    id: 'shift-csh-n12',
    name: 'Cashiers Night Shift (18:00 - 06:00)',
    category: 'cashier',
    startTime: '18:00',
    endTime: '06:00',
    expectedHours: 12,
    graceMinutes: 15,
    badgeColor: 'border-purple-600 bg-purple-50 text-purple-700',
  },

  // Bakery Staff Shift
  {
    id: 'shift-bak-d9',
    name: 'Bakery Staff Day Shift (06:00 - 15:00)',
    category: 'bakery',
    startTime: '06:00',
    endTime: '15:00',
    expectedHours: 9,
    graceMinutes: 10,
    badgeColor: 'border-rose-500 bg-rose-50 text-rose-700',
  },

  // General Workshop & Admin Shifts
  {
    id: 'shift-ws-d8',
    name: 'Workshop Service (08:00 - 17:00)',
    category: 'general',
    startTime: '08:00',
    endTime: '17:00',
    expectedHours: 8,
    graceMinutes: 15,
    badgeColor: 'border-slate-500 bg-slate-50 text-slate-700',
  },
  {
    id: 'shift-adm-d8',
    name: 'Station Admin (08:00 - 17:00)',
    category: 'general',
    startTime: '08:00',
    endTime: '17:00',
    expectedHours: 8,
    graceMinutes: 15,
    badgeColor: 'border-teal-500 bg-teal-50 text-teal-700',
  },
];

export const SOUTH_AFRICAN_HOLIDAYS: HolidayEvent[] = [
  // 2026 South Africa National Public Holidays
  {
    id: 'hol-1',
    title: "New Year's Day",
    startDate: '2026-01-01',
    endDate: '2026-01-01',
    type: 'public_holiday',
    jurisdiction: 'South Africa National',
    description: 'National Public Holiday',
  },
  {
    id: 'hol-2',
    title: 'Human Rights Day',
    startDate: '2026-03-21',
    endDate: '2026-03-21',
    type: 'public_holiday',
    jurisdiction: 'South Africa National',
    description: 'Sharpeville Commemoration',
  },
  {
    id: 'hol-3',
    title: 'Good Friday',
    startDate: '2026-04-03',
    endDate: '2026-04-03',
    type: 'public_holiday',
    jurisdiction: 'South Africa National',
    description: 'Easter Holy Day',
  },
  {
    id: 'hol-4',
    title: 'Family Day (Easter Monday)',
    startDate: '2026-04-06',
    endDate: '2026-04-06',
    type: 'public_holiday',
    jurisdiction: 'South Africa National',
    description: 'Easter Monday Holiday',
  },
  {
    id: 'hol-5',
    title: 'Freedom Day',
    startDate: '2026-04-27',
    endDate: '2026-04-27',
    type: 'public_holiday',
    jurisdiction: 'South Africa National',
    description: 'Commemoration of 1994 democratic election',
  },
  {
    id: 'hol-6',
    title: "Workers' Day",
    startDate: '2026-05-01',
    endDate: '2026-05-01',
    type: 'public_holiday',
    jurisdiction: 'South Africa National',
    description: 'Labour Day celebration',
  },
  {
    id: 'hol-7',
    title: 'Youth Day',
    startDate: '2026-06-16',
    endDate: '2026-06-16',
    type: 'public_holiday',
    jurisdiction: 'South Africa National',
    description: 'Commemorating June 16 1976 Soweto Uprising',
  },
  {
    id: 'hol-8',
    title: "National Women's Day (Observed)",
    startDate: '2026-08-10',
    endDate: '2026-08-10',
    type: 'public_holiday',
    jurisdiction: 'South Africa National',
    description: 'Public holiday observing Women’s Day',
  },
  {
    id: 'hol-9',
    title: 'Heritage Day (Braai Day)',
    startDate: '2026-09-24',
    endDate: '2026-09-24',
    type: 'public_holiday',
    jurisdiction: 'South Africa National',
    description: 'Celebrating cultural heritage and traditions',
  },
  {
    id: 'hol-10',
    title: 'Day of Reconciliation',
    startDate: '2026-12-16',
    endDate: '2026-12-16',
    type: 'public_holiday',
    jurisdiction: 'South Africa National',
    description: 'Promoting national unity and reconciliation',
  },
  {
    id: 'hol-11',
    title: 'Christmas Day',
    startDate: '2026-12-25',
    endDate: '2026-12-25',
    type: 'public_holiday',
    jurisdiction: 'South Africa National',
    description: 'Christmas Public Holiday',
  },
  {
    id: 'hol-12',
    title: 'Day of Goodwill',
    startDate: '2026-12-26',
    endDate: '2026-12-26',
    type: 'public_holiday',
    jurisdiction: 'South Africa National',
    description: 'Boxing Day holiday',
  },

  // 2026 School Holidays (Gauteng / Inland Schools)
  {
    id: 'sch-1',
    title: 'Term 1 Autumn School Holidays',
    startDate: '2026-03-28',
    endDate: '2026-04-07',
    type: 'school_holiday',
    jurisdiction: 'Gauteng / Inland Schools',
    description: 'Department of Basic Education Inland Term 1 Break',
  },
  {
    id: 'sch-2',
    title: 'Term 2 Winter School Holidays',
    startDate: '2026-06-27',
    endDate: '2026-07-20',
    type: 'school_holiday',
    jurisdiction: 'Gauteng / Inland Schools',
    description: 'Mid-Year Winter School Vacation',
  },
  {
    id: 'sch-3',
    title: 'Term 3 Spring School Holidays',
    startDate: '2026-09-26',
    endDate: '2026-10-05',
    type: 'school_holiday',
    jurisdiction: 'Gauteng / Inland Schools',
    description: 'Spring Break School Vacation',
  },
  {
    id: 'sch-4',
    title: 'Term 4 Summer Year-End Holidays',
    startDate: '2026-12-10',
    endDate: '2027-01-13',
    type: 'school_holiday',
    jurisdiction: 'Gauteng / Inland Schools',
    description: 'Summer Festive School Break',
  },
];

export const INITIAL_STAFF: StaffMember[] = [
  {
    id: 'staff-1001',
    name: 'Marcus Vance',
    email: 'marcus.v@engenfloridaglen.co.za',
    phone: '+27 82 555 4321',
    biometricId: '1001',
    department: 'Fuel Forecourt',
    role: 'Forecourt Shift Supervisor',
    shiftId: 'shift-fc-m12',
    hourlyRate: 38.5,
    status: 'active',
    avatarUrl: '/src/assets/images/avatar_technician_marcus_1791459896243.jpg',
    hireDate: '2023-01-15',
    leaveBalances: {
      annual: 14,
      sick: 7,
      casual: 3,
    },
  },
  {
    id: 'staff-1002',
    name: 'Amara Chen',
    email: 'amara.c@engenfloridaglen.co.za',
    phone: '+27 84 123 4567',
    biometricId: '1002',
    department: 'Cashiers & QuickShop',
    role: 'Lead QuickShop Cashier & Bakery',
    shiftId: 'shift-csh-d12',
    hourlyRate: 34.0,
    status: 'active',
    avatarUrl: '/src/assets/images/avatar_specialist_elena_1791459907203.jpg',
    hireDate: '2024-02-01',
    leaveBalances: {
      annual: 15,
      sick: 9,
      casual: 4,
    },
  },
];

// Current seed punches representing recent biometric activity from ERS Bio-Matrix Q24PC for the 2 demo staff
export const INITIAL_PUNCHES: PunchRecord[] = [
  // Today's punches (2026-10-08)
  {
    id: 'punch-001',
    staffId: 'staff-1001',
    biometricId: '1001',
    timestamp: '2026-10-08T05:58:14',
    type: 'clock_in',
    source: 'biometric_usb',
    deviceName: 'ERS Bio-Matrix Q24PC',
    verifiedMethod: 'fingerprint',
    isLate: false,
  },
  {
    id: 'punch-002',
    staffId: 'staff-1002',
    biometricId: '1002',
    timestamp: '2026-10-08T05:54:20',
    type: 'clock_in',
    source: 'biometric_usb',
    deviceName: 'ERS Bio-Matrix Q24PC',
    verifiedMethod: 'fingerprint',
    isLate: false,
  },
  {
    id: 'punch-003',
    staffId: 'staff-1002',
    biometricId: '1002',
    timestamp: '2026-10-08T12:00:15',
    type: 'break_start',
    source: 'biometric_usb',
    deviceName: 'ERS Bio-Matrix Q24PC',
    verifiedMethod: 'fingerprint',
  },
  {
    id: 'punch-004',
    staffId: 'staff-1002',
    biometricId: '1002',
    timestamp: '2026-10-08T12:35:10',
    type: 'break_end',
    source: 'biometric_usb',
    deviceName: 'ERS Bio-Matrix Q24PC',
    verifiedMethod: 'fingerprint',
  },

  // Yesterday's punches (2026-10-07)
  {
    id: 'punch-101',
    staffId: 'staff-1001',
    biometricId: '1001',
    timestamp: '2026-10-07T05:57:00',
    type: 'clock_in',
    source: 'biometric_usb',
    deviceName: 'ERS Bio-Matrix Q24PC',
    verifiedMethod: 'fingerprint',
  },
  {
    id: 'punch-102',
    staffId: 'staff-1001',
    biometricId: '1001',
    timestamp: '2026-10-07T18:12:30',
    type: 'clock_out',
    source: 'biometric_usb',
    deviceName: 'ERS Bio-Matrix Q24PC',
    verifiedMethod: 'fingerprint',
    isOvertime: true,
  },
  {
    id: 'punch-103',
    staffId: 'staff-1002',
    biometricId: '1002',
    timestamp: '2026-10-07T05:55:12',
    type: 'clock_in',
    source: 'biometric_usb',
    deviceName: 'ERS Bio-Matrix Q24PC',
    verifiedMethod: 'fingerprint',
  },
  {
    id: 'punch-104',
    staffId: 'staff-1002',
    biometricId: '1002',
    timestamp: '2026-10-07T18:02:00',
    type: 'clock_out',
    source: 'biometric_usb',
    deviceName: 'ERS Bio-Matrix Q24PC',
    verifiedMethod: 'fingerprint',
  },

  // Day before (2026-10-06)
  {
    id: 'punch-201',
    staffId: 'staff-1001',
    biometricId: '1001',
    timestamp: '2026-10-06T05:56:00',
    type: 'clock_in',
    source: 'biometric_usb',
    deviceName: 'ERS Bio-Matrix Q24PC',
    verifiedMethod: 'fingerprint',
  },
  {
    id: 'punch-202',
    staffId: 'staff-1001',
    biometricId: '1001',
    timestamp: '2026-10-06T18:00:00',
    type: 'clock_out',
    source: 'biometric_usb',
    deviceName: 'ERS Bio-Matrix Q24PC',
    verifiedMethod: 'fingerprint',
  },
  {
    id: 'punch-203',
    staffId: 'staff-1002',
    biometricId: '1002',
    timestamp: '2026-10-06T06:14:20',
    type: 'clock_in',
    source: 'biometric_usb',
    deviceName: 'ERS Bio-Matrix Q24PC',
    verifiedMethod: 'fingerprint',
    isLate: true,
    notes: 'Heavy traffic on Hendrik Potgieter Road',
  },
  {
    id: 'punch-204',
    staffId: 'staff-1002',
    biometricId: '1002',
    timestamp: '2026-10-06T18:05:00',
    type: 'clock_out',
    source: 'biometric_usb',
    deviceName: 'ERS Bio-Matrix Q24PC',
    verifiedMethod: 'fingerprint',
  },
];

export const INITIAL_LEAVES: LeaveRequest[] = [
  {
    id: 'leave-001',
    staffId: 'staff-1001',
    type: 'annual',
    startDate: '2026-10-22',
    endDate: '2026-10-23',
    daysCount: 2,
    reason: 'Family personal commitments and rest.',
    status: 'approved',
    appliedDate: '2026-10-02',
    reviewedBy: 'Bennie Mengoai (Station Admin)',
    reviewNotes: 'Approved. Shift cover arranged on forecourt.',
    reviewedAt: '2026-10-03',
  },
  {
    id: 'leave-002',
    staffId: 'staff-1002',
    type: 'casual',
    startDate: '2026-10-16',
    endDate: '2026-10-16',
    daysCount: 1,
    reason: 'Personal dental checkup and family errand.',
    status: 'pending',
    appliedDate: '2026-10-06',
  },
];

export const INITIAL_REPORT_SCHEDULES: AutomatedReportSchedule[] = [
  {
    id: 'sched-1',
    title: 'Weekly Comprehensive Timesheet & Overtime',
    frequency: 'weekly',
    reportType: 'timesheet_summary',
    recipientEmail: 'Valerie.ajtransportcater@gmail.com',
    executionTime: '08:00',
    isActive: true,
    lastGeneratedAt: '2026-10-05T08:00:00',
  },
  {
    id: 'sched-2',
    title: 'Daily Attendance & Late Punch Exceptions',
    frequency: 'daily',
    reportType: 'attendance_exceptions',
    recipientEmail: 'Valerie.ajtransportcater@gmail.com',
    executionTime: '18:00',
    isActive: true,
    lastGeneratedAt: '2026-10-07T18:00:00',
  },
  {
    id: 'sched-3',
    title: 'End of Month Payroll & Billable Labor Hours (ZAR)',
    frequency: 'monthly',
    reportType: 'payroll_breakdown',
    recipientEmail: 'Valerie.ajtransportcater@gmail.com',
    executionTime: '17:00',
    isActive: true,
    lastGeneratedAt: '2026-09-30T17:00:00',
  },
];

export const INITIAL_GENERATED_REPORTS: GeneratedReportSummary[] = [
  {
    id: 'rep-001',
    scheduleId: 'sched-1',
    title: 'Weekly Timesheet Audit (Sep 28 - Oct 04, 2026)',
    reportType: 'timesheet_summary',
    dateRange: {
      start: '2026-09-28',
      end: '2026-10-04',
    },
    generatedAt: '2026-10-05T08:00:00',
    totalEmployees: 2,
    totalHoursWorked: 144.0,
    totalOvertimeHours: 2.5,
    totalLateIncidents: 1,
    estimatedLaborCost: 5230.0,
    fileDownloadName: 'weekly_timesheet_audit_2026-W40.csv',
  },
  {
    id: 'rep-002',
    scheduleId: 'sched-2',
    title: 'Daily Exceptions Digest (Oct 07, 2026)',
    reportType: 'attendance_exceptions',
    dateRange: {
      start: '2026-10-07',
      end: '2026-10-07',
    },
    generatedAt: '2026-10-07T18:00:00',
    totalEmployees: 2,
    totalHoursWorked: 24.2,
    totalOvertimeHours: 0.2,
    totalLateIncidents: 0,
    estimatedLaborCost: 878.0,
    fileDownloadName: 'daily_exceptions_2026-10-07.csv',
  },
];

// Helper to generate seed roster entries for October 2026 for the 2 demo data users
export function generateSeedRoster(): RosterShiftEntry[] {
  const entries: RosterShiftEntry[] = [];
  const daysInMonth = 31;

  for (let d = 1; d <= daysInMonth; d++) {
    const dayStr = d < 10 ? `0${d}` : `${d}`;
    const date = `2026-10-${dayStr}`;
    const dateObj = new Date(2026, 9, d); // 2026-10-d
    const dayOfWeek = dateObj.getDay(); // 0 is Sunday, 6 is Saturday

    // 1. Marcus Vance (Forecourt Supervisor) - Forecourt Morning Shift (06:00 - 18:00)
    // On 4-days on, 1-day off rotation, except approved leave on Oct 22-23
    const isLeaveVance = d === 22 || d === 23;
    if (!isLeaveVance && d % 5 !== 0) {
      entries.push({
        id: `rst-${date}-1001`,
        staffId: 'staff-1001',
        date,
        shiftId: 'shift-fc-m12',
        notes: 'Forecourt Morning Shift Supervisor',
      });
    }

    // 2. Amara Chen (Cashiers & Bakery Lead) - Cashiers Day Shift (06:00 - 18:00)
    // Scheduled Monday through Saturday (Sunday off)
    if (dayOfWeek !== 0) {
      entries.push({
        id: `rst-${date}-1002`,
        staffId: 'staff-1002',
        date,
        shiftId: 'shift-csh-d12',
        notes: 'Lead QuickShop Cashier & Bakery Operations',
      });
    }
  }

  return entries;
}

export const INITIAL_ROSTER: RosterShiftEntry[] = generateSeedRoster();

