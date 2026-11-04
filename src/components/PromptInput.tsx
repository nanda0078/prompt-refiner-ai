import React, { useRef } from 'react';
import {
  Clipboard,
  Trash2,
  Sparkles,
  FileText,
  ArrowUpRight,
  RotateCcw,
  ImagePlus,
  X,
  Image as ImageIcon,
  Plus,
} from 'lucide-react';
import { ImageAttachment } from '../types';

interface PromptInputProps {
  value: string;
  onChange: (val: string) => void;
  onClear: () => void;
  onResetSession?: () => void;
  disabled?: boolean;
  images?: ImageAttachment[];
  onImagesChange?: (images: ImageAttachment[]) => void;
}

const SAMPLE_PROMPTS = [
  {
    title: 'Aplikasi AI Web',
    style: 'Coding & Development',
    prompt:
      'Buatkan aplikasi manajemen inventaris toko berbasis React, TypeScript, dan Tailwind dengan fitur export ke Excel dan pelacakan stok real-time.',
  },
  {
    title: 'Copywriting Iklan',
    style: 'Business & Marketing',
    prompt:
      'Tulis naskah iklan Instagram dan TikTok untuk peluncuran kopi botol cold brew rasa pandan organik. Target audiens usia 20-35 tahun pekerja kantoran.',
  },
  {
    title: 'Analisis Data Penjualan',
    style: 'Data Analysis',
    prompt:
      'Analisis data performa penjualan bulanan, temukan tren penurunan di kuartal 3, dan berikan rekomendasi actionable untuk meningkatkan retensi pelanggan.',
  },
  {
    title: 'Prompt Gambar Midjourney',
    style: 'Image Generation',
    prompt:
      'Gambar pemandangan kota futuristik bernuansa cyberpunk di malam hari yang hujan dengan lampu neon biru dan ungu, ultra-detailed 8k.',
  },
  {
    title: 'Paper Riset AI',
    style: 'Research',
    prompt:
      'Buat kerangka metodologi penelitian komparatif antara retrieval-augmented generation (RAG) dan fine-tuning model bahasa untuk domain medis.',
  },
];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function processImageFile(file: File): Promise<ImageAttachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`Gagal membaca file ${file.name}`));
    reader.onload = () => {
      const originalDataUrl = reader.result as string;
      const img = new Image();
      img.onerror = () => {
        // Fallback: use raw data URL if canvas cannot decode
        const base64Data = originalDataUrl.split(',')[1] || '';
        resolve({
          id: 'img-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
          name: file.name,
          mimeType: file.type || 'image/jpeg',
          base64Data,
          dataUrl: originalDataUrl,
          sizeBytes: file.size,
        });
      };
      img.onload = () => {
        // Optimize large images to max 1920px keeping aspect ratio
        const maxDim = 1920;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const targetMime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
            const optimizedDataUrl = canvas.toDataURL(targetMime, 0.88);
            const base64Data = optimizedDataUrl.split(',')[1] || '';
            resolve({
              id: 'img-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
              name: file.name,
              mimeType: targetMime,
              base64Data,
              dataUrl: optimizedDataUrl,
              sizeBytes: Math.round((base64Data.length * 3) / 4),
            });
            return;
          }
        }

        const base64Data = originalDataUrl.split(',')[1] || '';
        resolve({
          id: 'img-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
          name: file.name,
          mimeType: file.type || 'image/jpeg',
          base64Data,
          dataUrl: originalDataUrl,
          sizeBytes: file.size,
        });
      };
      img.src = originalDataUrl;
    };
    reader.readAsDataURL(file);
  });
}

export const PromptInput: React.FC<PromptInputProps> = ({
  value,
  onChange,
  onClear,
  onResetSession,
  disabled,
  images = [],
  onImagesChange,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const charCount = value.length;
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        onChange(value ? `${value}\n${text}` : text);
      }
    } catch {
      textareaRef.current?.focus();
    }
  };

  const applySample = (sample: typeof SAMPLE_PROMPTS[0]) => {
    onChange(sample.prompt);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFiles = e.target.files;
    if (!rawFiles || rawFiles.length === 0) return;

    // Snapshot files into a standalone array immediately
    const fileList = Array.from(rawFiles);

    // Reset input value so the same file can be selected again in the future
    e.target.value = '';

    const validFiles: File[] = [];
    for (const file of fileList) {
      const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
      const isImage =
        file.type.startsWith('image/') ||
        ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp'].includes(ext);
      if (!isImage) {
        alert(`File "${file.name}" bukan format gambar yang didukung (JPG, PNG, WEBP).`);
        continue;
      }
      if (file.size > 20 * 1024 * 1024) {
        alert(`File "${file.name}" terlalu besar (maksimal 20MB).`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    try {
      const processed = await Promise.all(validFiles.map(processImageFile));
      onImagesChange?.([...images, ...processed]);
    } catch (err: any) {
      console.error('Gagal memproses gambar:', err);
      alert('Terjadi kesalahan saat membaca gambar referensi: ' + (err?.message || 'Gagal membaca file'));
    }
  };

  const handleRemoveImage = (id: string) => {
    onImagesChange?.(images.filter((img) => img.id !== id));
  };

  const handleClearAllImages = () => {
    onImagesChange?.([]);
  };

  return (
    <div className="space-y-3">
      {/* Hidden file input for multiple image reference upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        multiple
        accept="image/jpeg,image/png,image/webp,image/jpg"
        className="hidden"
      />

      {/* Header Bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-indigo-500" />
            PROMPT YANG INGIN DIPERBAIKI
          </label>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-end">
            {/* Multiple Image Upload Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer disabled:opacity-50 ${
                images.length > 0
                  ? 'text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-700 shadow-xs ring-1 ring-indigo-500/20'
                  : 'text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700/80 border-gray-300 dark:border-gray-700'
              }`}
              title="Lampirkan satu atau beberapa gambar referensi visual (JPG, PNG, WEBP)"
            >
              <ImagePlus className="w-3.5 h-3.5 text-indigo-500" />
              <span>{images.length > 0 ? 'Tambah Gambar' : 'Lampirkan Gambar'}</span>
              {images.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-indigo-600 text-white text-[10px] font-bold">
                  {images.length}
                </span>
              )}
            </button>

            {onResetSession && (
              <button
                type="button"
                onClick={onResetSession}
                disabled={disabled}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-800/50 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                title="Mulai sesi baru & isolasi konteks (Hard Reset)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">New Session</span>
              </button>
            )}

            <button
              type="button"
              onClick={handlePaste}
              disabled={disabled}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
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
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                title="Kosongkan teks"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Textarea Container with Visual Grounding and Gallery */}
        <div className="relative rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800/90 shadow-xs focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all overflow-hidden">
          
          {/* UPLOADED REFERENCE IMAGES GALLERY PREVIEW */}
          {images.length > 0 && (
            <div className="p-3 bg-indigo-50/40 dark:bg-indigo-950/20 border-b border-indigo-100 dark:border-indigo-900/40">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                    Referensi Visual Terlampir ({images.length} gambar)
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-800">
                    Multimodal Grounding Aktif
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleClearAllImages}
                  disabled={disabled}
                  className="text-[11px] font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  Hapus Semua
                </button>
              </div>

              {/* Responsive Image Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                {images.map((img, index) => (
                  <div
                    key={img.id}
                    className="group relative rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden shadow-2xs transition-all hover:shadow-xs"
                  >
                    <div className="aspect-4/3 w-full bg-gray-100 dark:bg-gray-900 overflow-hidden relative">
                      <img
                        src={img.dataUrl}
                        alt={img.name}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                      {/* Reference Badge */}
                      <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-white text-[9px] font-mono font-bold tracking-tight">
                        Ref #{index + 1}
                      </span>
                      {/* Individual Delete Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(img.id)}
                        disabled={disabled}
                        className="absolute top-1 right-1 p-1 rounded-md bg-red-600/90 text-white hover:bg-red-700 transition-colors shadow-sm cursor-pointer opacity-90 group-hover:opacity-100"
                        title="Hapus gambar ini"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    {/* Caption: File Name & Size */}
                    <div className="p-1.5 text-[10px] bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700/60">
                      <p className="font-semibold text-gray-800 dark:text-gray-200 truncate" title={img.name}>
                        {img.name}
                      </p>
                      <p className="text-gray-500 dark:text-gray-400 text-[9px]">
                        {formatFileSize(img.sizeBytes)}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Quick Add Card */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled}
                  className="rounded-xl border-2 border-dashed border-indigo-200 dark:border-indigo-800/60 hover:border-indigo-400 dark:hover:border-indigo-600 bg-white/60 dark:bg-gray-800/40 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition-all flex flex-col items-center justify-center p-3 text-center cursor-pointer min-h-[90px]"
                  title="Tambah gambar referensi lagi"
                >
                  <Plus className="w-5 h-5 text-indigo-500 mb-1" />
                  <span className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">
                    Tambah
                  </span>
                  <span className="text-[9px] text-gray-500 dark:text-gray-400">
                    JPG/PNG/WEBP
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Text Input */}
          <textarea
            ref={textareaRef}
            rows={images.length > 0 ? 5 : 7}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            placeholder={
              images.length > 0
                ? "Ketik instruksi optimasi berdasarkan gambar referensi di atas (misal: analisis pose, komposisi, pencahayaan, atau buatkan prompt pembuatan gambar baru dengan estetika serupa)..."
                : "Masukkan ide, instruksi, atau prompt mentah yang ingin kamu optimalkan..."
            }
            className="w-full p-4 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 bg-transparent resize-y focus:outline-none leading-relaxed"
          />

          {/* Footer Counters */}
          <div className="flex items-center justify-between px-4 py-2 bg-gray-50/70 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700/60 text-[11px] text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-500" />
              Formula PCTCE+O aktif {images.length > 0 && `• ${images.length} Gambar Referensi Visual`}
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
