/**
 * Template Service - CRUD operations via Supabase
 */

import { createSupabaseBrowserClient } from './supabase';
import type { Template, TemplateCreate, TemplateUpdate } from '@chat/types';

let supabase: ReturnType<typeof createSupabaseBrowserClient> | null = null;

function getSupabase() {
  if (!supabase) {
    supabase = createSupabaseBrowserClient();
  }
  return supabase;
}

export const templateService = {
  /**
   * Get all templates for a user
   */
  async getTemplates(userId: string): Promise<Template[]> {
    const sb = getSupabase();

    const { data, error } = await sb
      .from('templates')
      .select('*')
      .eq('user_id', userId)
      .order('name');

    if (error) {
      console.error('Error loading templates:', error);
      return [];
    }

    return data as Template[];
  },

  /**
   * Get a single template by ID
   */
  async getTemplate(templateId: string): Promise<Template | null> {
    const sb = getSupabase();

    const { data, error } = await sb
      .from('templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (error) {
      console.error('Error loading template:', error);
      return null;
    }

    return data as Template;
  },

  /**
   * Get the default template for a user
   */
  async getDefaultTemplate(userId: string): Promise<Template | null> {
    const sb = getSupabase();

    const { data, error } = await sb
      .from('templates')
      .select('*')
      .eq('user_id', userId)
      .eq('is_default', true)
      .single();

    if (error) {
      console.error('Error loading default template:', error);
      return null;
    }

    return data as Template;
  },

  /**
   * Create a new template
   */
  async createTemplate(template: TemplateCreate): Promise<Template | null> {
    const sb = getSupabase();

    const { data, error } = await sb
      .from('templates')
      .insert(template)
      .select()
      .single();

    if (error) {
      console.error('Error creating template:', error);
      return null;
    }

    return data as Template;
  },

  /**
   * Update a template
   */
  async updateTemplate(templateId: string, updates: TemplateUpdate): Promise<boolean> {
    const sb = getSupabase();

    const { error } = await sb
      .from('templates')
      .update(updates)
      .eq('id', templateId);

    if (error) {
      console.error('Error updating template:', error);
      return false;
    }

    return true;
  },

  /**
   * Delete a template
   */
  async deleteTemplate(templateId: string): Promise<boolean> {
    const sb = getSupabase();

    const { error } = await sb.from('templates').delete().eq('id', templateId);

    if (error) {
      console.error('Error deleting template:', error);
      return false;
    }

    return true;
  },

  /**
   * Set a template as default
   */
  async setDefaultTemplate(templateId: string, userId: string): Promise<boolean> {
    const sb = getSupabase();

    // First, unset all defaults for this user
    await sb.from('templates').update({ is_default: false }).eq('user_id', userId);

    // Then set the selected template as default
    const { error } = await sb
      .from('templates')
      .update({ is_default: true })
      .eq('id', templateId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error setting default template:', error);
      return false;
    }

    return true;
  },
};
