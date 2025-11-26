export type ImageModelId =
  | 'flux-schnell'
  | 'flux-pro'
  | 'sdxl'
  | 'imagen-4-fast'
  | 'seedream-4'
  | 'ideogram-v3-turbo'
  | 'qwen-image'
  | 'sd-3.5-large-turbo'
  | 'imagen-4'
  | 'sd-3.5-medium'
  | 'nano-banana';

export interface ImageModel {
  id: ImageModelId;
  name: string;
  description: string;
  replicateId: string;
  estimatedTime: string;
  creditsPerImage: number;
  features?: string[];
  category?: 'budget' | 'standard' | 'premium' | 'specialty';
}

export const IMAGE_MODELS: Record<ImageModelId, ImageModel> = {
  // Existing models
  'flux-schnell': {
    id: 'flux-schnell',
    name: 'FLUX Schnell',
    description:
      'Schnelle Bildgenerierung in 1-2 Sekunden. Gut für Prototypen und Tests.',
    replicateId: 'black-forest-labs/flux-schnell',
    estimatedTime: '1-2 Sekunden',
    creditsPerImage: 1,
    features: ['ultra-fast', 'development'],
    category: 'budget',
  },
  'flux-pro': {
    id: 'flux-pro',
    name: 'FLUX Pro 1.1',
    description:
      'Höchste Bildqualität mit verbesserter Prompt-Befolgung. Ideal für finale Geschichten.',
    replicateId: 'black-forest-labs/flux-1.1-pro',
    estimatedTime: '10-15 Sekunden',
    creditsPerImage: 3,
    features: ['high-quality', 'prompt-adherence'],
    category: 'premium',
  },
  sdxl: {
    id: 'sdxl',
    name: 'Stable Diffusion XL',
    description:
      'Bewährte, stabile Bildgenerierung mit konsistenten Ergebnissen.',
    replicateId: 'stability-ai/sdxl',
    estimatedTime: '5-10 Sekunden',
    creditsPerImage: 2,
    features: ['stable', 'consistent'],
    category: 'standard',
  },

  // New models
  'imagen-4-fast': {
    id: 'imagen-4-fast',
    name: 'Google Imagen 4 Fast',
    description:
      'Extrem kostengünstige und schnelle Generierung. Ideal für hohe Volumen.',
    replicateId: 'google/imagen-4-fast:latest',
    estimatedTime: '2-5 Sekunden',
    creditsPerImage: 2,
    features: ['cost-effective', 'fast', 'safe', '2K-resolution'],
    category: 'budget',
  },
  'seedream-4': {
    id: 'seedream-4',
    name: 'ByteDance Seedream 4K',
    description:
      '4K Auflösung mit sequenzieller Batch-Generierung. Perfekt für Serien.',
    replicateId: 'bytedance/seedream-4',
    estimatedTime: '5-10 Sekunden',
    creditsPerImage: 3,
    features: ['4K', 'sequential', 'batch-processing', 'consistency'],
    category: 'premium',
  },
  'ideogram-v3-turbo': {
    id: 'ideogram-v3-turbo',
    name: 'Ideogram V3 Turbo',
    description:
      'Vielfältige künstlerische Stile mit automatischer Prompt-Optimierung.',
    replicateId: 'ideogram-ai/ideogram-v3-turbo:latest',
    estimatedTime: '5-10 Sekunden',
    creditsPerImage: 3,
    features: ['artistic-styles', 'magic-prompt', 'inpainting'],
    category: 'standard',
  },
  'qwen-image': {
    id: 'qwen-image',
    name: 'Qwen Image',
    description: 'Exzellentes Text-Rendering und komplexe Szenen. Open Source.',
    replicateId: 'qwen/qwen-image:latest',
    estimatedTime: '3-7 Sekunden',
    creditsPerImage: 2,
    features: ['text-rendering', 'H100-GPU', 'LoRA-support', 'open-source'],
    category: 'standard',
  },
  'sd-3.5-large-turbo': {
    id: 'sd-3.5-large-turbo',
    name: 'Stable Diffusion 3.5 Large Turbo',
    description: 'Schnelle, hochwertige Generierung mit feinen Details.',
    replicateId: 'stability-ai/stable-diffusion-3.5-large-turbo:latest',
    estimatedTime: '5-10 Sekunden',
    creditsPerImage: 4,
    features: ['fine-details', 'turbo-optimized', 'negative-prompts'],
    category: 'premium',
  },
  'imagen-4': {
    id: 'imagen-4',
    name: 'Google Imagen 4 Standard',
    description: 'Premium Google-Qualität mit verbesserter Typografie.',
    replicateId: 'google/imagen-4:latest',
    estimatedTime: '8-12 Sekunden',
    creditsPerImage: 4,
    features: ['google-quality', 'typography', '2K-resolution', 'safe'],
    category: 'premium',
  },
  'sd-3.5-medium': {
    id: 'sd-3.5-medium',
    name: 'Stable Diffusion 3.5 Medium',
    description: 'Ausgewogenes Preis-Leistungs-Verhältnis mit 2.5B Parametern.',
    replicateId: 'stability-ai/stable-diffusion-3.5-medium:latest',
    estimatedTime: '5-10 Sekunden',
    creditsPerImage: 3,
    features: ['balanced', 'MMDiT-X', 'webhook-support'],
    category: 'standard',
  },
  'nano-banana': {
    id: 'nano-banana',
    name: 'Google Nano Banana',
    description: 'Beste Charakterkonsistenz mit Multi-Turn-Editing und Fusion.',
    replicateId: 'google/nano-banana:latest',
    estimatedTime: '8-10 Sekunden',
    creditsPerImage: 4,
    features: [
      'character-consistency',
      'multi-turn-editing',
      'image-fusion',
      'SynthID',
    ],
    category: 'specialty',
  },
};

export const DEFAULT_IMAGE_MODEL: ImageModelId = 'seedream-4'; // 4K with image input support for consistent characters
