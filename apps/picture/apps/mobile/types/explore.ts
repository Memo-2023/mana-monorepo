import { Tag } from '~/store/tagStore';

export type Creator = {
  id: string;
  username: string | null;
  avatar_url: string | null;
};

export type ExploreImageItem = {
  id: string;
  public_url: string | null;
  prompt: string;
  created_at: string;
  is_favorite: boolean;
  user_id: string;
  model?: string;
  tags?: Tag[];
  creator?: Creator;
  likes_count?: number;
  user_has_liked?: boolean;
  blurhash?: string | null;
};

export type SortMode = 'recent' | 'popular' | 'trending';
