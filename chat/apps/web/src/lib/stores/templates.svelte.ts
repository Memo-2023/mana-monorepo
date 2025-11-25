/**
 * Templates Store - Manages template list using Svelte 5 runes
 */

import { templateService } from '$lib/services/template';
import type { Template, TemplateCreate, TemplateUpdate } from '@chat/types';

// State
let templates = $state<Template[]>([]);
let isLoading = $state(false);
let error = $state<string | null>(null);

export const templatesStore = {
  // Getters
  get templates() {
    return templates;
  },
  get isLoading() {
    return isLoading;
  },
  get error() {
    return error;
  },

  /**
   * Load templates for a user
   */
  async loadTemplates(userId: string) {
    isLoading = true;
    error = null;

    try {
      templates = await templateService.getTemplates(userId);
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load templates';
      templates = [];
    } finally {
      isLoading = false;
    }
  },

  /**
   * Create a new template
   */
  async createTemplate(template: TemplateCreate): Promise<Template | null> {
    error = null;

    try {
      const newTemplate = await templateService.createTemplate(template);
      if (newTemplate) {
        templates = [...templates, newTemplate].sort((a, b) => a.name.localeCompare(b.name));
      }
      return newTemplate;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to create template';
      return null;
    }
  },

  /**
   * Update a template
   */
  async updateTemplate(templateId: string, updates: TemplateUpdate): Promise<boolean> {
    error = null;

    try {
      const success = await templateService.updateTemplate(templateId, updates);
      if (success) {
        templates = templates
          .map((t) => (t.id === templateId ? { ...t, ...updates } : t))
          .sort((a, b) => a.name.localeCompare(b.name));
      }
      return success;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to update template';
      return false;
    }
  },

  /**
   * Delete a template
   */
  async deleteTemplate(templateId: string): Promise<boolean> {
    error = null;

    try {
      const success = await templateService.deleteTemplate(templateId);
      if (success) {
        templates = templates.filter((t) => t.id !== templateId);
      }
      return success;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to delete template';
      return false;
    }
  },

  /**
   * Set a template as default
   */
  async setDefaultTemplate(templateId: string, userId: string): Promise<boolean> {
    error = null;

    try {
      const success = await templateService.setDefaultTemplate(templateId, userId);
      if (success) {
        templates = templates.map((t) => ({
          ...t,
          is_default: t.id === templateId,
        }));
      }
      return success;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to set default template';
      return false;
    }
  },

  /**
   * Reset store
   */
  reset() {
    templates = [];
    error = null;
  },
};
