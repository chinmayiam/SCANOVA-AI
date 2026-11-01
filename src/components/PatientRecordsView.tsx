import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  FileText,
  Upload,
  AlertCircle,
  Eye,
  Calendar,
  Phone,
  Clock,
  X,
  CheckCircle2,
} from 'lucide-react';
import { PatientRecord, AnalysisReport } from '../types/scanov';

interface PatientRecordsViewProps {
  patients: PatientRecord[];
  onAddPatient: (patient: PatientRecord) => void;
  onNavigateToScanForPatient: (patientId: string) => void;
  onViewReport: (report: AnalysisReport) => void;
  autoOpenAddModal?: boolean;
}

export const PatientRecordsView: React.FC<PatientRecordsViewProps> = ({
  patients,
  onAddPatient,
  onNavigateToScanForPatient,
  onViewReport,
  autoOpenAddModal = false,
}) => {
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(
    patients.length > 0 ? patients[0].patientId : null
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(autoOpenAddModal);

  // Add Patient Form State
  const [patientId, setPatientId] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [contact, setContact] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const selectedPatient = patients.find((p) => p.patientId === selectedPatientId) || patients[0] || null;

  const filteredPatients = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.patientId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanId = patientId.trim();
    const cleanName = name.trim();

    if (!cleanId || !cleanName) {
      setFormError('Patient ID and Name are required fields.');
      return;
    }

    // Check duplicate ID
    const exists = patients.some(
      (p) => p.patientId.toLowerCase() === cleanId.toLowerCase()
    );
    if (exists) {
      setFormError(`Patient ID "${cleanId}" already exists. Each patient record must have a unique identifier.`);
      return;
    }

    const newRecord: PatientRecord = {
      patientId: cleanId,
      name: cleanName,
      age: Number(age) || 0,
      gender,
      contact: contact.trim(),
      clinicalNotes: clinicalNotes.trim(),
      createdAt: new Date().toISOString(),
      reports: [],
    };

    try {
      // Post to backend
      await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRecord),
      });
    } catch (err) {
      console.warn('Backend sync failed, storing locally:', err);
    }

    onAddPatient(newRecord);
    setSelectedPatientId(newRecord.patientId);
    setIsAddModalOpen(false);

    // Reset form
    setPatientId('');
    setName('');
    setAge('');
    setContact('');
    setClinicalNotes('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Patient Records
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage registered clinical patients and their associated scan histories.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-700 hover:to-sky-700 rounded-xl transition-all shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Patient Record</span>
        </button>
      </div>

      {/* Main Grid: Patient List & Detail View */}
      {patients.length === 0 ? (
        /* Empty State */
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-700 shadow-sm max-w-xl mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mx-auto">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            No Patient Records Found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            The patient database is currently empty. Click the button below to manually register a new patient before uploading scans.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-700 rounded-xl transition-colors shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add First Patient Record</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Registered Patients List */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Registered Patients ({patients.length})
              </h3>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or ID..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-800 dark:text-slate-200"
              />
            </div>

            {/* List */}
            <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
              {filteredPatients.map((pat) => {
                const isSelected = selectedPatient?.patientId === pat.patientId;
                const scanCount = pat.reports?.length || 0;

                return (
                  <div
                    key={pat.patientId}
                    onClick={() => setSelectedPatientId(pat.patientId)}
                    className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'border-cyan-600 bg-cyan-50/70 dark:bg-cyan-950/40 dark:border-cyan-500 ring-2 ring-cyan-600/20 shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-[10px] font-bold text-cyan-800 dark:text-cyan-300 bg-cyan-100/70 dark:bg-cyan-900/60 px-1.5 py-0.5 rounded">
                        {pat.patientId}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {scanCount} {scanCount === 1 ? 'scan' : 'scans'}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      {pat.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {pat.age}y · {pat.gender} {pat.contact ? `· ${pat.contact}` : ''}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Individual Patient Record Details */}
          <div className="lg:col-span-8 space-y-6">
            {selectedPatient && (
              <>
                {/* Patient Information Card */}
                <div className="p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded">
                          {selectedPatient.patientId}
                        </span>
                        <span className="text-xs text-slate-400">
                          Added {new Date(selectedPatient.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                        {selectedPatient.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {selectedPatient.age} years old · {selectedPatient.gender}
                        {selectedPatient.contact && ` · Phone: ${selectedPatient.contact}`}
                      </p>
                    </div>

                    {/* Upload New Scan Button */}
                    <button
                      onClick={() => onNavigateToScanForPatient(selectedPatient.patientId)}
                      className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-700 hover:to-sky-700 rounded-xl transition-all shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload New Scan</span>
                    </button>
                  </div>

                  {/* Clinical Notes */}
                  {selectedPatient.clinicalNotes && (
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-700 text-xs">
                      <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Clinical History & Indications:
                      </span>
                      <p className="text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-700/60 leading-relaxed">
                        {selectedPatient.clinicalNotes}
                      </p>
                    </div>
                  )}
                </div>

                {/* Existing Imaging Studies */}
                <div className="p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Existing Imaging Studies ({selectedPatient.reports?.length || 0})
                    </h4>
                  </div>

                  {selectedPatient.reports && selectedPatient.reports.length > 0 ? (
                    <div className="divide-y divide-slate-100 dark:divide-slate-700 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
                      {selectedPatient.reports.map((report) => (
                        <div
                          key={report.reportId}
                          className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                                {report.reportId}
                              </span>
                              <span className="text-slate-300 dark:text-slate-600">·</span>
                              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                {report.scanModality}
                              </span>
                              <span className="text-slate-300 dark:text-slate-600">·</span>
                              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                                {new Date(report.scanDate).toLocaleDateString()}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-xs">
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  report.detection === 'POSITIVE'
                                    ? 'bg-rose-500'
                                    : report.detection === 'NEGATIVE'
                                    ? 'bg-emerald-500'
                                    : 'bg-amber-500'
                                }`}
                              />
                              <span className="font-bold text-slate-800 dark:text-slate-200">
                                {report.detection}
                              </span>
                              <span className="text-slate-400">·</span>
                              <span className="text-slate-600 dark:text-slate-400">
                                Location: {report.suspectedLocation}
                              </span>
                              {report.suspectedStoneCount > 0 && (
                                <>
                                  <span className="text-slate-400">·</span>
                                  <span className="font-mono text-slate-600 dark:text-slate-400">
                                    Count: {report.suspectedStoneCount}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={() => onViewReport(report)}
                            className="px-3 py-1.5 text-xs font-semibold text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/60 hover:bg-cyan-100 dark:hover:bg-cyan-900/60 rounded-lg transition-colors inline-flex items-center gap-1 self-start sm:self-auto"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Report</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                      No imaging studies uploaded yet for this patient. Click "Upload New Scan" above.
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

        </div>
      )}

      {/* Add Patient Record Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden">
            
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Add Patient Record
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePatient} className="p-6 space-y-4">
              
              {formError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <p>{formError}</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Unique Patient ID *
                </label>
                <input
                  type="text"
                  required
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  placeholder="e.g. PAT-2026-001"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Age
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="125"
                    value={age}
                    onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 45"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Gender
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Contact Number
                </label>
                <input
                  type="text"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="e.g. +1 (555) 012-3456"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Clinical Notes / Indications
                </label>
                <textarea
                  rows={3}
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  placeholder="e.g. Left flank pain radiating to groin, history of nephrolithiasis..."
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-700 hover:to-sky-700 rounded-xl shadow-sm"
                >
                  Save Patient Record
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
