import React, { useState, useEffect } from 'react';
import {
  X,
  Key,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  RefreshCw,
  Trash2,
  Cpu,
  Sparkles,
  Server,
  Globe,
  Layers,
  Check,
} from 'lucide-react';
import { ConnectionTestResult, AIProviderId, AI_PROVIDERS, GEMINI_MODEL_OPTIONS } from '../types';
import {
  getActiveProvider,
  setActiveProvider,
  getProviderApiKey,
  saveProviderApiKey,
  clearProviderApiKey,
  getSelectedGeminiModel,
  setSelectedGeminiModel,
  getCrowLLMBaseUrl,
  setCrowLLMBaseUrl,
  getCrowLLMModelId,
  setCrowLLMModelId,
  getFallbackConfig,
  setFallbackConfig,
  loadCrowLLMModelsApi,
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

  // CrowLLM states
  const [crowBaseUrl, setCrowBaseUrlState] = useState('https://crowllm.com/v1');
  const [crowModelId, setCrowModelIdState] = useState('');
  const [crowAvailableModels, setCrowAvailableModels] = useState<string[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [modelLoadError, setModelLoadError] = useState<string | null>(null);

  // Fallback states
  const [fallbackEnabled, setFallbackEnabledState] = useState(false);
  const [fallbackSecondary, setFallbackSecondaryState] = useState<AIProviderId>('gemini-3.8-flash');

  useEffect(() => {
    if (isOpen) {
      const active = getActiveProvider();
      setSelectedProvider(active);

      const currentGeminiModel = getSelectedGeminiModel();
      setSelectedModel(currentGeminiModel);

      const currentCrowUrl = getCrowLLMBaseUrl();
      setCrowBaseUrlState(currentCrowUrl);

      const currentCrowModel = getCrowLLMModelId();
      setCrowModelIdState(currentCrowModel);

      const key = getProviderApiKey(active, active === 'gemini-3.8-flash' ? currentGeminiModel : currentCrowModel);
      setApiKey(key);

      const fb = getFallbackConfig();
      setFallbackEnabledState(fb.enabled);
      setFallbackSecondaryState(fb.secondaryProvider);

      setTestResult(null);
      setSaveSuccess(false);
      setModelLoadError(null);

      checkServerStatus().then((status) => {
        setServerHasKey(status.hasEnvKey);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleProviderChange = (newProvider: AIProviderId) => {
    setSelectedProvider(newProvider);
    setTestResult(null);
    setSaveSuccess(false);
    setModelLoadError(null);

    if (newProvider === 'crowllm') {
      const currentCrowKey = getProviderApiKey('crowllm');
      setApiKey(currentCrowKey);
    } else if (newProvider === 'gemini-3.8-flash') {
      setApiKey(getProviderApiKey('gemini-3.8-flash', selectedModel));
    } else {
      setApiKey(getProviderApiKey('pctce-o-studio'));
    }
  };

  const handleGeminiModelChange = (modelId: string) => {
    setSelectedModel(modelId);
    setSelectedGeminiModel(modelId);
    if (selectedProvider === 'gemini-3.8-flash') {
      setApiKey(getProviderApiKey('gemini-3.8-flash', modelId));
    }
    setTestResult(null);
    setSaveSuccess(false);
  };

  const handleLoadCrowLLMModels = async () => {
    setIsLoadingModels(true);
    setModelLoadError(null);
    try {
      const res = await loadCrowLLMModelsApi(crowBaseUrl, apiKey);
      if (res.success && res.models.length > 0) {
        setCrowAvailableModels(res.models);
        if (!crowModelId && res.models.length > 0) {
          setCrowModelIdState(res.models[0]);
        }
      } else {
        setModelLoadError(res.error || 'Tidak ada model yang ditemukan pada endpoint /models.');
      }
    } catch (e: any) {
      setModelLoadError(e?.message || 'Gagal memuat model dari CrowLLM.');
    } finally {
      setIsLoadingModels(false);
    }
  };

  const handleSave = () => {
    setActiveProvider(selectedProvider);

    if (selectedProvider === 'gemini-3.8-flash') {
      saveProviderApiKey('gemini-3.8-flash', apiKey, selectedModel);
      setSelectedGeminiModel(selectedModel);
    } else if (selectedProvider === 'crowllm') {
      saveProviderApiKey('crowllm', apiKey);
      setCrowLLMBaseUrl(crowBaseUrl);
      setCrowLLMModelId(crowModelId);
    } else {
      saveProviderApiKey('pctce-o-studio', apiKey);
    }

    setFallbackConfig(fallbackEnabled, fallbackSecondary);

    setSaveSuccess(true);
    onApiKeyUpdated();
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleClear = () => {
    if (selectedProvider === 'crowllm') {
      clearProviderApiKey('crowllm');
      setApiKey('');
    } else {
      clearProviderApiKey(selectedProvider, selectedModel);
      setApiKey('');
    }
    setTestResult(null);
    onApiKeyUpdated();
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await testGeminiConnection(
        apiKey,
        selectedProvider,
        selectedProvider === 'crowllm' ? crowModelId : selectedModel,
        crowBaseUrl
      );
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
      <div className="relative w-full max-w-xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-base">
                AI Provider & API Key Manager
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Pilih dan konfigurasikan Google Gemini atau CrowLLM API Provider
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* PROVIDER SELECTION TABS */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              Pilihan Provider Aktif
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Option 1: Google Gemini */}
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
                      Google Gemini
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-snug">
                    Gemini 3.8 / 3.5 Flash & Pro (BYOK).
                  </p>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded-full bg-cyan-100 dark:bg-cyan-950/70 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/50">
                    Official
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

              {/* Option 2: CrowLLM */}
              <button
                type="button"
                onClick={() => handleProviderChange('crowllm')}
                className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                  selectedProvider === 'crowllm'
                    ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-gray-900 dark:text-white flex items-center gap-1.5">
                      <Server className="w-3.5 h-3.5 text-emerald-500" />
                      CrowLLM
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-snug">
                    OpenAI-Compatible Gateway (/chat/completions).
                  </p>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
                    Baru V2.0
                  </span>
                  <div
                    className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                      selectedProvider === 'crowllm'
                        ? 'border-indigo-600 bg-indigo-600 text-white'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    {selectedProvider === 'crowllm' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
              </button>

              {/* Option 3: Engine AI Studio PCTCE+O */}
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
                      PCTCE+O Studio
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-snug">
                    Engine lokal terstandar bebas kuota & offline.
                  </p>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded-full bg-violet-100 dark:bg-violet-950/70 text-violet-800 dark:text-violet-300 border border-violet-200 dark:border-violet-800/50">
                    Local Built-in
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

          {/* CROWLLM SETTINGS PANEL */}
          {selectedProvider === 'crowllm' && (
            <div className="space-y-3.5 p-4 rounded-xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900/50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                  <Server className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Konfigurasi CrowLLM Gateway
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  OpenAI Compatible
                </span>
              </div>

              {/* Base URL */}
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300">
                  API Base URL
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={crowBaseUrl}
                    onChange={(e) => setCrowBaseUrlState(e.target.value)}
                    placeholder="https://crowllm.com/v1"
                    className="w-full pl-9 pr-3.5 py-2 text-xs font-mono bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* API Key */}
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300">
                  CrowLLM API Key (Bearer Token)
                </label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="crow_... atau sk-..."
                    className="w-full pl-3.5 pr-20 py-2 text-xs font-mono bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded cursor-pointer"
                      title={showKey ? 'Sembunyikan' : 'Tampilkan'}
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    {apiKey && (
                      <button
                        type="button"
                        onClick={handleClear}
                        className="p-1 text-red-400 hover:text-red-600 rounded cursor-pointer"
                        title="Hapus Kunci"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Model ID & Load Button */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300">
                    Model ID
                  </label>
                  <button
                    type="button"
                    onClick={handleLoadCrowLLMModels}
                    disabled={isLoadingModels || !apiKey}
                    className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                  >
                    {isLoadingModels ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Memuat Model...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3 h-3" />
                        Muat Model dari Akun
                      </>
                    )}
                  </button>
                </div>

                {crowAvailableModels.length > 0 ? (
                  <select
                    value={crowModelId}
                    onChange={(e) => setCrowModelIdState(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white"
                  >
                    <option value="">-- Pilih Model yang Tersedia --</option>
                    {crowAvailableModels.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={crowModelId}
                    onChange={(e) => setCrowModelIdState(e.target.value)}
                    placeholder="Contoh: gpt-4o, llama-3-70b, mistral-large, dll."
                    className="w-full px-3 py-2 text-xs font-mono bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white"
                  />
                )}

                {modelLoadError && (
                  <p className="text-[10px] text-red-600 dark:text-red-400 mt-1">
                    {modelLoadError}
                  </p>
                )}
              </div>
            </div>
          )}

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
                      onClick={() => handleGeminiModelChange(opt.id)}
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

          {/* GEMINI & AI STUDIO API KEY INPUT (When not CrowLLM) */}
          {selectedProvider !== 'crowllm' && (
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
          )}

          {/* FALLBACK SYSTEM CONFIGURATION */}
          <div className="p-3.5 rounded-xl border border-gray-200 dark:border-gray-700/60 bg-gray-50 dark:bg-gray-800/40 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-500" />
                Sistem Fallback Otomatis
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={fallbackEnabled}
                  onChange={(e) => setFallbackEnabledState(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4.5 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug">
              Beralih ke provider cadangan jika provider utama mengalami kegagalan server, batas laju (429), atau kehabisan kuota.
            </p>

            {fallbackEnabled && (
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700 flex items-center gap-2">
                <span className="text-[11px] text-gray-700 dark:text-gray-300 font-medium">
                  Provider Cadangan:
                </span>
                <select
                  value={fallbackSecondary}
                  onChange={(e) => setFallbackSecondaryState(e.target.value as AIProviderId)}
                  className="text-xs px-2.5 py-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="gemini-3.8-flash" disabled={selectedProvider === 'gemini-3.8-flash'}>
                    Google Gemini
                  </option>
                  <option value="crowllm" disabled={selectedProvider === 'crowllm'}>
                    CrowLLM
                  </option>
                  <option value="pctce-o-studio" disabled={selectedProvider === 'pctce-o-studio'}>
                    PCTCE+O Studio (Lokal)
                  </option>
                </select>
              </div>
            )}
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
                    Provider: {selectedProvider === 'crowllm' ? `CrowLLM (${crowModelId || testResult.model})` : selectedProvider === 'gemini-3.8-flash' ? `Gemini API (${testResult.model || selectedModel})` : 'Engine AI Studio PCTCE+O'} • Waktu respon: {testResult.latency}ms
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
              Kunci API masing-masing provider disimpan di slot terisolasi pada penyimpanan lokal browser Anda (LocalStorage). Berganti provider tidak akan menghapus atau mencampur kunci antar-provider. Kunci tidak pernah diekspos di log console.
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
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              Simpan Konfigurasi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
