export type Department =
  | 'Fuel Forecourt'
  | 'Cashiers & QuickShop'
  | 'Bakery & Food'
  | 'Workshop & Service'
  | 'Car Wash & Valet'
  | 'Administration & Management';

export type ShiftType = 'standard' | 'early' | 'night' | 'flexible';

export interface ShiftSchedule {
  id: string;
  name: string;
  category: 'forecourt' | 'cashier' | 'bakery' | 'general';
  startTime: string; // e.g. "06:00"
  endTime: string;   // e.g. "18:00"
  expectedHours: number; // e.g. 12
  graceMinutes: number; // e.g. 15 mins
  badgeColor?: string;
}

export interface HolidayEvent {
  id: string;
  title: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  type: 'public_holiday' | 'school_holiday';
  jurisdiction: 'South Africa National' | 'Gauteng / Inland Schools';
  description?: string;
}

export interface RosterShiftEntry {
  id: string;
  staffId: string;
  date: string; // YYYY-MM-DD
  shiftId: string;
  notes?: string;
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  biometricId: string; // Fingerprint device Enroll Number / PIN e.g. "1001"
  department: Department;
  role: string;
  shiftId: string;
  hourlyRate: number; // in South African Rands (ZAR / R)
  status: 'active' | 'on_leave' | 'inactive';
  avatarUrl?: string;
  hireDate: string;
  leaveBalances: {
    annual: number;
    sick: number;
    casual: number;
  };
}

export interface AdminProfile {
  name: string;
  cellPhone: string;
  email: string;
  role: string;
  password?: string;
  isLoggedIn: boolean;
}

export type PunchType = 'clock_in' | 'clock_out' | 'break_start' | 'break_end';

export type PunchSource = 'biometric_usb' | 'kiosk_terminal' | 'web_portal' | 'manual_adjustment';

export interface PunchRecord {
  id: string;
  staffId: string;
  biometricId: string;
  timestamp: string; // ISO string e.g. 2026-10-08T08:58:00
  type: PunchType;
  source: PunchSource;
  deviceName?: string;
  verifiedMethod?: 'fingerprint' | 'pin' | 'card' | 'manual';
  notes?: string;
  isLate?: boolean;
  isOvertime?: boolean;
}

export type LeaveType = 'annual' | 'sick' | 'casual' | 'maternity_paternity' | 'bereavement' | 'unpaid';

export type LeaveStatus = 'pending' | 'approved' | 'declined' | 'rejected' | 'cancelled';

export interface LeaveRequest {
  id: string;
  staffId: string;
  type: LeaveType;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  daysCount: number;
  reason: string;
  status: LeaveStatus;
  appliedDate: string;
  reviewedBy?: string;
  reviewNotes?: string;
  reviewedAt?: string;
}

export type NotificationChannel = 'whatsapp' | 'email' | 'sms' | 'in_app';

export interface NotificationItem {
  id: string;
  channel: NotificationChannel;
  recipient: string; // Phone number or email
  recipientName: string;
  title: string;
  message: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'pending' | 'failed';
  openwaMessageId?: string;
  type:
    | 'leave_request'
    | 'leave_approved'
    | 'leave_declined'
    | 'leave_pended'
    | 'late_coming'
    | 'absent_alert'
    | 'attlog_upload'
    | 'hourly_rate_change'
    | 'accountant_export'
    | 'system';
  isRead: boolean;
  metadata?: Record<string, any>;
}

export interface OpenWaConfig {
  gatewayUrl: string; // e.g. "http://localhost:2785"
  apiKey?: string;
  sessionStatus: 'connected' | 'disconnected' | 'pairing' | 'standby';
  defaultRecipientPhone: string; // "+27 010 7489"
  adminEmail: string; // "valerie.ajtransportcater@gmail.com"
  lastPing?: string;
  autoDispatchWhatsapp: boolean;
  autoDispatchEmail: boolean;
  autoDispatchSms: boolean;
}

export interface DailyAttLogEntry {
  date: string;
  pin: string;
  userName: string;
  department: string;
  rawTimes: string[];
  firstIn?: string;
  lastOut?: string;
  totalPunches: number;
  scheduledShift: string;
  expectedStartTime: string;
  expectedHours: number;
  hoursWorked: number;
  regularHours: number;
  overtimeHours: number;
  isLate: boolean;
  lateMinutes: number;
  isAbsent: boolean;
  onLeave: boolean;
  leaveType?: string;
  hourlyRate: number;
  dailyCost: number;
}

export interface WeeklyAttLogEntry {
  weekNumber: number;
  weekRange: string;
  pin: string;
  userName: string;
  department: string;
  daysWorked: number;
  totalHoursWorked: number;
  regularHours: number;
  overtimeHours: number;
  lateIncidents: number;
  totalLateMinutes: number;
  absentDays: number;
  leaveDays: number;
  hourlyRate: number;
  estimatedGrossPay: number;
}

export interface MonthlyAttLogEntry {
  month: string; // YYYY-MM
  pin: string;
  userName: string;
  department: string;
  daysWorked: number;
  totalHoursWorked: number;
  regularHours: number;
  overtimeHours: number;
  lateIncidents: number;
  totalLateMinutes: number;
  absentDays: number;
  leaveDays: number;
  hourlyRate: number;
  grossRegularPay: number;
  grossOvertimePay: number;
  totalGrossPay: number;
  uifDeduction: number; // 1%
  netPay: number;
}

export interface AccountantPayrollRecord {
  pin: string;
  name: string;
  department: string;
  role: string;
  hourlyRate: number;
  period: string;
  totalHoursWorked: number;
  regularHours: number;
  overtimeHours: number;
  lateIncidents: number;
  lateMinutes: number;
  absentDays: number;
  paidLeaveDays: number;
  regularEarnings: number;
  overtimeEarnings: number;
  grossPay: number;
  uifDeduction: number;
  netPay: number;
}

export interface ParsedUsbPunch {
  rawLine: string;
  biometricId: string;
  timestamp: string;
  type: PunchType;
  verifyMethod: 'fingerprint' | 'pin' | 'card' | 'manual';
  matchedStaff?: StaffMember;
  status: 'valid' | 'duplicate' | 'unmatched_id';
  notes?: string;
}

export interface AutomatedReportSchedule {
  id: string;
  title: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  reportType: 'timesheet_summary' | 'attendance_exceptions' | 'payroll_breakdown' | 'leave_utilization';
  recipientEmail: string;
  executionTime: string; // "18:00"
  isActive: boolean;
  lastGeneratedAt?: string;
}

export interface GeneratedReportSummary {
  id: string;
  scheduleId?: string;
  title: string;
  reportType: 'timesheet_summary' | 'attendance_exceptions' | 'payroll_breakdown' | 'leave_utilization';
  dateRange: {
    start: string;
    end: string;
  };
  generatedAt: string;
  totalEmployees: number;
  totalHoursWorked: number;
  totalOvertimeHours: number;
  totalLateIncidents: number;
  estimatedLaborCost: number;
  fileDownloadName: string;
}
