import React from 'react';
import { Activity, Settings, UserPlus, Users, Sparkles } from 'lucide-react';

interface NavbarProps {
  currentTab: 'home' | 'patients' | 'scan' | 'settings';
  setCurrentTab: (tab: 'home' | 'patients' | 'scan' | 'settings') => void;
  language: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  language,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          
          {/* Logo / Brand: SCANOV AI */}
          <button
            onClick={() => setCurrentTab('home')}
            className="flex items-center gap-2.5 text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded-lg p-1"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-sky-500 flex items-center justify-center text-white shadow-sm shadow-cyan-200 dark:shadow-cyan-900/30 transition-transform group-hover:scale-105">
              <Activity className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors whitespace-nowrap">
                SCANOV <span className="text-cyan-600 dark:text-cyan-400">AI</span>
              </span>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-500 dark:text-slate-400">
                Medical Scan Analysis
              </span>
            </div>
          </button>

          {/* Navigation Bar: Exactly 4 options: Home, Patient Records, Scan Analysis, Settings */}
          <nav className="flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-300">
            <button
              onClick={() => setCurrentTab('home')}
              className={`whitespace-nowrap transition-colors hover:text-cyan-600 dark:hover:text-cyan-400 ${
                currentTab === 'home'
                  ? 'text-cyan-600 dark:text-cyan-400 font-semibold border-b-2 border-cyan-600 dark:border-cyan-400 py-5'
                  : 'py-5'
              }`}
            >
              Home
            </button>

            <button
              onClick={() => setCurrentTab('patients')}
              className={`whitespace-nowrap transition-colors hover:text-cyan-600 dark:hover:text-cyan-400 ${
                currentTab === 'patients'
                  ? 'text-cyan-600 dark:text-cyan-400 font-semibold border-b-2 border-cyan-600 dark:border-cyan-400 py-5'
                  : 'py-5'
              }`}
            >
              Patient Records
            </button>

            <button
              onClick={() => setCurrentTab('scan')}
              className={`whitespace-nowrap transition-colors hover:text-cyan-600 dark:hover:text-cyan-400 ${
                currentTab === 'scan'
                  ? 'text-cyan-600 dark:text-cyan-400 font-semibold border-b-2 border-cyan-600 dark:border-cyan-400 py-5'
                  : 'py-5'
              }`}
            >
              Scan Analysis
            </button>

            <button
              onClick={() => setCurrentTab('settings')}
              className={`whitespace-nowrap transition-colors hover:text-cyan-600 dark:hover:text-cyan-400 ${
                currentTab === 'settings'
                  ? 'text-cyan-600 dark:text-cyan-400 font-semibold border-b-2 border-cyan-600 dark:border-cyan-400 py-5'
                  : 'py-5'
              }`}
            >
              Settings
            </button>
          </nav>

        </div>
      </div>
    </header>
  );
};
