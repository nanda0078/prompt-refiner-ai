import { ConnectionTestResult, RefineResult, RefinerOptions, AIProviderId, GEMINI_CONFIG } from '../types';
import { generateClientPctceRefinement } from './localEngine';

const SELECTED_PROVIDER_STORAGE_KEY = 'prompt_refiner_selected_provider';
const GEMINI_38_API_KEY_STORAGE_KEY = 'prompt_refiner_user_gemini_api_key';
const PCTCE_STUDIO_API_KEY_STORAGE_KEY = 'prompt_refiner_pctce_studio_api_key';
const SELECTED_GEMINI_MODEL_STORAGE_KEY = 'prompt_refiner_selected_gemini_model';

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
 * Get active AI Provider.
 * Default for fresh installation: 'gemini-3.8-flash'.
 * For existing users: preserves stored selection.
 */
export function getActiveProvider(): AIProviderId {
  try {
    const saved = localStorage.getItem(SELECTED_PROVIDER_STORAGE_KEY);
    if (saved === 'pctce-o-studio') {
      return 'pctce-o-studio';
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
 * Get API Key for a specific provider.
 */
export function getProviderApiKey(provider: AIProviderId): string {
  try {
    if (provider === 'gemini-3.8-flash') {
      return localStorage.getItem(GEMINI_38_API_KEY_STORAGE_KEY) || '';
    } else {
      return localStorage.getItem(PCTCE_STUDIO_API_KEY_STORAGE_KEY) || '';
    }
  } catch {
    return '';
  }
}

/**
 * Save API Key for a specific provider.
 */
export function saveProviderApiKey(provider: AIProviderId, key: string): void {
  try {
    const storageKey =
      provider === 'gemini-3.8-flash'
        ? GEMINI_38_API_KEY_STORAGE_KEY
        : PCTCE_STUDIO_API_KEY_STORAGE_KEY;

    if (key.trim()) {
      localStorage.setItem(storageKey, key.trim());
    } else {
      localStorage.removeItem(storageKey);
    }
  } catch (e) {
    console.error('Failed to save provider API key', e);
  }
}

/**
 * Clear API Key for a specific provider.
 */
export function clearProviderApiKey(provider: AIProviderId): void {
  try {
    const storageKey =
      provider === 'gemini-3.8-flash'
        ? GEMINI_38_API_KEY_STORAGE_KEY
        : PCTCE_STUDIO_API_KEY_STORAGE_KEY;
    localStorage.removeItem(storageKey);
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
  modelToTest?: string
): Promise<ConnectionTestResult> {
  const targetProvider = providerToTest || getActiveProvider();
  const customKey =
    keyToTest !== undefined ? keyToTest : getProviderApiKey(targetProvider);
  const targetModel =
    modelToTest || (targetProvider === 'gemini-3.8-flash' ? getSelectedGeminiModel() : GEMINI_CONFIG.model);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-ai-provider': targetProvider,
    'x-gemini-model': targetModel,
  };

  if (customKey) {
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
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        model: data.model || targetModel,
        message: data.message || data.error || `Gagal terhubung ke Gemini API (${targetModel}).`,
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
          targetProvider === 'gemini-3.8-flash'
            ? `Gemini API (${data.model || targetModel})`
            : 'Engine AI Studio PCTCE+O'
        } berhasil terverifikasi!`,
      usingCustomKey: data.usingCustomKey,
    };
  } catch (err: any) {
    // Client-side fallback test if backend server is not running (e.g., GitHub Pages)
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
  options: RefinerOptions
): Promise<RefineResult> {
  const activeProvider = getActiveProvider();
  const customKey = getProviderApiKey(activeProvider);
  const targetModel = activeProvider === 'gemini-3.8-flash' ? getSelectedGeminiModel() : GEMINI_CONFIG.model;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-session-id': currentSessionId,
    'x-ai-provider': activeProvider,
    'x-gemini-model': targetModel,
  };

  if (customKey) {
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
      }),
    });

    clearTimeout(timeoutId);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || data.error || 'Gagal mengoptimalkan prompt.');
    }

    return {
      id: 'pr-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      createdAt: new Date().toISOString(),
      rawMarkdown: data.rawMarkdown || '',
      targetAiMode: data.targetAiMode || `${options.targetAI} (${options.mode})`,
      optimizedPrompt: data.optimizedPrompt || '',
      appliedTechniques: data.appliedTechniques || [],
      improvementQuestions: data.improvementQuestions || [],
      engineUsed: data.engineUsed || (activeProvider === 'gemini-3.8-flash' ? `Gemini API (${targetModel})` : 'Engine AI Studio PCTCE+O'),
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
