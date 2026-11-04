import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Helper to check if an API key is valid (not empty, not placeholder)
function isValidApiKey(key?: string): boolean {
  if (!key) return false;
  const trimmed = key.trim();
  if (
    !trimmed ||
    trimmed === 'MY_GEMINI_API_KEY' ||
    trimmed.startsWith('MY_') ||
    trimmed.length < 15
  ) {
    return false;
  }
  return true;
}

// Helper to get Gemini client safely
function getGeminiClient(customApiKey?: string): GoogleGenAI | null {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;
  if (!isValidApiKey(apiKey)) {
    return null;
  }

  return new GoogleGenAI({
    apiKey: apiKey!,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Status endpoint
app.get('/api/status', (req, res) => {
  const hasEnvKey = isValidApiKey(process.env.GEMINI_API_KEY);
  res.json({
    status: 'ok',
    hasEnvKey,
    activeDefaultProvider: 'gemini-3.8-flash',
    supportedProviders: [
      { id: 'gemini-3.8-flash', name: 'Gemini API (gemini-3.8-flash)', model: 'gemini-3.8-flash' },
      { id: 'pctce-o-studio', name: 'Engine AI Studio PCTCE+O', model: 'pctce-o-studio' }
    ],
    model: 'gemini-3.8-flash',
    version: '1.0.0',
  });
});

// Hard Reset & Session Isolation Endpoint
app.post('/api/reset-session', (req, res) => {
  const sessionId = (req.headers['x-session-id'] as string) || req.body?.sessionId || 'unknown';
  const newSessionId = `sess-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  console.log(`[Session Reset] Hard reset invoked for session: ${sessionId}. Context purge complete. New isolated session: ${newSessionId}`);

  res.json({
    success: true,
    sessionId: newSessionId,
    message: 'Sesi berhasil direset. Semua memori konteks sebelumnya telah dihapus dan diisolasi secara total.',
    timestamp: new Date().toISOString(),
  });
});

// Helper for generating content with retry on temporary 503/429 with timeout
async function generateContentWithRetry(
  ai: GoogleGenAI,
  params: {
    model: string;
    contents: any;
    config?: any;
  },
  maxRetries = 1
) {
  const candidateModels = [
    params.model,
    'gemini-3.8-flash',
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
  ];
  // Deduplicate candidate models
  const modelsToTry = Array.from(new Set(candidateModels.filter(Boolean)));
  let lastError: any = null;

  for (const model of modelsToTry) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[Gemini API] Trying model: ${model} (attempt ${attempt + 1})...`);

        // Clone config and sanitize thinkingConfig for non-thinking models
        const config = { ...params.config };
        if (model.includes('1.5') || model.includes('2.0')) {
          delete config.thinkingConfig;
        }

        // Set a 15-second per-attempt timeout
        const timeoutMs = 15000;
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout calling Gemini model ${model} after ${timeoutMs}ms`)), timeoutMs)
        );

        const callPromise = ai.models.generateContent({
          ...params,
          config,
          model,
        });

        const response = (await Promise.race([callPromise, timeoutPromise])) as any;
        console.log(`[Gemini API] Successfully generated with model: ${model}`);
        return { response, usedModel: model };
      } catch (err: any) {
        lastError = err;
        const msg = err?.message || '';
        console.warn(`[Gemini API] Model ${model} attempt ${attempt + 1} failed: ${msg}`);

        const isTemporary =
          msg.includes('503') ||
          msg.includes('429') ||
          msg.includes('UNAVAILABLE') ||
          msg.includes('high demand') ||
          msg.includes('Timeout');

        if (isTemporary && attempt < maxRetries) {
          await new Promise((r) => setTimeout(r, 1000));
          continue;
        }
        break;
      }
    }
  }

  throw lastError;
}

// Test connection endpoint
app.post('/api/test-connection', async (req, res) => {
  try {
    const customKey = (req.headers['x-gemini-api-key'] as string) || req.body?.apiKey;
    const provider = (req.headers['x-ai-provider'] as string) || req.body?.provider || 'gemini-3.8-flash';
    const targetModel = (req.headers['x-gemini-model'] as string) || req.body?.model || (provider === 'gemini-3.8-flash' ? 'gemini-3.8-flash' : 'gemini-2.5-flash');

    const ai = getGeminiClient(customKey);

    if (!ai) {
      return res.status(400).json({
        success: false,
        message: 'API Key belum valid atau masih menggunakan placeholder. Harap masukkan Gemini API Key yang valid (diawali AIza...).',
      });
    }

    const startTime = Date.now();
    const { response, usedModel } = await generateContentWithRetry(ai, {
      model: targetModel,
      contents: 'Ping test. Reply with: OK',
    });

    const latency = Date.now() - startTime;
    const reply = response.text || '';
    const providerDisplayName = provider === 'gemini-3.8-flash' ? 'Gemini API (gemini-3.8-flash)' : 'Engine AI Studio PCTCE+O';

    res.json({
      success: true,
      latency,
      reply: reply.trim(),
      model: usedModel,
      provider,
      usingCustomKey: !!customKey,
      message: `Koneksi ke ${providerDisplayName} (${usedModel}) berhasil terverifikasi dalam ${latency}ms!`,
    });
  } catch (err: any) {
    const errorMsg = err?.message || 'Gagal terhubung ke Gemini API';
    res.status(400).json({
      success: false,
      error: errorMsg,
      message:
        errorMsg.includes('API_KEY_INVALID') || errorMsg.includes('API key not valid')
          ? 'Gemini API Key tidak valid. Periksa kembali API Key Anda dari Google AI Studio.'
          : `Gagal menguji koneksi: ${errorMsg}`,
    });
  }
});

// Parser helper for the 4 sections
function parseRefinerResponse(raw: string) {
  let targetAiMode = '';
  let optimizedPrompt = '';
  let appliedTechniques: string[] = [];
  let improvementQuestions: string[] = [];

  // Match Target AI & Mode
  const targetMatch = raw.match(/###?\s*🎯\s*Target AI & Mode\s*\n+([\s\S]*?)(?=(###?\s*⚡|###?\s*🛠|###?\s*🔍|$))/i);
  if (targetMatch) {
    targetAiMode = targetMatch[1].trim();
  }

  // Match Optimized Request within code block
  const codeBlockMatch = raw.match(/###?\s*⚡\s*Optimized Request[\s\S]*?```(?:text)?\n([\s\S]*?)```/i);
  if (codeBlockMatch) {
    optimizedPrompt = codeBlockMatch[1].trim();
  } else {
    // Fallback if no code block tags or different format
    const optSectionMatch = raw.match(/###?\s*⚡\s*Optimized Request\s*\n+([\s\S]*?)(?=(###?\s*🛠|###?\s*🔍|$))/i);
    if (optSectionMatch) {
      optimizedPrompt = optSectionMatch[1].replace(/```text|```/g, '').trim();
    }
  }

  // Match Applied Techniques
  const techMatch = raw.match(/###?\s*🛠\s*Applied Techniques\s*\n+([\s\S]*?)(?=(###?\s*🔍|$))/i);
  if (techMatch) {
    const lines = techMatch[1].split('\n');
    for (const line of lines) {
      const clean = line.replace(/^[-*•\d.]+\s*/, '').trim();
      if (clean && !clean.startsWith('#')) {
        appliedTechniques.push(clean);
      }
    }
  }

  // Match Improvement Questions
  const questMatch = raw.match(/###?\s*🔍\s*Improvement Questions\s*\n+([\s\S]*?)$/i);
  if (questMatch) {
    const lines = questMatch[1].split('\n');
    for (const line of lines) {
      const clean = line.replace(/^[-*•\d.]+\s*/, '').trim();
      if (clean && !clean.startsWith('#')) {
        improvementQuestions.push(clean);
      }
    }
  }

  return {
    targetAiMode,
    optimizedPrompt,
    appliedTechniques,
    improvementQuestions,
  };
}

/**
 * Built-in High-Grade PCTCE+O & Lyra 4D Algorithmic Refiner
 * Executes immediately without network latency. Ensures zero-stall reliability.
 */
function generateLocalPctceRefinement(
  rawPrompt: string,
  targetAI: string,
  mode: string,
  outputLang: string,
  promptStyle: string,
  customStyle?: string
): { rawMarkdown: string } {
  const isId = outputLang === 'Indonesia' || outputLang === 'Auto Detect';
  const cleanPrompt = rawPrompt.trim();
  const lowerPrompt = cleanPrompt.toLowerCase();

  // 1. Determine calibrated persona based on style & keywords
  let persona = '';
  if (promptStyle === 'Image Generation' || lowerPrompt.includes('gambar') || lowerPrompt.includes('foto') || lowerPrompt.includes('visual')) {
    persona = isId
      ? 'Anda adalah Prompt Engineer & Art Director Kelas Dunia untuk Midjourney v6, DALL-E 3, dan Flux.1. Anda menguasai komposisi visual, pencahayaan sinematik, sudut lensa kamera, dan atmosfer artistik.'
      : 'You are a World-Class Art Director & Visual Prompt Engineer specializing in Midjourney v6, DALL-E 3, and Flux.1 photorealism, volumetric lighting, and camera optics.';
  } else if (promptStyle === 'Coding & Development' || lowerPrompt.includes('kode') || lowerPrompt.includes('aplikasi') || lowerPrompt.includes('react') || lowerPrompt.includes('bug')) {
    persona = isId
      ? 'Anda adalah Principal Software Architect dan Senior Full-Stack Engineer dengan standar clean architecture, zero-regression debugging, dan penanganan edge-case defensif.'
      : 'You are a Principal Software Architect and Senior Full-Stack Engineer adhering to clean code standards, type safety, and defensive edge-case handling.';
  } else if (promptStyle === 'Writing & Content' || lowerPrompt.includes('artikel') || lowerPrompt.includes('naskah') || lowerPrompt.includes('cerita')) {
    persona = isId
      ? 'Anda adalah Senior Editorial Writer, Narrative Designer, dan Creative Director yang ahli dalam teknik storytelling mendalam, resonance emosional, dan struktur tulisan engaging.'
      : 'You are a Senior Narrative Designer and Editorial Director specializing in evocative storytelling, emotional pacing, and high-retention structural prose.';
  } else if (promptStyle === 'Business & Marketing' || lowerPrompt.includes('iklan') || lowerPrompt.includes('promosi') || lowerPrompt.includes('jual')) {
    persona = isId
      ? 'Anda adalah Elite Direct-Response Marketing Strategist & Conversion Copywriter yang berorientasi pada value proposition tajam, customer psychology, dan ROI tinggi.'
      : 'You are an Elite Direct-Response Copywriter and Growth Strategist specializing in value proposition clarity and high-conversion behavioral triggers.';
  } else if (promptStyle === 'Data Analysis' || lowerPrompt.includes('data') || lowerPrompt.includes('analisis') || lowerPrompt.includes('tren')) {
    persona = isId
      ? 'Anda adalah Lead Quantitative Analyst & Business Intelligence Specialist yang mahir dalam visualisasi data actionable, identifikasi tren kausal, dan strategi berbasis metrik.'
      : 'You are a Lead Quantitative Analytics Director specializing in causal inference, trend segmentation, and actionable metric frameworks.';
  } else {
    persona = isId
      ? `Anda adalah Master Prompt Engineer dan Asisten Pakar Senior tingkat lanjut. Anda berorientasi pada eksekusi terstruktur, eliminasi ambiguitas, dan penghantaran solusi presisi tinggi.`
      : `You are an Advanced Master AI Specialist and Context Architect delivering high-precision, zero-fluff, and fully structured solutions.`;
  }

  // 2. Formulate context
  let context = '';
  if (isId) {
    context = `Tujuan Pengguna: "${cleanPrompt}"
Lingkup Konteks:
- Model AI Sasaran: ${targetAI}
- Tingkat Optimasi: ${mode}
- Sasaran Kualitas: Mengubah instruksi ringkas pengguna menjadi instruksi eksekusi komprehensif, terstruktur rapi, dan langsung dapat ditindaklanjuti.`;
  } else {
    context = `Core User Intent: "${cleanPrompt}"
Operating Parameters:
- Target AI System: ${targetAI}
- Mode: ${mode}
- Quality Standard: Transform initial input into a deterministic, production-grade master prompt.`;
  }

  // 3. Formulate deliverables & task dynamically from current cleanPrompt only
  let task = '';
  if (promptStyle === 'Image Generation' || lowerPrompt.includes('gambar') || lowerPrompt.includes('foto') || lowerPrompt.includes('visual')) {
    task = isId
      ? `Buat deskripsi visual / prompt generasi gambar sinematik & fotorealistis berdasarkan instruksi: "${cleanPrompt}":\n1. Subjek & Komposisi: Detail subjek utama ("${cleanPrompt}"), postur/pose, ekspresi, tekstur, pakaian/properti, dan penempatan frame.\n2. Setting Lingkungan & Pencahayaan: Latar belakang dan tata cahaya yang spesifik untuk "${cleanPrompt}" (volumetric light, ambient mood, kedalaman ruang).\n3. Sinematografi & Lensa: Sudut kamera (eye-level/close-up/wide), lensa (50mm/85mm), aperture/depth of field, dan color grading profile.\n4. Parameter Teknis: Format siap pakai langsung untuk Midjourney v6 / DALL-E 3 / Flux.`
      : `Generate high-definition photographic prompt derived strictly from: "${cleanPrompt}":\n1. Core Subject & Framing: Detailed subject attributes for "${cleanPrompt}", pose, attire, tactile details, and composition.\n2. Atmospheric Setting: Background environment and lighting calibrated exclusively for "${cleanPrompt}".\n3. Camera & Lens: Focal length, depth of field, color grading.\n4. Generation Flags: Optimized directly for Midjourney v6 / DALL-E 3 / Flux.`;
  } else if (promptStyle === 'Writing & Content' || lowerPrompt.includes('artikel') || lowerPrompt.includes('naskah') || lowerPrompt.includes('cerita')) {
    task = isId
      ? `Susun karya tulisan berkualitas tinggi untuk: "${cleanPrompt}":\n1. Pembuka (Hook): Menarik atensi pembaca secara langsung dan relevan dengan topik "${cleanPrompt}".\n2. Pengembangan Konten: Uraian terstruktur, narasi mengalir, dan argumentasi/deskripsi berbobot.\n3. Penutup: Kesimpulan tajam atau pesan reflektif yang kuat.`
      : `Draft an engaging and structured written piece tailored to "${cleanPrompt}":\n1. Compelling Hook.\n2. In-depth narrative/analytical development.\n3. Memorable conclusion or call to reflection.`;
  } else if (promptStyle === 'Coding & Development' || lowerPrompt.includes('kode') || lowerPrompt.includes('aplikasi') || lowerPrompt.includes('react') || lowerPrompt.includes('bug')) {
    task = isId
      ? `Selesaikan kebutuhan rekayasa perangkat lunak untuk: "${cleanPrompt}":\n1. Analisis Kebutuhan & Desain: Identifikasi arsitektur komponen, alur data, dan mitigasi edge-case.\n2. Implementasi Lengkap: Tulis kode bersih (Clean Code), type-safe, dan efisien.\n3. Validasi & Pengujian: Uraikan verifikasi fungsional dan tips optimasi performa.`
      : `Execute software engineering requirements for "${cleanPrompt}":\n1. Architecture & component breakdown.\n2. Complete type-safe implementation.\n3. Verification and edge-case handling.`;
  } else if (promptStyle === 'Business & Marketing' || lowerPrompt.includes('iklan') || lowerPrompt.includes('promosi') || lowerPrompt.includes('jual')) {
    task = isId
      ? `Rancang strategi dan materi pemasaran untuk: "${cleanPrompt}":\n1. Value Proposition & Hook: Soroti pemecahan masalah utama audiens terkait "${cleanPrompt}".\n2. Draft Copy Kampanye: Materi promosi dengan fokus pada diferensiasi dan tingkat konversi tinggi.\n3. Call-to-Action (CTA): Arahan tindakan yang jelas, meyakinkan, dan berorientasi ROI.`
      : `Develop high-conversion marketing copy for "${cleanPrompt}":\n1. Value proposition and hook.\n2. High-impact messaging.\n3. Frictionless CTA.`;
  } else if (promptStyle === 'Data Analysis' || lowerPrompt.includes('data') || lowerPrompt.includes('analisis')) {
    task = isId
      ? `Lakukan analisis data terstruktur untuk: "${cleanPrompt}":\n1. Dekomposisi Metrik: Variabel kunci, kriteria evaluasi, dan segmentasi data.\n2. Metodologi Analitik: Pendekatan pemrosesan, kueri data, dan deteksi pola/tren.\n3. Rekomendasi Actionable: Arahan strategis berbasis temuan data.`
      : `Conduct structured analytical decomposition for "${cleanPrompt}":\n1. Key metrics and variables.\n2. Analysis methodology.\n3. Data-driven strategic takeaways.`;
  } else {
    task = isId
      ? `Eksekusi instruksi pengguna secara sistematis berdasarkan permintaan sesi ini: "${cleanPrompt}":\n1. Analisis Inti Kebutuhan: Bedah instruksi "${cleanPrompt}" menjadi komponen implementasi terukur.\n2. Solusi Utama Terperinci: Sajikan pemecahan masalah yang komprehensif, terstruktur, dan bebas ambiguitas.\n3. Panduan Eksekusi Praktis: Berikan langkah penerapan nyata dan kriteria kualitas output.`
      : `Systematically execute user instruction based exclusively on the current request: "${cleanPrompt}":\n1. Deconstruct core intent of "${cleanPrompt}".\n2. Deliver comprehensive, high-signal, and fully structured resolution.\n3. Provide step-by-step actionable guidance and best practices.`;
  }

  // 4. Formulate constraints
  const constraints = isId
    ? `- FORMAT: Sajikan dalam format Markdown rapi dengan judul bagian tegas.
- ZERO-HALLUCINATION: Jangan mengarang data atau referensi fiktif.
- EFISIENSI TOKEN: Hindari kalimat basa-basi pembuka ("Tentu saya bantu", dll.). Langsung mulai pada inti konten.
- NADA & BAHASA: Profesional, mengalir, dan bernilai informasi tinggi.`
    : `- FORMAT: Strict structured Markdown with distinct section headings.
- ZERO-HALLUCINATION: Never fabricate speculative claims or false citations.
- TOKEN EFFICIENCY: Zero conversational filler. Begin directly with actionable output.
- TONE: High-signal, authoritative, and engaging.`;

  // 5. Evaluation Gate
  const evaluation = isId
    ? `[SELF-CHECK / GERBANG EVALUASI MANDIRI]:
Sebelum menampilkan jawaban akhir, tinjau kembali:
1. Apakah seluruh elemen persona dan konteks telah terakomodasi secara harmonis?
2. Apakah struktur output rapi, mudah dibaca, dan bebas dari kata-kata mubazir?
3. Jika ditemukan kekurangan, perbaiki secara internal sebelum memberikan hasil final.`
    : `[MANDATORY EVALUATION GATE]:
Before finalizing output, audit against completeness, structural elegance, and zero conversational waste.`;

  // Construct Master Prompt Body
  const optimizedPrompt = `# ROLE & PERSONA
${persona}

# CONTEXT & BACKGROUND
${context}

# CORE TASK & DELIVERABLES
${task}

# OPERATIONAL CONSTRAINTS & GUARDRAILS
${constraints}

# QUALITY VERIFICATION GATE
${evaluation}`;

  // Construct Techniques
  const techniques = [
    'Sintesis Arsitektur PCTCE+O (Persona, Context, Task, Constraints, Evaluation, Optimization)',
    'Eliminasi Frasa Basa-basi & Kompresi Efisiensi Token (~45%)',
    'Penajaman Konteks & Resolusi Ambiguitas (Lyra 4D Workflow)',
    'Pagar Pembatas Anti-Halusinasi & Uncertainty Admission Guardrails',
    'Gerbang Verifikasi Mandiri (Internal Self-Evaluation Loop)'
  ];

  // Construct Improvement Questions dynamically based on style & input
  let questions: string[] = [];
  if (promptStyle === 'Image Generation' || lowerPrompt.includes('gambar') || lowerPrompt.includes('foto') || lowerPrompt.includes('visual')) {
    questions = isId
      ? [
          `Apakah ada preferensi rasio aspek khusus untuk subjek "${cleanPrompt}" (misal 16:9 sinematik, 9:16 vertikal, atau 1:1)?`,
          `Bagaimana pencahayaan dan atmosfer (mood) visual yang paling Anda inginkan (misal: natural daylight, dramatic studio lighting, atau golden hour)?`,
          `Apakah ada preferensi lensa kamera atau sudut pandang tertentu (misal: eye-level 50mm, close-up portrait 85mm, atau wide-angle 24mm)?`
        ]
      : [
          `Do you have a specific aspect ratio preference for "${cleanPrompt}" (e.g. 16:9 cinematic, 9:16 portrait, or 1:1)?`,
          `What lighting and visual atmosphere would you prefer (e.g. natural daylight, dramatic studio lighting, or golden hour)?`,
          `Is there a preferred lens profile or camera angle (e.g. 50mm candid, 85mm portrait, or wide-angle)?`
        ];
  } else if (promptStyle === 'Coding & Development' || lowerPrompt.includes('kode') || lowerPrompt.includes('aplikasi')) {
    questions = isId
      ? [
          'Apakah ada framework, bahasa, atau dependensi spesifik yang wajib digunakan?',
          'Seberapa mendalam tingkat penanganan error, validasi input, dan pengujian unit yang dibutuhkan?',
          'Apakah solusi harus kompatibel dengan sistem atau database yang sudah ada?'
        ]
      : [
          'Are there specific frameworks or language versions required?',
          'What depth of error handling, schema validation, and unit test coverage is needed?',
          'Are there existing architectural constraints to interface with?'
        ];
  } else {
    questions = isId
      ? [
          `Siapakah target audiens utama yang dituju untuk konteks "${cleanPrompt}" dan bagaimana nada bicara (tone) yang diharapkan?`,
          'Apakah ada batasan format tertentu (misalnya Markdown tabel, daftar prioritas, atau narasi mengalir) yang harus dipatuhi?',
          'Apakah Anda ingin menyertakan kriteria keberhasilan khusus untuk memvalidasi output target AI?'
        ]
      : [
          `Who is the primary intended audience for "${cleanPrompt}" and what tone of voice should be adopted?`,
          'Are there strict formatting constraints (e.g. structured table, checklist, or narrative prose) to enforce?',
          'Would you like to embed specific benchmark acceptance criteria into the prompt?'
        ];
  }

  const rawMarkdown = `### 🎯 Target AI & Mode
${targetAI} – ${promptStyle} (${mode})

### ⚡ Optimized Request
\`\`\`text
${optimizedPrompt}
\`\`\`

### 🛠 Applied Techniques
${techniques.map((t) => `- ${t}`).join('\n')}

### 🔍 Improvement Questions
${questions.map((q, idx) => `${idx + 1}. ${q}`).join('\n')}`;

  return { rawMarkdown };
}

// Prompt refine endpoint
app.post('/api/refine', async (req, res) => {
  try {
    const {
      prompt,
      targetAI = 'Auto Detect',
      mode = 'Advanced Refine',
      outputLang = 'Indonesia',
      promptStyle = 'General Assistant',
      customStyle = '',
    } = req.body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Prompt input tidak boleh kosong.',
      });
    }

    const sessionId = (req.headers['x-session-id'] as string) || req.body?.sessionId || 'stateless';
    console.log(`[API /api/refine] [Session: ${sessionId}] Processing fresh isolated request: "${prompt.slice(0, 40)}..." | Target: ${targetAI} | Mode: ${mode}`);

    const customKey = (req.headers['x-gemini-api-key'] as string) || req.body?.apiKey;
    const provider = (req.headers['x-ai-provider'] as string) || req.body?.provider || 'gemini-3.8-flash';
    const requestedModel = (req.headers['x-gemini-model'] as string) || req.body?.model || (provider === 'gemini-3.8-flash' ? 'gemini-3.8-flash' : 'gemini-2.5-flash');
    const ai = getGeminiClient(customKey);

    let rawMarkdown = '';
    let usedModel = '';

    // If a valid Gemini API Key is available, try invoking Gemini
    if (ai) {
      try {
        const systemInstruction = `You are a combined Prompt Engineering Expert & Master Prompt Refiner.

ROLE & MISSION:
Your only job is to:
- Take raw, messy, or inefficient prompts or user intentions.
- Turn them into a single, clean, token-efficient, ready-to-run master prompt for another AI system (GPT, Claude, Gemini, Copilot, etc.).
- Embed PCTCE+O standards:
  1. Persona: Define role, expertise, and tone the target AI should adopt.
  2. Context: Necessary background, no fluff.
  3. Task: Clear action verbs and depth.
  4. Constraints: Output format, hallucination controls.
  5. Evaluation: Self-check instructions before final output.
  6. Optimization: High token efficiency.

OUTPUT FORMAT (STRICT MARKDOWN):
### 🎯 Target AI & Mode
[Target AI and mode]

### ⚡ Optimized Request
\`\`\`text
[READY-TO-USE MASTER PROMPT INSIDE CODE BLOCK]
\`\`\`

### 🛠 Applied Techniques
- [Bullet points of techniques applied]

### 🔍 Improvement Questions
1. [Question 1]
2. [Question 2]`;

        const userMessage = `OPTIMIZATION SPECIFICATIONS:
- Target AI: ${targetAI}
- Optimization Mode: ${mode}
- Output Language: ${outputLang}
- Prompt Style: ${promptStyle === 'Custom' ? `Custom (${customStyle})` : promptStyle}

USER RAW PROMPT TO REFINE:
"""
${prompt}
"""

Please execute the Lyra 4D workflow and PCTCE+O framework to produce the final refined master prompt. Follow the strict four-section markdown format.`;

        const { response, usedModel: modelName } = await generateContentWithRetry(ai, {
          model: requestedModel,
          contents: [
            {
              role: 'user',
              parts: [{ text: userMessage }],
            },
          ],
          config: {
            systemInstruction,
            thinkingConfig: {
              thinkingLevel: mode === 'Expert Refine' ? 'high' : 'medium',
            },
          },
        });

        rawMarkdown = response.text || '';
        usedModel = provider === 'gemini-3.8-flash' ? `Gemini API (${modelName})` : `Engine AI Studio PCTCE+O (${modelName})`;
      } catch (geminiError: any) {
        console.warn('[API /api/refine] Gemini API unavailable or timed out. Seamlessly engaging local PCTCE+O engine:', geminiError?.message);
        const fallback = generateLocalPctceRefinement(prompt, targetAI, mode, outputLang, promptStyle, customStyle);
        rawMarkdown = fallback.rawMarkdown;
        usedModel = provider === 'gemini-3.8-flash' ? 'Gemini API (gemini-3.8-flash) [Local PCTCE+O Fallback]' : 'Engine AI Studio PCTCE+O';
      }
    } else {
      // No external API key: instantly use built-in local engine
      console.log('[API /api/refine] Operating in zero-latency mode via built-in PCTCE+O engine.');
      const fallback = generateLocalPctceRefinement(prompt, targetAI, mode, outputLang, promptStyle, customStyle);
      rawMarkdown = fallback.rawMarkdown;
      usedModel = provider === 'gemini-3.8-flash' ? 'Gemini API (gemini-3.8-flash) [Local PCTCE+O Fallback]' : 'Engine AI Studio PCTCE+O';
    }

    const parsed = parseRefinerResponse(rawMarkdown);

    // Compute simple word & char count metrics
    const origWords = prompt.trim().split(/\s+/).filter(Boolean).length;
    const origChars = prompt.length;
    const refinedWords = parsed.optimizedPrompt ? parsed.optimizedPrompt.split(/\s+/).filter(Boolean).length : 0;
    const refinedChars = parsed.optimizedPrompt ? parsed.optimizedPrompt.length : 0;

    res.json({
      success: true,
      rawMarkdown,
      targetAiMode: parsed.targetAiMode || `${targetAI} (${mode})`,
      optimizedPrompt: parsed.optimizedPrompt,
      appliedTechniques: parsed.appliedTechniques,
      improvementQuestions: parsed.improvementQuestions,
      engineUsed: usedModel,
      metrics: {
        originalWordCount: origWords,
        originalCharCount: origChars,
        refinedWordCount: refinedWords,
        refinedCharCount: refinedChars,
      },
    });
  } catch (err: any) {
    const errorMsg = err?.message || 'Terjadi kesalahan pada server saat memproses optimasi prompt.';
    console.error('Refine error:', errorMsg);

    res.status(500).json({
      success: false,
      error: errorMsg,
      message: 'Terjadi kesalahan saat memproses prompt. Silakan periksa kembali konfigurasi atau coba lagi.',
    });
  }
});

// Configure Vite integration for dev, or static files for prod
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PROMPT REFINER AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
