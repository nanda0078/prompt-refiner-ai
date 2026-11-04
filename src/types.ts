export type TargetAI =
  | 'Auto Detect'
  | 'Google Gemini'
  | 'ChatGPT'
  | 'Claude'
  | 'Microsoft Copilot'
  | 'Other AI';

export type OptimizationMode =
  | 'Quick Refine'
  | 'Advanced Refine'
  | 'Expert Refine';

export type OutputLanguage =
  | 'Indonesia'
  | 'English'
  | 'Auto Detect';

export type PromptStyle =
  | 'General Assistant'
  | 'Coding & Development'
  | 'Image Generation'
  | 'Video Generation'
  | 'Data Analysis'
  | 'Research'
  | 'Writing & Content'
  | 'Business & Marketing'
  | 'Custom';

export interface ImageAttachment {
  id: string;
  name: string;
  mimeType: string;
  base64Data: string; // raw base64 data without prefix
  dataUrl: string; // complete data URL for preview
  sizeBytes: number;
}

export interface RefinerOptions {
  targetAI: TargetAI;
  mode: OptimizationMode;
  outputLang: OutputLanguage;
  promptStyle: PromptStyle;
  customStyle?: string;
  images?: ImageAttachment[];
}


export type AdvancedRefineStatus = 'idle' | 'ready' | 'processing' | 'completed' | 'failed';

export interface AdvancedRefineData {
  refinedPrompt: string;
  status: AdvancedRefineStatus;
  engineUsed?: string;
  sourceOptimizedPrompt?: string;
  createdAt?: string;
}

export interface RefineMetrics {
  originalWordCount: number;
  originalCharCount: number;
  refinedWordCount: number;
  refinedCharCount: number;
}

export interface RefineResult {
  id: string;
  createdAt: string;
  rawMarkdown: string;
  targetAiMode: string;
  optimizedPrompt: string;
  appliedTechniques: string[];
  improvementQuestions: string[];
  metrics: RefineMetrics;
  originalPrompt: string;
  options: RefinerOptions;
  engineUsed?: string;
  imagesCount?: number;
  advancedRefinement?: AdvancedRefineData;
}

export interface HistoryItem extends RefineResult {
  title: string;
  isFavorite?: boolean;
}

export interface ConnectionTestResult {
  success: boolean;
  latency?: number;
  message: string;
  usingCustomKey?: boolean;
  model?: string;
  technicalDetails?: any;
}

export interface GeminiConfig {
  provider: string;
  model: string;
  apiVersion: string;
}

/**
 * Single Source of Truth for Gemini API Configuration
 */
export const GEMINI_CONFIG: GeminiConfig = {
  provider: 'gemini',
  model: 'gemini-3.8-flash',
  apiVersion: 'v1beta',
};

export type AIProviderId = 'gemini-3.8-flash' | 'pctce-o-studio';

export interface AIProviderConfig {
  id: AIProviderId;
  name: string;
  model: string;
  description: string;
}

export interface GeminiModelOption {
  id: string;
  name: string;
  badge?: string;
  description: string;
}

export const GEMINI_MODEL_OPTIONS: GeminiModelOption[] = [
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    badge: 'Rekomendasi Utama',
    description: 'Generasi terbaru dengan penalaran tinggi, latensi ultra-rendah & konteks luas.',
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    badge: 'Stabil',
    description: 'Model standar cepat dan stabil untuk sintesis prompt.',
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    badge: 'Penalaran Dalam',
    description: 'Model kemampuan penalaran kompleks dan instruksi bertingkat.',
  },
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    badge: 'Legacy',
    description: 'Model pendahulu dengan efisiensi tinggi.',
  },
];

export const AI_PROVIDERS: AIProviderConfig[] = [
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini API (gemini-3.8-flash)',
    model: 'gemini-3.8-flash',
    description: 'Google Gemini API langsung menggunakan model gemini-3.8-flash (BYOK - Bring Your Own Key).',
  },
  {
    id: 'pctce-o-studio',
    name: 'Engine AI Studio PCTCE+O',
    model: 'pctce-o-studio',
    description: 'Engine sintesis prompt PCTCE+O terstandar dengan alur kerja Lyra 4D (Built-in / AI Studio).',
  },
];
