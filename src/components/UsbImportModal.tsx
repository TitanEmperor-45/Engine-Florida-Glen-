import React, { useState, useRef } from 'react';
import { StaffMember, PunchRecord, ParsedUsbPunch } from '../types';
import {
  parseBiometricUsbLog,
  generateSampleBioMatrixDat,
  generateSampleBioMatrixCsv,
  downloadSampleUsbFile,
} from '../utils/biometricParser';
import {
  Upload,
  FileText,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  X,
  HelpCircle,
  Download,
  Fingerprint,
} from 'lucide-react';

interface UsbImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffList: StaffMember[];
  existingPunches: PunchRecord[];
  onCommitImport: (newPunches: PunchRecord[]) => void;
  onQuickAddStaff?: (biometricId: string) => void;
}

export const UsbImportModal: React.FC<UsbImportModalProps> = ({
  isOpen,
  onClose,
  staffList,
  existingPunches,
  onCommitImport,
  onQuickAddStaff,
}) => {
  const [fileContent, setFileContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [parsedResults, setParsedResults] = useState<{
    parsedPunches: ParsedUsbPunch[];
    summary: {
      totalLines: number;
      validCount: number;
      duplicateCount: number;
      unmatchedCount: number;
      uniqueStaffCount: number;
    };
  } | null>(null);

  const [activeTabFilter, setActiveTabFilter] = useState<'all' | 'valid' | 'duplicate' | 'unmatched'>('all');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isSuccessImported, setIsSuccessImported] = useState<boolean>(false);
  const [importedCount, setImportedCount] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleProcessRawText = (text: string, name: string) => {
    setFileContent(text);
    setFileName(name);
    const result = parseBiometricUsbLog(text, staffList, existingPunches);
    setParsedResults(result);
    setIsSuccessImported(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      handleProcessRawText(content, file.name);
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        handleProcessRawText(content, file.name);
      };
      reader.readAsText(file);
    }
  };

  const handleLoadSampleDat = () => {
    const sample = generateSampleBioMatrixDat();
    handleProcessRawText(sample, 'att.log (ERS Bio-Matrix Model Q24PC)');
  };

  const handleLoadSampleCsv = () => {
    const sample = generateSampleBioMatrixCsv();
    handleProcessRawText(sample, 'q24pc_usb_punches.csv (ERS Bio-Matrix Q24PC Export)');
  };

  const handleConfirmImport = () => {
    if (!parsedResults) return;

    const validItems = parsedResults.parsedPunches.filter((p) => p.status === 'valid' && p.matchedStaff);
    if (validItems.length === 0) return;

    const newPunchRecords: PunchRecord[] = validItems.map((p, idx) => ({
      id: `punch-usb-${Date.now()}-${idx}`,
      staffId: p.matchedStaff!.id,
      biometricId: p.biometricId,
      timestamp: p.timestamp,
      type: p.type,
      source: 'biometric_usb',
      deviceName: 'ERS Bio-Matrix Q24PC',
      verifiedMethod: p.verifyMethod,
      notes: 'Imported from ERS Bio-Matrix Q24PC via USB (att.log)',
    }));

    onCommitImport(newPunchRecords);
    setImportedCount(newPunchRecords.length);
    setIsSuccessImported(true);

    setTimeout(() => {
      onClose();
      setIsSuccessImported(false);
      setParsedResults(null);
      setFileContent('');
      setFileName('');
    }, 2000);
  };

  const filteredPunches = parsedResults
    ? parsedResults.parsedPunches.filter((p) => {
        if (activeTabFilter === 'all') return true;
        if (activeTabFilter === 'valid') return p.status === 'valid';
        if (activeTabFilter === 'duplicate') return p.status === 'duplicate';
        if (activeTabFilter === 'unmatched') return p.status === 'unmatched_id';
        return true;
      })
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#004899] shrink-0 border border-blue-900 flex items-center justify-center">
              <img
                src="/src/assets/images/engen_florida_glen_logo_1791460528638.jpg"
                alt="Engen Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-slate-900">
                Engen Florida-Glen · Biometric USB Importer
              </h2>
              <p className="text-xs text-slate-500">
                Import raw attendance logs from Bio-Matrix, ZKTeco, or compatible USB flash drives
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Success Banner if committed */}
          {isSuccessImported && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <div className="text-sm font-semibold">Import Complete!</div>
                <div className="text-xs text-emerald-700">
                  Successfully imported {importedCount} biometric punch records into the system. Closing...
                </div>
              </div>
            </div>
          )}

          {/* File Upload Zone */}
          {!parsedResults && (
            <div className="space-y-4">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-indigo-500 bg-indigo-50/50 scale-[0.99]'
                    : 'border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".dat,.txt,.csv,.att,.log"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <Upload className="w-6 h-6" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-1">
                  Click to select or drop ERS Bio-Matrix USB log file
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mb-3">
                  Populate attendance directly from device: <span className="font-mono text-blue-700 font-bold">att.log</span>,{' '}
                  <span className="font-mono text-slate-700">attlog.dat</span>, or{' '}
                  <span className="font-mono text-slate-700">*.csv</span> exported from your <strong>ERS Bio-Matrix Q24PC</strong> finger scanner.
                </p>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-blue-700 bg-blue-50 rounded-md border border-blue-200">
                  <FileText className="w-3.5 h-3.5" />
                  Select att.log from USB Flash Drive
                </span>
              </div>

              {/* Sample Presets for Immediate Testing */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-700">
                    <Fingerprint className="w-4 h-4 text-blue-700" />
                    <span>ERS Bio-Matrix Q24PC USB Presets</span>
                  </div>
                  <span className="text-xs text-slate-500">Test att.log parsing immediately</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleLoadSampleDat}
                    className="px-3 py-2 text-xs font-medium text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 hover:border-slate-400 transition-colors shadow-2xs flex items-center gap-2"
                  >
                    <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Load Sample att.log (Model Q24PC)
                  </button>

                  <button
                    type="button"
                    onClick={handleLoadSampleCsv}
                    className="px-3 py-2 text-xs font-medium text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 hover:border-slate-400 transition-colors shadow-2xs flex items-center gap-2"
                  >
                    <FileCheck className="w-3.5 h-3.5 text-blue-600" />
                    Load Sample Q24PC CSV
                  </button>

                  <button
                    type="button"
                    onClick={() => downloadSampleUsbFile('dat')}
                    className="px-3 py-2 text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200 rounded-lg hover:bg-slate-200 transition-colors ml-auto flex items-center gap-1.5"
                    title="Download sample att.log to copy to your physical USB stick"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Save att.log to USB Stick
                  </button>
                </div>
              </div>

              {/* Help & Protocol Instructions */}
              <div className="p-4 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-slate-900">
                  <HelpCircle className="w-4 h-4 text-slate-500" />
                  How to export from your ERS Bio-Matrix Device (Model Q24PC):
                </div>
                <ol className="list-decimal pl-5 space-y-1 text-slate-600">
                  <li>Plug your USB flash drive into the USB host port on the <strong>ERS Bio-Matrix Q24PC</strong> finger scanner.</li>
                  <li>On the terminal screen, open <strong>Menu → USB Disk / Data Mgt → Download AttLog / Glog</strong>.</li>
                  <li>The device writes <strong>att.log</strong> to the flash drive. When download completes, unplug the USB stick.</li>
                  <li>Plug the USB stick into your computer and drop <strong>att.log</strong> into this importer to reconcile staff hours.</li>
                </ol>
              </div>
            </div>
          )}

          {/* Results Preview & Verification Screen */}
          {parsedResults && (
            <div className="space-y-4">
              {/* Summary Metrics Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <div className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <span>{fileName}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {parsedResults.summary.totalLines} lines analyzed · {parsedResults.summary.uniqueStaffCount} staff members recognized
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-xs text-slate-500">Ready to Import: </span>
                    <span className="font-mono font-bold text-emerald-600 tabular-nums">
                      {parsedResults.summary.validCount}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setParsedResults(null);
                      setFileContent('');
                      setFileName('');
                    }}
                    className="text-xs text-slate-600 hover:text-slate-900 underline"
                  >
                    Change File
                  </button>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setActiveTabFilter('all')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    activeTabFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All Punches ({parsedResults.parsedPunches.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTabFilter('valid')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    activeTabFilter === 'valid'
                      ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Valid & Matched ({parsedResults.summary.validCount})
                </button>
                {parsedResults.summary.unmatchedCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTabFilter('unmatched')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      activeTabFilter === 'unmatched'
                        ? 'bg-white text-rose-700 shadow-2xs font-semibold'
                        : 'text-rose-600 hover:text-rose-800'
                    }`}
                  >
                    Unmatched IDs ({parsedResults.summary.unmatchedCount})
                  </button>
                )}
                {parsedResults.summary.duplicateCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTabFilter('duplicate')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      activeTabFilter === 'duplicate'
                        ? 'bg-white text-amber-700 shadow-2xs font-semibold'
                        : 'text-amber-600 hover:text-amber-800'
                    }`}
                  >
                    Duplicates ({parsedResults.summary.duplicateCount})
                  </button>
                )}
              </div>

              {/* Punches Preview Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[300px] overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 text-slate-600 uppercase font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Bio ID</th>
                      <th className="py-2.5 px-3">Matched Staff</th>
                      <th className="py-2.5 px-3">Timestamp</th>
                      <th className="py-2.5 px-3">Punch Type</th>
                      <th className="py-2.5 px-3">Method</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-normal">
                    {filteredPunches.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-400">
                          No punches match this filter.
                        </td>
                      </tr>
                    ) : (
                      filteredPunches.map((item, index) => (
                        <tr
                          key={index}
                          className={`hover:bg-slate-50/80 ${
                            item.status === 'unmatched_id'
                              ? 'bg-rose-50/30'
                              : item.status === 'duplicate'
                              ? 'bg-amber-50/30 text-slate-400'
                              : ''
                          }`}
                        >
                          <td className="py-2 px-3 font-mono font-medium text-slate-900">
                            #{item.biometricId}
                          </td>
                          <td className="py-2 px-3">
                            {item.matchedStaff ? (
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-slate-900">
                                  {item.matchedStaff.name}
                                </span>
                                <span className="text-[11px] text-slate-500">
                                  ({item.matchedStaff.department})
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="text-rose-600 font-medium">Unrecognized ID</span>
                                {onQuickAddStaff && (
                                  <button
                                    type="button"
                                    onClick={() => onQuickAddStaff(item.biometricId)}
                                    className="text-[10px] text-indigo-600 hover:underline"
                                  >
                                    + Add Staff
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="py-2 px-3 font-mono tabular-nums text-slate-700">
                            {item.timestamp.replace('T', ' ')}
                          </td>
                          <td className="py-2 px-3">
                            <span className="capitalize font-medium text-slate-800">
                              {item.type.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-600 capitalize">
                            {item.verifyMethod}
                          </td>
                          <td className="py-2 px-3">
                            {item.status === 'valid' ? (
                              <span className="text-emerald-700 font-medium flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                Valid
                              </span>
                            ) : item.status === 'duplicate' ? (
                              <span className="text-amber-700 flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                                Duplicate (will skip)
                              </span>
                            ) : (
                              <span className="text-rose-700 flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                                Unknown ID
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>

          {parsedResults && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500">
                {parsedResults.summary.validCount} punches will be logged
              </span>
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={parsedResults.summary.validCount === 0 || isSuccessImported}
                className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg transition-colors shadow-xs disabled:opacity-50 flex items-center gap-2"
              >
                <HardDrive className="w-4 h-4" />
                <span>Confirm & Import to Timesheet</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
