import {
  StaffMember,
  PunchRecord,
  ShiftSchedule,
  LeaveRequest,
  RosterShiftEntry,
  AdminProfile,
  DailyAttLogEntry,
  WeeklyAttLogEntry,
  MonthlyAttLogEntry,
  AccountantPayrollRecord,
} from '../types';

/**
 * Calculates daily, weekly, and monthly attendance and hours worked from biometric att.log punches.
 * Accurately accounts for:
 * - Exact biometric PIN, User Name, and Punch times from att.log
 * - Regular hours vs Overtime hours
 * - Late coming (minutes late vs shift start time)
 * - Absents (scheduled shifts with zero punches and no approved leave)
 * - Approved leaves (credited, not marked absent)
 * - Employee hourly rates (in South African Rands / ZAR)
 */
export function calculateAttLogAnalytics(
  punches: PunchRecord[],
  staffList: StaffMember[],
  shifts: ShiftSchedule[],
  leaves: LeaveRequest[],
  roster: RosterShiftEntry[]
): {
  daily: DailyAttLogEntry[];
  weekly: WeeklyAttLogEntry[];
  monthly: MonthlyAttLogEntry[];
  accountantSummary: AccountantPayrollRecord[];
} {
  const staffByPin = new Map<string, StaffMember>();
  staffList.forEach((s) => staffByPin.set(s.biometricId.trim(), s));

  const shiftsById = new Map<string, ShiftSchedule>();
  shifts.forEach((s) => shiftsById.set(s.id, s));

  // Determine all distinct dates in punches, plus recent roster dates
  const datesSet = new Set<string>();
  punches.forEach((p) => {
    if (p.timestamp) datesSet.add(p.timestamp.slice(0, 10));
  });

  // Also include roster dates from the last 30 days to detect absents
  const today = new Date();
  for (let i = 0; i < 31; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    datesSet.add(d.toISOString().slice(0, 10));
  }

  const sortedDates = Array.from(datesSet).sort().reverse();
  const dailyEntries: DailyAttLogEntry[] = [];

  // Calculate daily records for each staff member across dates
  staffList.forEach((staff) => {
    const pin = staff.biometricId.trim();
    const assignedShift = shiftsById.get(staff.shiftId) || shifts[0];

    sortedDates.forEach((dateStr) => {
      // Find all punches for this staff/PIN on this date
      const dayPunches = punches
        .filter((p) => (p.biometricId === pin || p.staffId === staff.id) && p.timestamp.startsWith(dateStr))
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      // Check if scheduled on this date
      const rosterEntry = roster.find((r) => r.staffId === staff.id && r.date === dateStr);
      const isScheduled = !!rosterEntry || isDefaultWorkday(staff, dateStr);
      const shiftForDay = rosterEntry ? shiftsById.get(rosterEntry.shiftId) || assignedShift : assignedShift;

      // Check if on approved leave
      const approvedLeave = leaves.find(
        (l) => l.staffId === staff.id && l.status === 'approved' && dateStr >= l.startDate && dateStr <= l.endDate
      );

      // Raw times list from att.log
      const rawTimes = dayPunches.map((p) => p.timestamp.slice(11, 19));
      const firstInPunch = dayPunches.find((p) => p.type === 'clock_in') || dayPunches[0];
      const lastOutPunch = dayPunches.filter((p) => p.type === 'clock_out').pop() || (dayPunches.length > 1 ? dayPunches[dayPunches.length - 1] : undefined);

      let hoursWorked = 0;
      let isLate = false;
      let lateMinutes = 0;
      let isAbsent = false;
      let onLeave = !!approvedLeave;

      if (dayPunches.length >= 2) {
        // Calculate elapsed time from first punch to last punch
        const startMs = new Date(dayPunches[0].timestamp).getTime();
        const endMs = new Date(dayPunches[dayPunches.length - 1].timestamp).getTime();
        const diffHours = (endMs - startMs) / (1000 * 60 * 60);

        // Deduct standard lunch break (30 mins if worked > 5 hours)
        const breakDeduction = diffHours > 5 ? 0.5 : 0;
        hoursWorked = Math.max(0, Math.round((diffHours - breakDeduction) * 100) / 100);
      } else if (dayPunches.length === 1) {
        // Half shift or active clock-in
        hoursWorked = 4.0;
      }

      // Late coming check
      if (firstInPunch && shiftForDay) {
        const punchTime = firstInPunch.timestamp.slice(11, 16); // "HH:MM"
        const [pHour, pMin] = punchTime.split(':').map((n) => parseInt(n, 10));
        const [sHour, sMin] = shiftForDay.startTime.split(':').map((n) => parseInt(n, 10));

        const punchMinutesFromMidnight = pHour * 60 + pMin;
        const shiftMinutesFromMidnight = sHour * 60 + sMin;
        const diff = punchMinutesFromMidnight - shiftMinutesFromMidnight;

        if (diff > (shiftForDay.graceMinutes || 15)) {
          isLate = true;
          lateMinutes = diff;
        }
      }

      // Absent check: scheduled, zero punches, and not on approved leave
      if (isScheduled && dayPunches.length === 0 && !onLeave) {
        // Only mark absent if date is today or in the past
        const todayStr = new Date().toISOString().slice(0, 10);
        if (dateStr <= todayStr) {
          isAbsent = true;
        }
      }

      // If neither punches, nor scheduled, skip empty days outside scope
      if (dayPunches.length === 0 && !isAbsent && !onLeave) {
        return;
      }

      const expectedHours = shiftForDay?.expectedHours || 8;
      const regularHours = Math.min(hoursWorked, expectedHours);
      const overtimeHours = Math.max(0, Math.round((hoursWorked - regularHours) * 100) / 100);
      const hourlyRate = staff.hourlyRate || 35;
      const dailyCost = Math.round((regularHours * hourlyRate + overtimeHours * hourlyRate * 1.5) * 100) / 100;

      dailyEntries.push({
        date: dateStr,
        pin,
        userName: staff.name,
        department: staff.department,
        rawTimes,
        firstIn: firstInPunch ? firstInPunch.timestamp.slice(11, 16) : undefined,
        lastOut: lastOutPunch ? lastOutPunch.timestamp.slice(11, 16) : undefined,
        totalPunches: dayPunches.length,
        scheduledShift: shiftForDay?.name || 'Standard Shift',
        expectedStartTime: shiftForDay?.startTime || '06:00',
        expectedHours,
        hoursWorked,
        regularHours,
        overtimeHours,
        isLate,
        lateMinutes,
        isAbsent,
        onLeave,
        leaveType: approvedLeave ? approvedLeave.type.toUpperCase() : undefined,
        hourlyRate,
        dailyCost,
      });
    });
  });

  // Calculate Weekly Breakdown
  const weeklyMap = new Map<string, WeeklyAttLogEntry>();

  dailyEntries.forEach((entry) => {
    const d = new Date(entry.date);
    const weekNumber = getWeekNumber(d);
    const weekKey = `${entry.pin}_${d.getFullYear()}_W${weekNumber}`;
    const weekRange = getWeekRangeString(d);

    if (!weeklyMap.has(weekKey)) {
      weeklyMap.set(weekKey, {
        weekNumber,
        weekRange,
        pin: entry.pin,
        userName: entry.userName,
        department: entry.department,
        daysWorked: 0,
        totalHoursWorked: 0,
        regularHours: 0,
        overtimeHours: 0,
        lateIncidents: 0,
        totalLateMinutes: 0,
        absentDays: 0,
        leaveDays: 0,
        hourlyRate: entry.hourlyRate,
        estimatedGrossPay: 0,
      });
    }

    const wk = weeklyMap.get(weekKey)!;
    if (entry.hoursWorked > 0) wk.daysWorked += 1;
    wk.totalHoursWorked = Math.round((wk.totalHoursWorked + entry.hoursWorked) * 100) / 100;
    wk.regularHours = Math.round((wk.regularHours + entry.regularHours) * 100) / 100;
    wk.overtimeHours = Math.round((wk.overtimeHours + entry.overtimeHours) * 100) / 100;
    if (entry.isLate) {
      wk.lateIncidents += 1;
      wk.totalLateMinutes += entry.lateMinutes;
    }
    if (entry.isAbsent) wk.absentDays += 1;
    if (entry.onLeave) wk.leaveDays += 1;
    wk.hourlyRate = entry.hourlyRate; // keep latest rate set by Binnie
    wk.estimatedGrossPay =
      Math.round((wk.regularHours * wk.hourlyRate + wk.overtimeHours * wk.hourlyRate * 1.5) * 100) / 100;
  });

  const weeklyEntries = Array.from(weeklyMap.values()).sort((a, b) => b.weekNumber - a.weekNumber);

  // Calculate Monthly Breakdown
  const monthlyMap = new Map<string, MonthlyAttLogEntry>();

  dailyEntries.forEach((entry) => {
    const monthStr = entry.date.slice(0, 7); // YYYY-MM
    const monthKey = `${entry.pin}_${monthStr}`;

    if (!monthlyMap.has(monthKey)) {
      monthlyMap.set(monthKey, {
        month: monthStr,
        pin: entry.pin,
        userName: entry.userName,
        department: entry.department,
        daysWorked: 0,
        totalHoursWorked: 0,
        regularHours: 0,
        overtimeHours: 0,
        lateIncidents: 0,
        totalLateMinutes: 0,
        absentDays: 0,
        leaveDays: 0,
        hourlyRate: entry.hourlyRate,
        grossRegularPay: 0,
        grossOvertimePay: 0,
        totalGrossPay: 0,
        uifDeduction: 0,
        netPay: 0,
      });
    }

    const mo = monthlyMap.get(monthKey)!;
    if (entry.hoursWorked > 0) mo.daysWorked += 1;
    mo.totalHoursWorked = Math.round((mo.totalHoursWorked + entry.hoursWorked) * 100) / 100;
    mo.regularHours = Math.round((mo.regularHours + entry.regularHours) * 100) / 100;
    mo.overtimeHours = Math.round((mo.overtimeHours + entry.overtimeHours) * 100) / 100;
    if (entry.isLate) {
      mo.lateIncidents += 1;
      mo.totalLateMinutes += entry.lateMinutes;
    }
    if (entry.isAbsent) mo.absentDays += 1;
    if (entry.onLeave) mo.leaveDays += 1;
    mo.hourlyRate = entry.hourlyRate; // synced with Binnie's rate
    mo.grossRegularPay = Math.round(mo.regularHours * mo.hourlyRate * 100) / 100;
    mo.grossOvertimePay = Math.round(mo.overtimeHours * mo.hourlyRate * 1.5 * 100) / 100;
    mo.totalGrossPay = Math.round((mo.grossRegularPay + mo.grossOvertimePay) * 100) / 100;
    mo.uifDeduction = Math.round(mo.totalGrossPay * 0.01 * 100) / 100; // 1% UIF
    mo.netPay = Math.round((mo.totalGrossPay - mo.uifDeduction) * 100) / 100;
  });

  const monthlyEntries = Array.from(monthlyMap.values()).sort((a, b) => b.month.localeCompare(a.month));

  // Accountant Summary Records
  const accountantSummary: AccountantPayrollRecord[] = monthlyEntries.map((mo) => {
    const staff = staffByPin.get(mo.pin);
    return {
      pin: mo.pin,
      name: mo.userName,
      department: mo.department,
      role: staff?.role || 'Staff Member',
      hourlyRate: mo.hourlyRate,
      period: mo.month,
      totalHoursWorked: mo.totalHoursWorked,
      regularHours: mo.regularHours,
      overtimeHours: mo.overtimeHours,
      lateIncidents: mo.lateIncidents,
      lateMinutes: mo.totalLateMinutes,
      absentDays: mo.absentDays,
      paidLeaveDays: mo.leaveDays,
      regularEarnings: mo.grossRegularPay,
      overtimeEarnings: mo.grossOvertimePay,
      grossPay: mo.totalGrossPay,
      uifDeduction: mo.uifDeduction,
      netPay: mo.netPay,
    };
  });

  return {
    daily: dailyEntries,
    weekly: weeklyEntries,
    monthly: monthlyEntries,
    accountantSummary,
  };
}

function isDefaultWorkday(staff: StaffMember, dateStr: string): boolean {
  const d = new Date(dateStr);
  const day = d.getDay(); // 0 is Sunday
  if (staff.department === 'Administration & Management' || staff.department === 'Workshop & Service') {
    return day !== 0; // Mon-Sat
  }
  return true; // 24/7 forecourt & cashier
}

function getWeekNumber(d: Date): number {
  const target = new Date(d.valueOf());
  const dayNr = (d.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
}

function getWeekRangeString(d: Date): string {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const monday = new Date(date.setDate(diff));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const mStr = monday.toISOString().slice(5, 10);
  const sStr = sunday.toISOString().slice(5, 10);
  return `${mStr} to ${sStr}`;
}

export function formatZAR(amount: number): string {
  return `R ${amount.toLocaleString('en-ZA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Generates official CSV export specifically tailored for the station accountant.
 */
export function generateAccountantExportCsv(
  records: AccountantPayrollRecord[],
  adminProfile: AdminProfile,
  periodMonth: string
): string {
  const lines: string[] = [];

  // Official station header block
  lines.push('ENGEN FLORIDA-GLEN GARAGE · OPERATIONS & PAYROLL PACK (ACCOUNTANT COPY)');
  lines.push(`Station Location: Cnr Gordon Rd & Hendrik Buytendag St, Florida Glen, Roodepoort, 1709`);
  lines.push(`Station Administrator: ${adminProfile.name} | Cell: ${adminProfile.cellPhone} | Email: ${adminProfile.email}`);
  lines.push(`Pay Period: ${periodMonth} | Currency: South African Rands (ZAR / R) | Date Exported: ${new Date().toISOString().slice(0, 10)}`);
  lines.push(`Statutory Deductions: UIF (Unemployment Insurance Fund) 1% Employee Contribution Included`);
  lines.push('');

  // Table headers
  const headers = [
    'Biometric PIN',
    'Employee Full Name',
    'Department',
    'Role',
    'Hourly Rate (ZAR)',
    'Total Hours Worked',
    'Normal Hours',
    'Overtime Hours (1.5x)',
    'Late Incidents',
    'Total Late Minutes',
    'Absent Days (Unpaid)',
    'Approved Leave Days',
    'Gross Regular Pay (ZAR)',
    'Gross Overtime Pay (ZAR)',
    'Total Gross Earnings (ZAR)',
    'UIF 1% Deduction (ZAR)',
    'Net Payable Amount (ZAR)',
    'Accountant Sign-Off',
  ];
  lines.push(headers.join(','));

  let totalGross = 0;
  let totalUif = 0;
  let totalNet = 0;
  let totalRegularHours = 0;
  let totalOvertimeHours = 0;

  records.forEach((r) => {
    totalGross += r.grossPay;
    totalUif += r.uifDeduction;
    totalNet += r.netPay;
    totalRegularHours += r.regularHours;
    totalOvertimeHours += r.overtimeHours;

    const row = [
      r.pin,
      `"${r.name}"`,
      `"${r.department}"`,
      `"${r.role}"`,
      formatZAR(r.hourlyRate),
      r.totalHoursWorked.toFixed(2),
      r.regularHours.toFixed(2),
      r.overtimeHours.toFixed(2),
      r.lateIncidents,
      r.lateMinutes,
      r.absentDays,
      r.paidLeaveDays,
      formatZAR(r.regularEarnings),
      formatZAR(r.overtimeEarnings),
      formatZAR(r.grossPay),
      formatZAR(r.uifDeduction),
      formatZAR(r.netPay),
      '"APPROVED BY BINNIE"',
    ];
    lines.push(row.join(','));
  });

  // Summary row
  lines.push('');
  lines.push(
    [
      '"TOTALS"',
      `"${records.length} Staff Members"`,
      '""',
      '""',
      '""',
      (totalRegularHours + totalOvertimeHours).toFixed(2),
      totalRegularHours.toFixed(2),
      totalOvertimeHours.toFixed(2),
      '""',
      '""',
      '""',
      '""',
      '""',
      '""',
      formatZAR(totalGross),
      formatZAR(totalUif),
      formatZAR(totalNet),
      '"VERIFIED FOR PAYROLL"',
    ].join(',')
  );

  return '\uFEFF' + lines.join('\n');
}

/**
 * Generates Daily Biometric Scanner att.log Times Breakdown CSV
 */
export function generateAttLogDailyCsv(records: DailyAttLogEntry[]): string {
  const headers = [
    'Date',
    'Biometric PIN',
    'Employee Name',
    'Department',
    'Scheduled Shift',
    'Expected Start',
    'First Clock-In',
    'Last Clock-Out',
    'Punches in att.log',
    'Raw Punches',
    'Actual Hours Worked',
    'Regular Hours',
    'Overtime Hours',
    'Late Arrival Flag',
    'Minutes Late',
    'Absent Flag',
    'On Leave Flag',
    'Leave Type',
    'Hourly Rate (ZAR)',
    'Daily Cost (ZAR)',
  ];

  const rows = records.map((r) => [
    r.date,
    r.pin,
    `"${r.userName}"`,
    `"${r.department}"`,
    `"${r.scheduledShift}"`,
    r.expectedStartTime,
    r.firstIn || '--',
    r.lastOut || '--',
    r.totalPunches,
    `"${r.rawTimes.join(' | ')}"`,
    r.hoursWorked.toFixed(2),
    r.regularHours.toFixed(2),
    r.overtimeHours.toFixed(2),
    r.isLate ? 'YES' : 'NO',
    r.lateMinutes,
    r.isAbsent ? 'YES (UNPAID)' : 'NO',
    r.onLeave ? 'YES (APPROVED)' : 'NO',
    r.leaveType || '--',
    formatZAR(r.hourlyRate),
    formatZAR(r.dailyCost),
  ]);

  return '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

/**
 * Generates Weekly Biometric Scanner att.log Times Breakdown CSV
 */
export function generateAttLogWeeklyCsv(records: WeeklyAttLogEntry[]): string {
  const headers = [
    'Week #',
    'Week Dates (Mon-Sun)',
    'Biometric PIN',
    'Employee Name',
    'Department',
    'Days Worked',
    'Total Hours Worked',
    'Normal Regular Hours',
    'Overtime Hours',
    'Late Incidents',
    'Total Late Minutes',
    'Absent Days',
    'Approved Leave Days',
    'Hourly Rate (ZAR)',
    'Estimated Gross Pay (ZAR)',
  ];

  const rows = records.map((r) => [
    `Week ${r.weekNumber}`,
    `"${r.weekRange}"`,
    r.pin,
    `"${r.userName}"`,
    `"${r.department}"`,
    r.daysWorked,
    r.totalHoursWorked.toFixed(2),
    r.regularHours.toFixed(2),
    r.overtimeHours.toFixed(2),
    r.lateIncidents,
    r.totalLateMinutes,
    r.absentDays,
    r.leaveDays,
    formatZAR(r.hourlyRate),
    formatZAR(r.estimatedGrossPay),
  ]);

  return '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

/**
 * Generates Monthly Biometric Scanner att.log Times Breakdown CSV
 */
export function generateAttLogMonthlyCsv(records: MonthlyAttLogEntry[]): string {
  const headers = [
    'Month',
    'Biometric PIN',
    'Employee Name',
    'Department',
    'Days Worked',
    'Total Monthly Hours Worked',
    'Regular Hours',
    'Overtime Hours',
    'Late Occurrences',
    'Late Minutes',
    'Absent Days',
    'Approved Leave Days',
    'Hourly Rate (ZAR)',
    'Regular Earnings (ZAR)',
    'Overtime Earnings (ZAR)',
    'Gross Labor Pay (ZAR)',
    'UIF 1% Contribution (ZAR)',
    'Net Pay (ZAR)',
  ];

  const rows = records.map((r) => [
    r.month,
    r.pin,
    `"${r.userName}"`,
    `"${r.department}"`,
    r.daysWorked,
    r.totalHoursWorked.toFixed(2),
    r.regularHours.toFixed(2),
    r.overtimeHours.toFixed(2),
    r.lateIncidents,
    r.totalLateMinutes,
    r.absentDays,
    r.leaveDays,
    formatZAR(r.hourlyRate),
    formatZAR(r.grossRegularPay),
    formatZAR(r.grossOvertimePay),
    formatZAR(r.totalGrossPay),
    formatZAR(r.uifDeduction),
    formatZAR(r.netPay),
  ]);

  return '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export function triggerCsvDownload(csvContent: string, fileName: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
