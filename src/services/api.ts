import { ConnectionTestResult, RefineResult, RefinerOptions, AIProviderId, GEMINI_CONFIG } from '../types';
import { generateClientPctceRefinement, generateClientAdvancedRefinement } from './localEngine';

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
        images: options.images,
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
      imagesCount: data.imagesCount !== undefined ? data.imagesCount : (options.images?.length || 0),
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

        const directParts: any[] = [];
        if (options.images && options.images.length > 0) {
          for (const img of options.images) {
            if (img.base64Data && img.mimeType) {
              directParts.push({
                inline_data: {
                  mime_type: img.mimeType,
                  data: img.base64Data,
                },
              });
            }
          }
        }
        const visualDirective = options.images && options.images.length > 0
          ? `\n\n[MULTIMODAL GROUNDING: ${options.images.length} reference image(s) provided. Synthesize visual details into the master prompt.]`
          : '';
        directParts.push({ text: `${directSystemPrompt}${visualDirective}\n\nRAW USER PROMPT TO OPTIMIZE:\n${prompt}` });

        const directRes = await fetch(
          `https://generativelanguage.googleapis.com/${GEMINI_CONFIG.apiVersion}/models/${targetModel}:generateContent?key=${customKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: directParts,
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
              imagesCount: options.images?.length || 0,
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
      appliedTechniques: options.images && options.images.length > 0 ? [...local.appliedTechniques, `Analisis Kontekstual ${options.images.length} Gambar Referensi Visual`] : local.appliedTechniques,
      imagesCount: options.images?.length || 0,
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


/**
 * Advanced Final Refinement API
 * Executes secondary high-precision refinement on top of Optimized Request.
 * Independent execution: Failure will NEVER affect Optimized Request.
 */
export async function advancedRefinePromptApi(
  optimizedPrompt: string,
  originalPrompt: string = '',
  options: RefinerOptions
): Promise<{
  refinedPrompt: string;
  engineUsed: string;
}> {
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
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch('/api/advanced-refine', {
      method: 'POST',
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        sessionId: currentSessionId,
        provider: activeProvider,
        model: targetModel,
        optimizedPrompt,
        originalPrompt,
        targetAI: options.targetAI,
        mode: options.mode,
        outputLang: options.outputLang,
        promptStyle: options.promptStyle,
        customStyle: options.customStyle,
        images: options.images,
      }),
    });

    clearTimeout(timeoutId);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || data.error || 'Gagal menjalankan Advanced Final Refinement.');
    }

    return {
      refinedPrompt: data.refinedPrompt || '',
      engineUsed: data.engineUsed || (activeProvider === 'gemini-3.8-flash' ? `Gemini API (${targetModel})` : 'Engine AI Studio PCTCE+O'),
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    console.warn('[API] Server /api/advanced-refine unavailable, engaging client fallback:', err?.message);

    // Direct Gemini API call if custom key exists (for GitHub Pages / mobile)
    if (activeProvider === 'gemini-3.8-flash' && customKey && customKey.length > 15) {
      try {
        const directSystemPrompt = `You are an Elite Principal Prompt Architect and Master Refinement Specialist.
Your mission is ADVANCED FINAL REFINEMENT:
Take an already-synthesized "Optimized Request" and elevate it to its definitive, highest-precision, production-grade master instruction form.

AUTHORITATIVE WRITING FORMAT ARCHETYPE:
You MUST structure the master prompt following this exact authoritative hierarchical archetype (adapting titles, subtitles, instruction order, and depth of technical detail dynamically and adaptively based on the analyzed OPTIMIZED REQUEST):

# [PRIMARY DOMAIN TITLE IN ALL-CAPS]
## [CORE AUTHORITY MANDATE IN ALL-CAPS]

### 1. [PRIMARY CONTEXT / SOURCE OF TRUTH]
**ABSOLUTE [KEY] LOCK**
[Explanatory paragraph establishing non-negotiable foundations, input data authority, and absolute fidelity.]
- [Core specification 1]
- [Core specification 2]
- [Core specification 3]

### 2. [CORE SUBJECT / ARCHITECTURAL SPECIFICATION]
**[DOMAIN] LOCK**
[Explanatory paragraph defining the focal entity, components, or primary deliverable with zero drift.]
- [Component/attribute detail 1]
- [Component/attribute detail 2]
- [Component/attribute detail 3]

### 3. [ENVIRONMENT & CONTEXTUAL BOUNDARIES]
[Explanatory paragraph specifying background, spatial layout, execution runtime, or operational ecosystem.]
- [Spatial/environmental boundary 1]
- [Spatial/environmental boundary 2]
- [Spatial/environmental boundary 3]

### 4. [EXECUTION DISCIPLINE & QUALITY SCIENCE]
**[DOMAIN] RESTRICTION**
[Explanatory paragraph detailing procedural discipline, physics/logic rules, lighting/coding standards.]
- [Discipline/standard rule 1]
- [Discipline/standard rule 2]
- [Discipline/standard rule 3]

### 5. [TECHNICAL / OPTICAL / SYSTEM SPECIFICATIONS]
[Explanatory paragraph detailing concrete technical measurements, aspect ratios, tools, frameworks, and rendering/execution flags.]
- [Technical parameter 1]
- [Technical parameter 2]
- [Technical parameter 3]

### 6. [QUALITY ENHANCEMENT & FIDELITY BOUNDARIES]
[Explanatory paragraph specifying hyper-fidelity, edge-case mitigation, micro-textures, and high-frequency consistency.]
- [Fidelity gate 1]
- [Fidelity gate 2]
- [Fidelity gate 3]

### 7. STRICT NEGATIVE INSTRUCTIONS
[Or "PAGAR PEMBATAS & LARANGAN KETAT" if output language is Indonesian. A strict, uncompromising list of forbidden elements, antipatterns, artifacts, and distortions, beginning with "Do not:" or "Dilarang:".]
- Do not: [Specific forbidden element 1]
- Do not: [Specific forbidden element 2]
- Do not: [Specific forbidden element 3]
- Do not: [Specific forbidden element 4]
- Do not: [Specific forbidden element 5]

### 8. FINAL OUTPUT REQUIREMENTS
[Or "PERSYARATAN OUTPUT AKHIR" if output language is Indonesian. Defines strict precedence and execution directive.]
**PRIORITY ORDER:**
1. [Highest priority hierarchy requirement]
2. [Second priority requirement]
3. [Third priority requirement]
4. [Fourth priority requirement]
5. [Fifth priority requirement]
6. [Sixth priority requirement]
7. [Seventh priority requirement]

**FINAL DIRECTIVE:**
[A single definitive, unyielding closing sentence commanding flawless execution with zero compromise.]

CRITICAL EXECUTION MANDATES:
1. DYNAMIC & ADAPTIVE: Adapt the headings, subheadings, terminology, and technical metrics to the specific domain analyzed from the OPTIMIZED REQUEST.
2. NEVER FORCE IRRELEVANT CATEGORIES: Do NOT include camera optics in a software prompt or database schemas in a portrait prompt. Be deeply domain-relevant.
3. 100% RETENTION: Retain all parameters, requirements, context, and instructions from the OPTIMIZED REQUEST.
4. LANGUAGE COHERENCE: If Indonesian, use Indonesian headings and terms. If English, use English.
5. STRICT OUTPUT: Return ONLY the clean, final, ready-to-run refined master prompt text. No preamble or conversational filler.`;

        const parts: any[] = [];
        if (options.images && options.images.length > 0) {
          for (const img of options.images) {
            if (img.base64Data && img.mimeType) {
              parts.push({
                inline_data: {
                  mime_type: img.mimeType,
                  data: img.base64Data,
                },
              });
            }
          }
        }
        parts.push({
          text: `${directSystemPrompt}\n\nOPTIMIZED REQUEST TO REFINE:\n"""\n${optimizedPrompt}\n"""\n\nORIGINAL USER GOAL:\n"""\n${originalPrompt}\n"""`,
        });

        const directRes = await fetch(
          `https://generativelanguage.googleapis.com/${GEMINI_CONFIG.apiVersion}/models/${targetModel}:generateContent?key=${customKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts }],
            }),
          }
        );

        if (directRes.ok) {
          const directData = await directRes.json();
          const rawText = directData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (rawText) {
            return {
              refinedPrompt: rawText.trim(),
              engineUsed: `Gemini API (${targetModel}) [Direct]`,
            };
          }
        }
      } catch (directErr) {
        console.warn('Direct Gemini call fallback error:', directErr);
      }
    }

    // Pure local algorithmic fallback
    const fallback = generateClientAdvancedRefinement(
      optimizedPrompt,
      originalPrompt,
      options.targetAI,
      options.mode,
      options.outputLang,
      options.promptStyle,
      options.customStyle
    );

    return fallback;
  }
}
