/**
 * Story Types for Märchenzauber Web App
 */

export interface StoryPage {
  image: string;
  pageNumber: number;
  story: string;
  blur_hash?: string;
}

export interface Story {
  id: string;
  characterId: string;
  characterName: string;
  characterImageUrl?: string;
  createdAt: string;
  prompt: string;
  pages: StoryPage[];
  text: string;
  user_id: string;
  title: string;
  archived?: boolean;
  is_favorite?: boolean;
  visibility?: 'private' | 'public' | 'central' | 'featured';
  is_published?: boolean;
  published_at?: string;
  published_by?: string;
  featured_score?: number;
  metadata?: {
    version?: number;
    language?: string;
    age_group?: string;
    author?: string;
    illustrator?: string;
    [key: string]: unknown;
  };
  is_central?: boolean;
  collection_position?: number;
  // Voting fields for public stories
  vote_count?: number;
  user_vote?: 'like' | 'love' | 'star' | null;
}

export interface StoryCollection {
  id: string;
  slug: string;
  name: string;
  description?: string;
  type: 'manual' | 'automatic' | 'contest' | 'seasonal';
  is_active: boolean;
  sort_order: number;
  config?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface StoriesResponse {
  data: Story[];
  error?: string;
}

export interface PublicStoriesResponse {
  stories: Story[];
  hasMore: boolean;
  total: number;
}

export type StoryFilter = 'all' | 'favorites' | string; // string for character ID filter

export interface CreateStoryRequest {
  storyDescription: string;
  characters: string[];
  language?: string;
}
