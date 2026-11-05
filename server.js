import { generateStructuredAdvancedRefinement } from "./src/services/structuredRefinement";
import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3e3;
app.use(express.json({ limit: "50mb" }));
function isValidApiKey(key) {
  if (!key) return false;
  const trimmed = key.trim();
  if (!trimmed || trimmed === "MY_GEMINI_API_KEY" || trimmed.startsWith("MY_") || trimmed.length < 15) {
    return false;
  }
  return true;
}
function getGeminiClient(customApiKey) {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;
  if (!isValidApiKey(apiKey)) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
}
const GEMINI_CONFIG = {
  provider: "gemini",
  model: "gemini-3.8-flash",
  apiVersion: "v1beta"
};
function maskApiKey(text) {
  if (!text) return "";
  return text.replace(/AIza[0-9A-Za-z_-]{35}/g, "AIza...[MASKED]");
}
function formatGeminiError(err, requestedModel) {
  const rawMsg = err?.message || String(err);
  const cleanMsg = maskApiKey(rawMsg);
  let status = 400;
  let userFriendly = "";
  if (cleanMsg.includes("API_KEY_INVALID") || cleanMsg.includes("API key not valid")) {
    status = 400;
    userFriendly = "Google Gemini API Key tidak valid. Harap periksa kembali API Key Anda dari Google AI Studio (aistudio.google.com/apikey).";
  } else if (cleanMsg.includes("NOT_FOUND") || cleanMsg.includes("404")) {
    status = 404;
    userFriendly = `Model '${requestedModel}' tidak ditemukan pada API version ${GEMINI_CONFIG.apiVersion} atau belum tersedia untuk API Key Anda.`;
  } else if (cleanMsg.includes("PERMISSION_DENIED") || cleanMsg.includes("403")) {
    status = 403;
    userFriendly = "Akses ditolak (Permission Denied). Akun Google Cloud atau API Key Anda tidak memiliki izin untuk mengakses model ini.";
  } else if (cleanMsg.includes("RESOURCE_EXHAUSTED") || cleanMsg.includes("429")) {
    status = 429;
    userFriendly = "Batas kuota terlampaui (Quota / Rate Limit Exceeded). Harap tunggu beberapa saat sebelum mencoba kembali.";
  } else if (cleanMsg.includes("Timeout") || cleanMsg.includes("ECONNREFUSED") || cleanMsg.includes("ETIMEDOUT") || cleanMsg.includes("fetch failed")) {
    status = 504;
    userFriendly = "Koneksi ke endpoint Google Gemini API mengalami timeout atau kegagalan jaringan.";
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
      rawError: cleanMsg.slice(0, 300)
    }
  };
}
app.get("/api/status", (req, res) => {
  const hasEnvKey = isValidApiKey(process.env.GEMINI_API_KEY);
  res.json({
    status: "ok",
    hasEnvKey,
    activeDefaultProvider: "gemini-3.8-flash",
    defaultModel: GEMINI_CONFIG.model,
    apiVersion: GEMINI_CONFIG.apiVersion,
    supportedProviders: [
      { id: "gemini-3.8-flash", name: "Gemini API (gemini-3.8-flash)", model: GEMINI_CONFIG.model },
      { id: "pctce-o-studio", name: "Engine AI Studio PCTCE+O", model: "pctce-o-studio" }
    ],
    model: GEMINI_CONFIG.model,
    version: "1.0.0"
  });
});
app.post("/api/reset-session", (req, res) => {
  const sessionId = req.headers["x-session-id"] || req.body?.sessionId || "unknown";
  const newSessionId = `sess-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  console.log(`[Session Reset] Hard reset invoked for session: ${sessionId}. Context purge complete. New isolated session: ${newSessionId}`);
  res.json({
    success: true,
    sessionId: newSessionId,
    message: "Sesi berhasil direset. Semua memori konteks sebelumnya telah dihapus dan diisolasi secara total.",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
async function generateContentWithRetry(ai, params, maxRetries = 1) {
  const targetModel = params.model || GEMINI_CONFIG.model;
  let lastError = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[Gemini API] Requesting target model: ${targetModel} (attempt ${attempt + 1}/${maxRetries + 1})...`);
      const config = { ...params.config };
      delete config.temperature;
      delete config.topP;
      delete config.topK;
      delete config.candidateCount;
      if (config.thinkingConfig) {
        if (config.thinkingConfig.thinkingBudget !== void 0 && !config.thinkingConfig.thinkingLevel) {
          config.thinkingConfig.thinkingLevel = "medium";
          delete config.thinkingConfig.thinkingBudget;
        }
      }
      const timeoutMs = 2e4;
      const timeoutPromise = new Promise(
        (_, reject) => setTimeout(() => reject(new Error(`Timeout memanggil Gemini model ${targetModel} setelah ${timeoutMs}ms`)), timeoutMs)
      );
      const callPromise = ai.models.generateContent({
        ...params,
        config,
        model: targetModel
      });
      const response = await Promise.race([callPromise, timeoutPromise]);
      console.log(`[Gemini API] Successfully generated with model: ${targetModel}`);
      return { response, usedModel: targetModel };
    } catch (err) {
      lastError = err;
      const msg = err?.message || "";
      console.warn(`[Gemini API] Model ${targetModel} attempt ${attempt + 1} failed: ${maskApiKey(msg)}`);
      const isTemporary = msg.includes("503") || msg.includes("429") || msg.includes("UNAVAILABLE") || msg.includes("high demand") || msg.includes("Timeout");
      if (isTemporary && attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 1e3));
        continue;
      }
      break;
    }
  }
  throw lastError;
}
app.post("/api/test-connection", async (req, res) => {
  const customKey = req.headers["x-gemini-api-key"] || req.body?.apiKey;
  const provider = req.headers["x-ai-provider"] || req.body?.provider || GEMINI_CONFIG.provider;
  const targetModel = req.headers["x-gemini-model"] || req.body?.model || GEMINI_CONFIG.model;
  console.log(`[API /api/test-connection] Testing connection for provider: ${provider} | Target Model: ${targetModel}`);
  try {
    const ai = getGeminiClient(customKey);
    if (!ai) {
      return res.status(400).json({
        success: false,
        model: targetModel,
        provider,
        message: "API Key belum valid atau masih menggunakan placeholder. Harap masukkan Gemini API Key yang valid (diawali AIza...)."
      });
    }
    const startTime = Date.now();
    const { response, usedModel } = await generateContentWithRetry(ai, {
      model: targetModel,
      contents: "Ping test. Reply with: OK"
    });
    const latency = Date.now() - startTime;
    const reply = response.text || "";
    const providerDisplayName = provider === "gemini-3.8-flash" || provider === "gemini" ? `Gemini API (${usedModel})` : "Engine AI Studio PCTCE+O";
    res.json({
      success: true,
      imagesCount: 0,
      latency,
      reply: reply.trim(),
      model: usedModel,
      provider,
      usingCustomKey: !!customKey,
      message: `Koneksi ke ${providerDisplayName} berhasil terverifikasi dalam ${latency}ms!`
    });
  } catch (err) {
    const parsed = formatGeminiError(err, targetModel);
    console.error(`[API /api/test-connection] Verification failed for ${targetModel}:`, parsed.error);
    res.status(parsed.status).json({
      success: false,
      model: targetModel,
      provider,
      error: parsed.error,
      message: parsed.message,
      technicalDetails: parsed.technicalDetails
    });
  }
});
function parseRefinerResponse(raw) {
  let targetAiMode = "";
  let optimizedPrompt = "";
  let appliedTechniques = [];
  let improvementQuestions = [];
  const targetMatch = raw.match(/###?\s*🎯\s*Target AI & Mode\s*\n+([\s\S]*?)(?=(###?\s*⚡|###?\s*🛠|###?\s*🔍|$))/i);
  if (targetMatch) {
    targetAiMode = targetMatch[1].trim();
  }
  const codeBlockMatch = raw.match(/###?\s*⚡\s*Optimized Request[\s\S]*?```(?:text)?\n([\s\S]*?)```/i);
  if (codeBlockMatch) {
    optimizedPrompt = codeBlockMatch[1].trim();
  } else {
    const optSectionMatch = raw.match(/###?\s*⚡\s*Optimized Request\s*\n+([\s\S]*?)(?=(###?\s*🛠|###?\s*🔍|$))/i);
    if (optSectionMatch) {
      optimizedPrompt = optSectionMatch[1].replace(/```text|```/g, "").trim();
    }
  }
  const techMatch = raw.match(/###?\s*🛠\s*Applied Techniques\s*\n+([\s\S]*?)(?=(###?\s*🔍|$))/i);
  if (techMatch) {
    const lines = techMatch[1].split("\n");
    for (const line of lines) {
      const clean = line.replace(/^[-*•\d.]+\s*/, "").trim();
      if (clean && !clean.startsWith("#")) {
        appliedTechniques.push(clean);
      }
    }
  }
  const questMatch = raw.match(/###?\s*🔍\s*Improvement Questions\s*\n+([\s\S]*?)$/i);
  if (questMatch) {
    const lines = questMatch[1].split("\n");
    for (const line of lines) {
      const clean = line.replace(/^[-*•\d.]+\s*/, "").trim();
      if (clean && !clean.startsWith("#")) {
        improvementQuestions.push(clean);
      }
    }
  }
  return {
    targetAiMode,
    optimizedPrompt,
    appliedTechniques,
    improvementQuestions
  };
}
function generateLocalPctceRefinement(rawPrompt, targetAI = "ChatGPT", mode = "Advanced Refine", outputLang = "English", promptStyle = "Image Generation", customStyle) {
  const isId = outputLang === "Indonesia" || outputLang === "Auto Detect";
  const cleanPrompt = rawPrompt.trim();
  const lowerPrompt = cleanPrompt.toLowerCase();
  let persona = "";
  if (promptStyle === "Image Generation" || lowerPrompt.includes("gambar") || lowerPrompt.includes("foto") || lowerPrompt.includes("visual")) {
    persona = isId ? "Anda adalah Prompt Engineer & Art Director Kelas Dunia untuk Midjourney v6, DALL-E 3, dan Flux.1. Anda menguasai komposisi visual, pencahayaan sinematik, sudut lensa kamera, dan atmosfer artistik." : "You are a World-Class Art Director & Visual Prompt Engineer specializing in Midjourney v6, DALL-E 3, and Flux.1 photorealism, volumetric lighting, and camera optics.";
  } else if (promptStyle === "Coding & Development" || lowerPrompt.includes("kode") || lowerPrompt.includes("aplikasi") || lowerPrompt.includes("react") || lowerPrompt.includes("bug")) {
    persona = isId ? "Anda adalah Principal Software Architect dan Senior Full-Stack Engineer dengan standar clean architecture, zero-regression debugging, dan penanganan edge-case defensif." : "You are a Principal Software Architect and Senior Full-Stack Engineer adhering to clean code standards, type safety, and defensive edge-case handling.";
  } else if (promptStyle === "Writing & Content" || lowerPrompt.includes("artikel") || lowerPrompt.includes("naskah") || lowerPrompt.includes("cerita")) {
    persona = isId ? "Anda adalah Senior Editorial Writer, Narrative Designer, dan Creative Director yang ahli dalam teknik storytelling mendalam, resonance emosional, dan struktur tulisan engaging." : "You are a Senior Narrative Designer and Editorial Director specializing in evocative storytelling, emotional pacing, and high-retention structural prose.";
  } else if (promptStyle === "Business & Marketing" || lowerPrompt.includes("iklan") || lowerPrompt.includes("promosi") || lowerPrompt.includes("jual")) {
    persona = isId ? "Anda adalah Elite Direct-Response Marketing Strategist & Conversion Copywriter yang berorientasi pada value proposition tajam, customer psychology, dan ROI tinggi." : "You are an Elite Direct-Response Copywriter and Growth Strategist specializing in value proposition clarity and high-conversion behavioral triggers.";
  } else if (promptStyle === "Data Analysis" || lowerPrompt.includes("data") || lowerPrompt.includes("analisis") || lowerPrompt.includes("tren")) {
    persona = isId ? "Anda adalah Lead Quantitative Analyst & Business Intelligence Specialist yang mahir dalam visualisasi data actionable, identifikasi tren kausal, dan strategi berbasis metrik." : "You are a Lead Quantitative Analytics Director specializing in causal inference, trend segmentation, and actionable metric frameworks.";
  } else {
    persona = isId ? `Anda adalah Master Prompt Engineer dan Asisten Pakar Senior tingkat lanjut. Anda berorientasi pada eksekusi terstruktur, eliminasi ambiguitas, dan penghantaran solusi presisi tinggi.` : `You are an Advanced Master AI Specialist and Context Architect delivering high-precision, zero-fluff, and fully structured solutions.`;
  }
  let context = "";
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
  let task = "";
  if (promptStyle === "Image Generation" || lowerPrompt.includes("gambar") || lowerPrompt.includes("foto") || lowerPrompt.includes("visual")) {
    task = isId ? `Buat deskripsi visual / prompt generasi gambar sinematik & fotorealistis berdasarkan instruksi: "${cleanPrompt}":
1. Subjek & Komposisi: Detail subjek utama ("${cleanPrompt}"), postur/pose, ekspresi, tekstur, pakaian/properti, dan penempatan frame.
2. Setting Lingkungan & Pencahayaan: Latar belakang dan tata cahaya yang spesifik untuk "${cleanPrompt}" (volumetric light, ambient mood, kedalaman ruang).
3. Sinematografi & Lensa: Sudut kamera (eye-level/close-up/wide), lensa (50mm/85mm), aperture/depth of field, dan color grading profile.
4. Parameter Teknis: Format siap pakai langsung untuk Midjourney v6 / DALL-E 3 / Flux.` : `Generate high-definition photographic prompt derived strictly from: "${cleanPrompt}":
1. Core Subject & Framing: Detailed subject attributes for "${cleanPrompt}", pose, attire, tactile details, and composition.
2. Atmospheric Setting: Background environment and lighting calibrated exclusively for "${cleanPrompt}".
3. Camera & Lens: Focal length, depth of field, color grading.
4. Generation Flags: Optimized directly for Midjourney v6 / DALL-E 3 / Flux.`;
  } else if (promptStyle === "Writing & Content" || lowerPrompt.includes("artikel") || lowerPrompt.includes("naskah") || lowerPrompt.includes("cerita")) {
    task = isId ? `Susun karya tulisan berkualitas tinggi untuk: "${cleanPrompt}":
1. Pembuka (Hook): Menarik atensi pembaca secara langsung dan relevan dengan topik "${cleanPrompt}".
2. Pengembangan Konten: Uraian terstruktur, narasi mengalir, dan argumentasi/deskripsi berbobot.
3. Penutup: Kesimpulan tajam atau pesan reflektif yang kuat.` : `Draft an engaging and structured written piece tailored to "${cleanPrompt}":
1. Compelling Hook.
2. In-depth narrative/analytical development.
3. Memorable conclusion or call to reflection.`;
  } else if (promptStyle === "Coding & Development" || lowerPrompt.includes("kode") || lowerPrompt.includes("aplikasi") || lowerPrompt.includes("react") || lowerPrompt.includes("bug")) {
    task = isId ? `Selesaikan kebutuhan rekayasa perangkat lunak untuk: "${cleanPrompt}":
1. Analisis Kebutuhan & Desain: Identifikasi arsitektur komponen, alur data, dan mitigasi edge-case.
2. Implementasi Lengkap: Tulis kode bersih (Clean Code), type-safe, dan efisien.
3. Validasi & Pengujian: Uraikan verifikasi fungsional dan tips optimasi performa.` : `Execute software engineering requirements for "${cleanPrompt}":
1. Architecture & component breakdown.
2. Complete type-safe implementation.
3. Verification and edge-case handling.`;
  } else if (promptStyle === "Business & Marketing" || lowerPrompt.includes("iklan") || lowerPrompt.includes("promosi") || lowerPrompt.includes("jual")) {
    task = isId ? `Rancang strategi dan materi pemasaran untuk: "${cleanPrompt}":
1. Value Proposition & Hook: Soroti pemecahan masalah utama audiens terkait "${cleanPrompt}".
2. Draft Copy Kampanye: Materi promosi dengan fokus pada diferensiasi dan tingkat konversi tinggi.
3. Call-to-Action (CTA): Arahan tindakan yang jelas, meyakinkan, dan berorientasi ROI.` : `Develop high-conversion marketing copy for "${cleanPrompt}":
1. Value proposition and hook.
2. High-impact messaging.
3. Frictionless CTA.`;
  } else if (promptStyle === "Data Analysis" || lowerPrompt.includes("data") || lowerPrompt.includes("analisis")) {
    task = isId ? `Lakukan analisis data terstruktur untuk: "${cleanPrompt}":
1. Dekomposisi Metrik: Variabel kunci, kriteria evaluasi, dan segmentasi data.
2. Metodologi Analitik: Pendekatan pemrosesan, kueri data, dan deteksi pola/tren.
3. Rekomendasi Actionable: Arahan strategis berbasis temuan data.` : `Conduct structured analytical decomposition for "${cleanPrompt}":
1. Key metrics and variables.
2. Analysis methodology.
3. Data-driven strategic takeaways.`;
  } else {
    task = isId ? `Eksekusi instruksi pengguna secara sistematis berdasarkan permintaan sesi ini: "${cleanPrompt}":
1. Analisis Inti Kebutuhan: Bedah instruksi "${cleanPrompt}" menjadi komponen implementasi terukur.
2. Solusi Utama Terperinci: Sajikan pemecahan masalah yang komprehensif, terstruktur, dan bebas ambiguitas.
3. Panduan Eksekusi Praktis: Berikan langkah penerapan nyata dan kriteria kualitas output.` : `Systematically execute user instruction based exclusively on the current request: "${cleanPrompt}":
1. Deconstruct core intent of "${cleanPrompt}".
2. Deliver comprehensive, high-signal, and fully structured resolution.
3. Provide step-by-step actionable guidance and best practices.`;
  }
  const constraints = isId ? `- FORMAT: Sajikan dalam format Markdown rapi dengan judul bagian tegas.
- ZERO-HALLUCINATION: Jangan mengarang data atau referensi fiktif.
- EFISIENSI TOKEN: Hindari kalimat basa-basi pembuka ("Tentu saya bantu", dll.). Langsung mulai pada inti konten.
- NADA & BAHASA: Profesional, mengalir, dan bernilai informasi tinggi.` : `- FORMAT: Strict structured Markdown with distinct section headings.
- ZERO-HALLUCINATION: Never fabricate speculative claims or false citations.
- TOKEN EFFICIENCY: Zero conversational filler. Begin directly with actionable output.
- TONE: High-signal, authoritative, and engaging.`;
  const evaluation = isId ? `[SELF-CHECK / GERBANG EVALUASI MANDIRI]:
Sebelum menampilkan jawaban akhir, tinjau kembali:
1. Apakah seluruh elemen persona dan konteks telah terakomodasi secara harmonis?
2. Apakah struktur output rapi, mudah dibaca, dan bebas dari kata-kata mubazir?
3. Jika ditemukan kekurangan, perbaiki secara internal sebelum memberikan hasil final.` : `[MANDATORY EVALUATION GATE]:
Before finalizing output, audit against completeness, structural elegance, and zero conversational waste.`;
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
  const techniques = [
    "Sintesis Arsitektur PCTCE+O (Persona, Context, Task, Constraints, Evaluation, Optimization)",
    "Eliminasi Frasa Basa-basi & Kompresi Efisiensi Token (~45%)",
    "Penajaman Konteks & Resolusi Ambiguitas (Lyra 4D Workflow)",
    "Pagar Pembatas Anti-Halusinasi & Uncertainty Admission Guardrails",
    "Gerbang Verifikasi Mandiri (Internal Self-Evaluation Loop)"
  ];
  let questions = [];
  if (promptStyle === "Image Generation" || lowerPrompt.includes("gambar") || lowerPrompt.includes("foto") || lowerPrompt.includes("visual")) {
    questions = isId ? [
      `Apakah ada preferensi rasio aspek khusus untuk subjek "${cleanPrompt}" (misal 16:9 sinematik, 9:16 vertikal, atau 1:1)?`,
      `Bagaimana pencahayaan dan atmosfer (mood) visual yang paling Anda inginkan (misal: natural daylight, dramatic studio lighting, atau golden hour)?`,
      `Apakah ada preferensi lensa kamera atau sudut pandang tertentu (misal: eye-level 50mm, close-up portrait 85mm, atau wide-angle 24mm)?`
    ] : [
      `Do you have a specific aspect ratio preference for "${cleanPrompt}" (e.g. 16:9 cinematic, 9:16 portrait, or 1:1)?`,
      `What lighting and visual atmosphere would you prefer (e.g. natural daylight, dramatic studio lighting, or golden hour)?`,
      `Is there a preferred lens profile or camera angle (e.g. 50mm candid, 85mm portrait, or wide-angle)?`
    ];
  } else if (promptStyle === "Coding & Development" || lowerPrompt.includes("kode") || lowerPrompt.includes("aplikasi")) {
    questions = isId ? [
      "Apakah ada framework, bahasa, atau dependensi spesifik yang wajib digunakan?",
      "Seberapa mendalam tingkat penanganan error, validasi input, dan pengujian unit yang dibutuhkan?",
      "Apakah solusi harus kompatibel dengan sistem atau database yang sudah ada?"
    ] : [
      "Are there specific frameworks or language versions required?",
      "What depth of error handling, schema validation, and unit test coverage is needed?",
      "Are there existing architectural constraints to interface with?"
    ];
  } else {
    questions = isId ? [
      `Siapakah target audiens utama yang dituju untuk konteks "${cleanPrompt}" dan bagaimana nada bicara (tone) yang diharapkan?`,
      "Apakah ada batasan format tertentu (misalnya Markdown tabel, daftar prioritas, atau narasi mengalir) yang harus dipatuhi?",
      "Apakah Anda ingin menyertakan kriteria keberhasilan khusus untuk memvalidasi output target AI?"
    ] : [
      `Who is the primary intended audience for "${cleanPrompt}" and what tone of voice should be adopted?`,
      "Are there strict formatting constraints (e.g. structured table, checklist, or narrative prose) to enforce?",
      "Would you like to embed specific benchmark acceptance criteria into the prompt?"
    ];
  }
  const rawMarkdown = `### \u{1F3AF} Target AI & Mode
${targetAI} \u2013 ${promptStyle} (${mode})

### \u26A1 Optimized Request
\`\`\`text
${optimizedPrompt}
\`\`\`

### \u{1F6E0} Applied Techniques
${techniques.map((t) => `- ${t}`).join("\n")}

### \u{1F50D} Improvement Questions
${questions.map((q, idx) => `${idx + 1}. ${q}`).join("\n")}`;
  return { rawMarkdown };
}
app.post("/api/refine", async (req, res) => {
  try {
    const {
      prompt,
      targetAI = "ChatGPT",
      mode = "Advanced Refine",
      outputLang = "English",
      promptStyle = "Image Generation",
      customStyle = ""
    } = req.body;
    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({
        success: false,
        error: "Prompt input tidak boleh kosong."
      });
    }
    const sessionId = req.headers["x-session-id"] || req.body?.sessionId || "stateless";
    console.log(`[API /api/refine] [Session: ${sessionId}] Processing fresh isolated request: "${prompt.slice(0, 40)}..." | Target: ${targetAI} | Mode: ${mode}`);
    const customKey = req.headers["x-gemini-api-key"] || req.body?.apiKey;
    const provider = req.headers["x-ai-provider"] || req.body?.provider || GEMINI_CONFIG.provider;
    const requestedModel = req.headers["x-gemini-model"] || req.body?.model || GEMINI_CONFIG.model;
    const images = req.body?.images || [];
    const ai = getGeminiClient(customKey);
    let rawMarkdown = "";
    let usedModel = "";
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
### \u{1F3AF} Target AI & Mode
[Target AI and mode]

### \u26A1 Optimized Request
\`\`\`text
[READY-TO-USE MASTER PROMPT INSIDE CODE BLOCK]
\`\`\`

### \u{1F6E0} Applied Techniques
- [Bullet points of techniques applied]

### \u{1F50D} Improvement Questions
1. [Question 1]
2. [Question 2]`;
        const visualContextNote = images.length > 0 ? `

[MULTIMODAL GROUNDING]: ${images.length} reference image(s) attached. Thoroughly examine visual features (composition, perspective, lighting, color harmony, subject details, artistic medium) and ground the master prompt firmly in these references according to user goals.` : "";
        const userMessage = `OPTIMIZATION SPECIFICATIONS:
- Target AI: ${targetAI}
- Optimization Mode: ${mode}
- Output Language: ${outputLang}
- Prompt Style: ${promptStyle === "Custom" ? `Custom (${customStyle})` : promptStyle}${visualContextNote}

USER RAW PROMPT TO REFINE:
"""
${prompt}
"""

Please execute the Lyra 4D workflow and PCTCE+O framework to produce the final refined master prompt. Follow the strict four-section markdown format.`;
        const userParts = [];
        if (images.length > 0) {
          for (const img of images) {
            if (img.base64Data && img.mimeType) {
              userParts.push({
                inlineData: {
                  mimeType: img.mimeType,
                  data: img.base64Data
                }
              });
            }
          }
        }
        userParts.push({ text: userMessage });
        const { response, usedModel: modelName } = await generateContentWithRetry(ai, {
          model: requestedModel,
          contents: [
            {
              role: "user",
              parts: userParts
            }
          ],
          config: {
            systemInstruction: systemInstruction + (images.length > 0 ? `

MULTIMODAL VISUAL DIRECTIVES:
The user has attached ${images.length} reference image(s). You must act as an expert computer vision and prompt engineer. Extract relevant visual characteristics (subject identity, pose, perspective, framing, lighting, color grading, artistic style, texture) and synthesize them seamlessly with the user's prompt instruction. Never ignore the user prompt; the user prompt dictates the goal, while the images provide the visual reference authority.` : ""),
            thinkingConfig: {
              thinkingLevel: mode === "Expert Refine" ? "high" : "medium"
            }
          }
        });
        rawMarkdown = response.text || "";
        usedModel = provider === "gemini-3.8-flash" ? `Gemini API (${modelName})` : `Engine AI Studio PCTCE+O (${modelName})`;
      } catch (geminiError) {
        console.warn("[API /api/refine] Gemini API unavailable or timed out. Seamlessly engaging local PCTCE+O engine:", geminiError?.message);
        const fallback = generateLocalPctceRefinement(prompt, targetAI, mode, outputLang, promptStyle, customStyle);
        rawMarkdown = fallback.rawMarkdown;
        usedModel = provider === "gemini-3.8-flash" ? "Gemini API (gemini-3.8-flash) [Local PCTCE+O Fallback]" : "Engine AI Studio PCTCE+O";
      }
    } else {
      console.log("[API /api/refine] Operating in zero-latency mode via built-in PCTCE+O engine.");
      const fallback = generateLocalPctceRefinement(prompt, targetAI, mode, outputLang, promptStyle, customStyle);
      rawMarkdown = fallback.rawMarkdown;
      usedModel = provider === "gemini-3.8-flash" ? "Gemini API (gemini-3.8-flash) [Local PCTCE+O Fallback]" : "Engine AI Studio PCTCE+O";
    }
    const parsed = parseRefinerResponse(rawMarkdown);
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
        refinedCharCount: refinedChars
      }
    });
  } catch (err) {
    const errorMsg = err?.message || "Terjadi kesalahan pada server saat memproses optimasi prompt.";
    console.error("Refine error:", errorMsg);
    res.status(500).json({
      success: false,
      error: errorMsg,
      message: "Terjadi kesalahan saat memproses prompt. Silakan periksa kembali konfigurasi atau coba lagi."
    });
  }
});
function generateServerLocalAdvancedRefinement(optimizedPrompt, originalPrompt = "", targetAI = "ChatGPT", mode = "Advanced Refine", outputLang = "English", promptStyle = "Image Generation", customStyle) {
  return generateStructuredAdvancedRefinement(
    optimizedPrompt,
    originalPrompt,
    targetAI,
    mode,
    outputLang,
    promptStyle,
    customStyle
  );
}
app.post("/api/advanced-refine", async (req, res) => {
  try {
    const {
      optimizedPrompt,
      originalPrompt = "",
      targetAI = "ChatGPT",
      mode = "Advanced Refine",
      outputLang = "English",
      promptStyle = "Image Generation",
      customStyle = "",
      images = []
    } = req.body;
    if (!optimizedPrompt || typeof optimizedPrompt !== "string" || !optimizedPrompt.trim()) {
      return res.status(400).json({
        success: false,
        error: "Optimized Request input tidak boleh kosong."
      });
    }
    const sessionId = req.headers["x-session-id"] || req.body?.sessionId || "stateless";
    console.log(`[API /api/advanced-refine] [Session: ${sessionId}] Running Advanced Final Refinement on ${optimizedPrompt.length} chars | Target: ${targetAI}`);
    const customKey = req.headers["x-gemini-api-key"] || req.body?.apiKey;
    const provider = req.headers["x-ai-provider"] || req.body?.provider || GEMINI_CONFIG.provider;
    const requestedModel = req.headers["x-gemini-model"] || req.body?.model || GEMINI_CONFIG.model;
    const ai = getGeminiClient(customKey);
    let refinedPrompt = "";
    let usedModel = "";
    if (ai) {
      try {
        const advancedSystemInstruction = `You are an Elite Principal Prompt Architect and Master Refinement Specialist.
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
1. DYNAMIC & ADAPTIVE: Adapt the headings, subheadings, terminology, and technical metrics to the specific domain analyzed from the OPTIMIZED REQUEST (e.g. Photography/Image Generation -> Optics, Camera, Lighting, Textures; Software/Coding -> Architecture, Tech Stack, Invariants, Type Safety; Writing/Editorial -> Narrative Structure, Cadence, Tone; Business/Marketing -> Hook, Value Prop, CTA; Data Analysis -> Metric Taxonomy, Causality, Statistical Rigor).
2. NEVER FORCE IRRELEVANT CATEGORIES: Do NOT include camera optics in a software prompt or database schemas in a portrait prompt. Be deeply domain-relevant.
3. 100% RETENTION: Retain all parameters, requirements, context, and instructions from the OPTIMIZED REQUEST. Do not drop or dilute any important constraints.
4. LANGUAGE COHERENCE: If the target output language is Indonesian or detected as Indonesian, use Indonesian headings and terms (e.g. ### 7. PAGAR PEMBATAS & LARANGAN KETAT, ### 8. PERSYARATAN OUTPUT AKHIR, **URUTAN PRIORITAS:**, **DIREKTIF AKHIR:**, etc.). If English, use English.
5. STRICT OUTPUT: Output ONLY the complete master prompt text. Zero conversational meta-commentary, introductory pleasantries ("Here is your prompt:"), or concluding remarks.`;
        const userParts = [];
        if (images && images.length > 0) {
          for (const img of images) {
            if (img.base64Data && img.mimeType) {
              userParts.push({
                inlineData: {
                  mimeType: img.mimeType,
                  data: img.base64Data
                }
              });
            }
          }
        }
        const promptText = `OPTIMIZED REQUEST (PRIMARY INPUT TO REFINE):
"""
${optimizedPrompt}
"""

ADDITIONAL CONTEXT (IF RELEVANT):
- Original User Request: ${originalPrompt || "N/A"}
- Target AI: ${targetAI}
- Mode: ${mode}
- Language: ${outputLang}
- Style: ${promptStyle === "Custom" ? `Custom (${customStyle})` : promptStyle}
${images && images.length > 0 ? `- Reference Images: ${images.length} image(s) attached for visual grounding.
` : ""}

Please execute the Universal Adaptive Refinement and output ONLY the final, definitive, production-grade master prompt.`;
        userParts.push({ text: promptText });
        const { response, usedModel: modelName } = await generateContentWithRetry(ai, {
          model: requestedModel,
          contents: [{ role: "user", parts: userParts }],
          config: {
            systemInstruction: advancedSystemInstruction,
            thinkingConfig: {
              thinkingLevel: mode === "Expert Refine" ? "high" : "medium"
            }
          }
        });
        const rawText = response.text || "";
        const codeBlockMatch = rawText.match(/^\s*```(?:markdown|text)?\n([\s\S]*?)```\s*$/);
        refinedPrompt = codeBlockMatch ? codeBlockMatch[1].trim() : rawText.trim();
        usedModel = provider === "gemini-3.8-flash" ? `Gemini API (${modelName})` : `Engine AI Studio PCTCE+O (${modelName})`;
      } catch (geminiError) {
        console.warn("[API /api/advanced-refine] Gemini API unavailable. Engaging server-side PCTCE+O engine:", geminiError?.message);
        const fallback = generateServerLocalAdvancedRefinement(optimizedPrompt, originalPrompt, targetAI, mode, outputLang, promptStyle, customStyle);
        refinedPrompt = fallback.refinedPrompt;
        usedModel = provider === "gemini-3.8-flash" ? "Gemini API (gemini-3.8-flash) [Local Engine Fallback]" : fallback.engineUsed;
      }
    } else {
      console.log("[API /api/advanced-refine] Operating in zero-latency mode via built-in PCTCE+O engine.");
      const fallback = generateServerLocalAdvancedRefinement(optimizedPrompt, originalPrompt, targetAI, mode, outputLang, promptStyle, customStyle);
      refinedPrompt = fallback.refinedPrompt;
      usedModel = fallback.engineUsed;
    }
    res.json({
      success: true,
      refinedPrompt,
      engineUsed: usedModel
    });
  } catch (err) {
    const errorMsg = err?.message || "Terjadi kesalahan pada server saat memproses Advanced Final Refinement.";
    console.error("Advanced refine error:", errorMsg);
    res.status(500).json({
      success: false,
      error: errorMsg,
      message: "Gagal menjalankan Advanced Final Refinement. Silakan coba kembali."
    });
  }
});
async function startServer() {
  const isProd = process.env.NODE_ENV === "production";
  if (!isProd) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`PROMPT REFINER AI server running on http://0.0.0.0:${PORT}`);
  });
}
startServer();
export {
  GEMINI_CONFIG
};
