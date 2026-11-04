import React from 'react';
import { Bot, Sliders, Globe, Palette, Info } from 'lucide-react';
import { TargetAI, OptimizationMode, OutputLanguage, PromptStyle, RefinerOptions } from '../types';

interface SettingsPanelProps {
  options: RefinerOptions;
  onChange: (updated: RefinerOptions) => void;
  disabled?: boolean;
}

const TARGET_AI_LIST: TargetAI[] = [
  'Auto Detect',
  'Google Gemini',
  'ChatGPT',
  'Claude',
  'Microsoft Copilot',
  'Other AI',
];

const MODES: { id: OptimizationMode; label: string; desc: string }[] = [
  {
    id: 'Quick Refine',
    label: 'Quick Refine',
    desc: 'Kompresi cepat, struktur PCTCE+O ringkas, hemat token.',
  },
  {
    id: 'Advanced Refine',
    label: 'Advanced Refine',
    desc: 'Analisis mendalam, eliminasi ambiguitas, penajaman konteks.',
  },
  {
    id: 'Expert Refine',
    label: 'Expert Refine',
    desc: 'Arsitektur sistem hierarkis, edge cases, batasan defensif & self-check.',
  },
];

const LANGUAGES: OutputLanguage[] = ['Indonesia', 'English', 'Auto Detect'];

const STYLES: PromptStyle[] = [
  'General Assistant',
  'Coding & Development',
  'Image Generation',
  'Video Generation',
  'Data Analysis',
  'Research',
  'Writing & Content',
  'Business & Marketing',
  'Custom',
];

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  options,
  onChange,
  disabled,
}) => {
  return (
    <div className="bg-gray-50/70 dark:bg-gray-800/40 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* A. Target AI */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
            <Bot className="w-3.5 h-3.5 text-indigo-500" />
            Target AI
          </label>
          <select
            value={options.targetAI}
            onChange={(e) => onChange({ ...options, targetAI: e.target.value as TargetAI })}
            disabled={disabled}
            className="w-full px-3 py-2 text-xs font-medium bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
          >
            {TARGET_AI_LIST.map((ai) => (
              <option key={ai} value={ai}>
                {ai}
              </option>
            ))}
          </select>
        </div>

        {/* B. Mode Optimasi */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-violet-500" />
            Mode Optimasi
          </label>
          <select
            value={options.mode}
            onChange={(e) => onChange({ ...options, mode: e.target.value as OptimizationMode })}
            disabled={disabled}
            className="w-full px-3 py-2 text-xs font-medium bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
          >
            {MODES.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        {/* C. Bahasa Output */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-cyan-500" />
            Bahasa Output
          </label>
          <select
            value={options.outputLang}
            onChange={(e) => onChange({ ...options, outputLang: e.target.value as OutputLanguage })}
            disabled={disabled}
            className="w-full px-3 py-2 text-xs font-medium bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </div>

        {/* D. Gaya Prompt */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-emerald-500" />
            Gaya Prompt
          </label>
          <select
            value={options.promptStyle}
            onChange={(e) => onChange({ ...options, promptStyle: e.target.value as PromptStyle })}
            disabled={disabled}
            className="w-full px-3 py-2 text-xs font-medium bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
          >
            {STYLES.map((style) => (
              <option key={style} value={style}>
                {style}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Mode explanation helper note */}
      <div className="flex items-start gap-2 text-[11px] text-gray-500 dark:text-gray-400 bg-white/70 dark:bg-gray-900/40 p-2.5 rounded-xl border border-gray-200/60 dark:border-gray-800">
        <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
        <span>
          <strong className="text-gray-800 dark:text-gray-200">{options.mode}:</strong>{' '}
          {MODES.find((m) => m.id === options.mode)?.desc}
        </span>
      </div>

      {/* Custom Style input if Custom selected */}
      {options.promptStyle === 'Custom' && (
        <div className="pt-2 animate-fadeIn">
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Deskripsi Gaya Kustom
          </label>
          <input
            type="text"
            value={options.customStyle || ''}
            onChange={(e) => onChange({ ...options, customStyle: e.target.value })}
            placeholder="Contoh: Format JSON Schema, Nada Akademik Kritis, atau Storytelling Emosional"
            disabled={disabled}
            className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>
      )}
    </div>
  );
};
