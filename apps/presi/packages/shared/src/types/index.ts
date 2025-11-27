/**
 * Presi Shared Types
 */

export interface Deck {
  id: string;
  userId: string;
  title: string;
  description?: string;
  themeId?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Slide {
  id: string;
  deckId: string;
  order: number;
  content: SlideContent;
  createdAt: string;
}

export interface SlideContent {
  type: 'title' | 'content' | 'image' | 'split';
  title?: string;
  subtitle?: string;
  body?: string;
  imageUrl?: string;
  bulletPoints?: string[];
}

export interface Theme {
  id: string;
  name: string;
  colors: ThemeColors;
  fonts: ThemeFonts;
  isDefault: boolean;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  accent: string;
}

export interface ThemeFonts {
  heading: string;
  body: string;
}

export interface SharedDeck {
  id: string;
  deckId: string;
  shareCode: string;
  expiresAt?: string;
  createdAt: string;
}

// DTOs
export interface CreateDeckDto {
  title: string;
  description?: string;
  themeId?: string;
}

export interface UpdateDeckDto {
  title?: string;
  description?: string;
  themeId?: string;
  isPublic?: boolean;
}

export interface CreateSlideDto {
  content: SlideContent;
  order?: number;
}

export interface UpdateSlideDto {
  content?: SlideContent;
  order?: number;
}

export interface ReorderSlidesDto {
  slides: { id: string; order: number }[];
}
