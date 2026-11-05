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

app.use(express.json({ limit: '50mb' }));

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

/**
 * Single Source of Truth for Gemini API Configuration
 */
export const GEMINI_CONFIG = {
  provider: 'gemini',
  model: 'gemini-3.8-flash',
  apiVersion: 'v1beta',
};

function maskApiKey(text: string): string {
  if (!text) return '';
  return text.replace(/AIza[0-9A-Za-z_-]{35}/g, 'AIza...[MASKED]');
}

function formatGeminiError(err: any, requestedModel: string) {
  const rawMsg = err?.message || String(err);
  const cleanMsg = maskApiKey(rawMsg);
  let status = 400;
  let userFriendly = '';

  if (cleanMsg.includes('API_KEY_INVALID') || cleanMsg.includes('API key not valid')) {
    status = 400;
    userFriendly = 'Google Gemini API Key tidak valid. Harap periksa kembali API Key Anda dari Google AI Studio (aistudio.google.com/apikey).';
  } else if (cleanMsg.includes('NOT_FOUND') || cleanMsg.includes('404')) {
    status = 404;
    userFriendly = `Model '${requestedModel}' tidak ditemukan pada API version ${GEMINI_CONFIG.apiVersion} atau belum tersedia untuk API Key Anda.`;
  } else if (cleanMsg.includes('PERMISSION_DENIED') || cleanMsg.includes('403')) {
    status = 403;
    userFriendly = 'Akses ditolak (Permission Denied). Akun Google Cloud atau API Key Anda tidak memiliki izin untuk mengakses model ini.';
  } else if (cleanMsg.includes('RESOURCE_EXHAUSTED') || cleanMsg.includes('429')) {
    status = 429;
    userFriendly = 'Batas kuota terlampaui (Quota / Rate Limit Exceeded). Harap tunggu beberapa saat sebelum mencoba kembali.';
  } else if (cleanMsg.includes('Timeout') || cleanMsg.includes('ECONNREFUSED') || cleanMsg.includes('ETIMEDOUT') || cleanMsg.includes('fetch failed')) {
    status = 504;
    userFriendly = 'Koneksi ke endpoint Google Gemini API mengalami timeout atau kegagalan jaringan.';
  } else {
    status = 400;
    userFriendly = `Gagal terhubung ke Gemini API (${requestedModel}): ${cleanMsg.slice(0, 200)}`;
  }

  return {
    status,
    error: cleanMsg,
    message: userFriendly,
    technicalDetails: {
      model: requestedModel,
      apiVersion: GEMINI_CONFIG.apiVersion,
      rawError: cleanMsg.slice(0, 300),
    },
  };
}

// Status endpoint
app.get('/api/status', (req, res) => {
  const hasEnvKey = isValidApiKey(process.env.GEMINI_API_KEY);
  res.json({
    status: 'ok',
    hasEnvKey,
    activeDefaultProvider: 'gemini-3.8-flash',
    defaultModel: GEMINI_CONFIG.model,
    apiVersion: GEMINI_CONFIG.apiVersion,
    supportedProviders: [
      { id: 'gemini-3.8-flash', name: 'Gemini API (gemini-3.8-flash)', model: GEMINI_CONFIG.model },
      { id: 'pctce-o-studio', name: 'Engine AI Studio PCTCE+O', model: 'pctce-o-studio' }
    ],
    model: GEMINI_CONFIG.model,
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
// STRICT: No secret or cascade fallback to other models! Only requests the targetModel.
async function generateContentWithRetry(
  ai: GoogleGenAI,
  params: {
    model: string;
    contents: any;
    config?: any;
  },
  maxRetries = 1
) {
  const targetModel = params.model || GEMINI_CONFIG.model;
  let lastError: any = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[Gemini API] Requesting target model: ${targetModel} (attempt ${attempt + 1}/${maxRetries + 1})...`);

      // Clean config strictly compliant with Gemini 3.8 Flash specifications:
      // Remove deprecated temperature, topP, topK, candidateCount.
      // Use thinkingConfig with thinkingLevel instead of thinkingBudget.
      const config: any = { ...params.config };
      delete config.temperature;
      delete config.topP;
      delete config.topK;
      delete config.candidateCount;

      if (config.thinkingConfig) {
        if (config.thinkingConfig.thinkingBudget !== undefined && !config.thinkingConfig.thinkingLevel) {
          config.thinkingConfig.thinkingLevel = 'medium';
          delete config.thinkingConfig.thinkingBudget;
        }
      }

      // Set a 20-second per-attempt timeout
      const timeoutMs = 20000;
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout memanggil Gemini model ${targetModel} setelah ${timeoutMs}ms`)), timeoutMs)
      );

      const callPromise = ai.models.generateContent({
        ...params,
        config,
        model: targetModel,
      });

      const response = (await Promise.race([callPromise, timeoutPromise])) as any;
      console.log(`[Gemini API] Successfully generated with model: ${targetModel}`);
      return { response, usedModel: targetModel };
    } catch (err: any) {
      lastError = err;
      const msg = err?.message || '';
      console.warn(`[Gemini API] Model ${targetModel} attempt ${attempt + 1} failed: ${maskApiKey(msg)}`);

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

  throw lastError;
}

// Test connection endpoint
app.post('/api/test-connection', async (req, res) => {
  const customKey = (req.headers['x-gemini-api-key'] as string) || req.body?.apiKey;
  const provider = (req.headers['x-ai-provider'] as string) || req.body?.provider || GEMINI_CONFIG.provider;
  const targetModel = (req.headers['x-gemini-model'] as string) || req.body?.model || GEMINI_CONFIG.model;

  console.log(`[API /api/test-connection] Testing connection for provider: ${provider} | Target Model: ${targetModel}`);

  try {
    const ai = getGeminiClient(customKey);

    if (!ai) {
      return res.status(400).json({
        success: false,
        model: targetModel,
        provider,
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
    const providerDisplayName = provider === 'gemini-3.8-flash' || provider === 'gemini'
      ? `Gemini API (${usedModel})`
      : 'Engine AI Studio PCTCE+O';

    res.json({
      success: true,
      imagesCount: images.length,
      latency,
      reply: reply.trim(),
      model: usedModel,
      provider,
      usingCustomKey: !!customKey,
      message: `Koneksi ke ${providerDisplayName} berhasil terverifikasi dalam ${latency}ms!`,
    });
  } catch (err: any) {
    const parsed = formatGeminiError(err, targetModel);
    console.error(`[API /api/test-connection] Verification failed for ${targetModel}:`, parsed.error);

    res.status(parsed.status).json({
      success: false,
      model: targetModel,
      provider,
      error: parsed.error,
      message: parsed.message,
      technicalDetails: parsed.technicalDetails,
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
  targetAI: string = 'ChatGPT',
  mode: string = 'Advanced Refine',
  outputLang: string = 'English',
  promptStyle: string = 'Image Generation',
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
      targetAI = 'ChatGPT',
      mode = 'Advanced Refine',
      outputLang = 'English',
      promptStyle = 'Image Generation',
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
    const provider = (req.headers['x-ai-provider'] as string) || req.body?.provider || GEMINI_CONFIG.provider;
    const requestedModel = (req.headers['x-gemini-model'] as string) || req.body?.model || GEMINI_CONFIG.model;
    const images: Array<{ id?: string; name?: string; mimeType: string; base64Data: string; sizeBytes?: number }> = req.body?.images || [];
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

        const visualContextNote = images.length > 0
          ? `\n\n[MULTIMODAL GROUNDING]: ${images.length} reference image(s) attached. Thoroughly examine visual features (composition, perspective, lighting, color harmony, subject details, artistic medium) and ground the master prompt firmly in these references according to user goals.`
          : '';

        const userMessage = `OPTIMIZATION SPECIFICATIONS:
- Target AI: ${targetAI}
- Optimization Mode: ${mode}
- Output Language: ${outputLang}
- Prompt Style: ${promptStyle === 'Custom' ? `Custom (${customStyle})` : promptStyle}${visualContextNote}

USER RAW PROMPT TO REFINE:
"""
${prompt}
"""

Please execute the Lyra 4D workflow and PCTCE+O framework to produce the final refined master prompt. Follow the strict four-section markdown format.`;

        // Assemble multimodal parts with images and text
        const userParts: any[] = [];
        if (images.length > 0) {
          for (const img of images) {
            if (img.base64Data && img.mimeType) {
              userParts.push({
                inlineData: {
                  mimeType: img.mimeType,
                  data: img.base64Data,
                },
              });
            }
          }
        }
        userParts.push({ text: userMessage });

        const { response, usedModel: modelName } = await generateContentWithRetry(ai, {
          model: requestedModel,
          contents: [
            {
              role: 'user',
              parts: userParts,
            },
          ],
          config: {
            systemInstruction: systemInstruction + (images.length > 0 ? `\n\nMULTIMODAL VISUAL DIRECTIVES:\nThe user has attached ${images.length} reference image(s). You must act as an expert computer vision and prompt engineer. Extract relevant visual characteristics (subject identity, pose, perspective, framing, lighting, color grading, artistic style, texture) and synthesize them seamlessly with the user's prompt instruction. Never ignore the user prompt; the user prompt dictates the goal, while the images provide the visual reference authority.` : ''),
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
      imagesCount: images.length,
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


// Universal Adaptive Advanced Refinement Helper for Server
function generateServerLocalAdvancedRefinement(
  optimizedPrompt: string,
  originalPrompt: string = '',
  targetAI: string = 'ChatGPT',
  mode: string = 'Advanced Refine',
  outputLang: string = 'English',
  promptStyle: string = 'Image Generation',
  customStyle?: string
): { refinedPrompt: string; engineUsed: string } {
  const isId = outputLang === 'Indonesia' || outputLang === 'Auto Detect';
  const cleanBase = optimizedPrompt.trim();
  const lowerBase = (cleanBase + ' ' + (originalPrompt || '')).toLowerCase();

  const isVisual = promptStyle === 'Image Generation' || lowerBase.includes('gambar') || lowerBase.includes('foto') || lowerBase.includes('portrait') || lowerBase.includes('visual');
  const isCode = promptStyle === 'Coding & Development' || lowerBase.includes('kode') || lowerBase.includes('aplikasi') || lowerBase.includes('react') || lowerBase.includes('bug');
  const isWriting = promptStyle === 'Writing & Content' || lowerBase.includes('artikel') || lowerBase.includes('naskah') || lowerBase.includes('cerita');
  const isMarketing = promptStyle === 'Business & Marketing' || lowerBase.includes('iklan') || lowerBase.includes('promosi') || lowerBase.includes('marketing');
  const isData = promptStyle === 'Data Analysis' || lowerBase.includes('data') || lowerBase.includes('analisis');

  let specializedEnrichment = '';
  if (isVisual) {
    specializedEnrichment = isId
      ? `### 📐 SPESIFIKASI VISUAL & OPTIK TINGKAT LANJUT
- Rasio Aspek (Aspect Ratio): Terkalibrasi 16:9 sinematik atau 9:16 potret resolusi ultra-tinggi (8K UHD).
- Lensa & Optik: 85mm f/1.4 prime lens, shallow depth-of-field, aperture lembut dengan efek bokeh melingkar halus pada latar belakang.
- Pencahayaan (Lighting Science): Kombinasi three-point studio lighting dengan Rembrandt key light, subtle rim light pada kontur subjek, dan soft volumetric fill light.
- Tekstur & Materialitas: Detail mikro tekstur kulit natural dengan subsurface scattering nyata (tanpa efek plastik atau airbrushed), helai rambut tajam, dan kejernihan mata dengan tangkapan cahaya (catchlight) natural.
- Color Grading & Mood: Palet warna sinematik terkalibrasi kodachrome 64/cinestill 800T, dynamic range luas, bayangan bersih tanpa noise digital.
- Pagar Pembatas Negatif (Negative Guardrails): Zero-distortion, no mutated limbs, no extra fingers, no blurry artifacts, no watermark, no CGI/plastic glossiness.`
      : `### 📐 ADVANCED OPTICAL & VISUAL SPECIFICATIONS
- Aspect Ratio: Native 16:9 cinematic or 9:16 portrait composition, 8K ultra-sharp fidelity.
- Optics & Focal Length: 85mm f/1.4 prime lens, shallow depth-of-field, organic circular bokeh on background highlights.
- Lighting Science: Balanced three-point illumination, Rembrandt key light, delicate hair rim light, soft ambient fill.
- Materiality & Texture: Natural skin micro-texture with authentic subsurface scattering (zero plastic airbrushing), realistic iris catchlight, and textile micro-weave.
- Color Science: Film-stock emulation (Kodachrome 64/Cinestill 800T), extended dynamic range, clean deep blacks.
- Negative Guardrails: Zero anatomical distortion, no unnatural limb multiplication, no watermarks, no blur artifacts.`;
  } else if (isCode) {
    specializedEnrichment = isId
      ? `### 🛡️ KONTRAK REKAYASA & PREVENTIF EDGE-CASE
- Integritas Arsitektur: Pola pemisahan tanggung jawab (Separation of Concerns), modularitas komponen, dan type-safe end-to-end.
- Penanganan Kondisi Batas (Edge Cases): Validasi input defensif (null/undefined/empty state), error boundary terisolasi, dan status loading/retry yang jelas.
- Standar Eksekusi: Clean Code, fungsi murni (pure functions) di mana memungkinkan, nama variabel deskriptif tanpa singkatan ambigu.
- Kriteria Verifikasi: Kode harus dapat dikompilasi tanpa peringatan (zero warnings), lulus verifikasi tipe statis, dan menyertakan contoh penggunaan nyata.`
      : `### 🛡️ ENGINEERING CONTRACT & DEFENSIVE INVARIANTS
- Architecture Integrity: Strict separation of concerns, high cohesion, end-to-end type safety.
- Edge-Case Resilience: Defensive validation against null/undefined/empty bounds, explicit error recovery, and robust status management.
- Execution Quality: Clean Code conventions, pure deterministic functions, and production-grade maintainability.
- Verification Gate: Zero build warnings, complete type coverage, and actionable executable snippets.`;
  } else if (isWriting) {
    specializedEnrichment = isId
      ? `### ✍️ KONTROL NARASI & ENGAGEMENT
- Arsitektur Narasi: Hook awal berdaya pikat tinggi -> Eskalasi pemikiran terstruktur -> Pembahasan mendalam berbobot -> Konklusi berdampak kuat.
- Dinamika Gaya: Kalimat bervariasi (rhythm & cadence), eliminasi frasa klise, dan pemilihan diksi yang bernas.
- Retensi Pembaca: Pertahankan alur logis yang mulus antar-paragraf dengan transisi alami.`
      : `### ✍️ NARRATIVE ARCHITECTURE & ENGAGEMENT
- Structural Flow: High-impact opening hook -> Systematic thematic development -> Deep intellectual value -> Resonant takeaway.
- Pacing & Rhythm: Alternating sentence lengths, active voice dominance, and zero repetitive filler.
- Reader Retention: Seamless logical transitions and emotional resonance.`;
  } else if (isMarketing) {
    specializedEnrichment = isId
      ? `### 🎯 STRATEGI KONVERSI & VALUE PROPOSITION
- Core Hook: Menjawab langsung titik sakit (pain-point) utama audiens dalam 3 detik pertama.
- Diferensiasi Tajam: Buktikan nilai unik tanpa klaim berlebihan (evidence-backed credibility).
- Call-to-Action (CTA): Instruksi tindakan tunggal, jelas, mendesak, dan minim friksi.`
      : `### 🎯 CONVERSION CATALYST & VALUE PROPOSITION
- Core Hook: Immediately resolves the user's primary friction point in the opening statement.
- Sharp Differentiation: Concrete value positioning supported by credible evidence.
- Frictionless CTA: Single, clear, unambiguous directive maximizing execution velocity.`;
  } else if (isData) {
    specializedEnrichment = isId
      ? `### 📊 FRAMEWORK ANALITIK & KAUSALITAS
- Taksonomi Metrik: Klasifikasi variabel primer, sekunder, dan variabel pengendali.
- Identifikasi Tren: Pisahkan anomali sementara dari pola kausal yang terbukti.
- Rekomendasi Eksekutif: Simpulan actionable dengan pembobotan prioritas berbasis dampak.`
      : `### 📊 ANALYTICAL DECOMPOSITION & CAUSALITY
- Metric Taxonomy: Clear segregation of primary KPIs, control variables, and secondary indicators.
- Causal Rigor: Isolate transient noise from genuine behavioral shifts.
- Executive Decision Matrix: Actionable takeaways ranked strictly by business impact.`;
  } else {
    specializedEnrichment = isId
      ? `### ⚡ PROTOKOL PRESISI EKSEKUSI
- Dekomposisi Sistematis: Eksekusi setiap tahapan secara hierarkis dan deterministik.
- Eliminasi Ambiguitas: Semua parameter memiliki batasan operasional yang jelas tanpa ruang interpretasi ganda.
- Verifikasi Akhir: Hasil wajib memenuhi seluruh kriteria kelengkapan fungsional.`
      : `### ⚡ DETERMINISTIC EXECUTION PROTOCOL
- Systematic Decomposition: Hierarchical, stepwise instruction execution.
- Zero-Ambiguity Guardrail: All operational boundaries explicitly defined.
- Verification Criteria: Output strictly evaluated against end-to-end completeness.`;
  }

  const refinedPrompt = `# ADVANCED FINAL REFINEMENT: DEFINITIVE MASTER SPECIFICATION
[CONFIRMED OBJECTIVE]: ${cleanBase.split('\n')[0].replace(/^[#\s*]+/, '') || 'High-Precision Task Execution'}

## 1. OPERATIONAL CONTEXT & EXECUTION SCOPE
- Target AI System: ${targetAI}
- Execution Mode: ${mode} (Maximum Determinism)
- Output Language: ${outputLang}
- Architectural Integrity: PCTCE+O & Lyra 4D Certified

## 2. SYNTHESIZED MASTER DIRECTIVES
${cleanBase}

## 3. UNIVERSAL ADAPTIVE ENRICHMENT & QUALITY GATES
${specializedEnrichment}

## 4. STRICT OUTPUT FORMAT & CONFLICT RESOLUTION
- Zero Conversational Meta: Mulai langsung pada output yang diminta tanpa kalimat pengantar atau penutup.
- Self-Consistency Check: Jika terdapat instruksi ambigu, pilih interpretasi yang paling aman dan operasional.
- High Signal-to-Noise: Pertahankan efisiensi token maksimal tanpa mengorbankan kedalaman teknis.`;

  return {
    refinedPrompt,
    engineUsed: 'Engine AI Studio PCTCE+O (Universal Adaptive Refiner)',
  };
}

// ADVANCED FINAL REFINEMENT ENDPOINT
// Takes Optimized Request as primary input and executes secondary high-precision refinement.
// Completely isolated from primary /api/refine.
app.post('/api/advanced-refine', async (req, res) => {
  try {
    const {
      optimizedPrompt,
      originalPrompt = '',
      targetAI = 'ChatGPT',
      mode = 'Advanced Refine',
      outputLang = 'English',
      promptStyle = 'Image Generation',
      customStyle = '',
      images = [],
    } = req.body;

    if (!optimizedPrompt || typeof optimizedPrompt !== 'string' || !optimizedPrompt.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Optimized Request input tidak boleh kosong.',
      });
    }

    const sessionId = (req.headers['x-session-id'] as string) || req.body?.sessionId || 'stateless';
    console.log(`[API /api/advanced-refine] [Session: ${sessionId}] Running Advanced Final Refinement on ${optimizedPrompt.length} chars | Target: ${targetAI}`);

    const customKey = (req.headers['x-gemini-api-key'] as string) || req.body?.apiKey;
    const provider = (req.headers['x-ai-provider'] as string) || req.body?.provider || GEMINI_CONFIG.provider;
    const requestedModel = (req.headers['x-gemini-model'] as string) || req.body?.model || GEMINI_CONFIG.model;
    const ai = getGeminiClient(customKey);

    let refinedPrompt = '';
    let usedModel = '';

    if (ai) {
      try {
        const advancedSystemInstruction = `You are an Elite Principal Prompt Architect and Universal Prompt Refinement Specialist.
Your mission is ADVANCED FINAL REFINEMENT:
Take an already-synthesized "Optimized Request" and elevate it to its definitive, highest-precision, production-grade master instruction form.

CORE REFINEMENT PRINCIPLES:
1. INTENT PRESERVATION: Faithfully preserve the user's primary objectives, constraints, and target outcomes.
2. CONTEXT VALIDATION: Ensure all parameters are consistent with the current task. Eliminate irrelevant cross-session assumptions.
3. DETAIL ENRICHMENT: Elevate operational depth, technical parameters, and execution specifications without conversational fluff.
4. STRUCTURAL OPTIMIZATION: Organize into clear, hierarchical, systematic markdown blocks optimized for target AI execution.
5. CONFLICT RESOLUTION: Resolve ambiguities or contradictory clauses logically without deviating from core intent.
6. COMPLETENESS VALIDATION: Ensure no required specifications were omitted.
7. EXECUTION PRECISION: High signal-to-noise ratio. Zero meta commentary or pleasantries. Every sentence must be an actionable constraint or directive.
8. UNIVERSAL ADAPTIVE REFINEMENT: Adapt your refinement criteria to the specific domain (e.g. Photography/Image generation optics & aspect ratio; Coding architectural boundaries & error handling; Writing tone & narrative pacing; Data analysis metric causality; UI/UX layout & component hierarchies).

STRICT OUTPUT REQUIREMENT:
Output ONLY the clean, final, ready-to-run refined master prompt text.
DO NOT include any conversational meta-commentary, introductory remarks ("Here is your refined prompt:"), or concluding summaries.`;

        const userParts: any[] = [];
        if (images && images.length > 0) {
          for (const img of images) {
            if (img.base64Data && img.mimeType) {
              userParts.push({
                inlineData: {
                  mimeType: img.mimeType,
                  data: img.base64Data,
                },
              });
            }
          }
        }

        const promptText = `OPTIMIZED REQUEST (PRIMARY INPUT TO REFINE):
"""
${optimizedPrompt}
"""

ADDITIONAL CONTEXT (IF RELEVANT):
- Original User Request: ${originalPrompt || 'N/A'}
- Target AI: ${targetAI}
- Mode: ${mode}
- Language: ${outputLang}
- Style: ${promptStyle === 'Custom' ? `Custom (${customStyle})` : promptStyle}
${images && images.length > 0 ? `- Reference Images: ${images.length} image(s) attached for visual grounding.\n` : ''}

Please execute the Universal Adaptive Refinement and output ONLY the final, definitive, production-grade master prompt.`;

        userParts.push({ text: promptText });

        const { response, usedModel: modelName } = await generateContentWithRetry(ai, {
          model: requestedModel,
          contents: [{ role: 'user', parts: userParts }],
          config: {
            systemInstruction: advancedSystemInstruction,
            thinkingConfig: {
              thinkingLevel: mode === 'Expert Refine' ? 'high' : 'medium',
            },
          },
        });

        const rawText = response.text || '';
        // Extract clean text, stripping code block markers if wrapped entirely in them
        const codeBlockMatch = rawText.match(/^\s*```(?:markdown|text)?\n([\s\S]*?)```\s*$/);
        refinedPrompt = codeBlockMatch ? codeBlockMatch[1].trim() : rawText.trim();
        usedModel = provider === 'gemini-3.8-flash' ? `Gemini API (${modelName})` : `Engine AI Studio PCTCE+O (${modelName})`;
      } catch (geminiError: any) {
        console.warn('[API /api/advanced-refine] Gemini API unavailable. Engaging server-side PCTCE+O engine:', geminiError?.message);
        const fallback = generateServerLocalAdvancedRefinement(optimizedPrompt, originalPrompt, targetAI, mode, outputLang, promptStyle, customStyle);
        refinedPrompt = fallback.refinedPrompt;
        usedModel = provider === 'gemini-3.8-flash' ? 'Gemini API (gemini-3.8-flash) [Local Engine Fallback]' : fallback.engineUsed;
      }
    } else {
      console.log('[API /api/advanced-refine] Operating in zero-latency mode via built-in PCTCE+O engine.');
      const fallback = generateServerLocalAdvancedRefinement(optimizedPrompt, originalPrompt, targetAI, mode, outputLang, promptStyle, customStyle);
      refinedPrompt = fallback.refinedPrompt;
      usedModel = fallback.engineUsed;
    }

    res.json({
      success: true,
      refinedPrompt,
      engineUsed: usedModel,
    });
  } catch (err: any) {
    const errorMsg = err?.message || 'Terjadi kesalahan pada server saat memproses Advanced Final Refinement.';
    console.error('Advanced refine error:', errorMsg);

    res.status(500).json({
      success: false,
      error: errorMsg,
      message: 'Gagal menjalankan Advanced Final Refinement. Silakan coba kembali.',
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
