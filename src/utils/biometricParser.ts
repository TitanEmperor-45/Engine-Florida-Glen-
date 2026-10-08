import { StaffMember, PunchRecord, ParsedUsbPunch, PunchType } from '../types';

/**
 * Parses raw text from a USB stick exported by ERS Bio-Matrix Fingerprint Scan Device (Model Q24PC).
 * Specifically parses:
 * 1. ERS Bio-Matrix Model Q24PC "att.log" or "attlog.dat" format:
 *    "1001\t2026-10-08 08:58:12\t1\t0\t1\t0" (EnrollNo, DateTime, Machine, State, VerifyMethod, WorkCode)
 * 2. Comma-separated CSV export from Q24PC USB management software:
 *    "EnrollNo,DateTime,State,DeviceName,VerifyMethod"
 * 3. General space/comma/semicolon delimited punch logs.
 */
export function parseBiometricUsbLog(
  fileContent: string,
  staffList: StaffMember[],
  existingPunches: PunchRecord[]
): {
  parsedPunches: ParsedUsbPunch[];
  summary: {
    totalLines: number;
    validCount: number;
    duplicateCount: number;
    unmatchedCount: number;
    uniqueStaffCount: number;
  };
} {
  const lines = fileContent.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  const parsedPunches: ParsedUsbPunch[] = [];

  // Create fast lookup maps
  const staffByBioId = new Map<string, StaffMember>();
  staffList.forEach((s) => staffByBioId.set(s.biometricId.trim(), s));

  // Map of existing punch signatures: `${staffId}_${timestamp}_${type}`
  const existingSignatures = new Set<string>();
  existingPunches.forEach((p) => {
    // Round to minute to prevent duplicate seconds mismatch
    const minuteTime = p.timestamp.slice(0, 16);
    existingSignatures.add(`${p.biometricId}_${minuteTime}`);
  });

  // Track lines in current batch to prevent intra-file duplicates
  const batchSignatures = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip CSV header if present
    if (
      i === 0 &&
      (line.toLowerCase().includes('enroll') ||
        line.toLowerCase().includes('pin') ||
        line.toLowerCase().includes('user id') ||
        line.toLowerCase().includes('datetime'))
    ) {
      continue;
    }

    const parsed = parseLineToPunch(line, staffByBioId);
    if (!parsed) continue;

    const minuteKey = `${parsed.biometricId}_${parsed.timestamp.slice(0, 16)}`;

    if (existingSignatures.has(minuteKey) || batchSignatures.has(minuteKey)) {
      parsed.status = 'duplicate';
      parsed.notes = 'Already logged in system or duplicate timestamp';
    } else {
      batchSignatures.add(minuteKey);
      if (!parsed.matchedStaff) {
        parsed.status = 'unmatched_id';
        parsed.notes = `Biometric ID #${parsed.biometricId} not assigned to any staff`;
      } else {
        parsed.status = 'valid';
      }
    }

    parsedPunches.push(parsed);
  }

  const validCount = parsedPunches.filter((p) => p.status === 'valid').length;
  const duplicateCount = parsedPunches.filter((p) => p.status === 'duplicate').length;
  const unmatchedCount = parsedPunches.filter((p) => p.status === 'unmatched_id').length;
  const uniqueStaff = new Set(parsedPunches.filter((p) => p.matchedStaff).map((p) => p.biometricId)).size;

  return {
    parsedPunches,
    summary: {
      totalLines: lines.length,
      validCount,
      duplicateCount,
      unmatchedCount,
      uniqueStaffCount: uniqueStaff,
    },
  };
}

function parseLineToPunch(
  line: string,
  staffMap: Map<string, StaffMember>
): ParsedUsbPunch | null {
  // Try comma-separated first
  let parts: string[] = [];
  if (line.includes(',')) {
    parts = line.split(',').map((p) => p.trim());
  } else if (line.includes('\t')) {
    parts = line.split('\t').map((p) => p.trim());
  } else if (line.includes(';')) {
    parts = line.split(';').map((p) => p.trim());
  } else {
    // Space delimited
    parts = line.split(/\s+/).map((p) => p.trim());
  }

  if (parts.length < 2) {
    return null;
  }

  // Common format 1: EnrollID in parts[0]
  const enrollId = parts[0].replace(/['"]/g, '');

  // Find date/time in remaining tokens
  let timestampStr = '';
  let inOutStateToken = '';
  let verifyToken = '';

  // Look for date pattern like YYYY-MM-DD or DD/MM/YYYY or parts[1] + parts[2]
  if (parts.length >= 3 && /^\d{4}-\d{2}-\d{2}$/.test(parts[1]) && /^\d{2}:\d{2}(:\d{2})?$/.test(parts[2])) {
    timestampStr = `${parts[1]}T${parts[2]}`;
    inOutStateToken = parts[3] || '';
    verifyToken = parts[4] || '';
  } else if (parts[1] && (parts[1].includes('-') || parts[1].includes('/') || parts[1].includes(':'))) {
    // Might be combined "2026-10-08 08:58:12"
    let dt = parts[1];
    if (parts.length >= 3 && /^\d{2}:\d{2}/.test(parts[2])) {
      dt = `${parts[1]} ${parts[2]}`;
      inOutStateToken = parts[3] || '';
      verifyToken = parts[4] || '';
    } else {
      inOutStateToken = parts[2] || '';
      verifyToken = parts[3] || '';
    }

    // Normalize date string to ISO
    timestampStr = normalizeDateTime(dt);
  }

  if (!timestampStr) {
    return null;
  }

  // Determine Punch Type from inOutStateToken
  const punchType = determinePunchType(inOutStateToken, timestampStr);

  // Determine verify method
  let verifyMethod: 'fingerprint' | 'pin' | 'card' | 'manual' = 'fingerprint';
  if (verifyToken === '2' || verifyToken.toLowerCase() === 'pin') {
    verifyMethod = 'pin';
  } else if (verifyToken === '3' || verifyToken.toLowerCase() === 'card') {
    verifyMethod = 'card';
  }

  const matchedStaff = staffMap.get(enrollId);

  return {
    rawLine: line,
    biometricId: enrollId,
    timestamp: timestampStr,
    type: punchType,
    verifyMethod,
    matchedStaff,
    status: 'valid',
  };
}

function normalizeDateTime(dtStr: string): string {
  try {
    const cleaned = dtStr.replace(/['"]/g, '').trim();
    // Check if ISO format already
    if (cleaned.includes('T')) {
      const d = new Date(cleaned);
      if (!isNaN(d.getTime())) return d.toISOString().slice(0, 19);
    }

    // Pattern: YYYY-MM-DD HH:MM:SS
    const match = cleaned.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})[\sT](\d{1,2}):(\d{1,2})(:(\d{1,2}))?/);
    if (match) {
      const year = match[1];
      const month = match[2].padStart(2, '0');
      const day = match[3].padStart(2, '0');
      const hour = match[4].padStart(2, '0');
      const min = match[5].padStart(2, '0');
      const sec = (match[7] || '00').padStart(2, '0');
      return `${year}-${month}-${day}T${hour}:${min}:${sec}`;
    }

    const d = new Date(cleaned);
    if (!isNaN(d.getTime())) {
      return d.toISOString().slice(0, 19);
    }
  } catch {
    // fallback
  }
  return new Date().toISOString().slice(0, 19);
}

function determinePunchType(stateToken: string, isoTimestamp: string): PunchType {
  const token = stateToken.toLowerCase();

  if (token === '0' || token === 'in' || token === 'checkin' || token === 'clockin') {
    return 'clock_in';
  }
  if (token === '1' || token === 'out' || token === 'checkout' || token === 'clockout') {
    return 'clock_out';
  }
  if (token === '2' || token === 'break_out' || token === 'breakout') {
    return 'break_start';
  }
  if (token === '3' || token === 'break_in' || token === 'breakin') {
    return 'break_end';
  }

  // Fallback by time of day if device does not export state code
  // Typically, morning punches before 12:30 are clock in, afternoon after 15:00 are clock out
  const hours = new Date(isoTimestamp).getHours();
  if (hours < 13) {
    return 'clock_in';
  } else {
    return 'clock_out';
  }
}

/**
 * Generates sample Bio-Matrix / ZKTeco .dat format file content for demonstration or testing.
 */
export function generateSampleBioMatrixDat(): string {
  const today = '2026-10-08';
  return [
    `1001\t${today} 05:58:14\t1\t0\t1\t0`,
    `1002\t${today} 05:54:20\t1\t0\t1\t0`,
    `1002\t${today} 12:00:15\t1\t2\t1\t0`,
    `1002\t${today} 12:35:10\t1\t3\t1\t0`,
    `1001\t${today} 18:10:45\t1\t1\t1\t0`,
    `1002\t${today} 18:02:30\t1\t1\t1\t0`,
    `1099\t${today} 06:05:00\t1\t0\t1\t0`, // Unmatched enroll ID to demonstrate scanner validation
  ].join('\n');
}

/**
 * Generates sample CSV format file content as commonly exported by Bio-Matrix USB tools.
 */
export function generateSampleBioMatrixCsv(): string {
  const today = '2026-10-08';
  return [
    'EnrollNo,DateTime,State,DeviceName,VerifyMethod',
    `1001,${today} 05:58:14,IN,Engen-FG-Forecourt-Q24PC,Fingerprint`,
    `1002,${today} 05:54:20,IN,Engen-FG-QuickShop-Q24PC,Fingerprint`,
    `1002,${today} 12:00:15,BREAK_OUT,Engen-FG-QuickShop-Q24PC,Fingerprint`,
    `1002,${today} 12:35:10,BREAK_IN,Engen-FG-QuickShop-Q24PC,Fingerprint`,
    `1001,${today} 18:10:45,OUT,Engen-FG-Forecourt-Q24PC,Fingerprint`,
    `1002,${today} 18:02:30,OUT,Engen-FG-QuickShop-Q24PC,Fingerprint`,
    `1099,${today} 06:05:00,IN,Engen-FG-Forecourt-Q24PC,Fingerprint`,
  ].join('\n');
}

/**
 * Triggers client-side browser file download for a sample file.
 */
export function downloadSampleUsbFile(type: 'dat' | 'csv') {
  const content = type === 'dat' ? generateSampleBioMatrixDat() : generateSampleBioMatrixCsv();
  const filename = type === 'dat' ? 'att.log' : 'q24pc_usb_punches.csv';
  const mimeType = type === 'dat' ? 'text/plain' : 'text/csv';

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
