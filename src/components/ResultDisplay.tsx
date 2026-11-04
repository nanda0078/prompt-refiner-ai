import React, { useState } from 'react';
import {
  Copy,
  Check,
  RotateCw,
  RotateCcw,
  RefreshCcw,
  Edit3,
  Download,
  Share2,
  SlidersHorizontal,
  Sparkles,
  HelpCircle,
  Wrench,
  CheckCircle2,
  Save,
  X,
  Layers,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  FileCode,
  Trash2,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import { RefineResult } from '../types';
import { advancedRefinePromptApi } from '../services/api';

interface ResultDisplayProps {
  result: RefineResult;
  onRegenerate: () => void;
  onRefineAgain: (refinedText: string) => void;
  onApplyImprovement: (questionText: string) => void;
  onResetSession?: () => void;
  isLoading?: boolean;
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({
  result,
  onRegenerate,
  onRefineAgain,
  onApplyImprovement,
  onResetSession,
  isLoading,
}) => {
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState(result.optimizedPrompt);
  const [showComparison, setShowComparison] = useState(false);

  // --- COLUMN 2: ADVANCED FINAL REFINEMENT STATES (SEPARATE & ISOLATED) ---
  const [advancedPrompt, setAdvancedPrompt] = useState<string | null>(
    result.advancedRefinement?.refinedPrompt || null
  );
  const [advancedStatus, setAdvancedStatus] = useState<
    'ready' | 'processing' | 'completed' | 'failed'
  >(result.advancedRefinement ? 'completed' : 'ready');
  const [advancedError, setAdvancedError] = useState<string | null>(null);
  const [sourceOptimizedPrompt, setSourceOptimizedPrompt] = useState<string | null>(
    result.advancedRefinement?.sourceOptimizedPrompt || null
  );
  const [isEditingAdvanced, setIsEditingAdvanced] = useState<boolean>(false);
  const [editedAdvancedPrompt, setEditedAdvancedPrompt] = useState<string>('');
  const [copiedAdvanced, setCopiedAdvanced] = useState<boolean>(false);
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);
  const [engineUsedAdvanced, setEngineUsedAdvanced] = useState<string>(
    result.advancedRefinement?.engineUsed || ''
  );

  // Sync edited prompt if result changes
  React.useEffect(() => {
    setEditedPrompt(result.optimizedPrompt);
    setIsEditing(false);

    // If completely new result id, reset or load its specific refinement
    if (result.advancedRefinement) {
      setAdvancedPrompt(result.advancedRefinement.refinedPrompt);
      setAdvancedStatus('completed');
      setSourceOptimizedPrompt(result.advancedRefinement.sourceOptimizedPrompt || result.optimizedPrompt);
      setEngineUsedAdvanced(result.advancedRefinement.engineUsed || '');
    } else {
      setAdvancedPrompt(null);
      setAdvancedStatus('ready');
      setSourceOptimizedPrompt(null);
      setEngineUsedAdvanced('');
    }
    setAdvancedError(null);
    setIsEditingAdvanced(false);
    setShowClearConfirm(false);
  }, [result.id]);

  const currentPrompt = isEditing ? editedPrompt : (result.optimizedPrompt || editedPrompt);

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(currentPrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleCopyAll = () => {
    let full = result.rawMarkdown || currentPrompt;
    if (advancedPrompt) {
      full += '\n\n### 💎 ADVANCED FINAL REFINEMENT\n```text\n' + advancedPrompt + '\n```';
    }
    navigator.clipboard.writeText(full);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleDownloadTxt = () => {
    let content = `=== PROMPT REFINER AI ===
Target AI & Mode: ${result.targetAiMode}
Generated: ${new Date(result.createdAt).toLocaleString()}

--- OPTIMIZED MASTER PROMPT ---
${currentPrompt}
`;

    if (advancedPrompt) {
      content += `\n--- ADVANCED FINAL REFINEMENT ---\n${advancedPrompt}\n`;
    }

    content += `\n--- APPLIED TECHNIQUES ---\n${result.appliedTechniques.map((t) => `• ${t}`).join('\n')}

--- IMPROVEMENT QUESTIONS ---
${result.improvementQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}
`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `optimized-prompt-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const saveEdit = () => {
    setIsEditing(false);
    result.optimizedPrompt = editedPrompt;
  };

  const cancelEdit = () => {
    setEditedPrompt(result.optimizedPrompt);
    setIsEditing(false);
  };

  // --- ADVANCED FINAL REFINEMENT HANDLERS ---
  const isStale = Boolean(
    advancedPrompt &&
    sourceOptimizedPrompt &&
    sourceOptimizedPrompt.trim() !== currentPrompt.trim()
  );

  const handleRunAdvancedRefine = async () => {
    if (!currentPrompt.trim() || advancedStatus === 'processing') return;

    setAdvancedStatus('processing');
    setAdvancedError(null);
    setIsEditingAdvanced(false);
    setShowClearConfirm(false);

    try {
      const res = await advancedRefinePromptApi(
        currentPrompt,
        result.originalPrompt,
        result.options
      );

      setAdvancedPrompt(res.refinedPrompt);
      setEditedAdvancedPrompt(res.refinedPrompt);
      setSourceOptimizedPrompt(currentPrompt);
      setEngineUsedAdvanced(res.engineUsed);
      setAdvancedStatus('completed');

      // Persist reference onto result for session continuity
      result.advancedRefinement = {
        refinedPrompt: res.refinedPrompt,
        status: 'completed',
        engineUsed: res.engineUsed,
        sourceOptimizedPrompt: currentPrompt,
        createdAt: new Date().toISOString(),
      };
    } catch (err: any) {
      console.error('Advanced Final Refinement failed:', err);
      setAdvancedError(err?.message || 'Gagal menjalankan Advanced Final Refinement.');
      setAdvancedStatus('failed');
    }
  };

  const handleCopyAdvanced = () => {
    if (!advancedPrompt) return;
    navigator.clipboard.writeText(advancedPrompt);
    setCopiedAdvanced(true);
    setTimeout(() => setCopiedAdvanced(false), 2000);
  };

  const handleStartEditAdvanced = () => {
    setEditedAdvancedPrompt(advancedPrompt || '');
    setIsEditingAdvanced(true);
  };

  const handleSaveEditAdvanced = () => {
    setAdvancedPrompt(editedAdvancedPrompt);
    setIsEditingAdvanced(false);
    if (result.advancedRefinement) {
      result.advancedRefinement.refinedPrompt = editedAdvancedPrompt;
    }
  };

  const handleCancelEditAdvanced = () => {
    setEditedAdvancedPrompt(advancedPrompt || '');
    setIsEditingAdvanced(false);
  };

  const handleClearAdvanced = () => {
    setAdvancedPrompt(null);
    setAdvancedStatus('ready');
    setSourceOptimizedPrompt(null);
    setShowClearConfirm(false);
    setIsEditingAdvanced(false);
    if (result.advancedRefinement) {
      delete result.advancedRefinement;
    }
  };

  // Metrics computation
  const origWords = result.metrics?.originalWordCount || result.originalPrompt.trim().split(/\s+/).length;
  const newWords = currentPrompt.trim().split(/\s+/).filter(Boolean).length;
  const wordDiff = newWords - origWords;

  return (
    <div className="bg-white dark:bg-gray-800/90 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden animate-fadeIn space-y-6 p-5 sm:p-6">
      {/* Top Header / Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-gray-200 dark:border-gray-700/80">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2 flex-wrap">
              Hasil Optimasi Prompt
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Ready to Use
              </span>
              {result.engineUsed && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  ⚡ {result.engineUsed}
                </span>
              )}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Disusun dengan prinsip PCTCE+O & Lyra 4D
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {onResetSession && (
            <button
              type="button"
              onClick={onResetSession}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-all cursor-pointer"
              title="Mulai sesi baru & isolasi konteks (Hard Reset)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Sesi Baru</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowComparison(!showComparison)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
              showComparison
                ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300'
                : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            title="Bandingkan prompt asli dengan hasil optimasi"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-500" />
            <span>Bandingkan Diff</span>
          </button>

          <button
            type="button"
            onClick={handleCopyAll}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
            title="Salin seluruh dokumen hasil optimasi"
          >
            {copiedAll ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400">Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-gray-500" />
                <span>Copy All</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownloadTxt}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
            title="Unduh hasil sebagai berkas .txt"
          >
            <Download className="w-3.5 h-3.5 text-gray-500" />
            <span className="hidden sm:inline">Download TXT</span>
          </button>
        </div>
      </div>

      {/* Comparison Drawer if enabled */}
      {showComparison && (
        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700/80 space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
            <span className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-500" />
              Perbandingan: Prompt Mentah vs Teroptimasi
            </span>
            <div className="flex items-center gap-3 font-normal normal-case text-gray-500 dark:text-gray-400 font-mono text-[11px]">
              <span>Asli: {origWords} kata</span>
              <span>•</span>
              <span>Hasil: {newWords} kata</span>
              <span
                className={`font-semibold px-2 py-0.5 rounded-full ${
                  wordDiff <= 0
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                }`}
              >
                {wordDiff < 0
                  ? `Dikompresi ${Math.abs(wordDiff)} kata (${Math.round((Math.abs(wordDiff) / origWords) * 100)}%)`
                  : `Diperkaya +${wordDiff} kata untuk kelengkapan struktur`}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <span className="text-[11px] font-semibold text-gray-400 block mb-1">
                PROMPT MENTAH:
              </span>
              <p className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-sans">
                {result.originalPrompt}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900">
              <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 block mb-1">
                PROMPT TERSTRUKTUR PCTCE+O:
              </span>
              <p className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-mono line-clamp-6">
                {currentPrompt}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 1. 🎯 Target AI & Mode */}
      <div className="flex items-center justify-between p-3.5 rounded-xl bg-gradient-to-r from-indigo-50 via-violet-50 to-cyan-50 dark:from-indigo-950/40 dark:via-violet-950/30 dark:to-cyan-950/20 border border-indigo-100 dark:border-indigo-800/60">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">🎯</span>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-300">
              Target AI & Mode
            </h3>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {result.targetAiMode}
            </p>
            {result.imagesCount !== undefined && result.imagesCount > 0 && (
              <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md bg-indigo-100/70 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 text-[10px] font-semibold border border-indigo-200/60 dark:border-indigo-800/60">
                🖼️ {result.imagesCount} Gambar Referensi Visual Terintegrasi
              </span>
            )}
          </div>
        </div>
        <div className="text-right text-[11px] text-gray-500 dark:text-gray-400 hidden sm:block">
          <span>Formula: PCTCE+O</span>
          {result.imagesCount !== undefined && result.imagesCount > 0 && (
            <span> • <strong className="text-indigo-600 dark:text-indigo-400">🖼️ {result.imagesCount} Gambar Referensi</strong></span>
          )}
          <span> • Engine: {result.engineUsed || 'Gemini API (gemini-3.8-flash)'}</span>
        </div>
      </div>

      {/* =============================================================== */}
      {/* TWO SEPARATE OUTPUT COLUMNS (EQUAL INDEPENDENT PRESENCE)       */}
      {/* COLUMN 1: OPTIMIZED REQUEST | COLUMN 2: ADVANCED REFINEMENT  */}
      {/* =============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        {/* ------------------------------------------------------------- */}
        {/* COLUMN 1 — OPTIMIZED REQUEST (EXISTING BASELINE)              */}
        {/* ------------------------------------------------------------- */}
        <div className="flex flex-col justify-between p-4 sm:p-5 rounded-2xl bg-gray-50/80 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 shadow-xs space-y-3">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap pb-1">
              <div className="flex items-center gap-2">
                <span className="text-lg">⚡</span>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white flex items-center gap-1.5">
                    OPTIMIZED REQUEST
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      Baseline
                    </span>
                  </h3>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400">
                    Master prompt terstruktur PCTCE+O siap pakai
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {isEditing ? (
                  <>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={saveEdit}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                    >
                      <Save className="w-3 h-3" />
                      Simpan
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors cursor-pointer"
                      title="Edit prompt hasil secara langsung"
                    >
                      <Edit3 className="w-3 h-3 text-indigo-500" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyPrompt}
                      className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-all cursor-pointer"
                      title="Salin Optimized Request"
                    >
                      {copiedPrompt ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          Tersalin!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Copy
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* The Prompt Container Column 1 */}
            {isEditing ? (
              <div className="rounded-xl border border-indigo-400 dark:border-indigo-600 bg-gray-900 p-3 shadow-inner">
                <textarea
                  rows={14}
                  value={editedPrompt}
                  onChange={(e) => setEditedPrompt(e.target.value)}
                  className="w-full text-xs font-mono text-emerald-400 bg-transparent resize-y focus:outline-none leading-relaxed"
                />
              </div>
            ) : (
              <div className="relative group rounded-xl border border-gray-800 bg-gray-950 p-4 shadow-inner overflow-hidden min-h-[220px]">
                <div className="absolute top-2.5 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={handleCopyPrompt}
                    className="px-2 py-1 text-[11px] font-mono text-gray-300 bg-gray-800 hover:bg-gray-700 rounded border border-gray-700 flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    {copiedPrompt ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copiedPrompt ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <pre className="text-xs font-mono text-gray-100 whitespace-pre-wrap break-words leading-relaxed selection:bg-indigo-700 selection:text-white max-h-[460px] overflow-y-auto pr-1">
                  {currentPrompt}
                </pre>
              </div>
            )}
          </div>

          {/* Action bar directly beneath prompt 1 */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-200/60 dark:border-gray-800/60">
            <div className="text-[11px] text-gray-500 dark:text-gray-400 font-mono">
              {newWords} kata • {currentPrompt.length} karakter
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onRegenerate}
                disabled={isLoading}
                className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors disabled:opacity-50 cursor-pointer"
                title="Buat variasi optimasi alternatif"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                Regenerate
              </button>
              <span className="text-gray-300 dark:text-gray-700">•</span>
              <button
                type="button"
                onClick={() => onRefineAgain(currentPrompt)}
                disabled={isLoading}
                className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors disabled:opacity-50 cursor-pointer"
                title="Gunakan hasil ini sebagai input untuk optimasi lanjutan"
              >
                <RefreshCcw className="w-3.5 h-3.5" />
                Refine Again
              </button>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* COLUMN 2 — ADVANCED FINAL REFINEMENT (NEW SEPARATE COLUMN)   */}
        {/* ------------------------------------------------------------- */}
        <div className="flex flex-col justify-between p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-indigo-50/50 via-violet-50/20 to-transparent dark:from-indigo-950/30 dark:via-violet-950/10 dark:to-transparent border border-indigo-200/90 dark:border-indigo-800/80 shadow-xs space-y-3">
          <div className="space-y-3">
            {/* Column 2 Header */}
            <div className="flex items-center justify-between gap-2 flex-wrap pb-1">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5 flex-wrap">
                    ADVANCED FINAL REFINEMENT
                    {/* Status Badge */}
                    {advancedStatus === 'ready' && !advancedPrompt && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        Ready
                      </span>
                    )}
                    {advancedStatus === 'processing' && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
                        <RotateCw className="w-3 h-3 animate-spin" /> Processing
                      </span>
                    )}
                    {advancedStatus === 'completed' && !isStale && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Completed
                      </span>
                    )}
                    {isStale && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Stale (Outdated)
                      </span>
                    )}
                    {advancedStatus === 'failed' && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                        Failed
                      </span>
                    )}
                  </h3>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400">
                    Penyempurnaan tingkat lanjut berbasis Optimized Request
                  </span>
                </div>
              </div>

              {/* Column 2 Actions */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {advancedPrompt && !isEditingAdvanced && (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowClearConfirm(true)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded-lg border border-rose-200 dark:border-rose-800/60 transition-colors cursor-pointer"
                      title="Hapus hanya hasil Advanced Final Refinement"
                    >
                      <Trash2 className="w-3 h-3" />
                      Clear
                    </button>
                    <button
                      type="button"
                      onClick={handleStartEditAdvanced}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors cursor-pointer"
                      title="Edit hasil secara manual"
                    >
                      <Edit3 className="w-3 h-3 text-indigo-500" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyAdvanced}
                      className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-lg shadow-xs transition-all cursor-pointer"
                      title="Salin hasil Advanced Final Refinement"
                    >
                      {copiedAdvanced ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          Tersalin!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Copy
                        </>
                      )}
                    </button>
                  </>
                )}

                {isEditingAdvanced && (
                  <>
                    <button
                      type="button"
                      onClick={handleCancelEditAdvanced}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveEditAdvanced}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                    >
                      <Save className="w-3 h-3" />
                      Simpan
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Clear Confirmation Prompt */}
            {showClearConfirm && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800/80 text-xs text-rose-900 dark:text-rose-200 space-y-2 animate-fadeIn">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                  Konfirmasi: Hapus Hasil Advanced Final Refinement?
                </div>
                <p className="text-[11px] text-rose-700 dark:text-rose-300">
                  Hasil Optimized Request di sebelah kiri tetap aman dan tidak akan terhapus.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleClearAdvanced}
                    className="px-3 py-1 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs cursor-pointer"
                  >
                    Ya, Hapus Refinement
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(false)}
                    className="px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer"
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}

            {/* STALE Alert Banner */}
            {isStale && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between gap-3 animate-fadeIn">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span className="leading-snug">
                    <strong>STALE:</strong> Optimized Request di sebelah kiri telah diperbarui. Klik tombol untuk menyelaraskan.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleRunAdvancedRefine}
                  disabled={advancedStatus === 'processing'}
                  className="px-2.5 py-1 text-[11px] font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shrink-0 shadow-xs flex items-center gap-1 cursor-pointer"
                >
                  <RotateCw className={`w-3 h-3 ${advancedStatus === 'processing' ? 'animate-spin' : ''}`} />
                  Refine Ulang
                </button>
              </div>
            )}

            {/* Column 2 Content Area */}
            {isEditingAdvanced ? (
              <div className="rounded-xl border border-violet-400 dark:border-violet-600 bg-gray-900 p-3 shadow-inner">
                <textarea
                  rows={14}
                  value={editedAdvancedPrompt}
                  onChange={(e) => setEditedAdvancedPrompt(e.target.value)}
                  className="w-full text-xs font-mono text-cyan-300 bg-transparent resize-y focus:outline-none leading-relaxed"
                />
              </div>
            ) : advancedPrompt ? (
              <div className="relative group rounded-xl border border-violet-900/60 bg-gray-950 p-4 shadow-inner overflow-hidden min-h-[220px]">
                <div className="absolute top-2.5 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={handleCopyAdvanced}
                    className="px-2 py-1 text-[11px] font-mono text-gray-300 bg-gray-800 hover:bg-gray-700 rounded border border-gray-700 flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    {copiedAdvanced ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copiedAdvanced ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <pre className="text-xs font-mono text-indigo-100 whitespace-pre-wrap break-words leading-relaxed selection:bg-violet-700 selection:text-white max-h-[460px] overflow-y-auto pr-1">
                  {advancedPrompt}
                </pre>
              </div>
            ) : advancedStatus === 'processing' ? (
              <div className="flex flex-col items-center justify-center p-8 text-center rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/20 dark:bg-gray-950/50 space-y-3 min-h-[220px]">
                <RotateCw className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                    Menjalankan Advanced Final Refinement...
                  </h4>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 font-mono">
                    Universal Adaptive Refinement & Presisi Operasional
                  </p>
                </div>
              </div>
            ) : advancedStatus === 'failed' ? (
              <div className="flex flex-col items-center justify-center p-6 text-center rounded-xl border border-rose-200 dark:border-rose-900/80 bg-rose-50/30 dark:bg-gray-950/50 space-y-3 min-h-[220px]">
                <AlertTriangle className="w-8 h-8 text-rose-500" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-rose-900 dark:text-rose-200">
                    Refinement Mengalami Kendala
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 max-w-sm">
                    {advancedError || 'Terjadi kesalahan saat memproses refinement. Optimized Request Anda tetap aman.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRunAdvancedRefine}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs cursor-pointer"
                >
                  Coba Lagi
                </button>
              </div>
            ) : (
              /* Ready State: Placeholder awaiting user click */
              <div className="flex flex-col items-center justify-center p-6 text-center rounded-xl border border-dashed border-indigo-200 dark:border-indigo-800/80 bg-white/70 dark:bg-gray-950/40 space-y-3.5 min-h-[220px]">
                <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shadow-xs">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div className="space-y-1 max-w-sm">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                    Siap Menyempurnakan Prompt
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                    Klik tombol <strong>REFINE</strong> untuk melakukan penyempurnaan tingkat lanjut (presisi instruksi, eliminasi konflik, dan penguatan struktur) terhadap Optimized Request.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRunAdvancedRefine}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-violet-600 via-indigo-600 to-indigo-700 hover:from-violet-500 hover:via-indigo-500 hover:to-indigo-600 rounded-xl shadow-md shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                  REFINE
                </button>
              </div>
            )}
          </div>

          {/* Bottom stats and action for Column 2 */}
          <div className="flex items-center justify-between pt-2 border-t border-indigo-200/40 dark:border-indigo-800/40">
            <div className="text-[11px] text-gray-500 dark:text-gray-400 font-mono">
              {advancedPrompt
                ? `${advancedPrompt.trim().split(/\s+/).filter(Boolean).length} kata • ${advancedPrompt.length} karakter`
                : 'Belum dijalankan'}
            </div>
            {advancedPrompt && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRunAdvancedRefine}
                  disabled={advancedStatus === 'processing'}
                  className="inline-flex items-center gap-1 text-xs font-medium text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors disabled:opacity-50 cursor-pointer"
                  title="Regenerate hasil Advanced Final Refinement"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${advancedStatus === 'processing' ? 'animate-spin' : ''}`} />
                  Regenerate
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. 🛠 Applied Techniques */}
      <div className="space-y-2.5 pt-2 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-xl">🛠</span>
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">
            Applied Techniques
          </h3>
          <span className="text-[11px] text-gray-400 dark:text-gray-500 hidden sm:inline">
            (Metode & Optimasi Token yang Diterapkan)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {result.appliedTechniques && result.appliedTechniques.length > 0 ? (
            result.appliedTechniques.map((tech, i) => (
              <div
                key={i}
                className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-900/40 border border-gray-200/80 dark:border-gray-800 text-xs text-gray-700 dark:text-gray-300 flex items-start gap-2"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                <span className="leading-snug">{tech}</span>
              </div>
            ))
          ) : (
            <div className="col-span-2 text-xs text-gray-500 p-2.5 bg-gray-50 dark:bg-gray-900/40 rounded-xl">
              • Role-Based Prompting & PCTCE+O Structural Synthesis
            </div>
          )}
        </div>
      </div>

      {/* 4. 🔍 Improvement Questions */}
      <div className="space-y-2.5 pt-2 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-xl">🔍</span>
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">
            Improvement Questions
          </h3>
          <span className="text-[11px] text-gray-400 dark:text-gray-500 hidden sm:inline">
            (Klik pertanyaan untuk menyempurnakan prompt di input)
          </span>
        </div>

        <div className="space-y-2">
          {result.improvementQuestions && result.improvementQuestions.length > 0 ? (
            result.improvementQuestions.map((question, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onApplyImprovement(question)}
                className="w-full text-left p-3 rounded-xl bg-violet-50/50 dark:bg-violet-950/20 hover:bg-violet-100/60 dark:hover:bg-violet-950/40 border border-violet-100 dark:border-violet-900/50 text-xs text-gray-800 dark:text-gray-200 flex items-center justify-between group transition-all cursor-pointer"
                title="Terapkan konteks ini ke prompt"
              >
                <div className="flex items-start gap-2.5">
                  <span className="font-mono font-bold text-violet-600 dark:text-violet-400 shrink-0">
                    Q{i + 1}.
                  </span>
                  <span className="leading-relaxed">{question}</span>
                </div>
                <div className="text-[11px] font-semibold text-violet-600 dark:text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 shrink-0 ml-2">
                  Tambahkan <ArrowRight className="w-3 h-3" />
                </div>
              </button>
            ))
          ) : (
            <div className="text-xs text-gray-500 p-2.5">
              Tidak ada pertanyaan tambahan; prompt dinilai sudah sangat lengkap.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
