/**
 * App Configuration Types
 *
 * Defines the configuration structure for each content app
 */

import type { ContentItem } from './index';

/**
 * Content type identifier
 */
export type ContentType = 'quote' | 'proverb' | 'poem' | 'speech' | 'fable' | 'thought';

/**
 * Color configuration for the app
 */
export interface AppColors {
  primary: string;
  secondary?: string;
  accent?: string;
  background?: string;
  surface?: string;
  text?: string;
}

/**
 * Feature flags for the app
 */
export interface AppFeatures {
  favorites?: boolean;
  lists?: boolean;
  sharing?: boolean;
  search?: boolean;
  filters?: boolean;
  authors?: boolean;
  categories?: boolean;
  tags?: boolean;
  dailyContent?: boolean;
  notifications?: boolean;
  widgets?: boolean;
  cloudSync?: boolean;
  premium?: boolean;
}

/**
 * Content display configuration
 */
export interface ContentDisplayConfig {
  showAuthor?: boolean;
  showDate?: boolean;
  showSource?: boolean;
  showCategory?: boolean;
  showTags?: boolean;
  cardStyle?: 'minimal' | 'detailed' | 'magazine';
  swipeDirection?: 'horizontal' | 'vertical';
}

/**
 * App metadata
 */
export interface AppMetadata {
  name: string;
  displayName: string;
  description: string;
  version: string;
  author?: string;
  website?: string;
  icon?: string;
  primaryLanguage: string;
  supportedLanguages: string[];
}

/**
 * Main App Configuration
 */
export interface AppConfig<TContent extends ContentItem = ContentItem> {
  // Basic Info
  metadata: AppMetadata;

  // Content Type
  contentType: ContentType;
  contentLabel: {
    singular: string;
    plural: string;
  };
  authorLabel?: {
    singular: string;
    plural: string;
  };

  // Branding
  colors: AppColors;

  // Features
  features: AppFeatures;

  // Display
  display: ContentDisplayConfig;

  // Custom fields (app-specific)
  custom?: Record<string, any>;
}

/**
 * Navigation configuration
 */
export interface NavigationConfig {
  tabs: {
    id: string;
    label: string;
    icon: string;
    route: string;
    enabled: boolean;
  }[];
  showTabBar?: boolean;
  tabBarStyle?: 'ios' | 'android' | 'custom';
}

/**
 * Complete app configuration including navigation
 */
export interface FullAppConfig<TContent extends ContentItem = ContentItem> extends AppConfig<TContent> {
  navigation: NavigationConfig;
}
