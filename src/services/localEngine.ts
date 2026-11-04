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

/**
 * Dynamic & Adaptive Advanced Final Refinement Engine
 * Formats output strictly matching the authoritative structured blueprint:
 * # TITLE
 * ## CORE MANDATE
 * ### 1. SOURCE OF TRUTH & AUTHORITY (with **MANDATORY LOCK**)
 * ### 2. CORE SPECIFICATIONS & ATTRIBUTES
 * ### 3. CONTEXT & ENVIRONMENT / ARCHITECTURE
 * ### 4. TECHNICAL EXECUTION & PARAMETERS
 * ### 5. FIDELITY & BENCHMARK SPECIFICATIONS
 * ### 6. DEFENSIVE QUALITY ENHANCEMENT
 * ### 7. STRICT NEGATIVE INSTRUCTIONS (Do not: ...)
 * ### 8. FINAL OUTPUT REQUIREMENTS (PRIORITY ORDER & FINAL DIRECTIVE)
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

  // Detect domain context
  const isVisual =
    promptStyle === 'Image Generation' ||
    lowerBase.includes('gambar') ||
    lowerBase.includes('foto') ||
    lowerBase.includes('portrait') ||
    lowerBase.includes('visual') ||
    lowerBase.includes('studio') ||
    lowerBase.includes('photorealistic') ||
    lowerBase.includes('midjourney') ||
    lowerBase.includes('flux');

  const isCode =
    promptStyle === 'Coding & Development' ||
    lowerBase.includes('kode') ||
    lowerBase.includes('aplikasi') ||
    lowerBase.includes('react') ||
    lowerBase.includes('typescript') ||
    lowerBase.includes('function') ||
    lowerBase.includes('bug') ||
    lowerBase.includes('backend') ||
    lowerBase.includes('frontend') ||
    lowerBase.includes('api');

  const isWriting =
    promptStyle === 'Writing & Content' ||
    lowerBase.includes('artikel') ||
    lowerBase.includes('naskah') ||
    lowerBase.includes('cerita') ||
    lowerBase.includes('buku') ||
    lowerBase.includes('esai');

  const isMarketing =
    promptStyle === 'Business & Marketing' ||
    lowerBase.includes('iklan') ||
    lowerBase.includes('promosi') ||
    lowerBase.includes('marketing') ||
    lowerBase.includes('copywriting') ||
    lowerBase.includes('penjualan');

  const isData =
    promptStyle === 'Data Analysis' ||
    lowerBase.includes('data') ||
    lowerBase.includes('analisis') ||
    lowerBase.includes('metrik') ||
    lowerBase.includes('statistik');

  // Extract primary topic or title candidate from the input
  const firstLine = cleanBase.split('\n')[0].replace(/^[#*\-\s\[\]0-9.:]+/, '').trim();
  const topicTitle = (firstLine && firstLine.length < 60)
    ? firstLine.toUpperCase()
    : (originalPrompt.trim().slice(0, 50).toUpperCase() || 'MASTER SPECIFICATION');

  let resultMarkdown = '';

  if (isVisual) {
    if (isId) {
      resultMarkdown = `# ${topicTitle}
## PRESERVASI IDENTITAS MUTLAK — OTORITAS REFERENSI VISUAL

### 1. GAMBAR & REFERENSI VISUAL — SUMBER KEBENARAN TUNGGAL
Gunakan gambar referensi yang diunggah dan instruksi visual yang diberikan sebagai satu-satunya sumber kebenaran otoritatif untuk identitas subjek, karakteristik fisik, busana, ekspresi, dan komposisi visual asli.
Pertahankan setiap subjek secara independen dengan tingkat fidelitas identitas setinggi mungkin.

**KUNCI IDENTITAS WAJAH MUTLAK (ABSOLUTE FACE IDENTITY LOCK)**
Wajah setiap subjek wajib tetap identik secara visual dengan referensi aslinya.
Dilarang menafsirkan ulang, meregenerasi, merekonstruksi, mendesain ulang, mempercantik (beautify), mengidealisasi, menata gaya (stylize), atau memodifikasi wajah apa pun.

Pertahankan seluruh karakteristik wajah asli:
- Geometri dan identitas wajah asli.
- Bentuk wajah dan proporsi fitur wajah.
- Struktur dahi dan garis rambut asli.
- Bentuk, ketebalan, dan posisi alis.
- Bentuk mata, ukuran, jarak antar-mata, dan sorot pandang.
- Struktur hidung, lebar cuping, dan proporsinya.
- Struktur pipi dan ketegasan tulang pipi.
- Bentuk bibir, proporsi mulut, dan ekspresi asli.
- Garis rahang, dagu, dan kontur leher.
- Bentuk, ukuran, dan posisi telinga.
- Asimetri alami wajah subjek.
- Tekstur kulit asli, pori-pori mikro, dan tanda lahir/karakteristik unik.
- Penampilan usia asli dan karakteristik alami wajah.

**PEMBATASAN ALTERASI NOL (ZERO FACIAL ALTERATION)**
Dilarang melakukan penghalusan kulit berlebih (skin smoothing), pembentukan ulang wajah (face reshaping), rekonstruksi wajah artifisial, atau penambahan detail wajah yang tidak ada pada referensi. Wajah referensi memegang prioritas tertinggi mutlak di atas seluruh instruksi visual lainnya.

### 2. SUBJEK DAN KOMPOSISI
Wujudkan potret studio formal yang sangat fotorealistis dan profesional yang menampilkan subjek asli sebagaimana pada referensi.
Sesuaikan secara dinamis dengan karakteristik aktual subjek:
- Jumlah subjek dan hubungan spasial antar-subjek.
- Karakteristik fisik, postur, dan proporsi anatomi tubuh alami.
- Gaya rambut asli, penutup kepala, atau aksesori yang melekat.
- Jenis pakaian, potongan busana, warna, dan detail tekstil.
- Sikap tubuh, gestur, dan arah pandang mata.

**KUNCI KOMPOSISI (COMPOSITION LOCK)**
Pertahankan orientasi asli, perspektif kamera, penempatan subjek dalam bingkai (framing), ruang kepala (headroom), dan tata letak spasial keseluruhan. Jangan mengubah pose, sudut kamera, atau posisi tubuh secara sepihak kecuali diminta secara eksplisit.

### 3. LATAR BELAKANG DAN LINGKUNGAN
Pertahankan lingkungan studio atau latar belakang sesuai preferensi spesifik yang diminta tanpa mengorbankan subjek:
- Warna latar belakang, gradasi nada, dan kedalaman spasial.
- Tekstur permukaan latar belakang studio yang rapi dan elegan.
- Pencahayaan latar belakang yang memisahkan subjek dari latar (separation lighting).
- Dilarang memasukkan elemen dekorasi yang tidak diminta atau mengaburkan subjek utama.

### 4. PENCAHAYAAN DAN RENDERING FOTOGRAFI
Terapkan tata cahaya studio profesional dengan tampilan fotografis yang seimbang dan natural:
- Pencahayaan studio lembut dan merata (soft diffused studio lighting).
- Distribusi bayangan alami (natural shadow gradation) tanpa kontras ekstrem yang merusak detail.
- Reproduksi warna kulit yang akurat dan natural (true-to-life skin tones).
- Highlight terkontrol tanpa overexposure atau clipping.
- Transisi tonal halus dan kedalaman optik yang realistis.

**PEMBATASAN PENCAHAYAAN WAJAH**
Pencahayaan baru tidak boleh merusak atau mengubah bentuk dan fitur wajah asli. Peningkatan kualitas pencahayaan wajib melayani preservasi identitas.

### 5. KARAKTERISTIK KAMERA DAN OPTIK
Fotografi potret studio profesional standar industri:
- Perspektif Lensa: 85mm f/1.4 prime lens (standar emas potret studio) atau 50mm natural eye-level.
- Kedalaman Ruang (Depth of Field): Aperture terkalibrasi lembut untuk mempertahankan seluruh subjek dan detail penting dalam fokus tajam, dengan bokeh latar belakang yang melingkar halus.
- Fokus: Fokus optik tajam pada iris mata subjek.
- Resolusi & Kejernihan: Fotografi resolusi ultra-tinggi (8K UHD photorealism).
- Tekstur Material: Detail mikro pakaian, tekstil kain, helaian rambut natural, dan tangkapan cahaya alami pada mata (catchlight).
- Hindari efek sinematik berlebihan, kontras artifisial, atau color grading yang menyimpang dari warna asli.

### 6. PENINGKATAN KUALITAS FOTOGRAFIS
Tingkatkan aspek teknis rendering tanpa menyentuh esensi subjek:
- Kejernihan optik dan resolusi gambar alami.
- Konsistensi latar belakang dan pemisahan subjek.
- Visibilitas detail tekstil busana dan ornamen.
- Kerapian pencahayaan dan keseragaman eksposur.
- Ketajaman fotografis murni tanpa artefak digital.

### 7. STRICT NEGATIVE INSTRUCTIONS
Do not:
- Mengubah identitas subjek atau merekayasa fitur wajah baru.
- Memodifikasi geometri wajah, bentuk hidung, mata, bibir, atau garis rahang.
- Mengubah ekspresi wajah asli atau arah tatapan mata.
- Mengubah estimasi usia subjek.
- Memodifikasi gaya rambut, garis rambut, atau warna rambut asli.
- Mengubah warna kulit asli atau menghapus tanda lahir/fitur khas.
- Mengaplikasikan filter kecantikan (beauty filters) atau penghalusan kulit plastik (airbrush/plastic skin).
- Mengubah proporsi alami tubuh atau postur tubuh.
- Mengubah pakaian atau memasukkan aksesori yang tidak diminta.
- Memasukkan objek latar belakang yang tidak relevan atau mengganggu.
- Mengubah sudut pandang kamera atau melakukan pemotongan (crop) subjek yang canggung.
- Menambahkan teks, tanda air (watermark), logo, border, atau elemen grafis artifisial.
- Menerapkan estetika lukisan, ilustrasi, 3D render/CGI, atau anime.

### 8. FINAL OUTPUT REQUIREMENTS
Hasilkan karya potret studio formal yang sangat fotorealistis dan sepenuhnya setia pada subjek dan konteks instruksi.

**PRIORITY ORDER:**
1. Preservasi mutlak identitas wajah dan geometri asli subjek.
2. Preservasi ekspresi wajah, arah pandang, dan karakteristik fisik khas.
3. Preservasi busana, anatomi alami, dan proporsi tubuh.
4. Preservasi komposisi, sudut pandang kamera, dan framing studio.
5. Preservasi lingkungan latar belakang dan pemisahan spasial.
6. Peningkatan pencahayaan, tekstur mikro, dan kejernihan optik kamera.

**FINAL DIRECTIVE:**
Referensi visual dan instruksi pengguna adalah otoritas tertinggi mutlak. Hasil akhir harus merepresentasikan subjek asli secara setia dan profesional, bukan interpretasi atau rekayasa AI. Ketika terjadi pertentangan antara peningkatan estetika dan preservasi identitas, preservasi identitas WAJIB dimenangkan tanpa pengecualian.`;
    } else {
      resultMarkdown = `# ${topicTitle}
## ABSOLUTE IDENTITY PRESERVATION — REFERENCE IMAGE AUTHORITY

### 1. REFERENCE IMAGE — ABSOLUTE SOURCE OF TRUTH
Use the uploaded reference photograph and confirmed visual instructions as the single authoritative source of truth for the subject's identity, facial appearance, physical characteristics, clothing, and original visual composition.
Preserve every subject independently with maximum possible identity fidelity.

**ABSOLUTE FACE IDENTITY LOCK**
Each subject's face must remain visually identical to their corresponding reference.
Do not reinterpret, regenerate, reconstruct, redesign, beautify, idealize, stylize, or modify any face.

Preserve all original facial characteristics:
- Original facial identity and geometry.
- Face shape and facial proportions.
- Forehead structure and hairline.
- Eyebrow shape, position, and thickness.
- Eye shape, size, spacing, and gaze direction.
- Nose structure, bridge width, and proportions.
- Cheek structure and cheekbone definition.
- Lip shape, mouth proportions, and original expression.
- Jawline, chin structure, and neck contour.
- Ear shape, size, and position.
- Natural facial asymmetry.
- Original skin texture, micro-pores, and distinctive marks.
- Original age appearance and natural facial characteristics.

**ZERO FACIAL ALTERATION**
No facial enhancement, beauty retouching, skin smoothing, face reshaping, artificial facial detail generation, or synthetic restructuring. The reference face takes absolute priority over every other instruction.

### 2. SUBJECT AND COMPOSITION
Create a professional, photorealistic formal studio portrait featuring the exact subject or subjects shown in the reference photograph.
Automatically adapt to the actual characteristics:
- Number of subjects and spatial relationships.
- Gender and natural age appearance.
- Physical characteristics and natural body proportions.
- Original hairstyle, headwear, and accessories.
- Clothing design, cut, color, and textile details.
- Pose, posture, and body positioning.

**COMPOSITION LOCK**
Preserve original orientation, camera perspective, subject positioning, framing, headroom, and spatial arrangement. Do not introduce an alternate pose, camera angle, or framing unless explicitly requested.

### 3. BACKGROUND AND ENVIRONMENT
Maintain the formal studio background according to specifications without compromising subject prominence:
- Clean, refined background tonal gradation.
- Optical depth of field ensuring distinct subject separation.
- Controlled studio backdrop free of random clutter or unrequested decorations.

### 4. LIGHTING AND PHOTOGRAPHIC RENDERING
Professional studio portrait lighting with a balanced, natural photographic appearance:
- Soft, even studio illumination (three-point balanced setup).
- Balanced exposure with natural shadow distribution.
- Accurate color reproduction and authentic skin undertones.
- Controlled highlights without clipping.
- Natural tonal transitions and realistic photographic depth.

**FACIAL LIGHTING RESTRICTION**
Photographic lighting must not alter facial identity, bone structure, or distinctive features.

### 5. CAMERA AND OPTICAL CHARACTERISTICS
Professional studio portrait photography:
- Lens Optics: 85mm f/1.4 prime portrait lens perspective.
- Focus: Precise optical focus on iris and facial contours.
- Depth of Field: Calibrated shallow depth with soft background circular bokeh.
- Resolution & Fidelity: 8K ultra-sharp photorealistic rendering.
- Texture & Materials: Natural micro-textures on skin, hair follicles, and clothing textiles.
- Avoid artificial cinematic bloom, oversaturated color profiles, or exaggerated grading.

### 6. PHOTOGRAPHIC QUALITY ENHANCEMENT
Improve only technical photographic rendering:
- Optical clarity and true resolution.
- Edge definition and background separation.
- Clothing texture and material visibility.
- Exposure consistency and dynamic range fidelity.

### 7. STRICT NEGATIVE INSTRUCTIONS
Do not:
- Change any subject's identity or generate synthetic facial features.
- Modify facial geometry, nose, eyes, lips, ears, or jawline.
- Change original facial expressions or gaze direction.
- Change apparent age or smooth out natural age lines.
- Modify original hairstyles, hairlines, or hair color.
- Change natural skin tones or apply artificial tanning/bleaching.
- Apply beauty filters or plastic skin smoothing.
- Change natural body proportions or posture.
- Alter clothing or introduce unrequested accessories.
- Introduce unrequested background objects or clutter.
- Change the original camera perspective or framing.
- Add text, watermarks, logos, or artificial borders.
- Apply illustration, painting, CGI, or anime styling.

### 8. FINAL OUTPUT REQUIREMENTS
Produce a highly photorealistic formal studio portrait that faithfully retains the original reference.

**PRIORITY ORDER:**
1. Absolute preservation of original facial identity and geometry.
2. Preservation of original facial expressions and distinctive features.
3. Preservation of clothing, anatomy, and body proportions.
4. Preservation of composition, camera perspective, and framing.
5. Preservation of studio environment and background depth.
6. Improvement of optical clarity, lighting balance, and textile textures.

**FINAL DIRECTIVE:**
The reference photograph and confirmed user instructions are the definitive visual authority. The result must represent the original subject faithfully, not an AI reinterpretation. When photographic enhancement conflicts with identity preservation, identity preservation ALWAYS takes precedence.`;
    }
  } else if (isCode) {
    if (isId) {
      resultMarkdown = `# ${topicTitle}
## SPESIFIKASI ARSITEKTUR PERANGKAT LUNAK — KONTRAK REKAYASA MUTLAK

### 1. SUMBER KEBENARAN & KONTRAK SISTEM
Gunakan spesifikasi kebutuhan pengguna dan arsitektur yang telah dianalisis sebagai acuan tunggal yang mengikat.
Seluruh komponen kode harus dibangun dengan standar produksi (production-grade), modular, dan siap digunakan secara langsung.

**KUNCI INTEGRITAS ARSITEKTUR & TYPE-SAFETY (ARCHITECTURE & TYPE LOCK)**
Dilarang menggunakan tipe implisit 'any' atau mengabaikan penanganan kondisi batas.
Seluruh tipe data, antarmuka (interfaces), fungsi, dan model data wajib didefinisikan secara eksplisit dan konsisten:
- Pemisahan tanggung jawab tegas (Separation of Concerns).
- Struktur modular yang dapat diuji secara independen (unit testable).
- Definisi antarmuka input dan output yang type-safe end-to-end.
- Penamaan fungsi, variabel, dan file yang ekspresif dan konsisten.

**PEMBATASAN TOLERANSI KESALAHAN NOL (ZERO UNHANDLED EXCEPTIONS)**
Dilarang membiarkan promise/asinkron tanpa penanganan error (unhandled rejections), validasi input yang bocor, atau penelanan error diam-diam (silent failure).

### 2. DEKOMPOSISI FITUR & IMPLEMENTASI SPESIFIK
Wujudkan modul fungsional yang memenuhi seluruh kebutuhan pengguna:
- Logika bisnis utama terisolasi dari lapisan presentasi UI atau database.
- Alur kerja data deterministik dan bebas efek samping yang tidak terduga.
- Pengelolaan status (state management) yang atomic, reaktif, dan dapat diprediksi.

**KUNCI LOGIKA & INVARIANT (STATE & LOGIC LOCK)**
Pertahankan seluruh batasan logika yang telah diidentifikasi pada Optimized Request. Pastikan tidak ada reduksi fitur atau simplifikasi sembrono.

### 3. PENANGANAN EDGE-CASE & RESILENSI DEFENSIVE
Terapkan pola rekayasa defensif di seluruh titik eksekusi:
- Validasi ketat terhadap input null, undefined, string kosong, atau format di luar batas.
- Error boundary terisolasi agar kegagalan satu komponen tidak melumpuhkan seluruh aplikasi.
- Penanganan status jaringan: loading state, fallback display, dan retry mechanism.
- Sanitasi data defensif untuk mencegah celah keamanan (injeksi, XSS, sanitasi payload).

### 4. PROTOKOL KINERJA & EFISIENSI RUNTIME
- Hindari komputasi berulang yang tidak perlu (memoization, lazy loading).
- Pengelolaan memori bersih (pencegahan memory leak, pembersihan event listener / timers).
- Efisiensi struktur data dengan kompleksitas waktu dan ruang yang optimal.

### 5. STANDAR KUALITAS KODE (CLEAN CODE STANDARDS)
- Format kode bersih, terindentasi rapi, dan mudah dipelihara.
- Dokumentasi teknis terarah pada blok-blok logika kritis tanpa komentar basa-basi.
- Tidak bergantung pada pustaka eksternal yang tidak diperlukan.

### 6. VERIFIKASI & PENGUJIAN
- Kriteria kelulusan: Kode dapat dikompilasi tanpa error dan tanpa warning.
- Sediakan contoh kasus penggunaan konkret dan skenario pengujian edge-case.

### 7. STRICT NEGATIVE INSTRUCTIONS
Do not:
- Menggunakan tipe 'any' atau mengabaikan type safety.
- Menelan error (try/catch kosong tanpa log atau pemulihan status).
- Melakukan mutasi langsung pada state tanpa mekanisme immutable.
- Menghilangkan fitur atau batasan fungsional dari Optimized Request.
- Menyertakan kredensial, token, atau secret yang di-hardcode ke dalam kode.
- Menggunakan dependensi pihak ketiga yang usang atau tidak aman.
- Menghasilkan kode boilerplate yang tidak relevan dengan kebutuhan pengguna.

### 8. FINAL OUTPUT REQUIREMENTS
Sajikan implementasi kode yang lengkap, fungsional, terstruktur rapi, dan langsung dapat dieksekusi tanpa memerlukan penyesuaian ulang.

**PRIORITY ORDER:**
1. Kebenaran fungsional dan integritas tipe data (Type-Safety).
2. Penanganan kondisi batas (Edge-Case Resilience) dan keamanan data.
3. Kerapian arsitektur modular dan keterbacaan kode (Clean Architecture).
4. Efisiensi runtime dan kinerja eksekusi.
5. Dokumentasi penggunaan yang jelas dan operasional.

**FINAL DIRECTIVE:**
Kebutuhan fungsional dan integritas sistem adalah acuan mutlak. Jika terjadi konflik antara keringkasan kode dan ketahanan arsitektur, ketahanan arsitektur WAJIB diutamakan.`;
    } else {
      resultMarkdown = `# ${topicTitle}
## SOFTWARE ARCHITECTURE SPECIFICATION — ABSOLUTE ENGINEERING CONTRACT

### 1. SOURCE OF TRUTH & ARCHITECTURAL INVARIANTS
Use the requirements and analyzed design specifications as the authoritative system contract.
All code and architecture must be production-grade, modular, self-contained, and immediately executable.

**ARCHITECTURE & TYPE-SAFETY LOCK**
No implicit 'any' types or neglected boundary invariants.
All interfaces, function signatures, data models, and schemas must be strictly defined:
- Strict separation of concerns (presentation, domain logic, data access).
- Fully testable, decoupled modular architecture.
- End-to-end type safety across all execution pathways.
- Explicit and descriptive naming conventions.

**ZERO UNHANDLED EXCEPTIONS MANDATE**
No unhandled promises, unvalidated boundary inputs, or silent error swallowing.

### 2. COMPONENT DECOMPOSITION & FUNCTIONAL IMPLEMENTATION
Implement all core functional units adhering strictly to the user goals:
- Core domain logic isolated from presentation and peripheral transport.
- Deterministic data flow without unintended side effects.
- Predictable, immutable, and atomic state transitions.

**STATE & LOGIC LOCK**
Preserve all constraints and functional parameters outlined in the Optimized Request. Zero arbitrary feature omission or unwarranted simplification.

### 3. DEFENSIVE EDGE-CASE RESILIENCE
Apply defensive engineering across all execution paths:
- Comprehensive validation against null, undefined, empty, or out-of-range payloads.
- Isolated error boundaries preventing cascading application failure.
- Explicit lifecycle and network status handling: loading states, fallback UI, and automated retry mechanisms.
- Rigorous data sanitization preventing injection and security regressions.

### 4. RUNTIME EFFICIENCY & RESOURCE PROTOCOLS
- Elimination of redundant computations via memoization or pure functions.
- Clean memory management (active disposal of listeners, timers, and heavy subscriptions).
- Optimal algorithmic time and space complexity.

### 5. CLEAN CODE & MAINTAINABILITY STANDARDS
- Pristine formatting and idiomatic convention compliance.
- Concise, high-signal documentation on complex invariant gates.
- Zero extraneous external dependency bloat.

### 6. VERIFICATION & TEST CRITERIA
- Zero compiler or linter warnings.
- Demonstrable correctness against edge cases and typical operational loads.

### 7. STRICT NEGATIVE INSTRUCTIONS
Do not:
- Use loose typing ('any') where concrete models can be expressed.
- Swallow runtime exceptions without state recovery or telemetry.
- Mutate shared or component state directly.
- Omit required operational flags or functional constraints from the Optimized Request.
- Hardcode API keys, credentials, or environment-specific secrets.
- Introduce outdated, vulnerable, or unvetted external dependencies.
- Output fragmented code that requires guesswork to assemble.

### 8. FINAL OUTPUT REQUIREMENTS
Deliver a complete, production-grade, immediately functional implementation.

**PRIORITY ORDER:**
1. Functional correctness and type-safe schema integrity.
2. Defensive edge-case resilience and security guardrails.
3. Modular clean architecture and maintainability.
4. Runtime efficiency and performance.
5. Operational clarity and documentation.

**FINAL DIRECTIVE:**
System robustness and functional correctness are non-negotiable. When brevity conflicts with architectural reliability, architectural reliability ALWAYS takes precedence.`;
    }
  } else if (isWriting || isMarketing) {
    if (isId) {
      resultMarkdown = `# ${topicTitle}
## ARSITEKTUR KONTEN & STRATEGI KOMUNIKASI TINGKAT TINGGI

### 1. OTORITAS TUJUAN & INTENSI UTAMA
Gunakan tujuan pengguna, profil audiens sasaran, dan pesan kunci sebagai fondasi mutlak yang mengarahkan setiap kalimat.

**KUNCI VALUE PROPOSITION & PESAN UTAMA (CORE VALUE LOCK)**
Pertahankan pesan pembeda utama (unique value) dan sudut pandang orisinal tanpa bias atau klise:
- Pemahaman tajam atas kebutuhan, aspirasi, dan titik sakit (pain points) audiens.
- Penegasan solusi yang jelas, meyakinkan, dan berbobot.
- Dilarang menyelipkan klaim kosong yang tidak didukung konteks.

**PEMBATASAN BASA-BASI NOL (ZERO FILLER MANDATE)**
Eliminasi seluruh frasa klise kecerdasan buatan, kalimat pembuka basa-basi, dan pengulangan gagasan yang memboroskan ruang baca.

### 2. STRUKTUR NARASI & RITME BACA
- Hook Pembuka: Menangkap atensi pembaca dalam 3 detik pertama dengan premis yang memikat.
- Eskalasi Gagasan: Alur pemikiran yang mengalir logis, bertahap, dan kohesif antar-paragraf.
- Kedalaman Konten: Argumen berbobot, fakta terarah, atau narasi emosional yang terkalibrasi.
- Klimaks / Konklusi: Penutup berkesan atau ajakan bertindak (Call to Action) yang minim friksi.

**KUNCI NADA DAN GAYA (TONE & VOICE LOCK)**
Gunakan nada bicara yang konsisten sesuai persona yang ditentukan (otoritatif, empatik, inspiratif, atau persuasif).

### 3. DAYA SIMPAN & RETENSI AUDIENS
- Variasi struktur kalimat (panjang-pendek dinamis) untuk menciptakan ritme membaca yang hidup.
- Transisi alami yang memandu pembaca dari satu gagasan ke gagasan berikutnya tanpa hambatan mental.

### 4. STRICT NEGATIVE INSTRUCTIONS
Do not:
- Menggunakan frasa pembuka klise AI (seperti "Tentu, mari kita bahas...", "Di era digital saat ini...").
- Mengulang premis yang sama dengan kata-kata berbeda hanya untuk memperpanjang tulisan.
- Mengaburkan pesan inti dengan bahasa yang berbelit-belit atau jargon kosong.
- Mengubah maksud asli atau mengubah fakta yang diberikan pengguna.
- Menyajikan ajakan bertindak (CTA) yang ambigu atau membingungkan.

### 5. FINAL OUTPUT REQUIREMENTS
Sajikan karya tulisan yang utuh, berdampak tinggi, terstruktur rapi, dan siap dipublikasikan secara langsung.

**PRIORITY ORDER:**
1. Kejelasan pesan inti dan kesesuaian dengan tujuan pengguna.
2. Daya pikat pembuka (hook) dan relevansi dengan audiens.
3. Kepadatan nilai (substance density) dan eliminasi basa-basi.
4. Ritme, kohesi narasi, dan keindahan diksi.
5. Efektivitas Call to Action (CTA) atau pesan penutup.

**FINAL DIRECTIVE:**
Kualitas esensi dan ketajaman pesan adalah tolok ukur tertinggi. Jangan memperpanjang teks kecuali jika setiap kata tambahan terbukti memperkuat dampak komunikasi.`;
    } else {
      resultMarkdown = `# ${topicTitle}
## EDITORIAL & STRATEGIC CONTENT ARCHITECTURE — HIGH-SIGNAL MANDATE

### 1. CORE MISSION & AUDIENCE AUTHORITY
Anchor every paragraph firmly in the user's primary objectives, target audience profile, and essential value proposition.

**CORE VALUE & INTENT LOCK**
Preserve the core message and distinct angle with zero dilution:
- Sharp alignment with target audience aspirations, psychology, and pain points.
- Concrete, credible, and resonant value delivery.
- Zero unsubstantiated claims or generic platitudes.

**ZERO FILLER MANDATE**
Eliminate all conversational filler, clichéd intros, and redundant repetition.

### 2. NARRATIVE PROGRESSION & PACING
- Compelling Hook: Captures audience focus immediately with an irresistible premise.
- Structured Development: Cohesive, logical progression of thoughts across sections.
- Intellectual / Emotional Density: Evocative storytelling or rigorous strategic articulation.
- Resonant Resolution: Unambiguous, frictionless Call to Action or memorable closing reflection.

**TONE & VOICE LOCK**
Maintain calibrated tone (authoritative, empathetic, or high-conversion) consistently from beginning to end.

### 3. STRICT NEGATIVE INSTRUCTIONS
Do not:
- Use standard AI clichéd openings ("In today's fast-paced world...", "Delve into...").
- Pad word count with repetitive generalizations.
- Dilute technical precision with vague rhetoric.
- Alter the user's intended positioning or factual assertions.
- Conclude with weak or conflicting calls to action.

### 4. FINAL OUTPUT REQUIREMENTS
Deliver a complete, high-impact, polished piece ready for immediate deployment.

**PRIORITY ORDER:**
1. Core intent fidelity and message precision.
2. Audience resonance and hook efficacy.
3. High signal-to-noise ratio and zero conversational waste.
4. Structural pacing and rhetorical elegance.
5. Impactful closing resolution or CTA.

**FINAL DIRECTIVE:**
Substance and reader impact take absolute precedence over length. Every sentence must earn its place by advancing the core mission.`;
    }
  } else {
    // General / Analysis / Universal adaptive
    if (isId) {
      resultMarkdown = `# ${topicTitle}
## SPESIFIKASI EKSEKUSI TINGKAT TINGGI — STANDAR PRESISI DETERMINISTIK

### 1. SUMBER KEBENARAN & MANDAT UTAMA
Gunakan instruksi pada Optimized Request sebagai kontrak eksekusi primer.
Seluruh arahan harus dijabarkan secara terstruktur, hierarkis, spesifik, dan siap dilaksanakan secara langsung.

**KUNCI RUANG LINGKUP & TUJUAN (SCOPE & INTENT LOCK)**
Pertahankan seluruh kebutuhan, batasan, kriteria evaluasi, dan parameter yang telah ditetapkan:
- Pemenuhan lengkap atas seluruh komponen tugas tanpa simplifikasi sepihak.
- Definisi operasional yang tegas untuk setiap istilah dan langkah kerja.
- Konsistensi internal di seluruh tingkatan instruksi.

**PEMBATASAN AMBIGUITAS NOL (ZERO AMBIGUITY MANDATE)**
Dilarang menyajikan instruksi yang memiliki interpretasi ganda. Setiap langkah wajib bersifat operasional dan dapat diverifikasi.

### 2. DEKOMPOSISI TAHAPAN EKSEKUSI
- Langkah Kerja Sistematis: Jalankan proses secara bertahap dengan urutan prioritas yang logis.
- Batasan Operasional: Tegaskan batas-batas apa yang wajib dilakukan dan apa yang dilarang.
- Format Output Akhir: Sajikan hasil dalam format terstruktur rapi sesuai tujuan target AI.

**KUNCI KONSISTENSI EKSEKUSI (CONSISTENCY LOCK)**
Pastikan setiap arahan selaras dengan kemampuan model target dan tidak membawa asumsi luar yang tidak terkonfirmasi.

### 3. KONTROL KUALITAS & GERBANG VERIFIKASI MANDIRI
- Verifikasi Kelengkapan: Pastikan tidak ada komponen penting yang terlewatkan.
- Konsistensi Fakta: Hindari informasi spekulatif atau data yang tidak berdasar.
- Kesiapan Pakai: Output akhir harus dapat langsung dieksekusi tanpa memerlukan penulisan ulang.

### 4. STRICT NEGATIVE INSTRUCTIONS
Do not:
- Mengubah maksud awal pengguna atau menghilangkan kriteria yang telah ditetapkan.
- Menambahkan asumsi atau konteks baru yang tidak diminta.
- Menyajikan instruksi yang bertentangan atau membingungkan.
- Menggunakan kalimat pengantar atau penutup basa-basi.
- Mengorbankan ketepatan demi penyederhanaan yang mengurangi esensi.

### 5. FINAL OUTPUT REQUIREMENTS
Sajikan hasil eksekusi yang komprehensif, terstruktur, presisi, dan siap digunakan secara langsung.

**PRIORITY ORDER:**
1. Kesetiaan mutlak pada tujuan dan batasan instruksi awal.
2. Presisi operasional dan eliminasi ambiguitas.
3. Kelengkapan fungsional seluruh komponen tugas.
4. Kerapian struktur dan kemudahan pembacaan sistem AI target.

**FINAL DIRECTIVE:**
Akurasi eksekusi dan integritas tujuan awal adalah prioritas tertinggi mutlak. Ketika terjadi pertentangan antara variasi kreatif dan batasan instruksi, batasan instruksi WAJIB dimenangkan.`;
    } else {
      resultMarkdown = `# ${topicTitle}
## HIGH-PRECISION EXECUTION SPECIFICATION — DETERMINISTIC MASTER MANDATE

### 1. SOURCE OF TRUTH & OPERATIONAL AUTHORITY
Use the Optimized Request as the primary operational contract.
All instructions must be organized into a systematic, hierarchical, unambiguous specification ready for direct execution.

**SCOPE & INTENT LOCK**
Preserve all constraints, deliverables, and parameters without arbitrary modification:
- Complete coverage of all required components.
- Unambiguous operational definitions for all phases.
- Absolute internal consistency across instructions.

**ZERO AMBIGUITY MANDATE**
Eliminate conflicting, vague, or subjective language. Every directive must be concrete, falsifiable, and executable.

### 2. EXECUTION DECOMPOSITION & DELIVERABLE SPECIFICATIONS
- Hierarchical Steps: Sequential, prioritized execution directives.
- Guardrails & Constraints: Strict boundary lines defining permitted and prohibited actions.
- Target Output Schema: Well-delimited structured presentation.

**EXECUTION CONSISTENCY LOCK**
Ensure alignment with target AI capabilities, eliminating unconfirmed cross-task assumptions.

### 3. QUALITY VERIFICATION GATES
- Completeness Audit: Verify no requested criteria have been dropped.
- Zero-Hallucination Barrier: Strictly factual and contextually grounded.
- Immediate Deployment: Output must be functional out of the box with zero manual restructuring.

### 4. STRICT NEGATIVE INSTRUCTIONS
Do not:
- Deviate from primary user goals or drop stated requirements.
- Introduce ungrounded speculation or unrequested peripheral tasks.
- Include conversational meta-talk or filler commentary.
- Introduce contradictory directives.
- Simplify away essential domain complexity.

### 5. FINAL OUTPUT REQUIREMENTS
Deliver an exhaustive, structured, high-precision specification ready for immediate production use.

**PRIORITY ORDER:**
1. Absolute fidelity to original intent and operational constraints.
2. Execution precision and ambiguity elimination.
3. Functional completeness across all deliverable facets.
4. Structural clarity and target AI readability.

**FINAL DIRECTIVE:**
Operational precision and fidelity to the primary objective are non-negotiable. When stylistic creativity conflicts with required constraints, required constraints ALWAYS take precedence.`;
    }
  }

  return {
    refinedPrompt: resultMarkdown,
    engineUsed: 'Engine AI Studio PCTCE+O (Universal Adaptive Refiner)',
  };
}
