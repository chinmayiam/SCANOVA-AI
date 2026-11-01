import React from 'react';
import { UserPlus, ArrowRight } from 'lucide-react';

interface HomeViewProps {
  onAddPatientRecord: () => void;
  onStartScanAnalysis: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onAddPatientRecord,
  onStartScanAnalysis,
}) => {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center bg-white dark:bg-slate-900 transition-colors px-4 sm:px-6 lg:px-8">
      {/* Soft cyan & light blue ambient gradient */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-cyan-50/70 via-sky-50/30 to-transparent dark:from-cyan-950/20 dark:via-sky-950/10 dark:to-transparent pointer-events-none" />

      <div className="relative max-w-3xl mx-auto text-center space-y-8 py-16">
        
        {/* Main Heading */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
          Smarter Medical Imaging.{' '}
          <span className="bg-gradient-to-r from-cyan-600 to-sky-600 dark:from-cyan-400 dark:to-sky-400 bg-clip-text text-transparent">
            Faster Insights.
          </span>
        </h1>

        {/* Description */}
        <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 font-normal leading-relaxed max-w-2xl mx-auto">
          AI-powered medical scan analysis to assist doctors in identifying potential abnormalities and understanding scan findings efficiently.
        </p>

        {/* Exactly Two Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onAddPatientRecord}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all"
          >
            <UserPlus className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span>Add Patient Record</span>
          </button>

          <button
            onClick={onStartScanAnalysis}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 text-sm font-semibold text-white bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-700 hover:to-sky-700 rounded-2xl shadow-lg shadow-cyan-600/20 hover:shadow-cyan-600/30 transition-all transform hover:-translate-y-0.5"
          >
            <span>Start Scan Analysis</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
