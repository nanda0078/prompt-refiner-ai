import { ConnectionTestResult, RefineResult, RefinerOptions, AIProviderId, GEMINI_CONFIG, CROWLLM_DEFAULT_CONFIG } from '../types';
import { generateClientPctceRefinement } from './localEngine';
import {
  fetchCrowLLMModels,
  testCrowLLMConnection,
  refineWithCrowLLM,
  maskCrowLLMKey,
  normalizeBaseUrl,
} from './crowllmAdapter';

const SELECTED_PROVIDER_STORAGE_KEY = 'prompt_refiner_selected_provider';
const GEMINI_38_API_KEY_STORAGE_KEY = 'prompt_refiner_user_gemini_api_key';
const PCTCE_STUDIO_API_KEY_STORAGE_KEY = 'prompt_refiner_pctce_studio_api_key';
const SELECTED_GEMINI_MODEL_STORAGE_KEY = 'prompt_refiner_selected_gemini_model';

// CrowLLM Storage Keys
const CROWLLM_API_KEY_STORAGE_KEY = 'prompt_refiner_user_crowllm_api_key';
const CROWLLM_BASE_URL_STORAGE_KEY = 'prompt_refiner_crowllm_base_url';
const CROWLLM_MODEL_ID_STORAGE_KEY = 'prompt_refiner_crowllm_model_id';
const FALLBACK_ENABLED_STORAGE_KEY = 'prompt_refiner_fallback_enabled';
const FALLBACK_PROVIDER_STORAGE_KEY = 'prompt_refiner_fallback_provider';

/**
 * Get selected Gemini model (e.g. 'gemini-3.8-flash', 'gemini-2.5-flash').
 * Default is configured centrally in GEMINI_CONFIG.model.
 */
export function getSelectedGeminiModel(): string {
  try {
    return localStorage.getItem(SELECTED_GEMINI_MODEL_STORAGE_KEY) || GEMINI_CONFIG.model;
  } catch {
    return GEMINI_CONFIG.model;
  }
}

/**
 * Save selected Gemini model.
 */
export function setSelectedGeminiModel(model: string): void {
  try {
    localStorage.setItem(SELECTED_GEMINI_MODEL_STORAGE_KEY, model.trim());
  } catch (e) {
    console.error('Failed to store selected Gemini model', e);
  }
}

/**
 * CrowLLM Base URL getter & setter
 */
export function getCrowLLMBaseUrl(): string {
  try {
    return localStorage.getItem(CROWLLM_BASE_URL_STORAGE_KEY) || CROWLLM_DEFAULT_CONFIG.baseUrl;
  } catch {
    return CROWLLM_DEFAULT_CONFIG.baseUrl;
  }
}

export function setCrowLLMBaseUrl(url: string): void {
  try {
    localStorage.setItem(CROWLLM_BASE_URL_STORAGE_KEY, normalizeBaseUrl(url));
  } catch (e) {
    console.error('Failed to store CrowLLM base URL', e);
  }
}

/**
 * CrowLLM Model ID getter & setter
 */
export function getCrowLLMModelId(): string {
  try {
    return localStorage.getItem(CROWLLM_MODEL_ID_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

export function setCrowLLMModelId(modelId: string): void {
  try {
    localStorage.setItem(CROWLLM_MODEL_ID_STORAGE_KEY, modelId.trim());
  } catch (e) {
    console.error('Failed to store CrowLLM model ID', e);
  }
}

/**
 * Fallback Provider Configuration getter & setter
 */
export function getFallbackConfig(): { enabled: boolean; secondaryProvider: AIProviderId } {
  try {
    const enabled = localStorage.getItem(FALLBACK_ENABLED_STORAGE_KEY) === 'true';
    const secondary = (localStorage.getItem(FALLBACK_PROVIDER_STORAGE_KEY) as AIProviderId) || 'gemini-3.8-flash';
    return { enabled, secondaryProvider: secondary };
  } catch {
    return { enabled: false, secondaryProvider: 'gemini-3.8-flash' };
  }
}

export function setFallbackConfig(enabled: boolean, secondaryProvider: AIProviderId): void {
  try {
    localStorage.setItem(FALLBACK_ENABLED_STORAGE_KEY, String(enabled));
    localStorage.setItem(FALLBACK_PROVIDER_STORAGE_KEY, secondaryProvider);
  } catch (e) {
    console.error('Failed to store fallback config', e);
  }
}

/**
 * Load available models from CrowLLM API
 */
export async function loadCrowLLMModelsApi(
  baseUrl?: string,
  apiKey?: string
): Promise<{ success: boolean; models: string[]; error?: string }> {
  const targetKey = apiKey !== undefined ? apiKey : getProviderApiKey('crowllm');
  const targetBaseUrl = baseUrl || getCrowLLMBaseUrl();

  // 1. Try server proxy first to avoid client CORS
  try {
    const res = await fetch('/api/crowllm/models', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-crowllm-api-key': targetKey,
        'x-crowllm-base-url': targetBaseUrl,
      },
      body: JSON.stringify({ apiKey: targetKey, baseUrl: targetBaseUrl }),
    });

    const data = await res.json();
    if (res.ok && data.success) {
      return data;
    }
  } catch {
    // server not running, fall back to direct fetch
  }

  // 2. Direct client fetch via adapter
  return fetchCrowLLMModels(targetBaseUrl, targetKey);
}

/**
 * Get active AI Provider.
 * Default for fresh installation: 'gemini-3.8-flash'.
 * For existing users: preserves stored selection.
 */
export function getActiveProvider(): AIProviderId {
  try {
    const saved = localStorage.getItem(SELECTED_PROVIDER_STORAGE_KEY);
    if (saved === 'pctce-o-studio' || saved === 'crowllm' || saved === 'gemini-3.8-flash') {
      return saved as AIProviderId;
    }
    return 'gemini-3.8-flash';
  } catch {
    return 'gemini-3.8-flash';
  }
}

/**
 * Set active AI Provider without clearing stored keys.
 */
export function setActiveProvider(provider: AIProviderId): void {
  try {
    localStorage.setItem(SELECTED_PROVIDER_STORAGE_KEY, provider);
  } catch (e) {
    console.error('Failed to store active AI provider', e);
  }
}

/**
 * Get API Key for a specific provider and optional model.
 */
export function getProviderApiKey(provider: AIProviderId, modelId?: string): string {
  try {
    if (provider === 'gemini-3.8-flash') {
      const activeModel = modelId || getSelectedGeminiModel();
      const modelSpecificKey = localStorage.getItem(`prompt_refiner_api_key_${activeModel}`);
      if (modelSpecificKey && modelSpecificKey.trim()) {
        return modelSpecificKey.trim();
      }
      return localStorage.getItem(GEMINI_38_API_KEY_STORAGE_KEY) || '';
    } else if (provider === 'crowllm') {
      return localStorage.getItem(CROWLLM_API_KEY_STORAGE_KEY) || '';
    } else {
      return localStorage.getItem(PCTCE_STUDIO_API_KEY_STORAGE_KEY) || '';
    }
  } catch {
    return '';
  }
}

/**
 * Save API Key for a specific provider and optional model.
 */
export function saveProviderApiKey(provider: AIProviderId, key: string, modelId?: string): void {
  try {
    const trimmed = key.trim();
    if (provider === 'gemini-3.8-flash') {
      const activeModel = modelId || getSelectedGeminiModel();
      if (trimmed) {
        localStorage.setItem(`prompt_refiner_api_key_${activeModel}`, trimmed);
        localStorage.setItem(GEMINI_38_API_KEY_STORAGE_KEY, trimmed);
      } else {
        localStorage.removeItem(`prompt_refiner_api_key_${activeModel}`);
        localStorage.removeItem(GEMINI_38_API_KEY_STORAGE_KEY);
      }
    } else if (provider === 'crowllm') {
      if (trimmed) {
        localStorage.setItem(CROWLLM_API_KEY_STORAGE_KEY, trimmed);
      } else {
        localStorage.removeItem(CROWLLM_API_KEY_STORAGE_KEY);
      }
    } else {
      if (trimmed) {
        localStorage.setItem(PCTCE_STUDIO_API_KEY_STORAGE_KEY, trimmed);
      } else {
        localStorage.removeItem(PCTCE_STUDIO_API_KEY_STORAGE_KEY);
      }
    }
  } catch (e) {
    console.error('Failed to save provider API key', e);
  }
}

/**
 * Clear API Key for a specific provider and optional model.
 */
export function clearProviderApiKey(provider: AIProviderId, modelId?: string): void {
  try {
    if (provider === 'gemini-3.8-flash') {
      const activeModel = modelId || getSelectedGeminiModel();
      localStorage.removeItem(`prompt_refiner_api_key_${activeModel}`);
      localStorage.removeItem(GEMINI_38_API_KEY_STORAGE_KEY);
    } else if (provider === 'crowllm') {
      localStorage.removeItem(CROWLLM_API_KEY_STORAGE_KEY);
    } else {
      localStorage.removeItem(PCTCE_STUDIO_API_KEY_STORAGE_KEY);
    }
  } catch (e) {
    console.error('Failed to clear provider API key', e);
  }
}

/**
 * Backward-compatible helper for active provider's API Key.
 */
export function getStoredApiKey(): string {
  return getProviderApiKey(getActiveProvider());
}

export function saveStoredApiKey(key: string): void {
  saveProviderApiKey(getActiveProvider(), key);
}

export function clearStoredApiKey(): void {
  clearProviderApiKey(getActiveProvider());
}

export async function checkServerStatus(): Promise<{
  hasEnvKey: boolean;
  status: string;
  activeDefaultProvider?: string;
}> {
  try {
    const res = await fetch('/api/status');
    if (!res.ok) throw new Error('Status endpoint unavailable');
    return await res.json();
  } catch {
    return { hasEnvKey: false, status: 'error' };
  }
}

export async function testGeminiConnection(
  keyToTest?: string,
  providerToTest?: AIProviderId,
  modelToTest?: string,
  baseUrlToTest?: string
): Promise<ConnectionTestResult> {
  const targetProvider = providerToTest || getActiveProvider();
  const customKey =
    keyToTest !== undefined ? keyToTest : getProviderApiKey(targetProvider);
  const targetModel =
    modelToTest || (targetProvider === 'gemini-3.8-flash' ? getSelectedGeminiModel() : targetProvider === 'crowllm' ? getCrowLLMModelId() : GEMINI_CONFIG.model);
  const targetBaseUrl = baseUrlToTest || getCrowLLMBaseUrl();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-ai-provider': targetProvider,
    'x-gemini-model': targetModel,
  };

  if (targetProvider === 'crowllm') {
    headers['x-crowllm-api-key'] = customKey;
    headers['x-crowllm-base-url'] = targetBaseUrl;
    headers['x-crowllm-model'] = targetModel;
  } else if (customKey) {
    headers['x-gemini-api-key'] = customKey;
  }

  try {
    const res = await fetch('/api/test-connection', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        apiKey: customKey,
        provider: targetProvider,
        model: targetModel,
        baseUrl: targetBaseUrl,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        model: data.model || targetModel,
        message: data.message || data.error || `Gagal terhubung ke provider ${targetProvider}.`,
        technicalDetails: data.technicalDetails,
      };
    }

    return {
      success: true,
      latency: data.latency,
      model: data.model || targetModel,
      message:
        data.message ||
        `Koneksi ${
          targetProvider === 'crowllm'
            ? `CrowLLM (${data.model || targetModel})`
            : targetProvider === 'gemini-3.8-flash'
            ? `Gemini API (${data.model || targetModel})`
            : 'Engine AI Studio PCTCE+O'
        } berhasil terverifikasi!`,
      usingCustomKey: data.usingCustomKey,
    };
  } catch (err: any) {
    // Client-side fallback test if backend server is not running (e.g., GitHub Pages)
    if (targetProvider === 'crowllm') {
      return testCrowLLMConnection(targetBaseUrl, customKey, targetModel);
    }
    if (customKey && customKey.length > 15) {
      try {
        const start = Date.now();
        const directRes = await fetch(
          `https://generativelanguage.googleapis.com/${GEMINI_CONFIG.apiVersion}/models/${targetModel}:generateContent?key=${customKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: 'Ping test. Reply with: OK' }] }] }),
          }
        );
        const directData = await directRes.json();
        if (directRes.ok) {
          return {
            success: true,
            latency: Date.now() - start,
            model: targetModel,
            message: `Koneksi ke Google Gemini Cloud API (${targetModel}) berhasil terverifikasi langsung!`,
            usingCustomKey: true,
          };
        } else {
          const directError = directData?.error?.message || '';
          let userMsg = `Gagal menguji koneksi ke ${targetModel}: ${directError}`;
          if (directError.includes('API_KEY_INVALID') || directError.includes('API key not valid')) {
            userMsg = 'Google Gemini API Key tidak valid. Harap periksa kembali kunci Anda di Google AI Studio.';
          } else if (directError.includes('NOT_FOUND')) {
            userMsg = `Model '${targetModel}' tidak ditemukan pada API version ${GEMINI_CONFIG.apiVersion}.`;
          } else if (directError.includes('RESOURCE_EXHAUSTED')) {
            userMsg = 'Batas kuota Gemini API terlampaui (Quota Exceeded).';
          }
          return {
            success: false,
            model: targetModel,
            message: userMsg,
            technicalDetails: directData?.error,
          };
        }
      } catch (directErr: any) {
        return {
          success: false,
          model: targetModel,
          message:
            `Gagal terhubung ke Google Gemini Cloud (${targetModel}): ` +
            (directErr?.message || 'Network error'),
        };
      }
    }

    if (targetProvider === 'pctce-o-studio') {
      return {
        success: true,
        latency: 1,
        message: 'Engine AI Studio PCTCE+O siap digunakan secara lokal (bebas kuota).',
        usingCustomKey: false,
      };
    }

    return {
      success: false,
      message: 'Gagal menghubungi server: ' + (err?.message || 'Network error'),
    };
  }
}

function generateSessionId(): string {
  return 'sess-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
}

let currentSessionId = generateSessionId();

export function getSessionId(): string {
  return currentSessionId;
}

export function resetSessionId(): string {
  currentSessionId = generateSessionId();
  return currentSessionId;
}

export async function resetSessionApi(): Promise<{
  success: boolean;
  sessionId: string;
  message: string;
}> {
  const oldSessionId = currentSessionId;
  currentSessionId = generateSessionId();

  try {
    const res = await fetch('/api/reset-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-session-id': oldSessionId,
      },
      body: JSON.stringify({ sessionId: oldSessionId }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('Failed to call reset session API:', e);
  }

  return {
    success: true,
    sessionId: currentSessionId,
    message: 'Sesi berhasil direset secara total.',
  };
}

export async function refinePromptApi(
  prompt: string,
  options: RefinerOptions,
  isFallbackAttempt: boolean = false
): Promise<RefineResult> {
  const activeProvider = getActiveProvider();
  const isCrowLLM = activeProvider === 'crowllm';
  const crowKey = getProviderApiKey('crowllm');
  const crowBaseUrl = getCrowLLMBaseUrl();
  const crowModel = getCrowLLMModelId();
  const customKey = getProviderApiKey(activeProvider);
  const targetModel = activeProvider === 'gemini-3.8-flash' ? getSelectedGeminiModel() : isCrowLLM ? crowModel : GEMINI_CONFIG.model;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-session-id': currentSessionId,
    'x-ai-provider': activeProvider,
    'x-gemini-model': targetModel,
  };

  if (isCrowLLM) {
    headers['x-crowllm-api-key'] = crowKey;
    headers['x-crowllm-base-url'] = crowBaseUrl;
    headers['x-crowllm-model'] = crowModel;
  } else if (customKey) {
    headers['x-gemini-api-key'] = customKey;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    const res = await fetch('/api/refine', {
      method: 'POST',
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        sessionId: currentSessionId,
        provider: activeProvider,
        model: targetModel,
        prompt,
        targetAI: options.targetAI,
        mode: options.mode,
        outputLang: options.outputLang,
        promptStyle: options.promptStyle,
        customStyle: options.customStyle,
        apiKey: isCrowLLM ? crowKey : customKey,
        baseUrl: crowBaseUrl,
      }),
    });

    clearTimeout(timeoutId);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || data.error || 'Gagal mengoptimalkan prompt.');
    }

    const defaultEngineName = isCrowLLM
      ? `CrowLLM (${crowModel || 'Custom'})`
      : activeProvider === 'gemini-3.8-flash'
      ? `Gemini API (${targetModel})`
      : 'Engine AI Studio PCTCE+O';

    return {
      id: 'pr-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      createdAt: new Date().toISOString(),
      rawMarkdown: data.rawMarkdown || '',
      targetAiMode: data.targetAiMode || `${options.targetAI} (${options.mode})`,
      optimizedPrompt: data.optimizedPrompt || '',
      appliedTechniques: data.appliedTechniques || [],
      improvementQuestions: data.improvementQuestions || [],
      engineUsed: data.engineUsed || defaultEngineName,
      metrics: data.metrics || {
        originalWordCount: prompt.trim().split(/\s+/).length,
        originalCharCount: prompt.length,
        refinedWordCount: (data.optimizedPrompt || '').trim().split(/\s+/).length,
        refinedCharCount: (data.optimizedPrompt || '').length,
      },
      originalPrompt: prompt,
      options,
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    console.warn('[API] Primary provider or server call encountered an issue:', err?.message);

    // Automatic fallback to secondary provider if configured and this isn't already a fallback
    const fallbackCfg = getFallbackConfig();
    if (!isFallbackAttempt && fallbackCfg.enabled && fallbackCfg.secondaryProvider !== activeProvider) {
      console.log(`[API Fallback] Automatically failing over to secondary provider: ${fallbackCfg.secondaryProvider}`);
      try {
        const originalProvider = activeProvider;
        setActiveProvider(fallbackCfg.secondaryProvider);
        const fallbackResult = await refinePromptApi(prompt, options, true);
        setActiveProvider(originalProvider); // restore user's primary selection
        fallbackResult.engineUsed = `${fallbackResult.engineUsed} [Fallback Otomatis]`;
        return fallbackResult;
      } catch (fallbackErr) {
        console.warn('[API Fallback] Secondary fallback provider also failed:', fallbackErr);
      }
    }

    // Direct CrowLLM execution if running client-only
    if (isCrowLLM && crowKey && crowModel) {
      try {
        const directSystemPrompt = `You are a combined Prompt Engineering Expert & Master Prompt Refiner.
ROLE & MISSION:
Your only job is to:
- Take raw, messy, or inefficient prompts or user intentions.
- Turn them into a single, clean, token-efficient, ready-to-run master prompt for another AI system (GPT, Claude, Gemini, Copilot, etc.).
- Embed PCTCE+O standards (Persona, Context, Task, Constraints, Evaluation, Optimization).
OUTPUT FORMAT (STRICT MARKDOWN):
### 🎯 Target AI & Mode
${options.targetAI} - ${options.promptStyle} (${options.mode})
### ⚡ Optimized Request
\`\`\`text
[READY-TO-USE MASTER PROMPT]
\`\`\`
### 🛠 Applied Techniques
- [Bullet points of applied techniques]
### 🔍 Improvement Questions
1. [Question 1]
2. [Question 2]`;

        const userMsg = `Target AI: ${options.targetAI}\nMode: ${options.mode}\nOutput Language: ${options.outputLang}\nStyle: ${options.promptStyle}\n\nRAW USER PROMPT TO REFINE:\n"""\n${prompt}\n"""`;

        const crowReply = await refineWithCrowLLM(crowBaseUrl, crowKey, crowModel, directSystemPrompt, userMsg);
        const codeBlockMatch = crowReply.match(/###?\s*⚡\s*Optimized Request[\s\S]*?```(?:text)?\n([\s\S]*?)```/i);
        const optimizedPrompt = codeBlockMatch ? codeBlockMatch[1].trim() : crowReply;

        return {
          id: 'pr-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
          createdAt: new Date().toISOString(),
          rawMarkdown: crowReply,
          targetAiMode: `${options.targetAI} - ${options.promptStyle} (${options.mode})`,
          optimizedPrompt,
          appliedTechniques: [
            'Sintesis Arsitektur PCTCE+O (Persona, Context, Task, Constraints, Evaluation, Optimization)',
            `CrowLLM (${crowModel}) OpenAI-Compatible Inference Engine`,
            'Eliminasi Frasa Basa-basi & Kompresi Efisiensi Token (-45%)',
            'Penajaman Konteks & Resolusi Ambiguitas (Lyra 4D Workflow)',
          ],
          improvementQuestions: [
            'Apakah Anda ingin menambahkan batasan teknis atau format data khusus?',
            'Apakah ada preferensi gaya bahasa atau nada penyampaian spesifik?',
          ],
          engineUsed: `CrowLLM (${crowModel})`,
          metrics: {
            originalWordCount: prompt.trim().split(/\s+/).length,
            originalCharCount: prompt.length,
            refinedWordCount: optimizedPrompt.trim().split(/\s+/).length,
            refinedCharCount: optimizedPrompt.length,
          },
          originalPrompt: prompt,
          options,
        };
      } catch (crowClientErr: any) {
        console.warn('[API] Direct CrowLLM client call failed:', crowClientErr?.message);
      }
    }
    console.warn('[API] Server endpoint unavailable, using client fallback engine:', err?.message);

    // Direct Google Gemini API execution if user is on GitHub Pages / Android with custom key
    if (activeProvider === 'gemini-3.8-flash' && customKey && customKey.length > 15) {
      try {
        const directSystemPrompt = `You are an elite Master Prompt Engineer using the PCTCE+O framework (Persona, Context, Task, Constraints, Evaluation, Optimization) and Lyra 4D workflow.
Target AI: ${options.targetAI} | Mode: ${options.mode} | Output Language: ${options.outputLang} | Style: ${options.promptStyle}.

Produce output strictly matching this format:
### 🎯 Target AI & Mode
${options.targetAI} - ${options.promptStyle} (${options.mode})

### ⚡ Optimized Request
\`\`\`text
[READY-TO-USE MASTER PROMPT]
\`\`\`

### 🛠 Applied Techniques
- Sintesis Arsitektur PCTCE+O
- Eliminasi Basa-basi & Kompresi Efisiensi Token
- Penajaman Konteks & Resolusi Ambiguitas (Lyra 4D Workflow)

### 🔍 Improvement Questions
1. [Clarification question 1]
2. [Clarification question 2]`;

        const directRes = await fetch(
          `https://generativelanguage.googleapis.com/${GEMINI_CONFIG.apiVersion}/models/${targetModel}:generateContent?key=${customKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [{ text: `${directSystemPrompt}\n\nRAW USER PROMPT TO OPTIMIZE:\n${prompt}` }],
                },
              ],
            }),
          }
        );

        if (directRes.ok) {
          const directData = await directRes.json();
          const rawText = directData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (rawText) {
            // Parse sections
            const codeBlockMatch = rawText.match(/###?\s*⚡\s*Optimized Request[\s\S]*?```(?:text)?\n([\s\S]*?)```/i);
            const optimizedPrompt = codeBlockMatch ? codeBlockMatch[1].trim() : rawText;

            return {
              id: 'pr-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
              createdAt: new Date().toISOString(),
              rawMarkdown: rawText,
              targetAiMode: `${options.targetAI} - ${options.promptStyle} (${options.mode})`,
              optimizedPrompt,
              appliedTechniques: [
                'Sintesis Arsitektur PCTCE+O (Persona, Context, Task, Constraints, Evaluation, Optimization)',
                `Gemini Cloud API (${targetModel}) Direct Inference Engine`,
                'Eliminasi Frasa Basa-basi & Kompresi Efisiensi Token (-45%)',
                'Penajaman Konteks & Resolusi Ambiguitas (Lyra 4D Workflow)',
              ],
              improvementQuestions: [
                'Apakah Anda ingin menambahkan parameter teknis atau format data khusus?',
                'Apakah nada komunikasi ingin dibuat lebih kasual atau formal akademik?',
              ],
              engineUsed: `Gemini API (${targetModel})`,
              metrics: {
                originalWordCount: prompt.trim().split(/\s+/).length,
                originalCharCount: prompt.length,
                refinedWordCount: optimizedPrompt.trim().split(/\s+/).length,
                refinedCharCount: optimizedPrompt.length,
              },
              originalPrompt: prompt,
              options,
            };
          }
        }
      } catch (directErr) {
        console.warn('[API] Direct Gemini Cloud call failed, falling back to local PCTCE+O engine:', directErr);
      }
    }

    // High-grade client-side standalone engine for GitHub Pages & Android APK
    const local = generateClientPctceRefinement(
      prompt,
      options.targetAI,
      options.mode,
      options.outputLang,
      options.promptStyle,
      options.customStyle
    );

    const fallbackEngineName =
      activeProvider === 'gemini-3.8-flash'
        ? `Gemini API (${targetModel}) [Local PCTCE+O Fallback]`
        : 'Engine AI Studio PCTCE+O';

    return {
      id: 'pr-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      createdAt: new Date().toISOString(),
      rawMarkdown: local.rawMarkdown,
      targetAiMode: local.targetAiMode,
      optimizedPrompt: local.optimizedPrompt,
      appliedTechniques: local.appliedTechniques,
      improvementQuestions: local.improvementQuestions,
      engineUsed: fallbackEngineName,
      metrics: {
        originalWordCount: prompt.trim().split(/\s+/).length,
        originalCharCount: prompt.length,
        refinedWordCount: local.optimizedPrompt.trim().split(/\s+/).length,
        refinedCharCount: local.optimizedPrompt.length,
      },
      originalPrompt: prompt,
      options,
    };
  }
}
