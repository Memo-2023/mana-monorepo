import { Tag } from '~/store/tagStore';

export type ImageItem = {
  id: string;
  public_url: string | null;
  prompt: string;
  created_at: string;
  is_favorite: boolean;
  model?: string;
  tags?: Tag[];
  blurhash?: string | null;
};

export type FilterMode = 'all' | 'favorites';

export type ViewMode = 'single' | 'grid3' | 'grid5';
