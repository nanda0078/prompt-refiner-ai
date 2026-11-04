import React, { useState, useEffect } from 'react';
import { X, Key, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, ShieldCheck, RefreshCw, Trash2, Cpu } from 'lucide-react';
import { ConnectionTestResult } from '../types';
import { getStoredApiKey, saveStoredApiKey, clearStoredApiKey, testGeminiConnection, checkServerStatus } from '../services/api';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApiKeyUpdated: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  onApiKeyUpdated,
}) => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);
  const [serverHasKey, setServerHasKey] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setApiKey(getStoredApiKey());
      setTestResult(null);
      setSaveSuccess(false);
      checkServerStatus().then((status) => {
        setServerHasKey(status.hasEnvKey);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    saveStoredApiKey(apiKey);
    setSaveSuccess(true);
    onApiKeyUpdated();
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleClear = () => {
    clearStoredApiKey();
    setApiKey('');
    setTestResult(null);
    onApiKeyUpdated();
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await testGeminiConnection(apiKey);
      setTestResult(result);
    } catch (e: any) {
      setTestResult({
        success: false,
        message: 'Pengujian koneksi gagal: ' + (e?.message || 'Error tidak diketahui'),
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-base">
                Gemini API Key Manager
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Konfigurasi akses Google Gemini API
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

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Status Banner */}
          <div className="p-3.5 rounded-xl border bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700/60 flex items-start gap-3">
            <Cpu className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
            <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900 dark:text-white">
                  Status Server AI Studio:
                </span>
                {serverHasKey ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/50">
                    <CheckCircle2 className="w-3 h-3" />
                    Environment Key Aktif
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-medium bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800/50">
                    <CheckCircle2 className="w-3 h-3" />
                    Engine PCTCE+O Siap Digunakan
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                {serverHasKey
                  ? 'Gemini API Key server terdeteksi aktif. Anda bisa langsung menggunakannya, atau memasukkan kunci kustom di bawah ini jika ingin menimpanya.'
                  : 'Aplikasi dilengkapi Engine Algoritmik PCTCE+O lokal siap pakai (bebas kuota). Jika ingin menggunakan Google Gemini Cloud AI secara langsung, masukkan Gemini API Key Anda di bawah ini.'}
              </p>
            </div>
          </div>

          {/* Input Field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
              KUNCI API GEMINI KUSTOM (OPSIONAL)
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full pl-3.5 pr-20 py-2.5 text-sm font-mono bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white placeholder-gray-400 transition-all"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  title={showKey ? 'Sembunyikan' : 'Tampilkan'}
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                {apiKey && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="p-1.5 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30"
                    title="Hapus Kunci"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              Dapatkan API Key gratis di{' '}
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-indigo-600 dark:text-indigo-400 underline font-medium hover:text-indigo-700"
              >
                Google AI Studio
              </a>
              .
            </p>
          </div>

          {/* Test Result Message */}
          {testResult && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                testResult.success
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                  : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="font-semibold">{testResult.message}</p>
                {testResult.latency !== undefined && (
                  <p className="text-[11px] opacity-80 mt-0.5">
                    Model: gemini-3.8-flash • Waktu respon: {testResult.latency}ms
                  </p>
                )}
              </div>
            </div>
          )}

          {saveSuccess && (
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Kunci API berhasil disimpan!
            </div>
          )}

          {/* Privacy & Security Note */}
          <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="text-[11px] text-blue-900 dark:text-blue-200 space-y-1 leading-relaxed">
              <span className="font-semibold block">Keamanan & Privasi Kunci API:</span>
              Kunci API kustom disimpan secara privat di penyimpanan lokal browser Anda (LocalStorage) dan hanya dikirim via header aman ke server proxy aplikasi ini. Kunci tidak pernah dibagikan ke pihak ketiga atau dicatat ke log publik.
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40">
          <button
            onClick={handleTestConnection}
            disabled={isTesting}
            type="button"
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-xl transition-all disabled:opacity-50"
          >
            {isTesting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                Menguji...
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5 text-indigo-500" />
                Uji Koneksi
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              type="button"
              className="px-4 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Tutup
            </button>
            <button
              onClick={handleSave}
              type="button"
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-all"
            >
              Simpan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
