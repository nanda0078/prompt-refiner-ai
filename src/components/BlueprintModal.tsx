import React from 'react';
import { X, BookOpen, Layers, CheckCircle2, Shield, Zap, Sparkles, BrainCircuit } from 'lucide-react';

interface BlueprintModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BlueprintModal: React.FC<BlueprintModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-base">
                Blueprint Arsitektur Prompt Refiner
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Framework PCTCE+O & Workflow Lyra 4D
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-gray-700 dark:text-gray-300">
          {/* Section 1: PCTCE+O */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <Layers className="w-4 h-4" />
              </span>
              <h4 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wide">
                1. Framework PCTCE+O
              </h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/60">
                <span className="font-bold text-indigo-600 dark:text-indigo-400 block mb-1">
                  P — Persona
                </span>
                Menentukan peran, keahlian, dan nada bicara AI target secara spesifik tanpa bertele-tele.
              </div>
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/60">
                <span className="font-bold text-indigo-600 dark:text-indigo-400 block mb-1">
                  C — Context
                </span>
                Konteks yang diperlukan dan cukup, ditempatkan di bagian atas untuk mencegah <i>lost-in-the-middle</i>.
              </div>
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/60">
                <span className="font-bold text-indigo-600 dark:text-indigo-400 block mb-1">
                  T — Task
                </span>
                Kata kerja aksi eksplisit, target audiens, kedalaman materi, dan apakah penalaran langkah-demi-langkah dibutuhkan.
              </div>
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/60">
                <span className="font-bold text-indigo-600 dark:text-indigo-400 block mb-1">
                  C — Constraints
                </span>
                Aturan output terstruktur (Markdown/JSON), batasan format, hal-hal yang dilarang/dihindari.
              </div>
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/60">
                <span className="font-bold text-indigo-600 dark:text-indigo-400 block mb-1">
                  E — Evaluation (Self-Check)
                </span>
                Instruksi mandiri bagi AI target untuk memvalidasi output sebelum menyajikan hasil final.
              </div>
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/60">
                <span className="font-bold text-indigo-600 dark:text-indigo-400 block mb-1">
                  +O — Optimization
                </span>
                Efisiensi token maksimum, memangkas repetisi dan frase dekoratif yang membuang kuota.
              </div>
            </div>
          </div>

          {/* Section 2: Lyra 4D */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="p-1.5 rounded-lg bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400">
                <BrainCircuit className="w-4 h-4" />
              </span>
              <h4 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wide">
                2. Workflow Lyra 4D
              </h4>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/60">
                <span className="px-2 py-0.5 rounded font-mono font-bold bg-violet-100 dark:bg-violet-900/60 text-violet-700 dark:text-violet-300">
                  D1: Parsing
                </span>
                <span>Mengidentifikasi tujuan utama, AI target, kriteria keberhasilan, dan titik pemborosan token.</span>
              </div>
              <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/60">
                <span className="px-2 py-0.5 rounded font-mono font-bold bg-violet-100 dark:bg-violet-900/60 text-violet-700 dark:text-violet-300">
                  D2: Diagnosis
                </span>
                <span>Mendeteksi ambiguitas, informasi penting yang hilang, dan potensi konflik instruksi.</span>
              </div>
              <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/60">
                <span className="px-2 py-0.5 rounded font-mono font-bold bg-violet-100 dark:bg-violet-900/60 text-violet-700 dark:text-violet-300">
                  D3: Development
                </span>
                <span>Menyusun prompt berkinerja tinggi menggunakan PCTCE+O dengan instruksi yang padat dan tegas.</span>
              </div>
              <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/60">
                <span className="px-2 py-0.5 rounded font-mono font-bold bg-violet-100 dark:bg-violet-900/60 text-violet-700 dark:text-violet-300">
                  D4: Delivery
                </span>
                <span>Mengemas prompt final dalam code block mandiri yang siap di-copy-paste langsung ke target AI.</span>
              </div>
            </div>
          </div>

          {/* Section 3: Hallucination Controls */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <Shield className="w-4 h-4" />
              </span>
              <h4 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wide">
                3. Hallucination & Safety Controls
              </h4>
            </div>
            <ul className="space-y-1.5 text-xs text-gray-600 dark:text-gray-300 list-disc list-inside">
              <li>AI target diinstruksikan untuk mengakui ketidaktahuan jika informasi tidak tersedia.</li>
              <li>Dilarang mengarang fakta, data statistik, URL, atau referensi palsu.</li>
              <li>Pemisahan ketat antara fakta yang terverifikasi dan asumsi/spekulasi.</li>
              <li>Menjaga maksud otentik dari pengguna tanpa menyimpang dari esensi kebutuhan.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 flex justify-end">
          <button
            onClick={onClose}
            type="button"
            className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors"
          >
            Mengerti & Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
