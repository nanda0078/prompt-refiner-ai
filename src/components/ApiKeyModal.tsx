import React, { useState, useEffect } from 'react';
import { X, Key, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, ShieldCheck, RefreshCw, Trash2, Cpu, Sparkles } from 'lucide-react';
import { ConnectionTestResult, AIProviderId, AI_PROVIDERS, GEMINI_MODEL_OPTIONS } from '../types';
import {
  getActiveProvider,
  setActiveProvider,
  getProviderApiKey,
  saveProviderApiKey,
  clearProviderApiKey,
  getSelectedGeminiModel,
  setSelectedGeminiModel,
  testGeminiConnection,
  checkServerStatus,
} from '../services/api';

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
  const [selectedProvider, setSelectedProvider] = useState<AIProviderId>('gemini-3.8-flash');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.8-flash');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);
  const [serverHasKey, setServerHasKey] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const active = getActiveProvider();
      setSelectedProvider(active);
      const currentModel = getSelectedGeminiModel();
      setSelectedModel(currentModel);
      setApiKey(getProviderApiKey(active, currentModel));
      setTestResult(null);
      setSaveSuccess(false);
      checkServerStatus().then((status) => {
        setServerHasKey(status.hasEnvKey);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleProviderChange = (newProvider: AIProviderId) => {
    setSelectedProvider(newProvider);
    setApiKey(getProviderApiKey(newProvider));
    setTestResult(null);
    setSaveSuccess(false);
  };

  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
    setSelectedGeminiModel(modelId);
    setApiKey(getProviderApiKey(selectedProvider, modelId));
    setTestResult(null);
    setSaveSuccess(false);
  };

  const handleSave = () => {
    setActiveProvider(selectedProvider);
    saveProviderApiKey(selectedProvider, apiKey, selectedModel);
    if (selectedProvider === 'gemini-3.8-flash') {
      setSelectedGeminiModel(selectedModel);
    }
    setSaveSuccess(true);
    onApiKeyUpdated();
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleClear = () => {
    clearProviderApiKey(selectedProvider, selectedModel);
    setApiKey('');
    setTestResult(null);
    onApiKeyUpdated();
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await testGeminiConnection(apiKey, selectedProvider, selectedModel);
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

  const activeModelOption = GEMINI_MODEL_OPTIONS.find((m) => m.id === selectedModel) || {
    id: selectedModel,
    name: selectedModel,
    badge: '',
    description: '',
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
                Konfigurasi AI Engine & Google Gemini API Provider
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
        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* PROVIDER SELECTION */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              Pilihan Provider / AI Engine
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Option 1: Gemini API (gemini-3.8-flash) */}
              <button
                type="button"
                onClick={() => handleProviderChange('gemini-3.8-flash')}
                className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                  selectedProvider === 'gemini-3.8-flash'
                    ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-gray-900 dark:text-white flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                      Gemini API ({activeModelOption.name})
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug">
                    Google Gemini API langsung menggunakan {activeModelOption.name} (BYOK).
                  </p>
                </div>
                <div className="mt-2.5 flex items-center justify-between">
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950/70 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/50">
                    Default / New
                  </span>
                  <div
                    className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                      selectedProvider === 'gemini-3.8-flash'
                        ? 'border-indigo-600 bg-indigo-600 text-white'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    {selectedProvider === 'gemini-3.8-flash' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
              </button>

              {/* Option 2: Engine AI Studio PCTCE+O */}
              <button
                type="button"
                onClick={() => handleProviderChange('pctce-o-studio')}
                className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                  selectedProvider === 'pctce-o-studio'
                    ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-gray-900 dark:text-white flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-violet-500" />
                      Engine AI Studio PCTCE+O
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug">
                    Engine sintesis prompt PCTCE+O terstandar dengan alur kerja Lyra 4D.
                  </p>
                </div>
                <div className="mt-2.5 flex items-center justify-between">
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-950/70 text-violet-800 dark:text-violet-300 border border-violet-200 dark:border-violet-800/50">
                    Standard / Fallback
                  </span>
                  <div
                    className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                      selectedProvider === 'pctce-o-studio'
                        ? 'border-indigo-600 bg-indigo-600 text-white'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    {selectedProvider === 'pctce-o-studio' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* GEMINI MODEL SELECTOR (Visible when Gemini API is selected) */}
          {selectedProvider === 'gemini-3.8-flash' && (
            <div className="space-y-2 p-3.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/70 dark:border-indigo-900/50">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-200">
                  Pilihan Model Gemini
                </label>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  Model: {selectedModel}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {GEMINI_MODEL_OPTIONS.map((opt) => {
                  const isSelected = selectedModel === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleModelChange(opt.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                        isSelected
                          ? 'border-indigo-600 bg-white dark:bg-gray-800 ring-2 ring-indigo-500/25 shadow-xs'
                          : 'border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-800/40 hover:bg-white dark:hover:bg-gray-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-gray-900 dark:text-white">
                          {opt.name}
                        </span>
                        {opt.badge && (
                          <span
                            className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
                              opt.id === 'gemini-3.8-flash'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                                : opt.id === 'gemini-3.5-flash'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60'
                                : opt.id === 'gemini-2.5-flash'
                                ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/70 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/60'
                                : opt.id === 'gemini-2.5-pro'
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60'
                                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {opt.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-snug">
                        {opt.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Dynamic Status Banner based on selected provider */}
          <div className="p-3.5 rounded-xl border bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700/60 flex items-start gap-3">
            <Cpu className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
            <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900 dark:text-white">
                  {selectedProvider === 'gemini-3.8-flash'
                    ? `Status ${activeModelOption.name}:`
                    : 'Status Engine AI Studio PCTCE+O:'}
                </span>
                {selectedProvider === 'gemini-3.8-flash' ? (
                  apiKey ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/50">
                      <CheckCircle2 className="w-3 h-3" />
                      BYOK Siap Digunakan
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800/50">
                      <AlertCircle className="w-3 h-3" />
                      Memerlukan API Key
                    </span>
                  )
                ) : serverHasKey ? (
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
                {selectedProvider === 'gemini-3.8-flash'
                  ? `Model ${selectedModel} terhubung langsung ke Google Cloud AI. Masukkan Gemini API Key pribadi (BYOK) untuk aktivasi.`
                  : serverHasKey
                  ? 'Gemini API Key server terdeteksi aktif. Anda bisa langsung menggunakannya atau memasukkan kunci kustom jika ingin menimpanya.'
                  : 'Engine PCTCE+O lokal siap pakai (bebas kuota). Jika ingin menggunakan server eksternal, masukkan API Key Anda di bawah ini.'}
              </p>
            </div>
          </div>

          {/* Input Field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
              {selectedProvider === 'gemini-3.8-flash'
                ? `GOOGLE GEMINI API KEY (BYOK UNTUK ${activeModelOption.name.toUpperCase()})`
                : 'KUNCI API AI STUDIO KUSTOM (OPSIONAL)'}
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
                  className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                  title={showKey ? 'Sembunyikan' : 'Tampilkan'}
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                {apiKey && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="p-1.5 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                    title="Hapus Kunci"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              Dapatkan API Key resmi gratis di{' '}
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
                    Provider: {selectedProvider === 'gemini-3.8-flash' ? `Gemini API (${testResult.model || selectedModel})` : 'Engine AI Studio PCTCE+O'} • Waktu respon: {testResult.latency}ms
                  </p>
                )}
                {!testResult.success && testResult.model && (
                  <p className="text-[11px] opacity-75 mt-0.5 font-mono">
                    Model terkonfirmasi dipanggil: {testResult.model}
                  </p>
                )}
                {testResult.technicalDetails && (
                  <div className="mt-1.5 p-2 rounded-lg bg-red-100/60 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 font-mono text-[10px] break-all text-red-900 dark:text-red-200">
                    <span className="font-bold block mb-0.5">Detail Teknis Debugging:</span>
                    {typeof testResult.technicalDetails === 'string'
                      ? testResult.technicalDetails
                      : JSON.stringify(testResult.technicalDetails, null, 2)}
                  </div>
                )}
              </div>
            </div>
          )}

          {saveSuccess && (
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Konfigurasi Provider & Kunci API berhasil disimpan!
            </div>
          )}

          {/* Privacy & Security Note */}
          <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="text-[11px] text-blue-900 dark:text-blue-200 space-y-1 leading-relaxed">
              <span className="font-semibold block">Isolasi & Keamanan Kunci Provider:</span>
              Kunci API masing-masing provider disimpan di slot terisolasi pada penyimpanan lokal browser Anda (LocalStorage). Berganti provider tidak akan menghapus atau mencampur kunci antar-provider.
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40">
          <button
            onClick={handleTestConnection}
            disabled={isTesting}
            type="button"
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-xl transition-all disabled:opacity-50 cursor-pointer"
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
              className="px-4 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors cursor-pointer"
            >
              Tutup
            </button>
            <button
              onClick={handleSave}
              type="button"
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-all cursor-pointer"
            >
              Simpan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
