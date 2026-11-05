// Pure client-side PCTCE+O & Lyra 4D Engine
// Guarantees 100% standalone execution for GitHub Pages & Android APK

export function generateClientPctceRefinement(
  rawPrompt: string,
  targetAI: string = 'ChatGPT',
  mode: string = 'Advanced Refine',
  outputLang: string = 'English',
  promptStyle: string = 'Image Generation',
  customStyle?: string
): {
  rawMarkdown: string;
  targetAiMode: string;
  optimizedPrompt: string;
  appliedTechniques: string[];
  improvementQuestions: string[];
} {
  const isId = outputLang === 'Indonesia' || outputLang === 'Auto Detect';
  const cleanPrompt = rawPrompt.trim();
  const lowerPrompt = cleanPrompt.toLowerCase();

  // 1. Calibrated persona
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
  } else if (promptStyle === 'Data Analysis' || lowerPrompt.includes('data') || lowerPrompt.includes('analisis')) {
    persona = isId
      ? 'Anda adalah Lead Quantitative Analyst & Business Intelligence Specialist yang mahir dalam visualisasi data actionable, identifikasi tren kausal, dan strategi berbasis metrik.'
      : 'You are a Lead Quantitative Analytics Director specializing in causal inference, trend segmentation, and actionable metric frameworks.';
  } else {
    persona = isId
      ? `Anda adalah Master Prompt Engineer dan Asisten Pakar Senior tingkat lanjut. Anda berorientasi pada eksekusi terstruktur, eliminasi ambiguitas, dan penghantaran solusi presisi tinggi.`
      : `You are an Advanced Master AI Specialist and Context Architect delivering high-precision, zero-fluff, and fully structured solutions.`;
  }

  // 2. Context
  const context = isId
    ? `Tujuan Pengguna: "${cleanPrompt}"
Lingkup Konteks:
- Model AI Sasaran: ${targetAI}
- Tingkat Optimasi: ${mode}
- Sasaran Kualitas: Mengubah instruksi ringkas pengguna menjadi instruksi eksekusi komprehensif, terstruktur rapi, dan langsung dapat ditindaklanjuti.`
    : `Core User Intent: "${cleanPrompt}"
Operating Parameters:
- Target AI System: ${targetAI}
- Mode: ${mode}
- Quality Standard: Transform initial input into a deterministic, production-grade master prompt.`;

  // 3. Deliverables & task
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

  // 4. Constraints
  const constraints = isId
    ? `- FORMAT: Sajikan dalam format Markdown rapi dengan judul bagian tegas.
- ZERO-HALLUCINATION: Jangan mengarang data atau referensi fiktif.
- EFISIENSI TOKEN: Hindari kalimat basa-basi pembuka ("Tentu saya bantu", dll.). Langsung mulai pada inti konten.
- NADA & BAHASA: Profesional, mengalir, dan bernilai informasi tinggi.`
    : `- FORMAT: Strict structured Markdown with distinct section headings.
- ZERO-HALLUCINATION: Never fabricate speculative claims or false citations.
- TOKEN EFFICIENCY: Zero conversational filler. Begin directly with actionable output.
- TONE: High-signal, authoritative, and engaging.`;

  // 5. Evaluation
  const evaluation = isId
    ? `[SELF-CHECK / GERBANG EVALUASI MANDIRI]:
Sebelum menampilkan jawaban akhir, tinjau kembali:
1. Apakah seluruh elemen persona dan konteks telah terakomodasi secara harmonis?
2. Apakah struktur output rapi, mudah dibaca, dan bebas dari kata-kata mubazir?
3. Jika ditemukan kekurangan, perbaiki secara internal sebelum memberikan hasil final.`
    : `[MANDATORY EVALUATION GATE]:
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

  const appliedTechniques = [
    'Sintesis Arsitektur PCTCE+O (Persona, Context, Task, Constraints, Evaluation, Optimization)',
    'Eliminasi Frasa Basa-basi & Kompresi Efisiensi Token (~45%)',
    'Penajaman Konteks & Resolusi Ambiguitas (Lyra 4D Workflow)',
    'Pagar Pembatas Anti-Halusinasi & Uncertainty Admission Guardrails',
    'Gerbang Verifikasi Mandiri (Internal Self-Evaluation Loop)'
  ];

  let improvementQuestions: string[] = [];
  if (promptStyle === 'Image Generation' || lowerPrompt.includes('gambar') || lowerPrompt.includes('foto') || lowerPrompt.includes('visual')) {
    improvementQuestions = isId
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
    improvementQuestions = isId
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
    improvementQuestions = isId
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

  const targetAiMode = `${targetAI} – ${promptStyle} (${mode})`;

  const rawMarkdown = `### 🎯 Target AI & Mode
${targetAiMode}

### ⚡ Optimized Request
\`\`\`text
${optimizedPrompt}
\`\`\`

### 🛠 Applied Techniques
${appliedTechniques.map((t) => `- ${t}`).join('\n')}

### 🔍 Improvement Questions
${improvementQuestions.map((q, idx) => `${idx + 1}. ${q}`).join('\n')}`;

  return {
    rawMarkdown,
    targetAiMode,
    optimizedPrompt,
    appliedTechniques,
    improvementQuestions,
  };
}


/**
 * Universal Adaptive Advanced Final Refinement Engine (Client-side / Offline)
 * Performs high-precision structural enrichment, conflict elimination, and operational sharpening.
 */
export function generateClientAdvancedRefinement(
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

  // Detect category domain
  const isVisual = promptStyle === 'Image Generation' || lowerBase.includes('gambar') || lowerBase.includes('foto') || lowerBase.includes('portrait') || lowerBase.includes('visual');
  const isCode = promptStyle === 'Coding & Development' || lowerBase.includes('kode') || lowerBase.includes('aplikasi') || lowerBase.includes('react') || lowerBase.includes('function') || lowerBase.includes('bug');
  const isWriting = promptStyle === 'Writing & Content' || lowerBase.includes('artikel') || lowerBase.includes('naskah') || lowerBase.includes('cerita');
  const isMarketing = promptStyle === 'Business & Marketing' || lowerBase.includes('iklan') || lowerBase.includes('promosi') || lowerBase.includes('marketing');
  const isData = promptStyle === 'Data Analysis' || lowerBase.includes('data') || lowerBase.includes('analisis') || lowerBase.includes('metrik');

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
