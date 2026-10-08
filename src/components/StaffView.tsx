import React, { useState } from 'react';
import { StaffMember, ShiftSchedule, Department } from '../types';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Fingerprint,
  Mail,
  Phone,
  Briefcase,
  Banknote,
  Calendar,
  X,
  CheckCircle,
  Download,
  Check,
  LayoutGrid,
  List,
} from 'lucide-react';
import { EngenLogo } from './EngenLogo';

interface StaffViewProps {
  staffList: StaffMember[];
  shifts: ShiftSchedule[];
  onAddStaff: (staff: StaffMember) => void;
  onUpdateStaff: (staff: StaffMember) => void;
  onDeleteStaff: (staffId: string) => void;
  onUpdateHourlyRate?: (staffId: string, newRate: number) => void;
}

const DEPARTMENTS: Department[] = [
  'Fuel Forecourt',
  'Cashiers & QuickShop',
  'Bakery & Food',
  'Workshop & Service',
  'Car Wash & Valet',
  'Administration & Management',
];

export const StaffView: React.FC<StaffViewProps> = ({
  staffList,
  shifts,
  onAddStaff,
  onUpdateStaff,
  onDeleteStaff,
  onUpdateHourlyRate,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);

  // Form state
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [biometricId, setBiometricId] = useState<string>('');
  const [department, setDepartment] = useState<Department>('Fuel Forecourt');
  const [role, setRole] = useState<string>('');
  const [shiftId, setShiftId] = useState<string>(shifts[0]?.id || 'shift-morning');
  const [hourlyRate, setHourlyRate] = useState<number>(35);
  const [status, setStatus] = useState<'active' | 'on_leave' | 'inactive'>('active');
  const [annualLeave, setAnnualLeave] = useState<number>(15);
  const [sickLeave, setSickLeave] = useState<number>(8);
  const [formError, setFormError] = useState<string | null>(null);

  // Administrator Binnie Quick Hourly Rate Editor
  const [editingRateStaffId, setEditingRateStaffId] = useState<string | null>(null);
  const [inlineRateValue, setInlineRateValue] = useState<string>('');

  const handleSaveInlineRate = (staff: StaffMember) => {
    const val = parseFloat(inlineRateValue);
    if (!isNaN(val) && val > 0) {
      if (onUpdateHourlyRate) {
        onUpdateHourlyRate(staff.id, val);
      } else {
        onUpdateStaff({
          ...staff,
          hourlyRate: val,
        });
      }
    }
    setEditingRateStaffId(null);
  };

  const openAddModal = (suggestedBioId?: string) => {
    setEditingStaff(null);
    setName('');
    setEmail('');
    setPhone('');
    // Auto-suggest next available biometric ID
    if (suggestedBioId) {
      setBiometricId(suggestedBioId);
    } else {
      const existingIds = staffList.map((s) => parseInt(s.biometricId, 10)).filter((n) => !isNaN(n));
      const nextId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1001;
      setBiometricId(String(nextId));
    }
    setDepartment('Fuel Forecourt');
    setRole('');
    setShiftId(shifts[0]?.id || 'shift-standard');
    setHourlyRate(35);
    setStatus('active');
    setAnnualLeave(15);
    setSickLeave(8);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (staff: StaffMember) => {
    setEditingStaff(staff);
    setName(staff.name);
    setEmail(staff.email);
    setPhone(staff.phone);
    setBiometricId(staff.biometricId);
    setDepartment(staff.department);
    setRole(staff.role);
    setShiftId(staff.shiftId);
    setHourlyRate(staff.hourlyRate);
    setStatus(staff.status);
    setAnnualLeave(staff.leaveBalances.annual);
    setSickLeave(staff.leaveBalances.sick);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validate unique biometric ID
    const trimmedBioId = biometricId.trim();
    if (!trimmedBioId) {
      setFormError('Biometric Enroll ID is required.');
      return;
    }

    const duplicateBio = staffList.find(
      (s) => s.biometricId === trimmedBioId && s.id !== editingStaff?.id
    );
    if (duplicateBio) {
      setFormError(`Biometric ID #${trimmedBioId} is already assigned to ${duplicateBio.name}. Please use a unique ID.`);
      return;
    }

    if (editingStaff) {
      onUpdateStaff({
        ...editingStaff,
        name,
        email,
        phone,
        biometricId: trimmedBioId,
        department,
        role,
        shiftId,
        hourlyRate: Number(hourlyRate),
        status,
        leaveBalances: {
          ...editingStaff.leaveBalances,
          annual: Number(annualLeave),
          sick: Number(sickLeave),
        },
      });
    } else {
      const newStaff: StaffMember = {
        id: `staff-${Date.now()}`,
        name,
        email,
        phone,
        biometricId: trimmedBioId,
        department,
        role,
        shiftId,
        hourlyRate: Number(hourlyRate),
        status,
        hireDate: new Date().toISOString().slice(0, 10),
        leaveBalances: {
          annual: Number(annualLeave),
          sick: Number(sickLeave),
          casual: 3,
        },
      };
      onAddStaff(newStaff);
    }

    setIsModalOpen(false);
  };

  const filteredStaff = staffList.filter((s) => {
    if (selectedDept !== 'all' && s.department !== selectedDept) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.biometricId.includes(q) ||
        s.role.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const exportStaffDirectoryCsv = () => {
    const headers = ['ID', 'Name', 'Biometric ID', 'Department', 'Role', 'Email', 'Phone', 'Shift ID', 'Hourly Rate (ZAR / R)', 'Status', 'Annual Leave Left'];
    const rows = filteredStaff.map((s) => [
      s.id,
      `"${s.name}"`,
      s.biometricId,
      `"${s.department}"`,
      `"${s.role}"`,
      s.email,
      s.phone,
      s.shiftId,
      s.hourlyRate.toFixed(2),
      s.status,
      s.leaveBalances.annual,
    ]);
    const content = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `staff_directory_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Brand Banner: Red Square Logo with Blue X + Florida-Glen: Service Station and Convenient Store */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
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
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">
                  Staff Members & Wage Rates
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  {staffList.length} Active Employees
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Manage employee profiles, biometric enrollment IDs, assigned shifts, and hourly wages amended by Binnie.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start xl:self-auto shrink-0">
            <button
              type="button"
              onClick={exportStaffDirectoryCsv}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={() => openAddModal()}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Add Staff Member</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter, View Toggle and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, biometric ID, role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 hidden sm:inline">Department:</span>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="text-xs rounded-lg border border-slate-300 py-1.5 px-3 bg-white text-slate-800 focus:outline-none w-full sm:w-auto"
            >
              <option value="all">All Departments ({staffList.length})</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* View Mode Toggle: Table vs Cards */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md text-xs flex items-center gap-1 transition-colors ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Table view - Quick rate editor"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden md:inline text-[11px]">Table</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md text-xs flex items-center gap-1 transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Card grid view"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden md:inline text-[11px]">Cards</span>
            </button>
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: COMPACT TABLE (Ideal for Binnie editing/amending hourly rates across all staff) */}
      {viewMode === 'table' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase">
                <tr>
                  <th className="py-2.5 px-3.5">PIN / Bio ID</th>
                  <th className="py-2.5 px-3.5">Staff Member</th>
                  <th className="py-2.5 px-3.5">Department & Role</th>
                  <th className="py-2.5 px-3.5">Assigned Shift</th>
                  <th className="py-2.5 px-3.5 text-right">Hourly Wage (ZAR)</th>
                  <th className="py-2.5 px-3.5 text-center">Leave Balance</th>
                  <th className="py-2.5 px-3.5 text-center">Status</th>
                  <th className="py-2.5 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No staff members found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map((staff) => {
                    const assignedShift = shifts.find((s) => s.id === staff.shiftId) || shifts[0];
                    const isEditingThisRate = editingRateStaffId === staff.id;

                    return (
                      <tr key={staff.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3.5 font-mono font-bold text-blue-700 bg-blue-50/40 whitespace-nowrap">
                          #{staff.biometricId}
                        </td>
                        <td className="py-2.5 px-3.5">
                          <div className="flex items-center gap-2.5">
                            {staff.avatarUrl ? (
                              <img
                                src={staff.avatarUrl}
                                alt={staff.name}
                                referrerPolicy="no-referrer"
                                className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
                              />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px] flex items-center justify-center border border-slate-200 shrink-0">
                                {staff.name.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div className="font-semibold text-slate-900">{staff.name}</div>
                              <div className="text-[11px] text-slate-400 font-mono">{staff.phone}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-3.5">
                          <div className="font-medium text-slate-800">{staff.department}</div>
                          <div className="text-[11px] text-slate-400">{staff.role}</div>
                        </td>
                        <td className="py-2.5 px-3.5 text-slate-600 whitespace-nowrap">
                          {assignedShift.name.split('(')[0]}
                        </td>
                        <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                          {isEditingThisRate ? (
                            <div className="flex items-center justify-end gap-1">
                              <span className="text-xs text-slate-500 font-bold">R</span>
                              <input
                                type="number"
                                step="0.5"
                                value={inlineRateValue}
                                onChange={(e) => setInlineRateValue(e.target.value)}
                                className="w-16 px-1.5 py-0.5 text-xs font-mono font-bold bg-white border border-blue-500 rounded text-slate-900 shadow-2xs"
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveInlineRate(staff)}
                                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                                title="Save amended rate"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingRateStaffId(null)}
                                className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                                title="Cancel"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-1.5">
                              <span className="font-mono font-bold text-slate-900 text-xs">
                                R {staff.hourlyRate.toFixed(2)}/hr
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingRateStaffId(staff.id);
                                  setInlineRateValue(String(staff.hourlyRate));
                                }}
                                className="p-1 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                                title="Administrator Binnie: Amend hourly rate"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-3.5 text-center text-slate-600 font-mono whitespace-nowrap">
                          {staff.leaveBalances.annual}d annual · {staff.leaveBalances.sick}d sick
                        </td>
                        <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                          <span
                            className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                              staff.status === 'active'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : staff.status === 'on_leave'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-slate-100 text-slate-500 border border-slate-200'
                            }`}
                          >
                            {staff.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openEditModal(staff)}
                              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Edit employee profile"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Remove staff member ${staff.name}?`)) {
                                  onDeleteStaff(staff.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Delete staff member"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
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
      )}

      {/* VIEW MODE 2: STAFF GRID CARDS */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStaff.length === 0 ? (
            <div className="col-span-full py-12 text-center bg-white border border-slate-200 rounded-xl">
              <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <h4 className="text-sm font-medium text-slate-900">No staff members found</h4>
              <p className="text-xs text-slate-500 mt-1">Try adjusting your search criteria or add a new staff member.</p>
            </div>
          ) : (
            filteredStaff.map((staff) => {
              const assignedShift = shifts.find((s) => s.id === staff.shiftId) || shifts[0];

              return (
                <div
                  key={staff.id}
                  className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-5 shadow-2xs flex flex-col justify-between transition-all"
                >
                  <div>
                    {/* Top card bar */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {staff.avatarUrl ? (
                          <img
                            src={staff.avatarUrl}
                            alt={staff.name}
                            referrerPolicy="no-referrer"
                            className="w-12 h-12 rounded-full object-cover border border-slate-200"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-700 font-bold text-sm flex items-center justify-center border border-slate-200">
                            {staff.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')}
                          </div>
                        )}
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 leading-tight">
                            {staff.name}
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">{staff.role}</p>
                          <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                            {staff.department}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          staff.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : staff.status === 'on_leave'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}
                      >
                        {staff.status.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Biometric & Shift Details */}
                    <div className="space-y-2 py-3 border-y border-slate-100 text-xs">
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="flex items-center gap-1.5 text-slate-500">
                          <Fingerprint className="w-3.5 h-3.5 text-indigo-600" />
                          Biometric Enroll ID
                        </span>
                        <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                          #{staff.biometricId}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-slate-600">
                        <span className="flex items-center gap-1.5 text-slate-500">
                          <Calendar className="w-3.5 h-3.5" />
                          Shift Schedule
                        </span>
                        <span className="font-medium text-slate-800">
                          {assignedShift.name.split('(')[0]}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-slate-600">
                        <span className="flex items-center gap-1.5 text-slate-500">
                          <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                          Hourly Wage (ZAR)
                        </span>
                        {editingRateStaffId === staff.id ? (
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-slate-500 font-semibold">R</span>
                            <input
                              type="number"
                              step="0.5"
                              value={inlineRateValue}
                              onChange={(e) => setInlineRateValue(e.target.value)}
                              className="w-16 px-1.5 py-0.5 text-xs font-mono font-bold bg-white border border-blue-500 rounded text-slate-900"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveInlineRate(staff)}
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                              title="Save rate"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingRateStaffId(null)}
                              className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono tabular-nums text-slate-900 font-semibold">
                              R {staff.hourlyRate.toFixed(2)}/hr
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingRateStaffId(staff.id);
                                setInlineRateValue(String(staff.hourlyRate));
                              }}
                              className="p-1 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                              title="Binnie: Edit hourly rate"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Leave Balances Quick Metric */}
                    <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                      <span>Leave Remaining:</span>
                      <span className="font-mono tabular-nums text-slate-700">
                        {staff.leaveBalances.annual}d Annual · {staff.leaveBalances.sick}d Sick
                      </span>
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="text-[11px] text-slate-400 font-mono">
                      Hired {staff.hireDate}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(staff)}
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit staff details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Remove staff member ${staff.name}?`)) {
                            onDeleteStaff(staff.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete staff member"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Add / Edit Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-2xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden my-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="text-base font-semibold text-slate-900">
                  {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {formError && (
                <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Thomas Wayne"
                    className="w-full text-sm rounded-lg border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Biometric Enroll PIN / ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={biometricId}
                    onChange={(e) => setBiometricId(e.target.value)}
                    placeholder="e.g. 1007"
                    className="w-full text-sm font-mono rounded-lg border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Must match fingerprint terminal PIN
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Department
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value as Department)}
                    className="w-full text-sm rounded-lg border border-slate-300 py-2 px-3 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Job Title / Role
                  </label>
                  <input
                    type="text"
                    required
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. Quality Inspector"
                    className="w-full text-sm rounded-lg border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Hourly Wage (Rands - R)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    required
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(parseFloat(e.target.value) || 0)}
                    placeholder="e.g. 38.50"
                    className="w-full text-sm font-mono rounded-lg border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="staff@company.com"
                    className="w-full text-sm rounded-lg border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 555-0192"
                    className="w-full text-sm rounded-lg border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Assigned Shift
                  </label>
                  <select
                    value={shiftId}
                    onChange={(e) => setShiftId(e.target.value)}
                    className="w-full text-sm rounded-lg border border-slate-300 py-2 px-3 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {shifts.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Employment Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'active' | 'on_leave' | 'inactive')}
                    className="w-full text-sm rounded-lg border border-slate-300 py-2 px-3 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="active">Active</option>
                    <option value="on_leave">On Leave</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Annual Leave Balance (Days)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={annualLeave}
                    onChange={(e) => setAnnualLeave(parseInt(e.target.value) || 0)}
                    className="w-full text-sm font-mono rounded-lg border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Sick Leave Balance (Days)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={sickLeave}
                    onChange={(e) => setSickLeave(parseInt(e.target.value) || 0)}
                    className="w-full text-sm font-mono rounded-lg border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>{editingStaff ? 'Update Staff Member' : 'Save Staff Member'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
