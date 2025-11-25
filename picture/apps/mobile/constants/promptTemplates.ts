export type PromptTemplate = {
  id: string;
  name: string;
  category: 'portrait' | 'landscape' | 'product' | 'abstract' | 'architecture' | 'food';
  icon: string;
  template: string;
  example: string;
  keywords: string[];
};

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  // Portrait Templates
  {
    id: 'portrait_professional',
    name: 'Professionelles Portrait',
    category: 'portrait',
    icon: '👔',
    template: 'Professional portrait photo of {subject}, {style}, studio lighting, sharp focus, 8k, high quality',
    example: 'Professional portrait photo of a business woman, cinematic style, studio lighting, sharp focus, 8k, high quality',
    keywords: ['professional', 'portrait', 'studio lighting', 'sharp focus', '8k']
  },
  {
    id: 'portrait_artistic',
    name: 'Künstlerisches Portrait',
    category: 'portrait',
    icon: '🎨',
    template: 'Artistic portrait of {subject}, {style}, dramatic lighting, creative composition, highly detailed',
    example: 'Artistic portrait of a musician, oil painting style, dramatic lighting, creative composition, highly detailed',
    keywords: ['artistic', 'portrait', 'dramatic lighting', 'creative', 'detailed']
  },
  {
    id: 'portrait_cinematic',
    name: 'Filmisches Portrait',
    category: 'portrait',
    icon: '🎬',
    template: 'Cinematic portrait of {subject}, {mood} atmosphere, film grain, depth of field, professional color grading',
    example: 'Cinematic portrait of a detective, noir atmosphere, film grain, depth of field, professional color grading',
    keywords: ['cinematic', 'portrait', 'film grain', 'depth of field', 'atmospheric']
  },

  // Landscape Templates
  {
    id: 'landscape_nature',
    name: 'Naturlandschaft',
    category: 'landscape',
    icon: '🏞️',
    template: '{location} landscape, {time_of_day}, {weather}, natural colors, wide angle, highly detailed, 8k',
    example: 'Mountain landscape, golden hour, clear sky, natural colors, wide angle, highly detailed, 8k',
    keywords: ['landscape', 'nature', 'wide angle', 'detailed', 'natural']
  },
  {
    id: 'landscape_fantasy',
    name: 'Fantasy-Landschaft',
    category: 'landscape',
    icon: '🏰',
    template: 'Fantasy {location}, {mood} atmosphere, magical elements, {style}, vibrant colors, epic composition',
    example: 'Fantasy forest, mystical atmosphere, magical elements, digital art style, vibrant colors, epic composition',
    keywords: ['fantasy', 'landscape', 'magical', 'vibrant', 'epic']
  },
  {
    id: 'landscape_urban',
    name: 'Stadtlandschaft',
    category: 'landscape',
    icon: '🌃',
    template: '{city_type} cityscape, {time_of_day}, {weather}, urban photography, architectural details, high contrast',
    example: 'Modern cityscape, blue hour, light rain, urban photography, architectural details, high contrast',
    keywords: ['cityscape', 'urban', 'architecture', 'modern', 'high contrast']
  },

  // Product Templates
  {
    id: 'product_minimal',
    name: 'Minimalistisches Produkt',
    category: 'product',
    icon: '📦',
    template: '{product} on {background}, minimal style, clean composition, soft lighting, commercial photography, high quality',
    example: 'Smartphone on white background, minimal style, clean composition, soft lighting, commercial photography, high quality',
    keywords: ['product', 'minimal', 'clean', 'commercial', 'professional']
  },
  {
    id: 'product_lifestyle',
    name: 'Lifestyle Produkt',
    category: 'product',
    icon: '✨',
    template: '{product} in {setting}, lifestyle photography, natural lighting, {mood} atmosphere, realistic, detailed',
    example: 'Coffee cup in modern kitchen, lifestyle photography, natural lighting, cozy atmosphere, realistic, detailed',
    keywords: ['product', 'lifestyle', 'natural', 'realistic', 'atmospheric']
  },

  // Abstract Templates
  {
    id: 'abstract_geometric',
    name: 'Geometrisch',
    category: 'abstract',
    icon: '🔷',
    template: 'Abstract geometric composition, {colors}, {style}, {mood}, minimalist, high resolution',
    example: 'Abstract geometric composition, vibrant blue and orange, modern style, energetic mood, minimalist, high resolution',
    keywords: ['abstract', 'geometric', 'minimalist', 'modern', 'vibrant']
  },
  {
    id: 'abstract_fluid',
    name: 'Fließend',
    category: 'abstract',
    icon: '🌊',
    template: 'Abstract fluid art, {colors}, flowing shapes, {style}, smooth gradients, mesmerizing',
    example: 'Abstract fluid art, purple and gold, flowing shapes, liquid style, smooth gradients, mesmerizing',
    keywords: ['abstract', 'fluid', 'flowing', 'gradients', 'smooth']
  },

  // Architecture Templates
  {
    id: 'architecture_modern',
    name: 'Moderne Architektur',
    category: 'architecture',
    icon: '🏢',
    template: 'Modern {building_type}, {style} architecture, {time_of_day}, clean lines, geometric, professional photography',
    example: 'Modern office building, minimalist architecture, golden hour, clean lines, geometric, professional photography',
    keywords: ['architecture', 'modern', 'geometric', 'professional', 'clean']
  },
  {
    id: 'architecture_interior',
    name: 'Innenarchitektur',
    category: 'architecture',
    icon: '🛋️',
    template: '{room_type} interior, {style} design, {lighting}, spacious, detailed textures, architectural photography',
    example: 'Living room interior, scandinavian design, natural lighting, spacious, detailed textures, architectural photography',
    keywords: ['interior', 'architecture', 'design', 'detailed', 'spacious']
  },

  // Food Templates
  {
    id: 'food_gourmet',
    name: 'Gourmet Essen',
    category: 'food',
    icon: '🍽️',
    template: 'Gourmet {dish}, professional food photography, {plating_style}, dramatic lighting, shallow depth of field, appetizing',
    example: 'Gourmet pasta dish, professional food photography, elegant plating, dramatic lighting, shallow depth of field, appetizing',
    keywords: ['food', 'gourmet', 'professional', 'appetizing', 'dramatic']
  },
  {
    id: 'food_rustic',
    name: 'Rustikales Essen',
    category: 'food',
    icon: '🥖',
    template: 'Rustic {dish}, natural food photography, {setting}, warm lighting, authentic, homemade feel',
    example: 'Rustic bread and cheese, natural food photography, wooden table, warm lighting, authentic, homemade feel',
    keywords: ['food', 'rustic', 'natural', 'authentic', 'warm']
  },
];

export type StyleKeyword = {
  id: string;
  label: string;
  value: string;
  category: 'style' | 'mood' | 'lighting' | 'quality' | 'camera';
  color: string;
};

export const STYLE_KEYWORDS: StyleKeyword[] = [
  // Styles
  { id: 's1', label: 'Fotorealistisch', value: 'photorealistic', category: 'style', color: '#3b82f6' },
  { id: 's2', label: 'Digital Art', value: 'digital art style', category: 'style', color: '#3b82f6' },
  { id: 's3', label: 'Ölgemälde', value: 'oil painting', category: 'style', color: '#3b82f6' },
  { id: 's4', label: 'Aquarell', value: 'watercolor', category: 'style', color: '#3b82f6' },
  { id: 's5', label: 'Anime', value: 'anime style', category: 'style', color: '#3b82f6' },
  { id: 's6', label: '3D Render', value: '3d render', category: 'style', color: '#3b82f6' },
  { id: 's7', label: 'Sketch', value: 'pencil sketch', category: 'style', color: '#3b82f6' },
  { id: 's8', label: 'Minimalistisch', value: 'minimalist style', category: 'style', color: '#3b82f6' },

  // Moods
  { id: 'm1', label: 'Dramatisch', value: 'dramatic atmosphere', category: 'mood', color: '#8b5cf6' },
  { id: 'm2', label: 'Gemütlich', value: 'cozy atmosphere', category: 'mood', color: '#8b5cf6' },
  { id: 'm3', label: 'Mystisch', value: 'mystical mood', category: 'mood', color: '#8b5cf6' },
  { id: 'm4', label: 'Energetisch', value: 'energetic mood', category: 'mood', color: '#8b5cf6' },
  { id: 'm5', label: 'Ruhig', value: 'peaceful atmosphere', category: 'mood', color: '#8b5cf6' },
  { id: 'm6', label: 'Düster', value: 'dark moody', category: 'mood', color: '#8b5cf6' },

  // Lighting
  { id: 'l1', label: 'Golden Hour', value: 'golden hour lighting', category: 'lighting', color: '#f59e0b' },
  { id: 'l2', label: 'Studio', value: 'studio lighting', category: 'lighting', color: '#f59e0b' },
  { id: 'l3', label: 'Natürlich', value: 'natural lighting', category: 'lighting', color: '#f59e0b' },
  { id: 'l4', label: 'Neon', value: 'neon lighting', category: 'lighting', color: '#f59e0b' },
  { id: 'l5', label: 'Weiches Licht', value: 'soft diffused lighting', category: 'lighting', color: '#f59e0b' },
  { id: 'l6', label: 'Gegenlicht', value: 'backlit', category: 'lighting', color: '#f59e0b' },

  // Quality
  { id: 'q1', label: '8K', value: '8k resolution', category: 'quality', color: '#10b981' },
  { id: 'q2', label: 'Hochdetailliert', value: 'highly detailed', category: 'quality', color: '#10b981' },
  { id: 'q3', label: 'Scharfer Fokus', value: 'sharp focus', category: 'quality', color: '#10b981' },
  { id: 'q4', label: 'Ultra Realistisch', value: 'ultra realistic', category: 'quality', color: '#10b981' },
  { id: 'q5', label: 'Masterpiece', value: 'masterpiece', category: 'quality', color: '#10b981' },

  // Camera
  { id: 'c1', label: 'Weitwinkel', value: 'wide angle lens', category: 'camera', color: '#ef4444' },
  { id: 'c2', label: 'Makro', value: 'macro photography', category: 'camera', color: '#ef4444' },
  { id: 'c3', label: 'Bokeh', value: 'shallow depth of field, bokeh', category: 'camera', color: '#ef4444' },
  { id: 'c4', label: 'Vogelperspektive', value: 'aerial view', category: 'camera', color: '#ef4444' },
  { id: 'c5', label: 'Low Angle', value: 'low angle shot', category: 'camera', color: '#ef4444' },
];

export const CATEGORY_LABELS = {
  style: 'Stil',
  mood: 'Stimmung',
  lighting: 'Beleuchtung',
  quality: 'Qualität',
  camera: 'Kamera',
};

export const TEMPLATE_CATEGORY_LABELS = {
  portrait: 'Portrait',
  landscape: 'Landschaft',
  product: 'Produkt',
  abstract: 'Abstrakt',
  architecture: 'Architektur',
  food: 'Essen',
};
