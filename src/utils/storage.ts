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
import {
  INITIAL_STAFF,
  INITIAL_SHIFTS,
  INITIAL_PUNCHES,
  INITIAL_LEAVES,
  INITIAL_REPORT_SCHEDULES,
  INITIAL_GENERATED_REPORTS,
  INITIAL_ADMIN,
  SOUTH_AFRICAN_HOLIDAYS,
  INITIAL_ROSTER,
  INITIAL_NOTIFICATIONS,
  INITIAL_OPENWA_CONFIG,
} from '../data/initialData';

const STORAGE_KEYS = {
  ADMIN: 'engen_florida_glen_admin_v3',
  STAFF: 'engen_florida_glen_staff_v3',
  SHIFTS: 'engen_florida_glen_shifts_v3',
  PUNCHES: 'engen_florida_glen_punches_v3',
  LEAVES: 'engen_florida_glen_leaves_v3',
  SCHEDULES: 'engen_florida_glen_schedules_v3',
  REPORTS: 'engen_florida_glen_reports_v3',
  ROSTER: 'engen_florida_glen_roster_v3',
  HOLIDAYS: 'engen_florida_glen_holidays_v3',
  NOTIFICATIONS: 'engen_florida_glen_notifications_v3',
  OPENWA: 'engen_florida_glen_openwa_v3',
};

export function loadAdminProfile(): AdminProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ADMIN);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load admin profile', err);
  }
  saveAdminProfile(INITIAL_ADMIN);
  return INITIAL_ADMIN;
}

export function saveAdminProfile(data: AdminProfile): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ADMIN, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save admin profile', err);
  }
}

export function loadStaff(): StaffMember[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STAFF);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load staff from storage', err);
  }
  saveStaff(INITIAL_STAFF);
  return INITIAL_STAFF;
}

export function saveStaff(data: StaffMember[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save staff', err);
  }
}

export function loadShifts(): ShiftSchedule[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SHIFTS);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load shifts', err);
  }
  saveShifts(INITIAL_SHIFTS);
  return INITIAL_SHIFTS;
}

export function saveShifts(data: ShiftSchedule[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SHIFTS, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save shifts', err);
  }
}

export function loadPunches(): PunchRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PUNCHES);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load punches', err);
  }
  savePunches(INITIAL_PUNCHES);
  return INITIAL_PUNCHES;
}

export function savePunches(data: PunchRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PUNCHES, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save punches', err);
  }
}

export function loadLeaves(): LeaveRequest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LEAVES);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load leaves', err);
  }
  saveLeaves(INITIAL_LEAVES);
  return INITIAL_LEAVES;
}

export function saveLeaves(data: LeaveRequest[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LEAVES, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save leaves', err);
  }
}

export function loadReportSchedules(): AutomatedReportSchedule[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SCHEDULES);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load schedules', err);
  }
  saveReportSchedules(INITIAL_REPORT_SCHEDULES);
  return INITIAL_REPORT_SCHEDULES;
}

export function saveReportSchedules(data: AutomatedReportSchedule[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save schedules', err);
  }
}

export function loadGeneratedReports(): GeneratedReportSummary[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REPORTS);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load reports', err);
  }
  saveGeneratedReports(INITIAL_GENERATED_REPORTS);
  return INITIAL_GENERATED_REPORTS;
}

export function saveGeneratedReports(data: GeneratedReportSummary[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save reports', err);
  }
}

export function loadRoster(): RosterShiftEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ROSTER);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load roster', err);
  }
  saveRoster(INITIAL_ROSTER);
  return INITIAL_ROSTER;
}

export function saveRoster(data: RosterShiftEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ROSTER, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save roster', err);
  }
}

export function loadHolidays(): HolidayEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HOLIDAYS);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load holidays', err);
  }
  saveHolidays(SOUTH_AFRICAN_HOLIDAYS);
  return SOUTH_AFRICAN_HOLIDAYS;
}

export function saveHolidays(data: HolidayEvent[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.HOLIDAYS, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save holidays', err);
  }
}

export function loadNotifications(): NotificationItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load notifications', err);
  }
  saveNotifications(INITIAL_NOTIFICATIONS);
  return INITIAL_NOTIFICATIONS;
}

export function saveNotifications(data: NotificationItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save notifications', err);
  }
}

export function loadOpenWaConfig(): OpenWaConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.OPENWA);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load Open-WA config', err);
  }
  saveOpenWaConfig(INITIAL_OPENWA_CONFIG);
  return INITIAL_OPENWA_CONFIG;
}

export function saveOpenWaConfig(data: OpenWaConfig): void {
  try {
    localStorage.setItem(STORAGE_KEYS.OPENWA, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save Open-WA config', err);
  }
}

/**
 * Live Server Synchronization: persists current state to the active server database
 */
export async function syncToServerDatabase(payload: {
  adminProfile?: AdminProfile;
  staffList?: StaffMember[];
  punches?: PunchRecord[];
  leaves?: LeaveRequest[];
  roster?: RosterShiftEntry[];
  notifications?: NotificationItem[];
  openwaConfig?: OpenWaConfig;
}): Promise<boolean> {
  try {
    const res = await fetch('/api/db/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Loads the active state from the server database (if available)
 */
export async function fetchServerDatabase(): Promise<any | null> {
  try {
    const res = await fetch('/api/db/state');
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Offline or server starting
  }
  return null;
}

export function resetAllToDemoData(): void {
  saveStaff(INITIAL_STAFF);
  saveShifts(INITIAL_SHIFTS);
  savePunches(INITIAL_PUNCHES);
  saveLeaves(INITIAL_LEAVES);
  saveReportSchedules(INITIAL_REPORT_SCHEDULES);
  saveGeneratedReports(INITIAL_GENERATED_REPORTS);
  saveRoster(INITIAL_ROSTER);
  saveHolidays(SOUTH_AFRICAN_HOLIDAYS);
  saveNotifications(INITIAL_NOTIFICATIONS);
  saveOpenWaConfig(INITIAL_OPENWA_CONFIG);
}

