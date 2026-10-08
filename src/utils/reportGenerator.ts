import {
  StaffMember,
  PunchRecord,
  ShiftSchedule,
  LeaveRequest,
  GeneratedReportSummary,
  AutomatedReportSchedule,
} from '../types';

export interface EmployeeDayRecord {
  date: string;
  staff: StaffMember;
  clockInTime?: string;
  clockOutTime?: string;
  breakDurationMinutes: number;
  regularHours: number;
  overtimeHours: number;
  totalHours: number;
  isLate: boolean;
  lateMinutes: number;
  isEarlyDeparture: boolean;
  isAbsent: boolean;
  onLeave: boolean;
  estimatedLaborCost: number;
}

export function calculateDailyRecords(
  staffList: StaffMember[],
  punches: PunchRecord[],
  shifts: ShiftSchedule[],
  leaves: LeaveRequest[],
  startDate: string,
  endDate: string
): EmployeeDayRecord[] {
  const records: EmployeeDayRecord[] = [];
  const shiftMap = new Map<string, ShiftSchedule>();
  shifts.forEach((s) => shiftMap.set(s.id, s));

  // Generate date list between start and end
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dateList: string[] = [];

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dateList.push(d.toISOString().slice(0, 10));
  }

  for (const dateStr of dateList) {
    const isWeekend = [0, 6].includes(new Date(dateStr).getDay());

    for (const staff of staffList) {
      if (staff.status === 'inactive') continue;

      const staffShift = shiftMap.get(staff.shiftId) || shifts[0];

      // Check if on approved leave
      const activeLeave = leaves.find(
        (l) =>
          l.staffId === staff.id &&
          l.status === 'approved' &&
          dateStr >= l.startDate &&
          dateStr <= l.endDate
      );

      // Find punches for this staff on this day
      const dayPunches = punches
        .filter(
          (p) =>
            p.staffId === staff.id &&
            p.timestamp.startsWith(dateStr)
        )
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      const clockIn = dayPunches.find((p) => p.type === 'clock_in');
      const clockOut = dayPunches.filter((p) => p.type === 'clock_out').pop();

      // Calculate break duration
      let breakMinutes = 0;
      const breakStarts = dayPunches.filter((p) => p.type === 'break_start');
      const breakEnds = dayPunches.filter((p) => p.type === 'break_end');

      for (let i = 0; i < Math.min(breakStarts.length, breakEnds.length); i++) {
        const startMs = new Date(breakStarts[i].timestamp).getTime();
        const endMs = new Date(breakEnds[i].timestamp).getTime();
        if (endMs > startMs) {
          breakMinutes += Math.round((endMs - startMs) / 60000);
        }
      }

      let totalHours = 0;
      let regularHours = 0;
      let overtimeHours = 0;
      let isLate = false;
      let lateMinutes = 0;
      let isEarlyDeparture = false;

      if (clockIn && clockOut) {
        const inMs = new Date(clockIn.timestamp).getTime();
        const outMs = new Date(clockOut.timestamp).getTime();
        if (outMs > inMs) {
          const rawDurationMinutes = (outMs - inMs) / 60000 - breakMinutes;
          totalHours = Math.max(0, parseFloat((rawDurationMinutes / 60).toFixed(2)));
          if (totalHours > 8) {
            regularHours = 8;
            overtimeHours = parseFloat((totalHours - 8).toFixed(2));
          } else {
            regularHours = totalHours;
            overtimeHours = 0;
          }
        }
      } else if (clockIn && !clockOut) {
        // Still currently clocked in today
        const inMs = new Date(clockIn.timestamp).getTime();
        const nowMs = new Date().getTime();
        if (nowMs > inMs && dateStr === new Date().toISOString().slice(0, 10)) {
          const rawDurationMinutes = (nowMs - inMs) / 60000 - breakMinutes;
          totalHours = Math.max(0, parseFloat((rawDurationMinutes / 60).toFixed(2)));
          regularHours = Math.min(8, totalHours);
          overtimeHours = Math.max(0, parseFloat((totalHours - 8).toFixed(2)));
        }
      }

      // Check lateness
      if (clockIn && staffShift) {
        const [shiftH, shiftM] = staffShift.startTime.split(':').map(Number);
        const punchDate = new Date(clockIn.timestamp);
        const shiftStartDate = new Date(punchDate);
        shiftStartDate.setHours(shiftH, shiftM, 0, 0);

        const diffMinutes = Math.round((punchDate.getTime() - shiftStartDate.getTime()) / 60000);
        if (diffMinutes > staffShift.graceMinutes) {
          isLate = true;
          lateMinutes = diffMinutes;
        }
      }

      // Check early departure
      if (clockOut && staffShift) {
        const [endH, endM] = staffShift.endTime.split(':').map(Number);
        const punchOutDate = new Date(clockOut.timestamp);
        const shiftEndDate = new Date(punchOutDate);
        shiftEndDate.setHours(endH, endM, 0, 0);

        const departureDiff = Math.round((shiftEndDate.getTime() - punchOutDate.getTime()) / 60000);
        if (departureDiff > 15) {
          isEarlyDeparture = true;
        }
      }

      const isAbsent = !clockIn && !activeLeave && !isWeekend;
      const hourlyRate = staff.hourlyRate || 30;
      const cost = regularHours * hourlyRate + overtimeHours * (hourlyRate * 1.5);

      records.push({
        date: dateStr,
        staff,
        clockInTime: clockIn ? clockIn.timestamp.slice(11, 16) : undefined,
        clockOutTime: clockOut ? clockOut.timestamp.slice(11, 16) : undefined,
        breakDurationMinutes: breakMinutes,
        regularHours,
        overtimeHours,
        totalHours,
        isLate,
        lateMinutes,
        isEarlyDeparture,
        isAbsent,
        onLeave: !!activeLeave,
        estimatedLaborCost: parseFloat(cost.toFixed(2)),
      });
    }
  }

  return records;
}

export function formatZAR(amount: number): string {
  return `R ${amount.toLocaleString('en-ZA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function generateCsvTimesheet(records: EmployeeDayRecord[]): string {
  const headers = [
    'Date',
    'Staff Name',
    'Biometric ID',
    'Department',
    'Clock In',
    'Clock Out',
    'Break (Mins)',
    'Regular Hours',
    'Overtime Hours',
    'Total Hours',
    'Late Status',
    'Late (Mins)',
    'Status Note',
    'Hourly Rate (ZAR / R)',
    'Estimated Labor Cost (ZAR / R)',
  ];

  const rows = records.map((r) => [
    r.date,
    `"${r.staff.name}"`,
    r.staff.biometricId,
    `"${r.staff.department}"`,
    r.clockInTime || '--:--',
    r.clockOutTime || '--:--',
    r.breakDurationMinutes,
    r.regularHours.toFixed(2),
    r.overtimeHours.toFixed(2),
    r.totalHours.toFixed(2),
    r.isLate ? 'LATE' : 'ON TIME',
    r.lateMinutes,
    r.onLeave ? 'ON LEAVE' : r.isAbsent ? 'ABSENT' : 'PRESENT',
    r.staff.hourlyRate.toFixed(2),
    r.estimatedLaborCost.toFixed(2),
  ]);

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}

export function generatePayrollSummaryCsv(
  staffList: StaffMember[],
  records: EmployeeDayRecord[]
): string {
  const headers = [
    'Staff Member',
    'Biometric ID',
    'Department',
    'Base Hourly Rate (R/hr)',
    'Regular Hours Worked',
    'Overtime Hours Worked',
    'Total Billable Hours',
    'Base Pay (ZAR / R)',
    'Overtime Pay (1.5x) (ZAR / R)',
    'Estimated Gross Pay (ZAR / R)',
  ];

  const rows = staffList.map((staff) => {
    const staffRows = records.filter((r) => r.staff.id === staff.id);
    const regHours = staffRows.reduce((a, b) => a + b.regularHours, 0);
    const otHours = staffRows.reduce((a, b) => a + b.overtimeHours, 0);
    const totHours = regHours + otHours;
    const rate = staff.hourlyRate || 30;
    const basePay = regHours * rate;
    const otPay = otHours * (rate * 1.5);
    const gross = basePay + otPay;

    return [
      `"${staff.name}"`,
      staff.biometricId,
      `"${staff.department}"`,
      rate.toFixed(2),
      regHours.toFixed(2),
      otHours.toFixed(2),
      totHours.toFixed(2),
      basePay.toFixed(2),
      otPay.toFixed(2),
      gross.toFixed(2),
    ];
  });

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}

export function generateExceptionsCsv(records: EmployeeDayRecord[]): string {
  const exceptions = records.filter((r) => r.isLate || r.isAbsent || r.isEarlyDeparture);
  const headers = [
    'Date',
    'Staff Name',
    'Biometric ID',
    'Department',
    'Exception Type',
    'Clock In',
    'Clock Out',
    'Late Minutes',
    'Scheduled Shift Hours',
    'Actual Hours Worked',
  ];

  const rows = exceptions.map((r) => {
    let exType = 'Normal';
    if (r.isAbsent) exType = 'ABSENCE';
    else if (r.isLate) exType = `LATE ARRIVAL (${r.lateMinutes}m)`;
    else if (r.isEarlyDeparture) exType = 'EARLY DEPARTURE';

    return [
      r.date,
      `"${r.staff.name}"`,
      r.staff.biometricId,
      `"${r.staff.department}"`,
      `"${exType}"`,
      r.clockInTime || '--:--',
      r.clockOutTime || '--:--',
      r.lateMinutes,
      r.staff.shiftId,
      r.totalHours.toFixed(2),
    ];
  });

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}

export function downloadCsv(filename: string, content: string): void {
  // \uFEFF enables UTF-8 BOM so Microsoft Excel and LibreOffice parse commas & special characters cleanly
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function executeAutomatedSchedule(
  schedule: AutomatedReportSchedule,
  staffList: StaffMember[],
  punches: PunchRecord[],
  shifts: ShiftSchedule[],
  leaves: LeaveRequest[]
): GeneratedReportSummary {
  const today = new Date().toISOString().slice(0, 10);
  let start = today;

  if (schedule.frequency === 'weekly') {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    start = d.toISOString().slice(0, 10);
  } else if (schedule.frequency === 'monthly') {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    start = d.toISOString().slice(0, 10);
  }

  const records = calculateDailyRecords(staffList, punches, shifts, leaves, start, today);

  const totalEmployees = new Set(records.map((r) => r.staff.id)).size;
  const totalHoursWorked = parseFloat(
    records.reduce((acc, r) => acc + r.totalHours, 0).toFixed(1)
  );
  const totalOvertimeHours = parseFloat(
    records.reduce((acc, r) => acc + r.overtimeHours, 0).toFixed(1)
  );
  const totalLateIncidents = records.filter((r) => r.isLate).length;
  const estimatedLaborCost = parseFloat(
    records.reduce((acc, r) => acc + r.estimatedLaborCost, 0).toFixed(2)
  );

  return {
    id: `rep-${Date.now()}`,
    scheduleId: schedule.id,
    title: `${schedule.title} (${start} to ${today})`,
    reportType: schedule.reportType,
    dateRange: { start, end: today },
    generatedAt: new Date().toISOString(),
    totalEmployees,
    totalHoursWorked,
    totalOvertimeHours,
    totalLateIncidents,
    estimatedLaborCost,
    fileDownloadName: `${schedule.reportType}_${start}_${today}.csv`,
  };
}
