import { ConnectionTestResult } from '../types';

/**
 * Mask API Key for safe console logging
 */
export function maskCrowLLMKey(key?: string): string {
  if (!key) return '(empty)';
  const trimmed = key.trim();
  if (trimmed.length <= 8) return '***';
  return `${trimmed.slice(0, 4)}...${trimmed.slice(-4)}`;
}

/**
 * Clean and normalize CrowLLM Base URL (defaults to https://crowllm.com/v1)
 */
export function normalizeBaseUrl(baseUrl?: string): string {
  if (!baseUrl || !baseUrl.trim()) {
    return 'https://crowllm.com/v1';
  }
  return baseUrl.trim().replace(/\/+$/, '');
}

/**
 * Fetch available models from CrowLLM /v1/models endpoint
 */
export async function fetchCrowLLMModels(
  baseUrl: string,
  apiKey: string,
  timeoutMs: number = 15000
): Promise<{ success: boolean; models: string[]; error?: string }> {
  const cleanBase = normalizeBaseUrl(baseUrl);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${cleanBase}/models`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey.trim()}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timer);
    const data = await res.json();

    if (!res.ok) {
      const errMsg = data?.error?.message || data?.message || `HTTP ${res.status}: Gagal memuat daftar model.`;
      return { success: false, models: [], error: errMsg };
    }

    // OpenAI models format: { data: [ { id: 'model-name' }, ... ] }
    let modelList: string[] = [];
    if (Array.isArray(data?.data)) {
      modelList = data.data.map((m: any) => m.id).filter(Boolean);
    } else if (Array.isArray(data)) {
      modelList = data.map((m: any) => typeof m === 'string' ? m : m.id).filter(Boolean);
    }

    modelList.sort((a, b) => a.localeCompare(b));
    return { success: true, models: modelList };
  } catch (err: any) {
    clearTimeout(timer);
    const isTimeout = err?.name === 'AbortError' || err?.message?.includes('aborted');
    return {
      success: false,
      models: [],
      error: isTimeout
        ? `Timeout saat memuat model dari ${cleanBase}/models (${timeoutMs}ms).`
        : (err?.message || 'Gagal menghubungi server CrowLLM.'),
    };
  }
}

/**
 * Test Connection to CrowLLM
 */
export async function testCrowLLMConnection(
  baseUrl: string,
  apiKey: string,
  modelId: string,
  timeoutMs: number = 20000
): Promise<ConnectionTestResult> {
  const cleanBase = normalizeBaseUrl(baseUrl);
  const trimmedKey = (apiKey || '').trim();
  const trimmedModel = (modelId || '').trim();

  if (!trimmedKey || trimmedKey.length < 5) {
    return {
      success: false,
      message: 'API Key CrowLLM belum diisi atau tidak valid.',
    };
  }

  if (!trimmedModel) {
    return {
      success: false,
      message: 'Model ID CrowLLM belum ditentukan. Masukkan Model ID manual atau muat model dari akun.',
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const startTime = Date.now();

  try {
    console.log(`[CrowLLM] Testing connection to ${cleanBase} with model: ${trimmedModel} (Key: ${maskCrowLLMKey(trimmedKey)})`);

    const res = await fetch(`${cleanBase}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${trimmedKey}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: trimmedModel,
        messages: [{ role: 'user', content: 'Ping test. Reply with: OK' }],
        max_tokens: 15,
        temperature: 0.1,
      }),
    });

    clearTimeout(timer);
    const latency = Date.now() - startTime;
    const data = await res.json();

    if (!res.ok) {
      const status = res.status;
      const apiMsg = data?.error?.message || data?.message || '';

      let friendlyMsg = `Koneksi ke CrowLLM gagal (HTTP ${status}): ${apiMsg}`;
      if (status === 401) {
        friendlyMsg = 'CrowLLM API Key tidak valid atau otentikasi Bearer ditolak (HTTP 401).';
      } else if (status === 402 || apiMsg.toLowerCase().includes('balance') || apiMsg.toLowerCase().includes('quota')) {
        friendlyMsg = 'Saldo atau kuota akun CrowLLM tidak mencukupi (Insufficient Balance / Quota).';
      } else if (status === 404 || apiMsg.toLowerCase().includes('model')) {
        friendlyMsg = `Model '${trimmedModel}' tidak ditemukan pada akun CrowLLM Anda (HTTP 404).`;
      } else if (status === 429) {
        friendlyMsg = 'Batas laju permintaan CrowLLM terlampaui (Rate Limit 429). Coba sesaat lagi.';
      } else if (status >= 500) {
        friendlyMsg = `Server CrowLLM sedang mengalami kendala (HTTP ${status}). Silakan coba beberapa saat lagi.`;
      }

      return {
        success: false,
        latency,
        model: trimmedModel,
        message: friendlyMsg,
        technicalDetails: data,
      };
    }

    return {
      success: true,
      latency,
      model: trimmedModel,
      message: `Koneksi ke CrowLLM (${trimmedModel}) berhasil terverifikasi dalam ${latency}ms!`,
      usingCustomKey: true,
    };
  } catch (err: any) {
    clearTimeout(timer);
    const latency = Date.now() - startTime;
    const isTimeout = err?.name === 'AbortError' || err?.message?.includes('aborted');

    return {
      success: false,
      latency,
      model: trimmedModel,
      message: isTimeout
        ? `Timeout saat menghubungkan ke CrowLLM setelah ${timeoutMs}ms. Periksa koneksi internet atau Base URL.`
        : `Gagal menghubungi endpoint CrowLLM: ${err?.message || 'Network error'}`,
    };
  }
}

/**
 * Execute Prompt Refinement using CrowLLM
 */
export async function refineWithCrowLLM(
  baseUrl: string,
  apiKey: string,
  modelId: string,
  systemInstruction: string,
  userPrompt: string,
  timeoutMs: number = 35000
): Promise<string> {
  const cleanBase = normalizeBaseUrl(baseUrl);
  const trimmedKey = (apiKey || '').trim();
  const trimmedModel = (modelId || '').trim();

  if (!trimmedKey) throw new Error('CrowLLM API Key belum diatur.');
  if (!trimmedModel) throw new Error('CrowLLM Model ID belum dipilih.');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${cleanBase}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${trimmedKey}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: trimmedModel,
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
      }),
    });

    clearTimeout(timer);
    const data = await res.json();

    if (!res.ok) {
      const status = res.status;
      const apiMsg = data?.error?.message || data?.message || '';

      if (status === 401) throw new Error('Otentikasi CrowLLM gagal (API Key tidak valid).');
      if (status === 402 || apiMsg.toLowerCase().includes('balance')) {
        throw new Error('Saldo / kuota akun CrowLLM tidak mencukupi.');
      }
      if (status === 429) throw new Error('Batas permintaan CrowLLM terlampaui (Rate Limit 429).');
      if (status >= 500) throw new Error(`Server CrowLLM mengalami kendala internal (HTTP ${status}).`);

      throw new Error(`CrowLLM API error (HTTP ${status}): ${apiMsg}`);
    }

    const content = data?.choices?.[0]?.message?.content;
    if (!content || !content.trim()) {
      throw new Error('Respons CrowLLM kosong.');
    }

    return content.trim();
  } catch (err: any) {
    clearTimeout(timer);
    if (err?.name === 'AbortError' || err?.message?.includes('aborted')) {
      throw new Error(`Timeout saat memproses optimasi dengan CrowLLM (${timeoutMs}ms).`);
    }
    throw err;
  }
}
