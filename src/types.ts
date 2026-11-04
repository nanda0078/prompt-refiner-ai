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

export interface RefinerOptions {
  targetAI: TargetAI;
  mode: OptimizationMode;
  outputLang: OutputLanguage;
  promptStyle: PromptStyle;
  customStyle?: string;
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
}
