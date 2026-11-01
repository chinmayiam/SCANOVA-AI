import React from 'react';
import { Globe, Moon, Sun, Type, Check } from 'lucide-react';
import { AppSettings } from '../types/scanov';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
}

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español (Spanish)' },
  { code: 'fr', label: 'Français (French)' },
  { code: 'de', label: 'Deutsch (German)' },
  { code: 'hi', label: 'हिन्दी (Hindi)' },
  { code: 'zh', label: '中文 (Chinese)' },
  { code: 'ja', label: '日本語 (Japanese)' },
];

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
}) => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Settings
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Configure application preferences for language, visual theme, and reading size.
        </p>
      </div>

      <div className="space-y-6">
        
        {/* Section A: Language Preferences */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                A. Language Preferences
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Select your preferred application display language
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            {LANGUAGES.map((lang) => {
              const isSelected = settings.language === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => onUpdateSettings({ language: lang.code as any })}
                  className={`p-3 rounded-2xl border text-xs font-semibold text-left transition-all flex items-center justify-between ${
                    isSelected
                      ? 'border-cyan-600 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-900 dark:text-cyan-300 ring-2 ring-cyan-600/20'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60'
                  }`}
                >
                  <span>{lang.label}</span>
                  {isSelected && <Check className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section B: Appearance */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              {settings.appearance === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                B. Appearance
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Select Light Mode or Dark Mode for clinical reading comfort
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <button
              type="button"
              onClick={() => onUpdateSettings({ appearance: 'light' })}
              className={`p-4 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                settings.appearance === 'light'
                  ? 'border-cyan-600 bg-cyan-50/60 dark:bg-cyan-950/40 text-slate-900 dark:text-white ring-2 ring-cyan-600/20'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Sun className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold block">Light Mode</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Clean white & cyan</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onUpdateSettings({ appearance: 'dark' })}
              className={`p-4 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                settings.appearance === 'dark'
                  ? 'border-cyan-600 bg-cyan-50/60 dark:bg-cyan-950/40 text-slate-900 dark:text-white ring-2 ring-cyan-600/20'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-slate-900 text-cyan-400 flex items-center justify-center">
                <Moon className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold block">Dark Mode</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Low-glare dark slate</span>
              </div>
            </button>
          </div>
        </div>

        {/* Section C: Font Size */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Type className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                C. Font Size
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Adjust the base font scaling across reports, tables, and dialogs
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2">
            {[
              { size: 'small', label: 'Small', sub: '14px baseline' },
              { size: 'medium', label: 'Medium', sub: '16px baseline (Default)' },
              { size: 'large', label: 'Large', sub: '18px baseline' },
            ].map((opt) => {
              const isSelected = settings.fontSize === opt.size;
              return (
                <button
                  key={opt.size}
                  type="button"
                  onClick={() => onUpdateSettings({ fontSize: opt.size as any })}
                  className={`p-3.5 rounded-2xl border text-center transition-all ${
                    isSelected
                      ? 'border-cyan-600 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-900 dark:text-cyan-300 ring-2 ring-cyan-600/20'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60'
                  }`}
                >
                  <span className="text-xs font-bold block">{opt.label}</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">{opt.sub}</span>
                </button>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
};
