import React, { useState } from 'react';
import { StaffMember, LeaveRequest, LeaveType, LeaveStatus } from '../types';
import {
  CalendarDays,
  PlusCircle,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  Search,
  User,
  Calendar,
  X,
  AlertCircle,
  CheckCheck,
  Download,
} from 'lucide-react';

interface LeaveViewProps {
  staffList: StaffMember[];
  leaves: LeaveRequest[];
  adminName?: string;
  onAddLeave: (leave: LeaveRequest) => void;
  onUpdateLeaveStatus: (leaveId: string, status: LeaveStatus, reviewNotes?: string) => void;
}

const LEAVE_TYPES: { id: LeaveType; label: string }[] = [
  { id: 'annual', label: 'Annual Holiday / Vacation' },
  { id: 'sick', label: 'Sick Leave / Medical' },
  { id: 'casual', label: 'Casual / Personal Leave' },
  { id: 'maternity_paternity', label: 'Maternity / Paternity' },
  { id: 'bereavement', label: 'Bereavement' },
  { id: 'unpaid', label: 'Unpaid Leave' },
];

export const LeaveView: React.FC<LeaveViewProps> = ({
  staffList,
  leaves,
  adminName = 'Binnie',
  onAddLeave,
  onUpdateLeaveStatus,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isApplyModalOpen, setIsApplyModalOpen] = useState<boolean>(false);

  // Apply form state
  const [selectedStaffId, setSelectedStaffId] = useState<string>(staffList[0]?.id || '');
  const [leaveType, setLeaveType] = useState<LeaveType>('annual');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState<string>('');
  const [applyError, setApplyError] = useState<string | null>(null);

  // Rejection modal
  const [rejectingLeaveId, setRejectingLeaveId] = useState<string | null>(null);
  const [rejectNotes, setRejectNotes] = useState<string>('');

  // Pend modal
  const [pendingLeaveId, setPendingLeaveId] = useState<string | null>(null);
  const [pendNotes, setPendNotes] = useState<string>('');

  const selectedStaff = staffList.find((s) => s.id === selectedStaffId);

  // Calculate days between start and end
  const calculateDays = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    const diffTime = e.getTime() - s.getTime();
    if (diffTime < 0) return 0;
    return Math.round(diffTime / (1000 * 3600 * 24)) + 1;
  };

  const daysCount = calculateDays(startDate, endDate);

  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setApplyError(null);

    if (daysCount <= 0) {
      setApplyError('End date cannot be earlier than start date.');
      return;
    }

    if (!selectedStaff) return;

    // Check balance
    if (leaveType === 'annual' && selectedStaff.leaveBalances.annual < daysCount) {
      setApplyError(`Insufficient annual leave balance. Requested ${daysCount} days, but only ${selectedStaff.leaveBalances.annual} remaining.`);
      return;
    }
    if (leaveType === 'sick' && selectedStaff.leaveBalances.sick < daysCount) {
      setApplyError(`Insufficient sick leave balance. Requested ${daysCount} days, but only ${selectedStaff.leaveBalances.sick} remaining.`);
      return;
    }

    const newLeave: LeaveRequest = {
      id: `leave-${Date.now()}`,
      staffId: selectedStaff.id,
      type: leaveType,
      startDate,
      endDate,
      daysCount,
      reason,
      status: 'pending',
      appliedDate: new Date().toISOString().slice(0, 10),
    };

    onAddLeave(newLeave);
    setIsApplyModalOpen(false);
    setReason('');
  };

  const handleApprove = (leave: LeaveRequest) => {
    onUpdateLeaveStatus(leave.id, 'approved', `Approved by Administrator ${adminName}`);
  };

  const handleConfirmReject = () => {
    if (!rejectingLeaveId) return;
    onUpdateLeaveStatus(
      rejectingLeaveId,
      'declined',
      rejectNotes || `Declined by Administrator ${adminName}`
    );
    setRejectingLeaveId(null);
    setRejectNotes('');
  };

  const handleConfirmPend = () => {
    if (!pendingLeaveId) return;
    onUpdateLeaveStatus(
      pendingLeaveId,
      'pending',
      pendNotes || `Marked pending by Administrator ${adminName} awaiting documentation`
    );
    setPendingLeaveId(null);
    setPendNotes('');
  };

  // Metrics
  const pendingLeaves = leaves.filter((l) => l.status === 'pending');
  const approvedLeaves = leaves.filter((l) => l.status === 'approved');
  const todayStr = new Date().toISOString().slice(0, 10);
  const staffAwayToday = approvedLeaves.filter((l) => todayStr >= l.startDate && todayStr <= l.endDate);

  const filteredLeaves = leaves.filter((l) => {
    if (filterStatus !== 'all' && l.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const staff = staffList.find((s) => s.id === l.staffId);
      const nameMatch = staff?.name.toLowerCase().includes(q);
      const reasonMatch = l.reason.toLowerCase().includes(q);
      return nameMatch || reasonMatch;
    }
    return true;
  });

  const exportLeavesCsv = () => {
    const headers = [
      'Leave ID',
      'Staff Name',
      'Biometric ID',
      'Department',
      'Leave Type',
      'Start Date',
      'End Date',
      'Days Count',
      'Status',
      'Applied Date',
      'Reason',
      'Reviewed By',
      'Review Notes',
    ];

    const rows = filteredLeaves.map((l) => {
      const staff = staffList.find((s) => s.id === l.staffId);
      return [
        l.id,
        `"${staff?.name || 'Unknown'}"`,
        staff?.biometricId || '',
        `"${staff?.department || 'N/A'}"`,
        l.type.toUpperCase(),
        l.startDate,
        l.endDate,
        l.daysCount,
        l.status.toUpperCase(),
        l.appliedDate,
        `"${l.reason || ''}"`,
        `"${l.reviewedBy || 'N/A'}"`,
        `"${l.reviewNotes || ''}"`,
      ];
    });

    const content = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leave_requests_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Leave Requests & Absence Management
          </h1>
          <div className="text-xs text-slate-500 mt-0.5">
            Review time-off applications, manage entitlements, and track scheduled staff absences
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={exportLeavesCsv}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
            title="Export leave records to CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setIsApplyModalOpen(true)}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Leave Request</span>
          </button>
        </div>
      </div>

      {/* Metrics strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Pending Approvals</span>
            <Clock className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {pendingLeaves.length}
            </span>
            <span className="text-xs text-slate-500">awaiting decision</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Currently on Leave Today</span>
            <CalendarDays className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {staffAwayToday.length}
            </span>
            <span className="text-xs text-slate-500">staff away</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Approved Requests</span>
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {approvedLeaves.length}
            </span>
            <span className="text-xs text-slate-500">total processed</span>
          </div>
        </div>
      </div>

      {/* Pending Approvals Queue - If any */}
      {pendingLeaves.length > 0 && (
        <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-semibold text-amber-900">
                Action Required: {pendingLeaves.length} Pending Application{pendingLeaves.length > 1 ? 's' : ''}
              </h3>
            </div>
            <span className="text-xs text-amber-700">Needs Manager Review</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingLeaves.map((req) => {
              const staff = staffList.find((s) => s.id === req.staffId);
              return (
                <div
                  key={req.id}
                  className="bg-white border border-amber-200/80 rounded-xl p-4 shadow-2xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        {staff?.avatarUrl ? (
                          <img
                            src={staff.avatarUrl}
                            alt={staff.name}
                            referrerPolicy="no-referrer"
                            className="w-9 h-9 rounded-full object-cover border border-slate-200"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 font-semibold text-xs flex items-center justify-center">
                            {staff?.name.slice(0, 2) || 'ST'}
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-bold text-slate-900">
                            {staff?.name}
                          </div>
                          <div className="text-xs text-slate-500">
                            {staff?.department} · Bio #{staff?.biometricId}
                          </div>
                        </div>
                      </div>

                      <span className="text-xs font-semibold uppercase font-mono tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {req.type}
                      </span>
                    </div>

                    <div className="mt-3 text-xs text-slate-600 space-y-1">
                      <div className="flex items-center gap-1.5 font-medium text-slate-800">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {req.startDate} to {req.endDate} ({req.daysCount} day{req.daysCount > 1 ? 's' : ''})
                        </span>
                      </div>
                      <p className="text-slate-500 italic mt-1 bg-slate-50 p-2 rounded">
                        "{req.reason}"
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setRejectingLeaveId(req.id)}
                      className="px-2.5 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1"
                      title="Decline leave request"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Decline</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingLeaveId(req.id)}
                      className="px-2.5 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors flex items-center gap-1"
                      title="Keep or mark as pending review"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Pend Request</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApprove(req)}
                      className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-lg transition-colors flex items-center gap-1"
                      title="Approve leave request"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Approve Leave</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Leave History Table */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              All Leave Records & Audit History
            </h3>
            <div className="text-xs text-slate-500">
              Comprehensive log of employee requests and approval decisions
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search staff, reason..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-44"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs rounded-lg border border-slate-300 py-1.5 px-3 bg-white text-slate-700 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
              <tr>
                <th className="py-2.5 px-3">Staff Member</th>
                <th className="py-2.5 px-3">Leave Type</th>
                <th className="py-2.5 px-3">Dates & Duration</th>
                <th className="py-2.5 px-3">Reason / Details</th>
                <th className="py-2.5 px-3">Applied On</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Reviewer</th>
                <th className="py-2.5 px-3 text-right">Actions (Admin Binnie)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {filteredLeaves.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No leave requests match your search criteria.
                  </td>
                </tr>
              ) : (
                filteredLeaves.map((l) => {
                  const staff = staffList.find((s) => s.id === l.staffId);
                  return (
                    <tr key={l.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900">
                          {staff?.name || 'Unknown'}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {staff?.department}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-medium capitalize text-slate-800">
                        {l.type.replace('_', ' ')}
                      </td>
                      <td className="py-2.5 px-3 font-mono tabular-nums text-slate-700">
                        <div>{l.startDate} to {l.endDate}</div>
                        <div className="text-[10px] text-slate-400">{l.daysCount} day{l.daysCount > 1 ? 's' : ''}</div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 max-w-xs">
                        <div className="truncate">{l.reason}</div>
                        {l.reviewNotes && (
                          <div className="text-[10px] text-slate-400 italic">
                            Note: {l.reviewNotes}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">
                        {l.appliedDate}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                            l.status === 'approved'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : l.status === 'pending'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {l.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">
                        {l.reviewedBy ? (
                          <span className="text-[11px] font-medium">{l.reviewedBy}</span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Pending Review</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {l.status !== 'approved' && (
                            <button
                              type="button"
                              onClick={() => handleApprove(l)}
                              className="px-2 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 transition-colors"
                              title="Approve leave"
                            >
                              Approve
                            </button>
                          )}
                          {l.status !== 'declined' && l.status !== 'rejected' && (
                            <button
                              type="button"
                              onClick={() => setRejectingLeaveId(l.id)}
                              className="px-2 py-1 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded border border-rose-200 transition-colors"
                              title="Decline leave"
                            >
                              Decline
                            </button>
                          )}
                          {l.status !== 'pending' && (
                            <button
                              type="button"
                              onClick={() => setPendingLeaveId(l.id)}
                              className="px-2 py-1 text-[11px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded border border-amber-200 transition-colors"
                              title="Set status to pending review"
                            >
                              Pend
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apply Leave Modal */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-2xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden my-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                  <CalendarDays className="w-4 h-4" />
                </div>
                <h3 className="text-base font-semibold text-slate-900">
                  Submit Leave Request
                </h3>
              </div>
              <button
                onClick={() => setIsApplyModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleApplySubmit} className="p-6 space-y-4">
              {applyError && (
                <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
                  {applyError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Staff Member *
                </label>
                <select
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-300 py-2 px-3 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  {staffList
                    .filter((s) => s.status !== 'inactive')
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.department}) - Balance: {s.leaveBalances.annual}d Annual, {s.leaveBalances.sick}d Sick
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Leave Category *
                </label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                  className="w-full text-sm rounded-lg border border-slate-300 py-2 px-3 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {LEAVE_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full text-sm rounded-lg border border-slate-300 py-2 px-3 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full text-sm rounded-lg border border-slate-300 py-2 px-3 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 flex items-center justify-between">
                <span>Calculated Duration:</span>
                <span className="font-mono font-bold text-slate-900">
                  {daysCount} Day{daysCount !== 1 ? 's' : ''}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Reason / Coverage Handover Details *
                </label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Provide brief reason and person covering shift duties..."
                  className="w-full text-sm rounded-lg border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsApplyModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Submit Request</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject note modal */}
      {rejectingLeaveId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-2xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden my-auto p-5">
            <h4 className="text-sm font-bold text-slate-900 mb-2">
              Reason for Declining Leave
            </h4>
            <p className="text-xs text-slate-500 mb-3">
              Administrator Binnie: Please provide reason for decline:
            </p>
            <textarea
              rows={2}
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              placeholder="e.g. Forecourt staffing coverage shortage on requested dates"
              className="w-full text-xs rounded-lg border border-slate-300 p-2 mb-3 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectingLeaveId(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg"
              >
                Confirm Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pend note modal */}
      {pendingLeaveId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-2xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden my-auto p-5">
            <h4 className="text-sm font-bold text-slate-900 mb-2">
              Mark Leave as Pending Review
            </h4>
            <p className="text-xs text-slate-500 mb-3">
              Administrator Binnie: Add reason or pending requirements:
            </p>
            <textarea
              rows={2}
              value={pendNotes}
              onChange={(e) => setPendNotes(e.target.value)}
              placeholder="e.g. Awaiting medical certificate / Discussing with forecourt lead"
              className="w-full text-xs rounded-lg border border-slate-300 p-2 mb-3 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingLeaveId(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPend}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg"
              >
                Set as Pending
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
