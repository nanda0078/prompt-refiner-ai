import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Zap,
  AlertCircle,
  Loader2,
  RefreshCw,
  Layers,
  ArrowRight,
  ShieldCheck,
  Bot,
  Sliders,
  CheckCircle2,
  RotateCcw,
  X,
} from 'lucide-react';
import { Header } from './components/Header';
import { PromptInput } from './components/PromptInput';
import { SettingsPanel } from './components/SettingsPanel';
import { ResultDisplay } from './components/ResultDisplay';
import { ApiKeyModal } from './components/ApiKeyModal';
import { HistoryDrawer } from './components/HistoryDrawer';
import { BlueprintModal } from './components/BlueprintModal';
import { RefinerOptions, RefineResult, HistoryItem } from './types';
import { refinePromptApi, checkServerStatus, getStoredApiKey, getProviderApiKey, getActiveProvider, resetSessionApi, resetSessionId } from './services/api';

const HISTORY_STORAGE_KEY = 'prompt_refiner_history_v1';
const THEME_STORAGE_KEY = 'prompt_refiner_theme';

export default function App() {
  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved !== null) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return true;
    }
  });

  // Prompt input and settings state
  const [rawPrompt, setRawPrompt] = useState<string>('');
  const [options, setOptions] = useState<RefinerOptions>({
    targetAI: 'Auto Detect',
    mode: 'Advanced Refine',
    outputLang: 'Indonesia',
    promptStyle: 'General Assistant',
    customStyle: '',
  });

  // Loading and workflow states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [currentResult, setCurrentResult] = useState<RefineResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // History state
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Modals
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState<boolean>(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState<boolean>(false);
  const [isBlueprintModalOpen, setIsBlueprintModalOpen] = useState<boolean>(false);
  const [hasApiKey, setHasApiKey] = useState<boolean>(true);
  const [resetToast, setResetToast] = useState<string | null>(null);

  // Apply dark mode class to <html>
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem(THEME_STORAGE_KEY, 'light');
    }
  }, [darkMode]);

  // Check API key status on mount
  const checkKeyStatus = async () => {
    const customKey = getStoredApiKey();
    if (customKey) {
      setHasApiKey(true);
      return;
    }
    const status = await checkServerStatus();
    setHasApiKey(status.hasEnvKey);
  };

  useEffect(() => {
    checkKeyStatus();
  }, []);

  // Save history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history.slice(0, 30)));
    } catch (e) {
      console.error('Failed to save history', e);
    }
  }, [history]);

  // Main refinement trigger
  const handleOptimizePrompt = async (overridePrompt?: string) => {
    const promptToRefine = overridePrompt !== undefined ? overridePrompt : rawPrompt;
    if (!promptToRefine.trim() || isLoading) return;

    setIsLoading(true);
    setErrorMessage(null);

    // Lyra 4D workflow step simulation
    setLoadingStep('1/4 Parsing tujuan utama & model AI target...');
    const step1 = setTimeout(() => {
      setLoadingStep('2/4 Mendiagnosis ambiguitas & gap konteks...');
    }, 1200);

    const step2 = setTimeout(() => {
      setLoadingStep('3/4 Merancang arsitektur PCTCE+O & kompresi token...');
    }, 2500);

    const step3 = setTimeout(() => {
      setLoadingStep('4/4 Memvalidasi kontrol halusinasi & format delivery...');
    }, 3500);

    const step4 = setTimeout(() => {
      setLoadingStep('Menyelesaikan sintesis Master Prompt PCTCE+O...');
    }, 6500);

    try {
      const result = await refinePromptApi(promptToRefine, options);
      clearTimeout(step1);
      clearTimeout(step2);
      clearTimeout(step3);
      clearTimeout(step4);

      setCurrentResult(result);

      // Add to history
      const newHistoryItem: HistoryItem = {
        ...result,
        title: promptToRefine.slice(0, 60) + (promptToRefine.length > 60 ? '...' : ''),
      };
      setHistory((prev) => [newHistoryItem, ...prev.filter((item) => item.id !== result.id)]);
    } catch (err: any) {
      clearTimeout(step1);
      clearTimeout(step2);
      clearTimeout(step3);
      clearTimeout(step4);
      setErrorMessage(
        err?.message || 'Terjadi kesalahan saat memproses prompt. Silakan coba kembali.'
      );
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  // Re-run with alternate variation
  const handleRegenerate = () => {
    if (currentResult?.originalPrompt) {
      handleOptimizePrompt(currentResult.originalPrompt);
    } else {
      handleOptimizePrompt();
    }
  };

  // Re-optimize previously refined prompt
  const handleRefineAgain = (refinedText: string) => {
    setRawPrompt(refinedText);
    // Smooth scroll to top of input
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Apply improvement question suggestion to input
  const handleApplyImprovement = (questionText: string) => {
    const addition = `\n\n[Konteks Tambahan Berdasarkan Saran]:\n${questionText} -> [Isi jawaban/detail Anda di sini]`;
    setRawPrompt((prev) => prev + addition);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Select item from history drawer
  const handleSelectHistoryItem = (item: HistoryItem) => {
    setCurrentResult(item);
    setRawPrompt(item.originalPrompt);
    setOptions(item.options);
    setIsHistoryDrawerOpen(false);
  };

  // Clear all history
  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(HISTORY_STORAGE_KEY);
    } catch (e) {
      console.error(e);
    }
  };

  // Delete individual history item
  const handleDeleteHistoryItem = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  };

  // Hard Reset & Complete Context Isolation Handler
  const handleHardReset = async () => {
    // 1. Immediately abort running states and step timers
    setIsLoading(false);
    setLoadingStep('');
    setErrorMessage(null);

    // 2. Clear prompt input and current result
    setRawPrompt('');
    setCurrentResult(null);

    // 3. Purge transient session cache and drafts
    try {
      sessionStorage.clear();
      localStorage.removeItem('prompt_refiner_draft');
    } catch (e) {
      console.warn('Storage purge warning:', e);
    }

    // 4. Generate fresh session ID and notify server
    resetSessionId();
    try {
      await resetSessionApi();
    } catch (e) {
      console.warn('Reset session API warning:', e);
    }

    // 5. Visual confirmation toast
    setResetToast(
      'Sesi Baru Diaktifkan: Seluruh konteks, cache, dan riwayat sebelumnya telah diisolasi secara total (One Session = One Independent Task).'
    );
    setTimeout(() => {
      setResetToast(null);
    }, 4000);

    // 6. Smooth scroll to top of workspace
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors">
      {/* Top Navbar */}
      <Header
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        onOpenHistory={() => setIsHistoryDrawerOpen(true)}
        onOpenBlueprint={() => setIsBlueprintModalOpen(true)}
        onResetSession={handleHardReset}
        historyCount={history.length}
        hasApiKey={hasApiKey}
      />

      {/* Main Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Reset Confirmation Toast Banner */}
        {resetToast && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700/60 text-emerald-900 dark:text-emerald-100 text-xs sm:text-sm flex items-center justify-between gap-3 shadow-md animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                <ShieldCheck className="w-5 h-5 shrink-0" />
              </div>
              <p className="font-semibold leading-relaxed">{resetToast}</p>
            </div>
            <button
              onClick={() => setResetToast(null)}
              className="p-1 text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-white rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors cursor-pointer"
              title="Tutup pesan"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Hero Banner / Introduction */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 border border-indigo-800/50 p-6 sm:p-8 text-white shadow-xl">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-16 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Engine Rekayasa Prompt Profesional
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Transformasikan Ide Menjadi Master Prompt Berdaya Tinggi
            </h2>
            <p className="text-sm sm:text-base text-indigo-200/90 leading-relaxed">
              Tingkatkan akurasi AI hingga 10x lipat dan hemat token dengan sintesis terstandar{' '}
              <strong className="text-white">PCTCE+O</strong> (Persona, Context, Task, Constraints, Evaluation, Optimization) serta workflow teruji{' '}
              <strong className="text-white">Lyra 4D</strong>.
            </p>
          </div>
        </div>

        {/* Input & Settings Card */}
        <section className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm p-5 sm:p-7 space-y-6">
          {/* Prompt Textarea */}
          <PromptInput
            value={rawPrompt}
            onChange={setRawPrompt}
            onClear={() => setRawPrompt('')}
            onResetSession={handleHardReset}
            disabled={isLoading}
          />

          {/* Optimization Controls */}
          <SettingsPanel
            options={options}
            onChange={setOptions}
            disabled={isLoading}
          />

          {/* Error Message Alert Banner */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-800 dark:text-red-200 text-xs flex items-start gap-3 animate-fadeIn">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <span className="font-bold block">Gagal Memproses Prompt:</span>
                <p className="leading-relaxed">{errorMessage}</p>
                <div className="pt-1.5 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleOptimizePrompt()}
                    className="underline font-semibold hover:text-red-950 dark:hover:text-white"
                  >
                    Coba Ulang Sekarang
                  </button>
                  <span className="opacity-40">•</span>
                  <button
                    type="button"
                    onClick={() => setIsApiKeyModalOpen(true)}
                    className="underline hover:text-red-950 dark:hover:text-white"
                  >
                    Periksa Gemini API Key
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Main Action Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => handleOptimizePrompt()}
              disabled={!rawPrompt.trim() || isLoading}
              className={`w-full py-4 px-6 rounded-2xl font-bold text-sm tracking-wide shadow-lg transition-all flex items-center justify-center gap-2.5 ${
                !rawPrompt.trim() || isLoading
                  ? 'bg-gray-300 dark:bg-gray-800 text-gray-500 dark:text-gray-600 cursor-not-allowed shadow-none'
                  : 'bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700 hover:from-indigo-500 hover:via-violet-500 hover:to-indigo-600 text-white shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                  <span className="font-mono text-xs sm:text-sm">{loadingStep || 'Mengoptimalkan Prompt...'}</span>
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 text-amber-300 fill-amber-300" />
                  OPTIMALKAN PROMPT
                </>
              )}
            </button>
          </div>
        </section>

        {/* Results Section */}
        {currentResult && (
          <section id="result-section">
            <ResultDisplay
              result={currentResult}
              onRegenerate={handleRegenerate}
              onRefineAgain={handleRefineAgain}
              onApplyImprovement={handleApplyImprovement}
              onResetSession={handleHardReset}
              isLoading={isLoading}
            />
          </section>
        )}
      </main>

      {/* Modals & Drawers */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onApiKeyUpdated={checkKeyStatus}
      />

      <BlueprintModal
        isOpen={isBlueprintModalOpen}
        onClose={() => setIsBlueprintModalOpen(false)}
      />

      <HistoryDrawer
        isOpen={isHistoryDrawerOpen}
        onClose={() => setIsHistoryDrawerOpen(false)}
        history={history}
        onSelectHistoryItem={handleSelectHistoryItem}
        onClearHistory={handleClearHistory}
        onDeleteItem={handleDeleteHistoryItem}
      />
    </div>
  );
}
