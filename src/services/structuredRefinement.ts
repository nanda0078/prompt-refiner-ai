/**
 * Universal Dynamic & Adaptive Advanced Refinement Engine
 *
 * Implements the authoritative structured master specification archetype modeled after:
 * # [PRIMARY DOMAIN TITLE IN ALL-CAPS]
 * ## [CORE AUTHORITY MANDATE IN ALL-CAPS]
 * ### 1. [PRIMARY CONTEXT / SOURCE OF TRUTH] (**ABSOLUTE LOCK** / **ZERO ALTERATION**)
 * ### 2. [CORE SUBJECT / ARCHITECTURAL SPECIFICATION] (**STRUCTURE/COMPOSITION LOCK**)
 * ### 3. [ENVIRONMENT & CONTEXTUAL BOUNDARIES]
 * ### 4. [EXECUTION DISCIPLINE & QUALITY SCIENCE] (**DOMAIN RESTRICTION**)
 * ### 5. [TECHNICAL / OPTICAL / SYSTEM SPECIFICATIONS]
 * ### 6. [QUALITY ENHANCEMENT & FIDELITY BOUNDARIES]
 * ### 7. STRICT NEGATIVE INSTRUCTIONS (Do not / Dilarang)
 * ### 8. FINAL OUTPUT REQUIREMENTS (**PRIORITY ORDER:** & **FINAL DIRECTIVE:**)
 */

export function generateStructuredAdvancedRefinement(
  optimizedPrompt: string,
  originalPrompt: string = '',
  targetAI: string = 'ChatGPT',
  mode: string = 'Advanced Refine',
  outputLang: string = 'English',
  promptStyle: string = 'Image Generation',
  customStyle?: string
): { refinedPrompt: string; engineUsed: string } {
  const isId =
    outputLang === 'Indonesia' ||
    (outputLang === 'Auto Detect' &&
      /\b(dan|yang|dengan|untuk|pada|adalah|harus|jangan|buat|buatkan|foto|gambar|wajah|subjek|kode|aplikasi)\b/i.test(
        optimizedPrompt + ' ' + originalPrompt
      ));

  const cleanBase = optimizedPrompt.trim();
  const lowerBase = (cleanBase + ' ' + (originalPrompt || '')).toLowerCase();

  // Extract clean bullet items from input to preserve 100% of user data
  const rawLines = cleanBase
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('```'));

  const extractedBullets = rawLines
    .filter((l) => l.startsWith('-') || l.startsWith('*') || l.startsWith('•') || /^\d+\./.test(l))
    .map((l) => l.replace(/^[-*•\d.]+\s*/, '').trim())
    .filter((l) => l.length > 3);

  // Domain detection
  const isVisual =
    promptStyle === 'Image Generation' ||
    promptStyle === 'Video Generation' ||
    lowerBase.includes('portrait') ||
    lowerBase.includes('foto') ||
    lowerBase.includes('gambar') ||
    lowerBase.includes('photography') ||
    lowerBase.includes('studio') ||
    lowerBase.includes('lighting') ||
    lowerBase.includes('camera') ||
    lowerBase.includes('photorealistic') ||
    lowerBase.includes('wajah') ||
    lowerBase.includes('facial') ||
    lowerBase.includes('subjek');

  const isCode =
    promptStyle === 'Coding & Development' ||
    lowerBase.includes('kode') ||
    lowerBase.includes('code') ||
    lowerBase.includes('react') ||
    lowerBase.includes('typescript') ||
    lowerBase.includes('javascript') ||
    lowerBase.includes('python') ||
    lowerBase.includes('api') ||
    lowerBase.includes('function') ||
    lowerBase.includes('component') ||
    lowerBase.includes('backend') ||
    lowerBase.includes('frontend') ||
    lowerBase.includes('database') ||
    lowerBase.includes('bug') ||
    lowerBase.includes('refactor');

  const isWriting =
    promptStyle === 'Writing & Content' ||
    lowerBase.includes('artikel') ||
    lowerBase.includes('article') ||
    lowerBase.includes('essay') ||
    lowerBase.includes('cerita') ||
    lowerBase.includes('story') ||
    lowerBase.includes('naskah') ||
    lowerBase.includes('novel') ||
    lowerBase.includes('narrative') ||
    lowerBase.includes('copywriting') ||
    lowerBase.includes('tulisan');

  const isMarketing =
    promptStyle === 'Business & Marketing' ||
    lowerBase.includes('marketing') ||
    lowerBase.includes('campaign') ||
    lowerBase.includes('iklan') ||
    lowerBase.includes('sales') ||
    lowerBase.includes('promosi') ||
    lowerBase.includes('conversion') ||
    lowerBase.includes('branding') ||
    lowerBase.includes('leads');

  const isData =
    promptStyle === 'Data Analysis' ||
    promptStyle === 'Research' ||
    lowerBase.includes('data') ||
    lowerBase.includes('analysis') ||
    lowerBase.includes('analisis') ||
    lowerBase.includes('dataset') ||
    lowerBase.includes('metric') ||
    lowerBase.includes('statistics') ||
    lowerBase.includes('forecast') ||
    lowerBase.includes('sql');

  let refinedPrompt = '';

  // -------------------------------------------------------------
  // DOMAIN 1: VISUAL / PHOTOGRAPHY / STUDIO PORTRAIT
  // -------------------------------------------------------------
  if (isVisual) {
    if (isId) {
      refinedPrompt = `# POTRET STUDIO FORMAL FOTOREALISTIS
## PRESERVASI IDENTITAS MUTLAK — OTORITAS CITRA REFERENSI

### 1. CITRA REFERENSI — SUMBER KEBENARAN MUTLAK

Gunakan foto referensi atau spesifikasi visual yang diberikan sebagai satu-satunya sumber kebenaran otoritatif untuk identitas subjek, penampilan wajah, karakteristik fisik, pakaian, dan komposisi visual asli.

Pertahankan setiap subjek secara independen dengan fidelitas identitas setinggi mungkin.

**KUNCI IDENTITAS WAJAH MUTLAK**

Wajah setiap subjek wajib tetap identik secara visual dengan referensi aslinya.

Dilarang menginterpretasi ulang, membuat ulang, merekonstruksi, mendesain ulang, mempercantik, mengidealisasi, membuat stilasi, atau mengubah wajah subjek.

Pertahankan seluruh karakteristik wajah asli:

- Identitas dan geometri wajah asli.
- Bentuk wajah dan proporsi wajah.
- Struktur dahi dan garis rambut.
- Bentuk alis, posisi, dan ketebalan.
- Bentuk mata, ukuran, jarak, dan posisi bola mata.
- Struktur hidung dan proporsinya.
- Struktur pipi dan ketajaman tulang pipi.
- Bentuk bibir, proporsi mulut, dan ekspresi asli.
- Garis rahang dan struktur dagu.
- Bentuk telinga, ukuran, dan posisi.
- Asimetri wajah alami.
- Tekstur kulit asli, pori-pori, dan tanda pengenal khas.
- Tampilan usia asli dan garis ekspresi alami.
${extractedBullets.length > 0 ? '\nKarakteristik khusus yang dipreservasi dari permintaan:\n' + extractedBullets.map((b) => `- ${b}`).join('\n') : ''}

**NOL PERUBAHAN WAJAH**

Tanpa penyempurnaan wajah buatan, tanpa restorasi kecantikan, tanpa penghalusan kulit (skin smoothing), tanpa pembentukan ulang wajah, tanpa regenerasi identitas sintetis, dan tanpa pembuatan detail wajah fiktif.

Wajah referensi memiliki prioritas mutlak di atas seluruh instruksi visual lainnya.

### 2. SUBJEK DAN KOMPOSISI

Hasilkan potret studio formal yang profesional dan fotorealistis menampilkan subjek yang sama persis seperti pada referensi.

Sesuaikan secara otomatis dengan karakteristik aktual:

- Jumlah subjek dan penataan posisi.
- Penampilan gender dan usia natural.
- Karakteristik wajah dan fisik asli.
- Gaya rambut asli, penutup kepala, dan aksesori.
- Jenis pakaian, potongan desain, warna, dan detail tekstil.
- Proporsi tubuh dan anatomi alami.
- Pose, postur, dan penempatan tubuh.
- Ekspresi wajah dan arah tatapan mata.
- Susunan spasial dan relasi jarak antar-subjek.

Pertahankan relasi subjek-ke-tubuh asli dan seluruh detail visual yang distingtif.

**KUNCI KOMPOSISI**

Pertahankan orientasi asli, perspektif kamera, penempatan subjek, framing, headroom, dan tata letak komposisi keseluruhan.

Dilarang mengubah pose, sudut kamera, posisi tubuh, atau membongkar susunan komposisi kecuali secara eksplisit diminta.

### 3. LATAR BELAKANG DAN LINGKUNGAN

Pertahankan latar belakang dan lingkungan sesuai referensi atau spesifikasi yang diminta secara eksplisit.

Pertahankan karakteristik latar belakang:

- Warna latar belakang dan gradasi tonal.
- Tekstur permukaan dan karakteristik visual studio.
- Pencahayaan dan kedalaman ruang (spatial depth).
- Elemen lingkungan dan dekorasi yang ada.
- Objek eksisting dan posisinya.

Dilarang memasukkan, menghapus, mengganti, atau mendesain ulang elemen latar belakang secara acak.

Jika latar belakang studio tertentu diminta, sesuaikan latar belakang tersebut tanpa mengorbankan identitas subjek maupun integritas komposisi.

### 4. PENCAHAYAAN DAN RENDERING FOTOGRAFIS

Gunakan pencahayaan potret studio profesional dengan tampilan fotografi yang seimbang dan alami.

Karakteristik pencahayaan:

- Iluminasi studio yang lembut dan merata.
- Eksposur terkalibrasi seimbang.
- Distribusi bayangan alami tanpa area gelap pekat (crushed blacks).
- Reproduksi warna akurat dengan saturasi realistis.
- Highlight terkendali tanpa clipping atau efek blown-out.
- Transisi tonal yang halus dan organik.
- Kedalaman fotografi yang nyata (three-dimensional depth).

**BATASAN PENCAHAYAAN WAJAH**

Dilarang melakukan relighting ekstrem, pewarnaan ulang, penajaman berlebih (over-sharpening), denoising artifisial, atau manipulasi fitur wajah secara independen.

Pertahankan pencahayaan dan tampilan wajah asli sedekat mungkin.

Penyempurnaan fotografi tidak boleh mengubah identitas wajah atau karakteristik natural subjek.

### 5. KARAKTERISTIK KAMERA DAN OPTIK

Standar fotografi potret studio profesional:

- Perspektif kamera: ikuti sudut pandang referensi.
- Karakteristik lensa: perspektif potret natural 50mm–85mm yang proporsional.
- Fokus: pertahankan ketajaman fokus optik alami pada mata dan wajah subjek.
- Kedalaman bidang (Depth of Field): proporsional untuk mempertahankan kejelasan subjek dan detail penting.
- Kualitas gambar: fotografi fotorealistis resolusi tinggi (UHD fidelity).
- Tekstur: detail material mikro alami dan rendering fotografi organik.
- Reproduksi warna: natural, bersih, dan akurat.
- Kontras: seimbang, tidak berlebihan.

Hindari efek sinematik buatan yang berlebihan, kontras berlebih, bokeh artifisial melingkar palsu, atau grading warna bergaya filter media sosial.

### 6. PENINGKATAN KUALITAS FOTOGRAFIS

Tingkatkan hanya rendering fotografis keseluruhan secara teknis:

- Kejernihan optik (optical clarity).
- Resolusi gambar alami tanpa artefak upscaling.
- Konsistensi tekstur latar belakang.
- Visibilitas tekstur kain pakaian dan detail bahan.
- Preservasi detail mikro halus.
- Konsistensi eksposur pencahayaan.
- Fidelitas visual keseluruhan.
- Ketajaman fotografis natural.

Jangan pernah mengorbankan preservasi identitas demi mengejar peningkatan gambar kosmetik.

### 7. PAGAR PEMBATAS & LARANGAN KETAT

Dilarang:

- Mengubah identitas subjek sedikit pun.
- Memodifikasi geometri atau proporsi wajah.
- Mengubah ekspresi wajah asli.
- Mengubah usia tampak subjek.
- Memodifikasi gaya rambut asli atau garis rambut.
- Mengubah warna kulit atau tekstur kulit alami.
- Menerapkan filter kecantikan (beauty filters).
- Menghaluskan atau merekonstruksi kulit wajah secara artifisial.
- Mengubah bentuk mata, hidung, bibir, telinga, atau garis rahang.
- Mengubah proporsi anatomi tubuh alami.
- Mengganti pakaian atau aksesori secara sepihak tanpa instruksi.
- Memasukkan objek atau subjek yang tidak diminta.
- Mengubah latar belakang secara sembarangan.
- Mengubah perspektif dan sudut kamera asli.
- Melakukan pemotongan (crop) atau reposisi subjek yang tidak perlu.
- Menambahkan teks, logo, watermark, atau elemen grafis.
- Menerapkan estetika ilustrasi, lukisan, CGI plastik, kartun, atau anime.

### 8. PERSYARATAN OUTPUT AKHIR

Hasilkan potret studio formal yang sangat fotorealistis yang secara setia mempertahankan seluruh integritas citra referensi.

**URUTAN PRIORITAS:**

1. Preservasi mutlak identitas wajah asli.
2. Preservasi geometri wajah dan ekspresi alami.
3. Preservasi penampilan visual subjek asli.
4. Preservasi pakaian, aksesori, dan proporsi tubuh.
5. Preservasi komposisi, framing, dan perspektif kamera.
6. Preservasi latar belakang dan karakteristik lingkungan.
7. Peningkatan rendering fotografis teknis tanpa mengorbankan identitas.

**DIREKTIF AKHIR:**

Citra referensi adalah otoritas visual tertinggi dan definitif. Hasil akhir wajib merepresentasikan subjek asli secara setia, bukan hasil reinterpretasi atau modifikasi kecerdasan buatan.

Seluruh instruksi harus beradaptasi secara patuh pada referensi visual dan spesifikasi eksplisit pengguna.

Apabila terjadi pertentangan antara peningkatan estetika fotografi dan preservasi identitas, maka preservasi identitas selalu memegang kendali mutlak tanpa pengecualian.`;
    } else {
      refinedPrompt = `# PHOTOREALISTIC FORMAL STUDIO PORTRAIT
## ABSOLUTE IDENTITY PRESERVATION — REFERENCE IMAGE AUTHORITY

### 1. REFERENCE IMAGE — ABSOLUTE SOURCE OF TRUTH

Use the uploaded reference photograph or primary visual specifications as the single authoritative source of truth for the subject's identity, facial appearance, physical characteristics, clothing, and original visual composition.

Preserve every subject independently with maximum possible identity fidelity.

**ABSOLUTE FACE IDENTITY LOCK**

Each subject's face must remain visually identical to their corresponding reference.

Do not reinterpret, regenerate, reconstruct, redesign, beautify, idealize, stylize, or modify any face.

Preserve all original facial characteristics:

- Original facial identity and geometry.
- Face shape and facial proportions.
- Forehead structure and hairline.
- Eyebrow shape, position, and thickness.
- Eye shape, size, spacing, and position.
- Nose structure and proportions.
- Cheek structure and cheekbone definition.
- Lip shape, mouth proportions, and original expression.
- Jawline and chin structure.
- Ear shape, size, and position.
- Natural facial asymmetry.
- Original skin texture, pores, and distinctive marks.
- Original age appearance and facial characteristics.
${extractedBullets.length > 0 ? '\nSpecific characteristics preserved from input:\n' + extractedBullets.map((b) => `- ${b}`).join('\n') : ''}

**ZERO FACIAL ALTERATION**

No facial enhancement, face restoration, beauty retouching, skin smoothing, face reshaping, facial reconstruction, facial regeneration, identity reinterpretation, or artificial facial detail generation.

The reference face takes absolute priority over every other visual instruction.

### 2. SUBJECT AND COMPOSITION

Create a professional, photorealistic formal studio portrait featuring the same subject or subjects shown in the reference photograph.

Automatically adapt to the reference image's actual characteristics, including:

- Number of subjects.
- Gender and age appearance.
- Facial and physical characteristics.
- Original hairstyle, headwear, and accessories.
- Clothing type, design, color, and details.
- Body proportions and natural anatomy.
- Pose, posture, and body positioning.
- Facial expression and gaze direction.
- Subject arrangement and spatial relationships.

Preserve the original subject-to-body relationship and all distinctive visual characteristics.

**COMPOSITION LOCK**

Preserve the reference photograph's original orientation, camera perspective, subject positioning, framing, headroom, spatial arrangement, and overall composition.

Do not introduce a different pose, camera angle, body position, or composition unless explicitly requested.

### 3. BACKGROUND AND ENVIRONMENT

Preserve the background and environment according to the reference photograph or explicitly requested specifications.

Maintain the original background characteristics, including:

- Background color and tonal appearance.
- Surface texture and visual characteristics.
- Lighting and spatial depth.
- Environmental elements and decorations.
- Existing objects and their positions.

Do not arbitrarily introduce, remove, replace, or redesign background elements.

If a specific studio background is requested, adapt the background accordingly without compromising subject identity or composition.

### 4. LIGHTING AND PHOTOGRAPHIC RENDERING

Use professional studio portrait lighting with a balanced, natural photographic appearance.

Lighting characteristics:

- Soft, even studio illumination.
- Balanced exposure.
- Natural shadow distribution.
- Accurate color reproduction.
- Controlled highlights without clipping.
- Natural tonal transitions.
- Realistic photographic depth.

**FACIAL LIGHTING RESTRICTION**

Do not independently relight, recolor, retouch, sharpen, denoise, or enhance facial features.

Preserve the original facial lighting and appearance as closely as possible.

Photographic improvements must not alter facial identity or facial characteristics.

### 5. CAMERA AND OPTICAL CHARACTERISTICS

Professional studio portrait photography.

- Camera perspective: follow the reference photograph.
- Lens appearance: natural 50mm–85mm portrait perspective where appropriate.
- Focus: maintain natural facial focus and optical appearance.
- Depth of field: sufficient to retain subjects and relevant details clearly.
- Image quality: high-resolution photorealistic photography.
- Texture: natural material details and realistic photographic rendering.
- Color reproduction: accurate and natural.
- Contrast: balanced and realistic.

Avoid artificial cinematic effects, excessive contrast, exaggerated bokeh, or stylized color grading.

### 6. PHOTOGRAPHIC QUALITY ENHANCEMENT

Improve only the overall photographic rendering where technically possible:

- Optical clarity.
- Natural image resolution.
- Background consistency.
- Clothing and material texture visibility.
- Fine detail preservation.
- Exposure consistency.
- Overall image fidelity.
- Natural photographic sharpness.

Never sacrifice identity preservation for image enhancement.

### 7. STRICT NEGATIVE INSTRUCTIONS

Do not:

- Change any subject's identity.
- Modify facial geometry or proportions.
- Change original facial expressions.
- Change apparent age.
- Modify original hairstyles or hairlines.
- Change skin tone or skin texture.
- Apply beauty filters.
- Smooth or reconstruct facial skin.
- Alter eyes, nose, lips, ears, or jawline.
- Change natural body proportions.
- Arbitrarily change clothing or accessories.
- Introduce unrequested objects or subjects.
- Arbitrarily change the background.
- Change the original camera perspective.
- Crop or reposition subjects unnecessarily.
- Add text, logos, watermarks, or graphic elements.
- Apply illustration, painting, CGI, or anime aesthetics.

### 8. FINAL OUTPUT REQUIREMENTS

Produce a highly photorealistic formal studio portrait that faithfully retains the original reference photograph.

**PRIORITY ORDER:**

1. Absolute preservation of original facial identity.
2. Preservation of facial geometry and expression.
3. Preservation of original subject appearance.
4. Preservation of clothing and body proportions.
5. Preservation of composition and camera perspective.
6. Preservation of background and environmental characteristics.
7. Improvement of photographic rendering without compromising identity.

**FINAL DIRECTIVE:**

The uploaded reference photograph is the definitive visual authority. The result must faithfully represent the original subject or subjects, not an AI-generated reinterpretation.

All instructions must adapt to the actual reference photograph and the user's explicitly requested specifications.

When photographic enhancement conflicts with identity preservation, identity preservation always takes precedence.`;
    }
  }

  // -------------------------------------------------------------
  // DOMAIN 2: CODING & SOFTWARE ARCHITECTURE
  // -------------------------------------------------------------
  else if (isCode) {
    if (isId) {
      refinedPrompt = `# ARSITEKTUR SISTEM PRODUKSI & REKAYASA KODE
## IMPLEMENTASI DETERMINISTIK TYPE-SAFE — MANDAT NOL REGRESI

### 1. KONTRAK ARSITEKTUR — SUMBER KEBENARAN MUTLAK

Gunakan seluruh spesifikasi teknis dan kebutuhan fungsional yang diberikan sebagai sumber kebenaran mutlak. Semua struktur kode, antarmuka tipe, dan alur eksekusi wajib dibangun secara kokoh dan terverifikasi.

**KUNCI INTEGRITAS TIPE DATA MUTLAK**

Sistem wajib mempertahankan kontrak tipe data statis end-to-end (strict type safety) tanpa kompromi.

Dilarang menggunakan tipe implisit 'any', mengabaikan validasi parameter, atau mengorbankan definisi skema data.

Pertahankan seluruh kontrak teknis:

- Model data dan relasi entitas inti.
- Definisi tipe parameter dan nilai balik fungsi.
- Modularitas kode berbasis Separation of Concerns.
- Penanganan status asinkron (loading, success, error, empty).
- Validasi data defensif pada setiap gerbang masuk data.
${extractedBullets.length > 0 ? '\nSpesifikasi fungsional yang dipreservasi dari permintaan:\n' + extractedBullets.map((b) => `- ${b}`).join('\n') : ''}

**NOL AMBIGUITAS RUNTIME**

Dilarang membiarkan unhandled promise rejections, silent exception swallowing, atau mutasi data tak terlacak di luar state manager.

Kontrak tipe data memegang prioritas tertinggi di atas kecepatan pembuatan kode.

### 2. LOGIKA INTI & ARSITEKTUR KOMPONEN

Bangun implementasi modular berkualitas produksi yang memenuhi seluruh kebutuhan yang dianalisis:

- Struktur komponen/modul yang terisolasi dan mudah diuji (testable).
- Manajemen state deterministik yang dapat diprediksi alurnya.
- Integrasi API yang terstruktur dengan deserialisasi data aman.
- Siklus hidup komponen yang bersih tanpa memory leaks.
- Reusabilitas kode tinggi melalui pola komposisi bersih.

**KUNCI KONTRAK ANTARMUKA**

Pertahankan antarmuka publik fungsi, prop types, atau rute API sesuai kebutuhan sistem.

Dilarang mengubah parameter publik atau memutus integrasi yang telah ada tanpa instruksi eksplisit.

### 3. INTEGRASI LINGKUNGAN & DEPENDENSI

Sesuaikan dengan ekosistem runtime target dan batas operasionalnya:

- Kompatibilitas versi bahasa dan framework target.
- Penggunaan library pihak ketiga minimal dan terstandarisasi.
- Pemanfaatan API standar platform secara optimal.
- Isolasi variabel lingkungan (environment variables) sensitif.

Dilarang memasukkan library berat yang tidak esensial jika fungsi dapat diselesaikan secara native dan bersih.

### 4. REKAYASA DEFENSIF & PENANGANAN KESALAHAN

Terapkan standar toleransi kesalahan tingkat produksi:

- Validasi nilai batas (edge-case bounds) untuk input null, undefined, dan koleksi kosong.
- Isolasi error boundary untuk mencegah kegagalan cascade seluruh aplikasi.
- Pesan kesalahan yang informatif, dapat ditindaklanjuti, dan aman bagi pengguna.
- Mekanisme fallback atau retry otomatis pada operasi jaringan.

**BATASAN MUTASI DATA**

Dilarang memutasi state secara langsung (direct state mutation). Semua transformasi data wajib bersifat immutable dan murni (pure transformations).

### 5. SPESIFIKASI PERFORMA & EFISIENSI SUMBER DAYA

Standar kinerja rekayasa sistem:

- Kompleksitas waktu dan memori yang optimal (O(n) atau lebih baik pada jalur kritis).
- Pembersihan listener, timer, dan observer secara eksplisit saat siklus selesai.
- Lazy-loading dan pemisahan modul jika relevan.
- Efisiensi render dengan memoization terukur pada komputasi berat.

### 6. STANDAR KUALITAS KODE & REFAKTORING

Tingkatkan kualitas kode hanya pada batas teknis yang konstruktif:

- Keterbacaan kode (clean self-documenting naming conventions).
- Konsistensi format dan konvensi penamaan standar industri.
- Komentar penjelasan singkat pada logika bisnis non-trivial.
- Kemudahan pemeliharaan (maintainability) jangka panjang.

Jangan pernah mengorbankan kebenaran logika demi trik penulisan kode yang sulit dipahami (over-clever code).

### 7. PAGAR PEMBATAS & LARANGAN KETAT

Dilarang:

- Menggunakan 'any' atau mengabaikan peringatan linter tipe data.
- Menulis kode dengan placeholder elipsis seperti '// TODO' atau '// tambahkan logika di sini'.
- Membiarkan blok try-catch kosong tanpa pencatatan atau pemulihan error.
- Melakukan hardcoding URL, kredensial, atau rahasia otentikasi.
- Mengubah arsitektur basis data tanpa validasi migrasi.
- Menambahkan dependensi eksternal usang atau bermasalah lisensi.
- Memperkenalkan mutasi state global yang tidak terisolasi.

### 8. PERSYARATAN OUTPUT AKHIR

Sajikan kode sumber yang lengkap, siap dijalankan langsung, dan bebas cacat sintaks maupun tipe data.

**URUTAN PRIORITAS:**

1. Kebenaran fungsional mutlak sesuai kebutuhan spesifikasi.
2. Kepatuhan ketat terhadap type-safety dan kontrak skema.
3. Ketahanan rekayasa defensif dan penanganan error lengkap.
4. Keterbacaan kode, modularitas, dan struktur bersih.
5. Efisiensi sumber daya dan performa runtime.
6. Kelengkapan implementasi tanpa placeholder yang belum selesai.
7. Dokumentasi instruksi penggunaan dan integrasi.

**DIREKTIF AKHIR:**

Spesifikasi kebutuhan adalah otoritas tertinggi. Kode yang dihasilkan wajib lengkap, langsung dapat dieksekusi, dan memenuhi standar produksi nyata.

Apabila terjadi konflik antara optimasi mikro dan kebenaran tipe data, maka kebenaran tipe data selalu memegang kendali mutlak.`;
    } else {
      refinedPrompt = `# FULL-STACK PRODUCTION SYSTEM ARCHITECTURE
## TYPE-SAFE DETERMINISTIC IMPLEMENTATION — ZERO-REGRESSION MANDATE

### 1. ARCHITECTURAL SPECIFICATION — ABSOLUTE SOURCE OF TRUTH

Use the analyzed technical specifications and functional requirements as the single authoritative source of truth. All code architecture, data contracts, and execution paths must be robustly engineered and fully verified.

**ABSOLUTE TYPE-SAFETY & SCHEMA LOCK**

The system must strictly maintain end-to-end static type safety without compromise.

Do not use implicit 'any', bypass runtime validations, or loosen schema contracts.

Preserve all core technical contracts:

- Core entity models and domain invariants.
- Function parameter definitions and explicit return types.
- Strict separation of concerns across architectural layers.
- Deterministic asynchronous states (loading, success, error, empty).
- Defensive data validation at every system boundary.
${extractedBullets.length > 0 ? '\nSpecific functional specifications preserved from input:\n' + extractedBullets.map((b) => `- ${b}`).join('\n') : ''}

**ZERO RUNTIME AMBIGUITY**

No unhandled promise rejections, no silent exception swallowing, and no untracked state mutations outside designated state containers.

Type contracts take absolute priority over development expediency.

### 2. CORE COMPONENT & LOGICAL IMPLEMENTATION

Construct modular, production-ready code fulfilling all analyzed requirements:

- Component and service modules engineered for independent testability.
- Deterministic, predictable state management workflows.
- Structured API communication with validated serialization/deserialization.
- Clean lifecycle management guaranteeing zero memory leaks.
- High reusability achieved through clean composition patterns.

**INTERFACE CONTRACT LOCK**

Preserve all public function signatures, prop types, and API endpoints according to requirements.

Do not alter public interfaces or break existing integrations without explicit instruction.

### 3. ENVIRONMENT & DEPENDENCY INTEGRATION

Align with the target runtime ecosystem and operational limits:

- Full compatibility with target language and framework versions.
- Minimal, vetted, and standardized third-party dependencies.
- Idiomatic use of standard platform APIs.
- Strict isolation of sensitive environment variables.

Do not introduce heavy third-party packages when standard native solutions are readily available.

### 4. DEFENSIVE ENGINEERING & ERROR HANDLING

Implement production-grade fault tolerance:

- Comprehensive boundary validation for null, undefined, and empty collections.
- Isolated error boundaries preventing catastrophic application cascades.
- Actionable, secure, and user-friendly error messages.
- Robust retry strategies for transient network failures.

**STATE MUTATION RESTRICTION**

Do not mutate state directly. All data updates must be immutable and deterministic.

### 5. SYSTEM PERFORMANCE & COMPLEXITY CONSTRAINTS

Production-grade engineering standards:

- Optimal algorithmic complexity on critical execution paths.
- Explicit cleanup of event listeners, subscriptions, and timers.
- Strategic code-splitting and lazy-loading where appropriate.
- Judicious memoization of computationally intensive operations.

### 6. CODE QUALITY & REFACTORING BOUNDARIES

Enhance code exclusively within constructive technical boundaries:

- Self-documenting, descriptive naming conventions.
- Consistent formatting following industry standards.
- Concise architectural commentary on non-trivial domain logic.
- Long-term maintainability and structural cohesion.

Never sacrifice correctness or clarity for clever, opaque micro-optimizations.

### 7. STRICT NEGATIVE INSTRUCTIONS

Do not:

- Use implicit or explicit 'any' types.
- Leave unfinished code placeholders such as '// TODO' or '// add logic here'.
- Catch errors without logging, recovery, or proper propagation.
- Hardcode URLs, credentials, or secrets into source files.
- Introduce outdated or vulnerable external dependencies.
- Mutate shared or global state unpredictably.
- Omit boundary checks on external inputs.

### 8. FINAL OUTPUT REQUIREMENTS

Deliver complete, immediately executable, production-grade source code with zero syntax or typing defects.

**PRIORITY ORDER:**

1. Absolute functional correctness matching the analyzed specification.
2. Strict adherence to type safety and schema contracts.
3. Comprehensive defensive engineering and error containment.
4. Clean code readability, modularity, and maintainability.
5. Runtime performance and resource efficiency.
6. Complete implementation with zero placeholder ellipses.
7. Clear documentation of non-obvious integration steps.

**FINAL DIRECTIVE:**

The technical specification is the ultimate authority. The resulting code must be complete, directly runnable in production, and fully realized.

When optimization conflicts with correctness or type safety, correctness always takes absolute precedence.`;
    }
  }

  // -------------------------------------------------------------
  // DOMAIN 3: WRITING, CONTENT & EDITORIAL
  // -------------------------------------------------------------
  else if (isWriting) {
    if (isId) {
      refinedPrompt = `# SPESIFIKASI MASTER REDAKSIONAL & KONTEN BERDAYA PIKAT
## KEUNGGULAN NARASI & OTORITAS SUARA PENULISAN

### 1. PIAGAM REDAKSIONAL — SUMBER KEBENARAN MUTLAK

Gunakan seluruh tujuan penulisan, pesan utama, dan kriteria pesan yang telah dianalisis sebagai sumber kebenaran mutlak. Teks wajib dibangun dengan kedalaman intelektual dan resonansi emosional yang tinggi.

**KUNCI NADA & SUARA PENULISAN MUTLAK**

Pertahankan konsistensi suara penulisan (voice and tone) dari awal hingga akhir naskah.

Dilarang menggunakan klise basi, kalimat pengisi (filler), atau generalisasi tanpa substansi.

Pertahankan karakteristik pesan:

- Premis utama dan pesan inti.
- Karakter suara naratif (otoritatif, empatik, tajam, dan memikat).
- Kedalaman wawasan dan keakuratan konsep yang diangkat.
- Relevansi langsung dengan target pembaca.
${extractedBullets.length > 0 ? '\nPoin-poin narasi yang dipreservasi dari permintaan:\n' + extractedBullets.map((b) => `- ${b}`).join('\n') : ''}

**NOL RETORIKA KOSONG**

Setiap paragraf harus mengusung pemikiran berbobot yang menggerakkan alur narasi ke depan.

Integritas pesan memegang prioritas tertinggi di atas sekadar panjang kata.

### 2. STRUKTUR ARSITEKTUR NARASI

Susun naskah dengan progresi logis yang mengikat pembaca:

- Hook pembuka yang langsung menarik perhatian intelektual pembaca.
- Eskalasi gagasan yang tertata rapi antar-babak atau subjudul.
- Transisi mulus yang menghubungkan argumen pendukung secara kohesif.
- Titik puncak pembahasan (insight utama) yang memperkaya wawasan.
- Konklusi berdaya ingat tinggi yang memberikan resolusi memuaskan.

**KUNCI ARSITEKTUR CERITA**

Pertahankan alur logis dan hierarki gagasan yang telah ditentukan.

Dilarang melompat antar-ide tanpa jembatan transisi naratif yang wajar.

### 3. KONTEKS AUDIENS & RELEVANSI EMOSIONAL

Sesuaikan seluruh diksi dan perumpamaan dengan konteks pembaca sasaran:

- Penyesuaian register bahasa (formal, kasual cerdas, atau profesional).
- Penggunaan analogi yang mudah dipahami namun bermartabat.
- Antisipasi keberatan atau pertanyaan kritis pembaca.

### 4. SAINS GAYA BAHASA & IRAMA KALIMAT

Terapkan disiplin ritme penulisan tingkat tinggi:

- Variasi panjang kalimat (cadence) untuk menciptakan dinamika bacaan alami.
- Dominasi kalimat aktif yang lugas dan bertenaga.
- Diksi yang tajam dan presisi, menghindari kata sifat berlebihan.

**BATASAN EKSPRESI BERLEBIHAN**

Dilarang menggunakan metafora campur aduk (mixed metaphors) atau bahasa sensasional tanpa dasar.

### 5. SPESIFIKASI FORMAT & TEKSTUAL

Standar penulisan editorial profesional:

- Penataan hierarki judul dan subjudul yang jelas.
- Paragraf yang proporsional untuk kenyamanan membaca di layar maupun cetak.
- Penggunaan penekanan teks (tebal/miring) yang selektif dan bermakna.

### 6. CAKUPAN PENINGKATAN KUALITAS KONTEN

Tingkatkan naskah secara konstruktif:

- Kejelasan argumen dan bobot persuasif.
- Kehalusan transisi kalimat.
- Kekayaan kosakata yang proporsional dan tidak bertele-tele.

Jangan pernah mengorbankan kejelasan demi terdengar rumit secara artifisial.

### 7. PAGAR PEMBATAS & LARANGAN KETAT

Dilarang:

- Menggunakan frasa klise seperti 'di era digital saat ini' atau kata pengisi tanpa arti.
- Menulis kalimat berputar-putar tanpa premis yang jelas.
- Menyajikan klaim faktual tanpa konteks yang kredibel.
- Mengubah nada bicara di tengah tulisan tanpa alasan naratif.
- Menggunakan jargon teknis berlebihan yang mengasingkan pembaca sasaran.

### 8. PERSYARATAN OUTPUT AKHIR

Sajikan naskah lengkap yang koheren, memikat, dan siap dipublikasikan langsung tanpa perlu penataan ulang.

**URUTAN PRIORITAS:**

1. Kejelasan dan bobot premis utama.
2. Konsistensi suara dan nada naratif.
3. Kerapian arsitektur naratif dan transisi logis.
4. Kekuatan hook pembuka dan konklusi penutup.
5. Ritme kalimat dan presisi diksi.
6. Relevansi dan resonansi bagi audiens target.
7. Kelengkapan naskah tanpa bagian yang terputus.

**DIREKTIF AKHIR:**

Tujuan pesan pembaca adalah otoritas tertinggi. Tulisan yang dihasilkan wajib berdampak nyata, berbobot, dan mengalir secara alami.`;
    } else {
      refinedPrompt = `# HIGH-ENGAGEMENT EDITORIAL MASTER SPECIFICATION
## NARRATIVE EXCELLENCE & COHESIVE VOICE AUTHORITY

### 1. EDITORIAL CHARTER — ABSOLUTE SOURCE OF TRUTH

Use the analyzed content objectives, core messaging, and target outcomes as the single authoritative source of truth. Every paragraph must be constructed with intellectual rigor and emotional resonance.

**ABSOLUTE TONE & VOICE LOCK**

Maintain unwavering voice and tone consistency across the entire manuscript.

Do not employ tired clichés, conversational fluff, or hollow generalizations.

Preserve all fundamental messaging traits:

- Core thesis and overarching narrative throughline.
- Distinct voice personality (authoritative, empathetic, incisive, and engaging).
- Depth of analytical insight and conceptual clarity.
- Direct alignment with the intended readership.
${extractedBullets.length > 0 ? '\nSpecific thematic elements preserved from input:\n' + extractedBullets.map((b) => `- ${b}`).join('\n') : ''}

**ZERO RHETORICAL FLUFF**

Every sentence must carry distinct weight and advance the core argument.

Substance and clarity take absolute priority over mere word count.

### 2. NARRATIVE ARCHITECTURE & PROGRESSION

Structure the piece with a captivating, logical progression:

- An arresting opening hook establishing immediate intellectual stakes.
- Methodical escalation of ideas across structured sections.
- Seamless transitions binding supporting evidence to the central thesis.
- A high-impact conceptual climax delivering actionable illumination.
- A memorable, resonant conclusion providing satisfying closure.

**NARRATIVE ARCHITECTURE LOCK**

Preserve the logical progression and conceptual hierarchy defined in the requirements.

Do not jump between disconnected concepts without natural transitional bridges.

### 3. AUDIENCE CALIBRATION & CONTEXTUAL RESONANCE

Align vocabulary, framing, and pacing with the target readership:

- Appropriate language register (executive, analytical, or culturally resonant).
- Precise, illuminating analogies that clarify complex themes.
- Proactive addressing of counter-arguments and reader skepticism.

### 4. RHETORICAL CRAFT & SENTENCE CADENCE

Enforce sophisticated prose rhythm:

- Deliberate variation in sentence length creating an organic reading cadence.
- Dominance of active voice and vigorous action verbs.
- Precision diction eliminating adjectives that dilute clarity.

**EXPRESSIVE DISCIPLINE RESTRICTION**

Do not resort to mixed metaphors, sensationalist hyperbole, or melodrama.

### 5. FORMATTING & TEXTUAL SPECIFICATIONS

Professional editorial formatting standards:

- Distinct, intuitive section headers guiding reader navigation.
- Balanced paragraph lengths optimized for sustained visual comfort.
- Purposeful typographic hierarchy for key takeaways.

### 6. CONTENT REFINEMENT & VALUE DEPTH

Refine the manuscript strictly within constructive boundaries:

- Sharpening the persuasive force of arguments.
- Polishing prose rhythm and flow.
- Enhancing vocabulary precision without artificial pretension.

Never sacrifice clarity for needlessly convoluted phrasing.

### 7. STRICT NEGATIVE INSTRUCTIONS

Do not:

- Use generic clichés or formulaic filler phrases.
- Wander off into tangential musings that break narrative momentum.
- Make unsubstantiated assertions lacking contextual grounding.
- Shift tone abruptly without deliberate narrative purpose.
- Introduce unvetted jargon that alienates the primary audience.

### 8. FINAL OUTPUT REQUIREMENTS

Deliver a polished, compelling, publishable manuscript ready for immediate distribution.

**PRIORITY ORDER:**

1. Intellectual clarity and strength of the central thesis.
2. Unwavering consistency of editorial voice and tone.
3. Cohesive narrative progression and seamless transitions.
4. Impact of the opening hook and closing resolution.
5. Sentence cadence and precision of word choice.
6. Contextual resonance for the target audience.
7. Complete, unified presentation ready for publication.

**FINAL DIRECTIVE:**

The core communicative intent is the supreme authority. The output must be engaging, incisive, and immediately publishable without restructuring.`;
    }
  }

  // -------------------------------------------------------------
  // DOMAIN 4: BUSINESS, MARKETING & COPYWRITING
  // -------------------------------------------------------------
  else if (isMarketing) {
    if (isId) {
      refinedPrompt = `# DIREKTIF STRATEGIS KAMPANYE & COPYWRITING
## OTORITAS VALUE PROPOSITION & AKUISISI BERDAYA KONVERSI

### 1. POSISIONING STRATEGIS — SUMBER KEBENARAN MUTLAK

Gunakan seluruh proposisi nilai, profil audiens sasaran, dan tujuan bisnis yang dianalisis sebagai sumber kebenaran mutlak.

**KUNCI VALUE PROPOSITION MUTLAK**

Pertahankan diferensiasi unik produk/layanan secara tajam dan tak terbantahkan.

Dilarang membuat klaim berlebihan yang tidak kredibel atau menggunakan basa-basi korporat generik.

Pertahankan karakteristik strategis:

- Titik sakit utama (core pain points) pelanggan yang dipecahkan.
- Proposisi nilai unik (Unique Value Proposition) yang tak tertandingi.
- Bukti kredibilitas (social proof, data, hasil nyata).
- Tindakan tunggal yang diinginkan dari audiens (Single Desired Action).
${extractedBullets.length > 0 ? '\nPoin strategis yang dipreservasi dari permintaan:\n' + extractedBullets.map((b) => `- ${b}`).join('\n') : ''}

**NOL KLAIM KOSONG**

Setiap kalimat penawaran harus didukung manfaat nyata dan relevan bagi kehidupan atau bisnis audiens.

### 2. AUDIENS TARGET & ARSITEKTUR PESAN

- Hook: Menyentuh langsung urgensi audiens dalam hitungan detik pertama.
- Eksplorasi Masalah: Mengartikulasikan masalah pelanggan lebih baik daripada mereka sendiri.
- Solusi & Bukti: Menghadirkan penawaran sebagai solusi logis yang tak terhindarkan.
- Penawaran: Syarat dan manfaat yang jelas dan transparan.
- Ajakan Bertindak (Call to Action): Instruksi penutup yang jelas, mendesak, dan minim friksi.

**KUNCI HIERARKI PESAN**

Pertahankan urutan psikologis persuasi tanpa memutarbalikkan alur logis.

### 3. KONTEKS PASAR & DIFERENSIASI KOMPETITIF

- Tegaskan keunggulan komparatif terhadap alternatif pasar.
- Hilangkan keraguan umum (risk-reversal) melalui jaminan atau mitigasi risiko.

### 4. PSIKOLOGI PERSUASI & ELIMINASI FRIKSI

- Diksi yang memotivasi tindakan tanpa terkesan memaksa murahan.
- Fokus pada hasil akhir yang dinikmati pelanggan (outcomes, not features).

**BATASAN CALL-TO-ACTION**

Fokus hanya pada 1 tindakan utama. Dilarang memecah fokus audiens dengan instruksi yang saling bersaing.

### 5. SPESIFIKASI KANAL & FORMAT KAMPANYE

- Format teks terstruktur rapi dengan poin-poin tebal yang mudah dipindai mata (scannable).
- Callout penawaran yang menonjol dan memikat.

### 6. OPTIMASI TINGKAT LANJUT

- Ketajaman kalimat penawaran.
- Penguatan daya pikat emosional dan rasional.

### 7. PAGAR PEMBATAS & LARANGAN KETAT

Dilarang:

- Menggunakan bahasa 'salesy' murahan yang menurunkan martabat merek.
- Membingungkan audiens dengan jargon yang sulit dicerna.
- Menjanjikan hal yang tidak dapat dibuktikan.
- Menyediakan lebih dari satu call-to-action utama yang membingungkan.

### 8. PERSYARATAN OUTPUT AKHIR

Sajikan copy kampanye lengkap yang siap tayang dan berdaya konversi tinggi.

**URUTAN PRIORITAS:**

1. Kejelasan proposisi nilai dan keunikan diferensiasi.
2. Penanganan tuntas terhadap titik sakit utama audiens.
3. Kredibilitas bukti dan mitigasi risiko.
4. Kejernihan dan daya dorong Call to Action.
5. Alur psikologis persuasi yang mulus.
6. Keterbacaan dan keindahan tata letak teks.
7. Kelengkapan naskah siap pakai.

**DIREKTIF AKHIR:**

Nilai nyata bagi pelanggan adalah otoritas tertinggi. Seluruh pesan harus berfokus pada hasil nyata audiens.`;
    } else {
      refinedPrompt = `# STRATEGIC CAMPAIGN DIRECTIVE & COPYWRITING SPECIFICATION
## VALUE PROPOSITION & HIGH-CONVERSION ACQUISITION AUTHORITY

### 1. STRATEGIC POSITIONING — ABSOLUTE SOURCE OF TRUTH

Use the analyzed unique value proposition, target customer persona, and commercial objectives as the single authoritative source of truth.

**CORE VALUE PROPOSITION LOCK**

Sharply and indisputably preserve the distinct differentiation of the offering.

Do not rely on empty hype, unsubstantiated claims, or generic corporate filler.

Preserve all strategic pillars:

- Primary customer pain points and frictions resolved.
- Unique Value Proposition (UVP) and competitive edge.
- Concrete credibility elements (data, social proof, proven outcomes).
- Single Desired Action (SDA) required from the prospect.
${extractedBullets.length > 0 ? '\nSpecific strategic elements preserved from input:\n' + extractedBullets.map((b) => `- ${b}`).join('\n') : ''}

**ZERO GENERIC HYPE**

Every claim must directly tie to a tangible, demonstrable benefit for the customer.

### 2. TARGET AUDIENCE & MESSAGING ARCHITECTURE

- The Hook: Instantly confronts the prospect's primary urgency within seconds.
- Problem Articulation: Defines the prospect's dilemma with sharper clarity than they do themselves.
- Solution & Proof: Positions the offering as the only logical, self-evident answer.
- Irresistible Proposition: Transparent presentation of deliverables and value exchange.
- Call to Action (CTA): Single, frictionless, unmistakable closing directive.

**MESSAGING HIERARCHY LOCK**

Preserve the psychological sequence of persuasion without disrupting narrative momentum.

### 3. MARKET CONTEXT & COMPETITIVE DIFFERENTIATION

- Position explicitly against market alternatives.
- Systematically neutralize common objections and risk concerns.

### 4. PERSUASION PSYCHOLOGY & FRICTION REDUCTION

- Compelling, active phrasing emphasizing prospect empowerment.
- Relentless focus on transformational outcomes rather than passive feature lists.

**CALL-TO-ACTION RESTRICTION**

Direct prospects toward exactly one primary action. Do not fracture attention across competing directives.

### 5. CHANNEL & CAMPAIGN ASSET SPECIFICATIONS

- Highly scannable layout utilizing bold micro-copy and clean hierarchy.
- Prominent presentation of key value catalysts.

### 6. OPTIMIZATION & CONVERSION FIDELITY

- Honing persuasive clarity without introducing false urgency.
- Balancing emotional motivation with rational justification.

### 7. STRICT NEGATIVE INSTRUCTIONS

Do not:

- Use generic buzzwords that erode commercial credibility.
- Overwhelm prospects with confusing internal technical jargon.
- Present unverified claims that compromise brand integrity.
- Introduce multiple contradictory conversion goals.

### 8. FINAL OUTPUT REQUIREMENTS

Deliver complete, production-grade campaign copy ready for immediate deployment.

**PRIORITY ORDER:**

1. Absolute clarity of the value proposition and core differentiation.
2. Direct resolution of the customer's primary pain points.
3. Concrete credibility backing and risk neutralization.
4. Frictionless, compelling clarity of the primary CTA.
5. Psychological coherence and persuasive momentum.
6. Scannability and visual presentation.
7. End-to-end completeness ready for execution.

**FINAL DIRECTIVE:**

Customer value is the ultimate authority. Every directive must drive verifiable real-world action.`;
    }
  }

  // -------------------------------------------------------------
  // DOMAIN 5: DATA ANALYSIS & RESEARCH
  // -------------------------------------------------------------
  else if (isData) {
    if (isId) {
      refinedPrompt = `# SPESIFIKASI ANALISIS DATA & PEMODELAN KAUSAL
## INTEGRITAS METODOLOGI & OTORITAS RIGOR STATISTIK

### 1. PIAGAM ANALITIK — SUMBER KEBENARAN MUTLAK

Gunakan seluruh pertanyaan riset, skema dataset, dan metrik bisnis yang dianalisis sebagai sumber kebenaran mutlak.

**KUNCI RIGOR METODOLOGIS MUTLAK**

Pertahankan keakuratan matematis dan pemisahan tegas antara korelasi dan kausalitas.

Dilarang menarik simpulan prematur dari anomali acak atau mengabaikan bias data.

Pertahankan parameter analitik:

- Hipotesis utama dan variabel yang diuji.
- Definisi matematis dari setiap indikator kinerja (KPI).
- Batas toleransi statistik (p-value, confidence intervals, power).
- Validasi kualitas data (missing values, outliers, data drift).
${extractedBullets.length > 0 ? '\nPoin analisis yang dipreservasi dari permintaan:\n' + extractedBullets.map((b) => `- ${b}`).join('\n') : ''}

**NOL KORELASI SPEKULATIF**

Semua rekomendasi wajib berpijak pada data yang dapat diverifikasi secara empiris.

### 2. TAKSONOMI DATA & FORMULASI METRIK

- Klasifikasi variabel: dependen, independen, dan variabel pengendali.
- Normalisasi dan transformasi fitur yang transparan dan dapat direproduksi.

**KUNCI KONTRAK PENGUKURAN**

Pertahankan formula perhitungan metrik tanpa mengubah definisi dasar secara sepihak.

### 3. LINGKUNGAN SISTEM & ALUR PIPELINE DATA

- Standar pipeline ETL/ELT yang reproducible dan terdokumentasi.
- Penanganan integritas data pada kondisi batas.

### 4. PEMODELAN STATISTIK & VERIFIKASI KAUSAL

- Pemilihan model statistik/machine learning yang sesuai dengan sifat distribusi data.
- Pengujian hipotesis dan pemeriksaan asumsi model secara menyeluruh.

**BATASAN INFERENSI**

Dilarang mengekstrapolasi simpulan di luar cakupan populasi atau domain data yang diuji.

### 5. SPESIFIKASI KOMPUTASIONAL & TOLERANSI

- Kriteria pengujian validasi silang (cross-validation).
- Keterjelasan metrik evaluasi (Precision, Recall, ROC-AUC, RMSE, dsb.).

### 6. PENINGKATAN KUALITAS & RESOLUSI ANOMALI

- Pembersihan noise data yang dapat dipertanggungjawabkan secara saintifik.
- Penyajian visualisasi analitik yang objektif dan tidak menyesatkan.

### 7. PAGAR PEMBATAS & LARANGAN KETAT

Dilarang:

- Mengaburkan perbedaan antara korelasi statistik dan hubungan sebab-akibat.
- Memilih data secara selektif (cherry-picking) demi membenarkan hipotesis.
- Mengabaikan missing values tanpa strategi imputasi yang jelas.
- Menyajikan visualisasi chart dengan skala sumbu yang menyesatkan.

### 8. PERSYARATAN OUTPUT AKHIR

Sajikan laporan analisis lengkap, akurat, dan dapat ditindaklanjuti secara strategis.

**URUTAN PRIORITAS:**

1. Integritas metodologis dan validitas statistik empiris.
2. Kejelasan formulasi metrik dan definisi data.
3. Keterujian dan reprodusibilitas alur komputasi.
4. Kualitas deteksi bias dan anomali data.
5. Kedalaman rekomendasi berbasis bukti data nyata.
6. Objektivitas visualisasi analitik.
7. Kelengkapan ringkasan eksekutif yang actionable.

**DIREKTIF AKHIR:**

Kebenaran empiris data adalah otoritas tertinggi. Simpulan analisis wajib objektif, berbasis data nyata, dan bebas bias spekulatif.`;
    } else {
      refinedPrompt = `# EMPIRICAL DATA SCIENCE & CAUSAL ANALYSIS SPECIFICATION
## METHODOLOGICAL INTEGRITY & STATISTICAL RIGOR AUTHORITY

### 1. ANALYTICAL CHARTER — ABSOLUTE SOURCE OF TRUTH

Use the analyzed research objectives, dataset schemas, and quantitative metrics as the single authoritative source of truth.

**EMPIRICAL GROUNDING LOCK**

Strictly maintain mathematical precision and rigorous separation between correlation and causality.

Do not draw premature conclusions from statistical noise or ignore sampling biases.

Preserve all analytical pillars:

- Core research hypothesis and experimental variables.
- Explicit mathematical formulations for all key indicators.
- Rigorous statistical tolerance boundaries (confidence intervals, p-values).
- Data quality controls addressing anomalies and missing values.
${extractedBullets.length > 0 ? '\nSpecific analytical requirements preserved from input:\n' + extractedBullets.map((b) => `- ${b}`).join('\n') : ''}

**ZERO SPECULATIVE CORRELATION**

All findings and strategic recommendations must be rooted in verifiable empirical evidence.

### 2. DATASET TAXONOMY & METRIC FORMULATIONS

- Explicit segregation of independent, dependent, and confounding variables.
- Transparent, fully reproducible data transformation pipelines.

**MEASUREMENT CONTRACT LOCK**

Preserve metric mathematical definitions without arbitrary alteration.

### 3. SYSTEM PIPELINE & COMPUTATIONAL CONTEXT

- Fully reproducible execution scripts and data extraction queries.
- Systematic validation across boundary cases and outliers.

### 4. STATISTICAL MODELING & CAUSAL METHODOLOGY

- Selection of algorithms suited to the underlying data distribution.
- Robust validation of model assumptions and residual diagnostics.

**INFERENCE BOUNDARY RESTRICTION**

Do not extrapolate findings beyond the verified sample population boundaries.

### 5. COMPUTATIONAL SPECIFICATIONS & TOLERANCES

- Standardized cross-validation protocols.
- Explicit reporting of validation metrics (RMSE, Precision, Recall, AUC).

### 6. RIGOR ENHANCEMENT & ANOMALY RESOLUTION

- Scientifically grounded imputation and outlier management.
- Objective, non-misleading visual charting standards.

### 7. STRICT NEGATIVE INSTRUCTIONS

Do not:

- Conflate statistical correlation with causal attribution.
- Cherry-pick metrics or data segments to support favored outcomes.
- Ignore missing values without documented handling rationale.
- Present visualizations with truncated axes designed to deceive.

### 8. FINAL OUTPUT REQUIREMENTS

Deliver a rigorous, complete, and reproducible analytical report with high-leverage strategic takeaways.

**PRIORITY ORDER:**

1. Absolute empirical validity and statistical integrity.
2. Precision of mathematical formulas and metric definitions.
3. Full computational reproducibility.
4. Robustness of bias detection and data hygiene.
5. Actionability and commercial impact of recommendations.
6. Visual objectivity and clarity of data reporting.
7. Executive clarity and thoroughness.

**FINAL DIRECTIVE:**

Empirical reality is the ultimate authority. All conclusions must be mathematically defensible and free from subjective bias.`;
    }
  }

  // -------------------------------------------------------------
  // DOMAIN 6: GENERAL / MULTI-DISCIPLINARY HIGH-PRECISION TASK
  // -------------------------------------------------------------
  else {
    const mainTitle =
      cleanBase
        .split('\n')[0]
        .replace(/^[#\s*]+/, '')
        .trim()
        .slice(0, 60)
        .toUpperCase() || 'HIGH-PRECISION OPERATIONAL TASK';

    if (isId) {
      refinedPrompt = `# ${mainTitle}
## PRESISI OPERASIONAL TINGKAT TINGGI — SPESIFIKASI MASTER EKSEKUSI

### 1. RUANG LINGKUP & MANDAT — SUMBER KEBENARAN MUTLAK

Gunakan seluruh tujuan utama, batasan operasional, dan kriteria keberhasilan yang telah dianalisis sebagai sumber kebenaran tunggal dan mutlak.

Eksekusi setiap bagian tugas secara hierarkis, sistematis, dan tanpa deviasi.

**KUNCI SASARAN OPERASIONAL MUTLAK**

Hasil akhir wajib memenuhi seluruh kriteria fungsional dan sasaran yang ditentukan secara presisi.

Dilarang mengaburkan fokus, membuat asumsi di luar lingkup tugas, atau menyederhanakan instruksi penting.

Pertahankan seluruh parameter tugas inti:

- Tujuan utama dan indikator keberhasilan eksekusi.
- Ruang lingkup batasan kerja yang diperbolehkan.
- Standar kualitas dan akurasi yang diharapkan.
- Keterkaitan logis antar-tahapan eksekusi.
${extractedBullets.length > 0 ? '\nPoin spesifikasi yang dipreservasi dari permintaan:\n' + extractedBullets.map((b) => `- ${b}`).join('\n') : ''}

**NOL DEVIASI SPEKULATIF**

Semua langkah eksekusi harus dapat diverifikasi keabsahannya terhadap instruksi asli.

Tujuan utama memegang prioritas tertinggi di atas seluruh preferensi sekunder.

### 2. SPESIFIKASI FUNGSIONAL & DEKOMPOSISI PROSEDURAL

Laksanakan tugas dengan membaginya ke dalam unit-unit kerja yang terstruktur:

- Dekomposisi tugas langkah demi langkah yang jelas dan berurutan.
- Penetapan input, proses transformasi, dan output pada setiap tahapan.
- Definisi kriteria verifikasi kualitas pada masing-masing tahapan.

**KUNCI ARSITEKTUR EKSEKUSI**

Pertahankan urutan logis dan hubungan ketergantungan antar-langkah.

Dilarang melewati tahapan penting tanpa penyelesaian menyeluruh.

### 3. BATASAN LINGKUNGAN & EKOSISTEM SUMBER DAYA

- Sesuaikan dengan sistem target (${targetAI}) dan batasan platformnya.
- Optimalkan efisiensi token dan kejelasan instruksi tanpa kata-kata klise.
- Pertahankan konsistensi data dan format di seluruh alur kerja.

### 4. METODOLOGI EKSEKUSI & SAINS KUALITAS

- Terapkan disiplin deterministik tinggi: setiap instruksi memiliki batasan yang tidak dapat disalahartikan.
- Antisipasi kondisi batas (edge cases) dan sediakan instruksi penanganan yang jelas.

**BATASAN OPERASIONAL KHUSUS**

Dilarang memperkenalkan komponen atau langkah tambahan yang tidak relevan dengan sasaran tugas.

### 5. SPESIFIKASI TEKNIS & KEPATUHAN FORMAT

- Kepatuhan penuh terhadap format keluaran yang diminta.
- Struktur hierarki informasi yang memudahkan pemindaian dan eksekusi.

### 6. PENINGKATAN KUALITAS & BATASAN PENYEMPURNAAN

- Penajaman kejelasan bahasa dan ketegasan instruksi.
- Penghapusan ambiguitas semantik.

Jangan pernah mengorbankan kepatuhan terhadap instruksi demi mengejar elaborasi yang tidak diminta.

### 7. PAGAR PEMBATAS & LARANGAN KETAT

Dilarang:

- Menyimpang dari tujuan utama yang telah ditetapkan.
- Mengabaikan batasan atau prasyarat yang ditentukan.
- Menggunakan kalimat pengantar atau penutup obrolan (conversational meta).
- Menyajikan informasi yang tidak lengkap atau menggunakan placeholder elipsis.
- Menambahkan asumsi spekulatif yang tidak berdasar.

### 8. PERSYARATAN OUTPUT AKHIR

Hasilkan luaran yang lengkap, terstruktur rapi, spesifik, dan siap digunakan secara langsung.

**URUTAN PRIORITAS:**

1. Kepatuhan mutlak terhadap tujuan dan sasaran utama.
2. Kelengkapan dan ketepatan spesifikasi fungsional.
3. Kepatuhan terhadap seluruh batasan dan pagar pembatas.
4. Kejelasan dan ketajaman instruksi langkah demi langkah.
5. Kerapian struktur hierarki dan konsistensi format.
6. Efisiensi penyampaian pesan tanpa pemborosan kata.
7. Kesiapan pakai langsung tanpa memerlukan perbaikan ulang.

**DIREKTIF AKHIR:**

Mandat operasional yang dianalisis adalah otoritas tertinggi. Seluruh hasil akhir wajib memenuhi standar kelengkapan penuh, presisi tinggi, dan deterministik.`;
    } else {
      refinedPrompt = `# ${mainTitle}
## HIGH-PRECISION OPERATIONAL DISCIPLINE — MASTER EXECUTION SPECIFICATION

### 1. OPERATIONAL CHARTER — ABSOLUTE SOURCE OF TRUTH

Use the analyzed primary objectives, operational boundaries, and success criteria as the single authoritative source of truth.

Execute every task phase hierarchically, systematically, and without deviation.

**CORE OBJECTIVE LOCK**

The final output must precisely satisfy all functional requirements and designated targets.

Do not dilute focus, introduce unsupported assumptions, or oversimplify critical directives.

Preserve all fundamental mission parameters:

- Primary objective and verifiable success milestones.
- Strictly permitted operational boundaries.
- Quality, precision, and compliance benchmarks.
- Logical dependencies binding task execution phases.
${extractedBullets.length > 0 ? '\nSpecific specifications preserved from input:\n' + extractedBullets.map((b) => `- ${b}`).join('\n') : ''}

**ZERO SPECULATIVE DRIFT**

Every execution step must be directly traceable to the foundational instructions.

The primary objective holds absolute precedence over secondary preferences.

### 2. FUNCTIONAL SCOPE & PROCEDURAL DECOMPOSITION

Decompose the mission into structured, verifiable execution phases:

- Stepwise execution methodology eliminating procedural ambiguity.
- Explicit definition of inputs, processing rules, and outputs per phase.
- Objective verification criteria established for each milestone.

**EXECUTION ARCHITECTURE LOCK**

Preserve the logical sequence and inter-task dependencies without disruption.

Do not bypass intermediate steps without rigorous validation.

### 3. CONTEXTUAL BOUNDARIES & RESOURCE ENVIRONMENT

- Calibrate explicitly for the target AI platform (${targetAI}).
- Maximize signal-to-noise ratio and eliminate conversational redundancy.
- Maintain consistent nomenclature and formatting conventions throughout.

### 4. METHODOLOGY & QUALITY GATES

- High-precision deterministic discipline: every instruction carries explicit boundaries leaving zero room for misinterpretation.
- Proactive edge-case handling protocols.

**OPERATIONAL DISCIPLINE RESTRICTION**

Do not introduce supplementary steps or extraneous components outside the required scope.

### 5. TECHNICAL & COMPLIANCE SPECIFICATIONS

- Strict compliance with requested output schemas and formats.
- Structured typographic hierarchy ensuring rapid visual comprehension.

### 6. FIDELITY ENHANCEMENT & REFINEMENT BOUNDARIES

- Sharpening instructional clarity and precision.
- Elimination of semantic ambiguities.

Never sacrifice strict instruction compliance for unrequested elaboration.

### 7. STRICT NEGATIVE INSTRUCTIONS

Do not:

- Deviate from the core objective and defined scope.
- Bypass explicit operational constraints or boundaries.
- Include conversational meta-talk or introductory pleasantries.
- Provide incomplete answers or placeholder ellipses.
- Fabricate unverified assumptions.

### 8. FINAL OUTPUT REQUIREMENTS

Deliver a comprehensive, meticulously structured, definitive specification ready for immediate operational deployment.

**PRIORITY ORDER:**

1. Absolute fidelity to core objectives and functional requirements.
2. Completeness and precision of procedural instructions.
3. Strict adherence to negative constraints and boundaries.
4. Logical coherence and step-by-step clarity.
5. Structural hierarchy and clean formatting.
6. High signal-to-noise ratio.
7. Immediate production readiness without requiring revision.

**FINAL DIRECTIVE:**

The analyzed mission charter is the supreme authority. The output must be complete, deterministic, and immediately actionable without restructuring.`;
    }
  }

  return {
    refinedPrompt: refinedPrompt.trim(),
    engineUsed: isId ? 'Engine AI Studio PCTCE+O (Spesifikasi Master Terstruktur)' : 'Engine AI Studio PCTCE+O (Structured Master Specification)',
  };
}
