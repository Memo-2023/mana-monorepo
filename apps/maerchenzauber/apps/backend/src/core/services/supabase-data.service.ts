import { Injectable } from '@nestjs/common';
import { SupabaseProvider } from '../../supabase/supabase.provider';

@Injectable()
export class SupabaseDataService {
  constructor(private supabaseProvider: SupabaseProvider) {}

  // Expose client for internal use
  get client() {
    return this.supabaseProvider.getClient();
  }

  // Character Methods - with optimized retrieval using JSONB
  async getCharacterById(id: string) {
    const supabase = this.supabaseProvider.getClient();

    const { data, error } = await supabase
      .from('characters')
      .select('*, images_data')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async getUserCharacters(userId: string) {
    const supabase = this.supabaseProvider.getClient();

    const { data, error } = await supabase
      .from('characters')
      .select('*, images_data')
      .eq('user_id', userId);

    if (error) throw error;
    return data;
  }

  async createCharacter(userId: string, characterData: any) {
    const supabase = this.supabaseProvider.getClient();

    // Initialize empty images_data array if not provided
    if (!characterData.images_data) {
      characterData.images_data = [];
    }

    const { data, error } = await supabase
      .from('characters')
      .insert([{ ...characterData, user_id: userId }])
      .select();

    if (error) throw error;
    return data[0];
  }

  async addCharacterImage(characterId: string, imageData: any) {
    const supabase = this.supabaseProvider.getClient();

    // Insert the new image
    const { data, error } = await supabase
      .from('character_images')
      .insert([{ ...imageData, character_id: characterId }])
      .select();

    if (error) throw error;

    // Now we need to update the JSONB field manually since we don't have triggers
    // Get all images for this character
    const { data: allImages, error: fetchError } = await supabase
      .from('character_images')
      .select('*')
      .eq('character_id', characterId);

    if (fetchError) throw fetchError;

    // Convert to JSONB format
    const imagesJson = allImages.map((img) => ({
      id: img.id,
      description: img.description,
      image_url: img.image_url,
    }));

    // Update the character's images_data field
    const { error: updateError } = await supabase
      .from('characters')
      .update({ images_data: imagesJson })
      .eq('id', characterId);

    if (updateError) throw updateError;

    return data[0];
  }

  // Story Methods - with optimized retrieval using JSONB
  async getStoryById(id: string) {
    const supabase = this.supabaseProvider.getClient();

    const { data, error } = await supabase
      .from('stories')
      .select('*, pages_data, characters_data')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async getUserStories(userId: string) {
    const supabase = this.supabaseProvider.getClient();

    const { data, error } = await supabase
      .from('stories')
      .select('*, pages_data, characters_data')
      .eq('user_id', userId);

    if (error) throw error;
    return data;
  }

  async createStory(userId: string, storyData: any) {
    const supabase = this.supabaseProvider.getClient();

    // Initialize empty JSONB arrays if not provided
    if (!storyData.pages_data) {
      storyData.pages_data = [];
    }

    if (!storyData.characters_data) {
      storyData.characters_data = [];
    }

    const { data, error } = await supabase
      .from('stories')
      .insert([{ ...storyData, user_id: userId }])
      .select();

    if (error) throw error;
    return data[0];
  }

  async addStoryPage(storyId: string, pageData: any) {
    const supabase = this.supabaseProvider.getClient();

    // Insert the new page
    const { data, error } = await supabase
      .from('story_pages')
      .insert([{ ...pageData, story_id: storyId }])
      .select();

    if (error) throw error;

    // Now we need to update the JSONB field manually since we don't have triggers
    // Get all pages for this story
    const { data: allPages, error: fetchError } = await supabase
      .from('story_pages')
      .select('*')
      .eq('story_id', storyId)
      .order('page_number');

    if (fetchError) throw fetchError;

    // Convert to JSONB format
    const pagesJson = allPages.map((page) => ({
      id: page.id,
      page_number: page.page_number,
      story_text: page.story_text,
      illustration_description: page.illustration_description,
      image_url: page.image_url,
    }));

    // Update the story's pages_data field
    const { error: updateError } = await supabase
      .from('stories')
      .update({ pages_data: pagesJson })
      .eq('id', storyId);

    if (updateError) throw updateError;

    return data[0];
  }

  async addStoryCharacter(storyId: string, characterData: any) {
    const supabase = this.supabaseProvider.getClient();

    // Insert the new character
    const { data, error } = await supabase
      .from('story_characters')
      .insert([{ ...characterData, story_id: storyId }])
      .select();

    if (error) throw error;

    // Now we need to update the JSONB field manually since we don't have triggers
    // Get all characters for this story
    const { data: allCharacters, error: fetchError } = await supabase
      .from('story_characters')
      .select('*')
      .eq('story_id', storyId);

    if (fetchError) throw fetchError;

    // Convert to JSONB format
    const charactersJson = allCharacters.map((char) => ({
      id: char.id,
      character_description: char.character_description,
      pages: char.pages,
    }));

    // Update the story's characters_data field
    const { error: updateError } = await supabase
      .from('stories')
      .update({ characters_data: charactersJson })
      .eq('id', storyId);

    if (updateError) throw updateError;

    return data[0];
  }

  // Update methods for JSONB fields since we don't have triggers

  async updateCharacterImagesJsonb(characterId: string) {
    const supabase = this.supabaseProvider.getClient();

    // Get all images for this character
    const { data: allImages, error: fetchError } = await supabase
      .from('character_images')
      .select('*')
      .eq('character_id', characterId);

    if (fetchError) throw fetchError;

    // Convert to JSONB format
    const imagesJson = allImages.map((img) => ({
      id: img.id,
      description: img.description,
      image_url: img.image_url,
    }));

    // Update the character's images_data field
    const { error: updateError } = await supabase
      .from('characters')
      .update({ images_data: imagesJson })
      .eq('id', characterId);

    if (updateError) throw updateError;

    return true;
  }

  async updateStoryPagesJsonb(storyId: string) {
    const supabase = this.supabaseProvider.getClient();

    // Get all pages for this story
    const { data: allPages, error: fetchError } = await supabase
      .from('story_pages')
      .select('*')
      .eq('story_id', storyId)
      .order('page_number');

    if (fetchError) throw fetchError;

    // Convert to JSONB format
    const pagesJson = allPages.map((page) => ({
      id: page.id,
      page_number: page.page_number,
      story_text: page.story_text,
      illustration_description: page.illustration_description,
      image_url: page.image_url,
    }));

    // Update the story's pages_data field
    const { error: updateError } = await supabase
      .from('stories')
      .update({ pages_data: pagesJson })
      .eq('id', storyId);

    if (updateError) throw updateError;

    return true;
  }

  async updateStoryCharactersJsonb(storyId: string) {
    const supabase = this.supabaseProvider.getClient();

    // Get all characters for this story
    const { data: allCharacters, error: fetchError } = await supabase
      .from('story_characters')
      .select('*')
      .eq('story_id', storyId);

    if (fetchError) throw fetchError;

    // Convert to JSONB format
    const charactersJson = allCharacters.map((char) => ({
      id: char.id,
      character_description: char.character_description,
      pages: char.pages,
    }));

    // Update the story's characters_data field
    const { error: updateError } = await supabase
      .from('stories')
      .update({ characters_data: charactersJson })
      .eq('id', storyId);

    if (updateError) throw updateError;

    return true;
  }

  // The service still supports direct access to the relational tables
  // for cases where more complex operations are needed

  async getStoryPages(storyId: string) {
    const supabase = this.supabaseProvider.getClient();

    const { data, error } = await supabase
      .from('story_pages')
      .select('*')
      .eq('story_id', storyId)
      .order('page_number');

    if (error) throw error;
    return data;
  }

  async getStoryCharacters(storyId: string) {
    const supabase = this.supabaseProvider.getClient();

    const { data, error } = await supabase
      .from('story_characters')
      .select('*')
      .eq('story_id', storyId);

    if (error) throw error;
    return data;
  }

  async getCharacterImages(characterId: string) {
    const supabase = this.supabaseProvider.getClient();

    const { data, error } = await supabase
      .from('character_images')
      .select('*')
      .eq('character_id', characterId);

    if (error) throw error;
    return data;
  }
}
