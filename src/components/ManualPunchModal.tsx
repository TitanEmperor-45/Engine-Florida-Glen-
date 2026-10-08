import React, { useState } from 'react';
import { StaffMember, PunchRecord, PunchType } from '../types';
import { X, Clock, CheckCircle } from 'lucide-react';

interface ManualPunchModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffList: StaffMember[];
  onAddManualPunch: (record: Omit<PunchRecord, 'id'>) => void;
}

export const ManualPunchModal: React.FC<ManualPunchModalProps> = ({
  isOpen,
  onClose,
  staffList,
  onAddManualPunch,
}) => {
  const [selectedStaffId, setSelectedStaffId] = useState<string>(
    staffList[0]?.id || ''
  );
  const [punchDate, setPunchDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [punchTime, setPunchTime] = useState<string>(
    new Date().toTimeString().slice(0, 5)
  );
  const [punchType, setPunchType] = useState<PunchType>('clock_in');
  const [reason, setReason] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const staff = staffList.find((s) => s.id === selectedStaffId);
    if (!staff) return;

    const timestamp = `${punchDate}T${punchTime}:00`;

    onAddManualPunch({
      staffId: staff.id,
      biometricId: staff.biometricId,
      timestamp,
      type: punchType,
      source: 'manual_adjustment',
      deviceName: 'Supervisor Web Override',
      verifiedMethod: 'manual',
      notes: reason || 'Manual supervisor punch adjustment',
    });

    onClose();
    setReason('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-2xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden my-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
              <Clock className="w-4 h-4" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">
              Manual Punch Adjustment
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Staff Member
            </label>
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="w-full text-sm rounded-lg border border-slate-300 py-2 px-3 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            >
              {staffList
                .filter((s) => s.status !== 'inactive')
                .map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.name} (Bio #{staff.biometricId}) - {staff.department}
                  </option>
                ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Date
              </label>
              <input
                type="date"
                value={punchDate}
                onChange={(e) => setPunchDate(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-300 py-2 px-3 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Time (HH:MM)
              </label>
              <input
                type="time"
                value={punchTime}
                onChange={(e) => setPunchTime(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-300 py-2 px-3 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Punch Action Type
            </label>
            <select
              value={punchType}
              onChange={(e) => setPunchType(e.target.value as PunchType)}
              className="w-full text-sm rounded-lg border border-slate-300 py-2 px-3 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="clock_in">Clock In (Shift Start)</option>
              <option value="clock_out">Clock Out (Shift End)</option>
              <option value="break_start">Start Break</option>
              <option value="break_end">End Break</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Adjustment Reason & Audit Note
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Employee forgot finger scan on arrival; verified by team lead"
              className="w-full text-sm rounded-lg border border-slate-300 py-2 px-3 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Save Adjustment</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
