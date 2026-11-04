import React from 'react';
import { Sparkles, Key, History, BookOpen, Sun, Moon, ShieldCheck, Cpu, RotateCcw, Smartphone } from 'lucide-react';

interface HeaderProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenApiKeyModal: () => void;
  onOpenHistory: () => void;
  onOpenBlueprint: () => void;
  onResetSession: () => void;
  historyCount: number;
  hasApiKey: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  darkMode,
  onToggleDarkMode,
  onOpenApiKeyModal,
  onOpenHistory,
  onOpenBlueprint,
  onResetSession,
  historyCount,
  hasApiKey,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-cyan-400 text-white shadow-md shadow-indigo-500/20">
            <Sparkles className="w-5 h-5 animate-pulse" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-900" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-lg sm:text-xl tracking-tight text-gray-900 dark:text-white">
                PROMPT REFINER <span className="bg-gradient-to-r from-indigo-500 to-cyan-500 bg-clip-text text-transparent">AI</span>
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
                <Cpu className="w-3 h-3" />
                Prompt Engineering
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
              Transform your ideas into powerful AI prompts
            </p>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* HARD RESET / NEW SESSION BUTTON */}
          <button
            onClick={onResetSession}
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-800/60 rounded-lg transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
            title="Reset Total / Sesi Baru: Bersihkan seluruh konteks & memori (One Session = One Task)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset / New Session</span>
            <span className="sm:hidden">Reset</span>
          </button>

          {/* Download Release APK */}
          <a
            href="./apk/prompt-refiner-ai.apk"
            download="prompt-refiner-ai.apk"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800/60 rounded-lg transition-all shadow-2xs hover:shadow-xs cursor-pointer"
            title="Download Android Release APK (v1.0.0)"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden md:inline">APK Release</span>
          </a>

          {/* Blueprint modal trigger */}
          <button
            onClick={onOpenBlueprint}
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
            title="Lihat Blueprint Framework PCTCE+O & Lyra 4D"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
            <span className="hidden md:inline">Blueprint</span>
          </button>

          {/* History drawer trigger */}
          <button
            onClick={onOpenHistory}
            type="button"
            className="relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Riwayat Prompt"
          >
            <History className="w-3.5 h-3.5 text-violet-500" />
            <span className="hidden md:inline">Riwayat</span>
            {historyCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-indigo-600 text-white">
                {historyCount}
              </span>
            )}
          </button>

          {/* API Key Modal trigger */}
          <button
            onClick={onOpenApiKeyModal}
            type="button"
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all border ${
              hasApiKey
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300'
            }`}
            title="Pengaturan Gemini API Key"
          >
            <Key className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">API Key</span>
            <span
              className={`w-2 h-2 rounded-full ${
                hasApiKey ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
          </button>

          {/* Dark Mode toggle */}
          <button
            onClick={onToggleDarkMode}
            type="button"
            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Toggle Dark Mode"
            title={darkMode ? 'Beralih ke Light Mode' : 'Beralih ke Dark Mode'}
          >
            {darkMode ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
