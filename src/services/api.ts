import { ConnectionTestResult, RefineResult, RefinerOptions } from '../types';
import { generateClientPctceRefinement } from './localEngine';

const API_KEY_STORAGE_KEY = 'prompt_refiner_user_gemini_api_key';

export function getStoredApiKey(): string {
  try {
    return localStorage.getItem(API_KEY_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

export function saveStoredApiKey(key: string): void {
  try {
    if (key.trim()) {
      localStorage.setItem(API_KEY_STORAGE_KEY, key.trim());
    } else {
      localStorage.removeItem(API_KEY_STORAGE_KEY);
    }
  } catch (e) {
    console.error('Failed to store API key', e);
  }
}

export function clearStoredApiKey(): void {
  try {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear API key', e);
  }
}

export async function checkServerStatus(): Promise<{ hasEnvKey: boolean; status: string }> {
  try {
    const res = await fetch('/api/status');
    if (!res.ok) throw new Error('Status endpoint unavailable');
    return await res.json();
  } catch {
    return { hasEnvKey: false, status: 'error' };
  }
}

export async function testGeminiConnection(keyToTest?: string): Promise<ConnectionTestResult> {
  const customKey = keyToTest !== undefined ? keyToTest : getStoredApiKey();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (customKey) {
    headers['x-gemini-api-key'] = customKey;
  }

  try {
    const res = await fetch('/api/test-connection', {
      method: 'POST',
      headers,
      body: JSON.stringify({ apiKey: customKey }),
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        message: data.message || data.error || 'Gagal terhubung ke Gemini API.',
      };
    }

    return {
      success: true,
      latency: data.latency,
      message: data.message || 'Koneksi Gemini API berhasil terverifikasi!',
      usingCustomKey: data.usingCustomKey,
    };
  } catch (err: any) {
    if (customKey && customKey.length > 20) {
      try {
        const start = Date.now();
        const directRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${customKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: 'Ping' }] }] }),
          }
        );
        const directData = await directRes.json();
        if (directRes.ok) {
          return {
            success: true,
            latency: Date.now() - start,
            message: 'Koneksi ke Google Gemini Cloud API berhasil terverifikasi langsung!',
            usingCustomKey: true,
          };
        } else {
          return {
            success: false,
            message: directData?.error?.message || 'Gemini API Key tidak valid menurut server Google.',
          };
        }
      } catch (directErr: any) {
        return {
          success: false,
          message: 'Gagal terhubung ke Google Gemini Cloud: ' + (directErr?.message || 'Network error'),
        };
      }
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

export async function resetSessionApi(): Promise<{ success: boolean; sessionId: string; message: string }> {
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
  const customKey = getStoredApiKey();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-session-id': currentSessionId,
  };

  if (customKey) {
    headers['x-gemini-api-key'] = customKey;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  try {
    const res = await fetch('/api/refine', {
      method: 'POST',
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        sessionId: currentSessionId,
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
      engineUsed: data.engineUsed,
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
    console.warn('[API] Server endpoint unavailable, using client-side standalone engine:', err?.message);

    // High-grade client-side standalone engine for GitHub Pages & Android APK
    const local = generateClientPctceRefinement(
      prompt,
      options.targetAI,
      options.mode,
      options.outputLang,
      options.promptStyle,
      options.customStyle
    );

    return {
      id: 'pr-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      createdAt: new Date().toISOString(),
      rawMarkdown: local.rawMarkdown,
      targetAiMode: local.targetAiMode,
      optimizedPrompt: local.optimizedPrompt,
      appliedTechniques: local.appliedTechniques,
      improvementQuestions: local.improvementQuestions,
      engineUsed: 'PCTCE+O Standalone Engine',
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
