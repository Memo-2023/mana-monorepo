import { create } from 'zustand';
import { supabase } from '~/utils/supabase';

export interface Tag {
  id: string;
  name: string;
  color: string | null;
  created_at: string;
}

export interface ImageTag {
  id: string;
  image_id: string;
  tag_id: string;
  added_at: string;
  tag?: Tag;
}

interface TagStore {
  // State
  tags: Tag[];
  imageTags: Map<string, Tag[]>; // imageId -> tags
  selectedTags: string[]; // for filtering
  isLoading: boolean;
  error: string | null;

  // Actions - Tags
  fetchTags: () => Promise<void>;
  createTag: (name: string, color?: string) => Promise<Tag | null>;
  updateTag: (id: string, updates: Partial<Tag>) => Promise<boolean>;
  deleteTag: (id: string) => Promise<boolean>;
  
  // Actions - Image Tags
  fetchImageTags: (imageId: string) => Promise<void>;
  addTagsToImage: (imageId: string, tagIds: string[]) => Promise<boolean>;
  removeTagFromImage: (imageId: string, tagId: string) => Promise<boolean>;
  
  // Actions - Filtering
  toggleTagFilter: (tagId: string) => void;
  clearTagFilters: () => void;
  
  // Helpers
  getTagByName: (name: string) => Tag | undefined;
  getImageTags: (imageId: string) => Tag[];
}

export const useTagStore = create<TagStore>((set, get) => ({
  // Initial state
  tags: [],
  imageTags: new Map(),
  selectedTags: [],
  isLoading: false,
  error: null,

  // Fetch all tags
  fetchTags: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name');

      if (error) throw error;
      set({ tags: data || [], isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  // Create new tag
  createTag: async (name: string, color?: string) => {
    try {
      // Check if tag already exists
      const existing = get().getTagByName(name);
      if (existing) return existing;

      // Generate random color if not provided
      const tagColor = color || `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`;

      const { data, error } = await supabase
        .from('tags')
        .insert({ name: name.toLowerCase().trim(), color: tagColor })
        .select()
        .single();

      if (error) {
        // If unique constraint error, fetch existing tag
        if (error.code === '23505') {
          const { data: existingTag } = await supabase
            .from('tags')
            .select('*')
            .eq('name', name.toLowerCase().trim())
            .single();
          
          if (existingTag) {
            set(state => ({ tags: [...state.tags.filter(t => t.id !== existingTag.id), existingTag] }));
            return existingTag;
          }
        }
        throw error;
      }

      set(state => ({ tags: [...state.tags, data] }));
      return data;
    } catch (error: any) {
      set({ error: error.message });
      return null;
    }
  },

  // Update tag
  updateTag: async (id: string, updates: Partial<Tag>) => {
    try {
      const { error } = await supabase
        .from('tags')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        tags: state.tags.map(tag => 
          tag.id === id ? { ...tag, ...updates } : tag
        )
      }));
      return true;
    } catch (error: any) {
      set({ error: error.message });
      return false;
    }
  },

  // Delete tag
  deleteTag: async (id: string) => {
    try {
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        tags: state.tags.filter(tag => tag.id !== id),
        selectedTags: state.selectedTags.filter(tagId => tagId !== id),
        imageTags: new Map(
          Array.from(state.imageTags.entries()).map(([imageId, tags]) => [
            imageId,
            tags.filter(tag => tag.id !== id)
          ])
        )
      }));
      return true;
    } catch (error: any) {
      set({ error: error.message });
      return false;
    }
  },

  // Fetch tags for specific image
  fetchImageTags: async (imageId: string) => {
    try {
      const { data, error } = await supabase
        .from('image_tags')
        .select(`
          *,
          tag:tags(*)
        `)
        .eq('image_id', imageId);

      if (error) throw error;

      const tags = data?.map(it => it.tag).filter(Boolean) as Tag[] || [];
      
      set(state => {
        const newImageTags = new Map(state.imageTags);
        newImageTags.set(imageId, tags);
        return { imageTags: newImageTags };
      });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  // Add tags to image
  addTagsToImage: async (imageId: string, tagIds: string[]) => {
    try {
      // Prepare insert data
      const imageTagsData = tagIds.map(tagId => ({
        image_id: imageId,
        tag_id: tagId
      }));

      const { error } = await supabase
        .from('image_tags')
        .insert(imageTagsData);

      if (error) throw error;

      // Update local state
      const allTags = get().tags;
      const newTags = tagIds
        .map(id => allTags.find(t => t.id === id))
        .filter(Boolean) as Tag[];
      
      set(state => {
        const newImageTags = new Map(state.imageTags);
        const currentTags = newImageTags.get(imageId) || [];
        const uniqueTags = [...currentTags, ...newTags].filter(
          (tag, index, self) => index === self.findIndex(t => t.id === tag.id)
        );
        newImageTags.set(imageId, uniqueTags);
        return { imageTags: newImageTags };
      });

      return true;
    } catch (error: any) {
      set({ error: error.message });
      return false;
    }
  },

  // Remove tag from image
  removeTagFromImage: async (imageId: string, tagId: string) => {
    try {
      const { error } = await supabase
        .from('image_tags')
        .delete()
        .eq('image_id', imageId)
        .eq('tag_id', tagId);

      if (error) throw error;

      set(state => {
        const newImageTags = new Map(state.imageTags);
        const currentTags = newImageTags.get(imageId) || [];
        newImageTags.set(imageId, currentTags.filter(tag => tag.id !== tagId));
        return { imageTags: newImageTags };
      });

      return true;
    } catch (error: any) {
      set({ error: error.message });
      return false;
    }
  },

  // Toggle tag filter
  toggleTagFilter: (tagId: string) => {
    set(state => ({
      selectedTags: state.selectedTags.includes(tagId)
        ? state.selectedTags.filter(id => id !== tagId)
        : [...state.selectedTags, tagId]
    }));
  },

  // Clear all filters
  clearTagFilters: () => {
    set({ selectedTags: [] });
  },

  // Get tag by name
  getTagByName: (name: string) => {
    return get().tags.find(tag => 
      tag.name.toLowerCase() === name.toLowerCase().trim()
    );
  },

  // Get tags for image
  getImageTags: (imageId: string) => {
    return get().imageTags.get(imageId) || [];
  }
}));