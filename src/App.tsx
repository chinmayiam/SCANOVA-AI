import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { PatientRecordsView } from './components/PatientRecordsView';
import { ScanAnalyzer } from './components/ScanAnalyzer';
import { SettingsView } from './components/SettingsView';
import { PatientRecord, AnalysisReport, AppSettings } from './types/scanov';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'home' | 'patients' | 'scan' | 'settings'>('home');

  // Database states - Starts 100% EMPTY as mandated by Section 4 & Section 9
  const [patients, setPatients] = useState<PatientRecord[]>(() => {
    try {
      const saved = localStorage.getItem('scanov_patients');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [reports, setReports] = useState<AnalysisReport[]>(() => {
    try {
      const saved = localStorage.getItem('scanov_reports');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Active context states for cross-tab routing
  const [targetPatientForScan, setTargetPatientForScan] = useState<string | null>(null);
  const [activeReportToView, setActiveReportToView] = useState<AnalysisReport | null>(null);
  const [autoOpenAddModal, setAutoOpenAddModal] = useState<boolean>(false);

  // Application Settings
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('scanov_settings');
      return saved
        ? JSON.parse(saved)
        : {
            language: 'en',
            appearance: 'light',
            fontSize: 'medium',
          };
    } catch {
      return {
        language: 'en',
        appearance: 'light',
        fontSize: 'medium',
      };
    }
  });

  // Sync settings with DOM (Theme & Font Size scaling)
  useEffect(() => {
    const root = document.documentElement;
    // Appearance: Light vs Dark
    if (settings.appearance === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Font size scaling
    root.classList.remove('font-size-small', 'font-size-medium', 'font-size-large');
    root.classList.add(`font-size-${settings.fontSize}`);

    try {
      localStorage.setItem('scanov_settings', JSON.stringify(settings));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, [settings]);

  // Sync patients to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('scanov_patients', JSON.stringify(patients));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, [patients]);

  // Sync reports to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('scanov_reports', JSON.stringify(reports));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, [reports]);

  // Fetch initial patient list from backend on mount
  useEffect(() => {
    fetch('/api/patients')
      .then((res) => res.json())
      .then((data: PatientRecord[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setPatients(data);
        }
      })
      .catch((err) => console.log('Backend sync note:', err));
  }, []);

  // Update Settings Handler
  const handleUpdateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  // Add Patient Handler
  const handleAddPatient = (patient: PatientRecord) => {
    setPatients((prev) => [patient, ...prev]);
  };

  // Report Generated Handler
  const handleReportGenerated = (newReport: AnalysisReport) => {
    setReports((prev) => [newReport, ...prev]);

    // Attach report to patient record
    setPatients((prev) =>
      prev.map((p) => {
        if (p.patientId === newReport.patientId) {
          return {
            ...p,
            reports: [newReport, ...(p.reports || [])],
          };
        }
        return p;
      })
    );
  };

  // Action: Add Patient from Home
  const handleAddPatientFromHome = () => {
    setAutoOpenAddModal(true);
    setCurrentTab('patients');
  };

  // Action: Start Scan Analysis from Home
  const handleStartScanFromHome = () => {
    setTargetPatientForScan(null);
    setActiveReportToView(null);
    setCurrentTab('scan');
  };

  // Action: Upload New Scan for Patient
  const handleUploadScanForPatient = (patientId: string) => {
    setTargetPatientForScan(patientId);
    setActiveReportToView(null);
    setCurrentTab('scan');
  };

  // Action: View Report for Patient
  const handleViewReport = (report: AnalysisReport) => {
    setActiveReportToView(report);
    setCurrentTab('scan');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      
      {/* Navigation Bar (Strictly 4 Options: Home, Patient Records, Scan Analysis, Settings) */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setCurrentTab(tab);
          if (tab !== 'patients') {
            setAutoOpenAddModal(false);
          }
          if (tab !== 'scan') {
            setActiveReportToView(null);
          }
        }}
        language={settings.language}
      />

      {/* Main View Area */}
      <main className="flex-1">
        {currentTab === 'home' && (
          <HomeView
            onAddPatientRecord={handleAddPatientFromHome}
            onStartScanAnalysis={handleStartScanFromHome}
          />
        )}

        {currentTab === 'patients' && (
          <PatientRecordsView
            patients={patients}
            onAddPatient={handleAddPatient}
            onNavigateToScanForPatient={handleUploadScanForPatient}
            onViewReport={handleViewReport}
            autoOpenAddModal={autoOpenAddModal}
          />
        )}

        {currentTab === 'scan' && (
          <ScanAnalyzer
            patients={patients}
            initialPatientId={targetPatientForScan}
            onReportGenerated={handleReportGenerated}
            onNavigateToAddPatient={() => {
              setAutoOpenAddModal(true);
              setCurrentTab('patients');
            }}
            preloadedReport={activeReportToView}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsView
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
          />
        )}
      </main>

      {/* Minimal Clean Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-6 transition-colors no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 dark:text-slate-200">SCANOV AI</span>
            <span>·</span>
            <span>Clinical Medical Scan Analysis System</span>
          </div>
          <p className="italic">
            AI-generated report is preliminary and must be reviewed and confirmed by a qualified medical professional.
          </p>
        </div>
      </footer>

    </div>
  );
}
