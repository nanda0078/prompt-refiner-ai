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
} from 'lucide-react';
import { RefineResult } from '../types';

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

  // Sync edited prompt if result changes
  React.useEffect(() => {
    setEditedPrompt(result.optimizedPrompt);
    setIsEditing(false);
  }, [result]);

  const currentPrompt = isEditing ? editedPrompt : (result.optimizedPrompt || editedPrompt);

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(currentPrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleCopyAll = () => {
    navigator.clipboard.writeText(result.rawMarkdown || currentPrompt);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleDownloadTxt = () => {
    const content = `=== PROMPT REFINER AI ===
Target AI & Mode: ${result.targetAiMode}
Generated: ${new Date(result.createdAt).toLocaleString()}

--- OPTIMIZED MASTER PROMPT ---
${currentPrompt}

--- APPLIED TECHNIQUES ---
${result.appliedTechniques.map((t) => `• ${t}`).join('\n')}

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
          </div>
        </div>
        <div className="text-right text-[11px] text-gray-500 dark:text-gray-400 hidden sm:block">
          <span>Formula: PCTCE+O</span> • <span>Engine: Gemini 3.8</span>
        </div>
      </div>

      {/* 2. ⚡ Optimized Request */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚡</span>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">
              Optimized Request
            </h3>
            <span className="text-[11px] text-gray-400 dark:text-gray-500 hidden sm:inline">
              (Single self-contained ready-to-run master prompt)
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <X className="w-3 h-3" />
                  Batal
                </button>
                <button
                  type="button"
                  onClick={saveEdit}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
                >
                  <Save className="w-3 h-3" />
                  Simpan Perubahan
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title="Edit prompt hasil secara langsung"
                >
                  <Edit3 className="w-3 h-3 text-indigo-500" />
                  Edit Prompt
                </button>
                <button
                  type="button"
                  onClick={handleCopyPrompt}
                  className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all"
                  title="Salin prompt final"
                >
                  {copiedPrompt ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Tersalin!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy Prompt
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {/* The Prompt Container */}
        {isEditing ? (
          <div className="rounded-xl border border-indigo-400 dark:border-indigo-600 bg-gray-900 p-3 shadow-inner">
            <textarea
              rows={12}
              value={editedPrompt}
              onChange={(e) => setEditedPrompt(e.target.value)}
              className="w-full text-xs font-mono text-emerald-400 bg-transparent resize-y focus:outline-none leading-relaxed"
            />
          </div>
        ) : (
          <div className="relative group rounded-xl border border-gray-800 bg-gray-950 p-4 shadow-inner overflow-hidden">
            <div className="absolute top-2.5 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={handleCopyPrompt}
                className="px-2 py-1 text-[11px] font-mono text-gray-300 bg-gray-800 hover:bg-gray-700 rounded border border-gray-700 flex items-center gap-1 shadow-xs"
              >
                {copiedPrompt ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copiedPrompt ? 'Copied' : 'Copy'}
              </button>
            </div>
            <pre className="text-xs font-mono text-gray-100 whitespace-pre-wrap break-words leading-relaxed selection:bg-indigo-700 selection:text-white">
              {currentPrompt}
            </pre>
          </div>
        )}

        {/* Action bar directly beneath prompt */}
        <div className="flex items-center justify-between pt-1">
          <div className="text-[11px] text-gray-500 dark:text-gray-400 font-mono">
            {newWords} kata • {currentPrompt.length} karakter
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRegenerate}
              disabled={isLoading}
              className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors disabled:opacity-50"
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
              className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors disabled:opacity-50"
              title="Gunakan hasil ini sebagai input untuk optimasi lanjutan"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
              Refine Again
            </button>
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
