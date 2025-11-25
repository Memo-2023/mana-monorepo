/**
 * Template-Service für Chat-Vorlagen
 */
import { supabase } from '../utils/supabase';

// Typdefinition für eine Vorlage
export interface Template {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  system_prompt: string;
  initial_question: string | null;
  model_id: string | null;
  color: string;
  is_default: boolean;
  document_mode: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Lädt alle Vorlagen eines Benutzers
 * @param userId Die ID des Benutzers
 * @returns Liste der Vorlagen
 */
export async function getTemplates(userId: string): Promise<Template[]> {
  try {
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .eq('user_id', userId)
      .order('name');

    if (error) {
      console.error('Fehler beim Laden der Vorlagen:', error);
      return [];
    }

    return data as Template[];
  } catch (error) {
    console.error('Fehler beim Laden der Vorlagen:', error);
    return [];
  }
}

/**
 * Lädt eine bestimmte Vorlage anhand ihrer ID
 * @param templateId Die ID der Vorlage
 * @returns Die Vorlage oder null, wenn nicht gefunden
 */
export async function getTemplateById(templateId: string): Promise<Template | null> {
  try {
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (error) {
      console.error('Fehler beim Laden der Vorlage:', error);
      return null;
    }

    return data as Template;
  } catch (error) {
    console.error('Fehler beim Laden der Vorlage:', error);
    return null;
  }
}

/**
 * Erstellt eine neue Vorlage
 * @param template Die zu erstellende Vorlage (ohne ID)
 * @returns Die erstellte Vorlage mit ID oder null bei Fehler
 */
export async function createTemplate(template: Omit<Template, 'id' | 'created_at' | 'updated_at'>): Promise<Template | null> {
  try {
    const { data, error } = await supabase
      .from('templates')
      .insert(template)
      .select()
      .single();

    if (error) {
      console.error('Fehler beim Erstellen der Vorlage:', error);
      return null;
    }

    return data as Template;
  } catch (error) {
    console.error('Fehler beim Erstellen der Vorlage:', error);
    return null;
  }
}

/**
 * Aktualisiert eine bestehende Vorlage
 * @param templateId Die ID der zu aktualisierenden Vorlage
 * @param updates Die zu aktualisierenden Felder
 * @returns true bei Erfolg, false bei Fehler
 */
export async function updateTemplate(
  templateId: string, 
  updates: Partial<Omit<Template, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('templates')
      .update(updates)
      .eq('id', templateId);

    if (error) {
      console.error('Fehler beim Aktualisieren der Vorlage:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Vorlage:', error);
    return false;
  }
}

/**
 * Löscht eine Vorlage
 * @param templateId Die ID der zu löschenden Vorlage
 * @returns true bei Erfolg, false bei Fehler
 */
export async function deleteTemplate(templateId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('templates')
      .delete()
      .eq('id', templateId);

    if (error) {
      console.error('Fehler beim Löschen der Vorlage:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Fehler beim Löschen der Vorlage:', error);
    return false;
  }
}

/**
 * Setzt eine Vorlage als Standard
 * @param templateId Die ID der Vorlage, die als Standard gesetzt werden soll
 * @param userId Die ID des Benutzers
 * @returns true bei Erfolg, false bei Fehler
 */
export async function setDefaultTemplate(templateId: string, userId: string): Promise<boolean> {
  try {
    // Zuerst alle Vorlagen des Benutzers auf nicht-Standard setzen
    await supabase
      .from('templates')
      .update({ is_default: false })
      .eq('user_id', userId);

    // Dann die ausgewählte Vorlage als Standard setzen
    const { error } = await supabase
      .from('templates')
      .update({ is_default: true })
      .eq('id', templateId)
      .eq('user_id', userId);

    if (error) {
      console.error('Fehler beim Setzen der Standard-Vorlage:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Fehler beim Setzen der Standard-Vorlage:', error);
    return false;
  }
}

/**
 * Holt die Standard-Vorlage des Benutzers
 * @param userId Die ID des Benutzers
 * @returns Die Standard-Vorlage oder null, wenn keine gefunden wurde
 */
export async function getDefaultTemplate(userId: string): Promise<Template | null> {
  try {
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .eq('user_id', userId)
      .eq('is_default', true)
      .single();

    if (error) {
      console.error('Fehler beim Laden der Standard-Vorlage:', error);
      return null;
    }

    return data as Template;
  } catch (error) {
    console.error('Fehler beim Laden der Standard-Vorlage:', error);
    return null;
  }
}