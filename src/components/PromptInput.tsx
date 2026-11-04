import React, { useRef } from 'react';
import { Clipboard, Trash2, Sparkles, FileText, ArrowUpRight, RotateCcw } from 'lucide-react';

interface PromptInputProps {
  value: string;
  onChange: (val: string) => void;
  onClear: () => void;
  onResetSession?: () => void;
  disabled?: boolean;
}

const SAMPLE_PROMPTS = [
  {
    title: 'Aplikasi AI Web',
    style: 'Coding & Development',
    prompt: 'Buatkan aplikasi manajemen inventaris toko berbasis React, TypeScript, dan Tailwind dengan fitur export ke Excel dan pelacakan stok real-time.',
  },
  {
    title: 'Copywriting Iklan',
    style: 'Business & Marketing',
    prompt: 'Tulis naskah iklan Instagram dan TikTok untuk peluncuran kopi botol cold brew rasa pandan organik. Target audiens usia 20-35 tahun pekerja kantoran.',
  },
  {
    title: 'Analisis Data Penjualan',
    style: 'Data Analysis',
    prompt: 'Analisis data performa penjualan bulanan, temukan tren penurunan di kuartal 3, dan berikan rekomendasi actionable untuk meningkatkan retensi pelanggan.',
  },
  {
    title: 'Prompt Gambar Midjourney',
    style: 'Image Generation',
    prompt: 'Gambar pemandangan kota futuristik bernuansa cyberpunk di malam hari yang hujan dengan lampu neon biru dan ungu, ultra-detailed 8k.',
  },
  {
    title: 'Paper Riset AI',
    style: 'Research',
    prompt: 'Buat kerangka metodologi penelitian komparatif antara retrieval-augmented generation (RAG) dan fine-tuning model bahasa untuk domain medis.',
  },
];

export const PromptInput: React.FC<PromptInputProps> = ({
  value,
  onChange,
  onClear,
  onResetSession,
  disabled,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const charCount = value.length;
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        onChange(value ? `${value}\n${text}` : text);
      }
    } catch {
      // Fallback: focus textarea
      textareaRef.current?.focus();
    }
  };

  const applySample = (sample: typeof SAMPLE_PROMPTS[0]) => {
    onChange(sample.prompt);
  };

  return (
    <div className="space-y-3">
      {/* Sample Templates Bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-indigo-500" />
            PROMPT YANG INGIN DIPERBAIKI
          </label>

          <div className="flex items-center gap-2">
            {onResetSession && (
              <button
                type="button"
                onClick={onResetSession}
                disabled={disabled}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-800/50 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                title="Mulai sesi baru & isolasi konteks (Hard Reset)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                New Session
              </button>
            )}
            <button
              type="button"
              onClick={handlePaste}
              disabled={disabled}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
              title="Tempel teks dari clipboard"
            >
              <Clipboard className="w-3.5 h-3.5 text-indigo-500" />
              Paste
            </button>
            {value && (
              <button
                type="button"
                onClick={onClear}
                disabled={disabled}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors disabled:opacity-50"
                title="Kosongkan teks"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Textarea */}
        <div className="relative rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800/90 shadow-xs focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all overflow-hidden">
          <textarea
            ref={textareaRef}
            rows={7}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            placeholder="Masukkan ide, instruksi, atau prompt mentah yang ingin kamu optimalkan..."
            className="w-full p-4 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 bg-transparent resize-y focus:outline-none leading-relaxed"
          />

          {/* Footer Counters */}
          <div className="flex items-center justify-between px-4 py-2 bg-gray-50/70 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700/60 text-[11px] text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-500" />
              Formula PCTCE+O aktif
            </span>
            <div className="flex items-center gap-3 font-mono">
              <span>{wordCount} kata</span>
              <span>•</span>
              <span>{charCount} karakter</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick sample chips */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 mr-1 flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          Contoh Cepat:
        </span>
        {SAMPLE_PROMPTS.map((sample, i) => (
          <button
            key={i}
            type="button"
            onClick={() => applySample(sample)}
            disabled={disabled}
            className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 dark:hover:text-indigo-300 border border-gray-200 dark:border-gray-700/60 transition-all cursor-pointer"
          >
            {sample.title}
            <ArrowUpRight className="w-2.5 h-2.5 opacity-60" />
          </button>
        ))}
      </div>
    </div>
  );
};
