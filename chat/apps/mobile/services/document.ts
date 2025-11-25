/**
 * Document-Service für die Verwaltung von Dokumenten im Dokumentmodus
 */
import { supabase } from '../utils/supabase';

// Typdefinition für ein Dokument
export interface Document {
  id: string;
  conversation_id: string;
  version: number;
  content: string;
  created_at: string;
  updated_at: string;
}

/**
 * Erstellt ein neues Dokument in einer Konversation
 * @param conversationId Die ID der Konversation
 * @param content Der Inhalt des Dokuments
 * @returns Das erstellte Dokument oder null bei Fehler
 */
export async function createDocument(
  conversationId: string,
  content: string
): Promise<Document | null> {
  try {
    console.log(`Erstelle Dokument für Konversation ${conversationId} mit Inhalt: ${content.substring(0, 50)}...`);
    
    const { data, error } = await supabase
      .from('documents')
      .insert({
        conversation_id: conversationId,
        version: 1, // Initiale Version ist immer 1
        content,
      })
      .select()
      .single();

    if (error) {
      console.error('Fehler beim Erstellen des Dokuments:', error);
      console.error('Vollständiger Fehler:', JSON.stringify(error));
      return null;
    }

    console.log('Dokument erfolgreich erstellt:', data);
    return data as Document;
  } catch (error) {
    console.error('Fehler beim Erstellen des Dokuments:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message, error.stack);
    }
    return null;
  }
}

/**
 * Erstellt eine neue Version eines Dokuments
 * @param conversationId Die ID der Konversation
 * @param content Der neue Inhalt des Dokuments
 * @returns Das erstellte Dokument oder null bei Fehler
 */
export async function createDocumentVersion(
  conversationId: string,
  content: string
): Promise<Document | null> {
  try {
    // Hole die aktuelle höchste Version
    const { data: latestVersionData, error: versionError } = await supabase
      .from('documents')
      .select('version')
      .eq('conversation_id', conversationId)
      .order('version', { ascending: false })
      .limit(1)
      .single();

    if (versionError) {
      console.error('Fehler beim Laden der letzten Dokumentversion:', versionError);
      return null;
    }

    const newVersion = (latestVersionData?.version || 0) + 1;

    // Erstelle eine neue Dokumentversion
    const { data, error } = await supabase
      .from('documents')
      .insert({
        conversation_id: conversationId,
        version: newVersion,
        content,
      })
      .select()
      .single();

    if (error) {
      console.error('Fehler beim Erstellen der neuen Dokumentversion:', error);
      return null;
    }

    return data as Document;
  } catch (error) {
    console.error('Fehler beim Erstellen der neuen Dokumentversion:', error);
    return null;
  }
}

/**
 * Holt die aktuellste Version eines Dokuments für eine Konversation
 * @param conversationId Die ID der Konversation
 * @returns Das aktuellste Dokument oder null, wenn nicht gefunden
 */
export async function getLatestDocument(conversationId: string): Promise<Document | null> {
  try {
    console.log(`Lade neuestes Dokument für Konversation ${conversationId}`);
    
    // Einfache Abfrage ohne Cache-Busting
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('version', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('Fehler beim Laden des aktuellen Dokuments:', error);
      if (error.code === 'PGRST116') {
        console.log('Kein Dokument gefunden (PGRST116)');
      }
      return null;
    }

    console.log(`Neuestes Dokument gefunden: Version ${data.version}, ID ${data.id}`);
    return data as Document;
  } catch (error) {
    console.error('Fehler beim Laden des aktuellen Dokuments:', error);
    return null;
  }
}

/**
 * Lädt alle Versionen eines Dokuments für eine Konversation
 * @param conversationId Die ID der Konversation
 * @returns Eine Liste aller Dokumentversionen
 */
export async function getAllDocumentVersions(conversationId: string): Promise<Document[]> {
  try {
    console.log(`Lade alle Dokumentversionen für Konversation ${conversationId}`);
    
    // Einfache Abfrage ohne Cache-Busting (das verursacht Probleme)
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('version', { ascending: false });

    if (error) {
      console.error('Fehler beim Laden der Dokumentversionen:', error);
      return [];
    }

    console.log(`${data?.length || 0} Dokumentversionen geladen`);
    
    // Detaillierte Infos zur Fehlersuche
    if (data && data.length > 0) {
      console.log(`Erstes Dokument: ID=${data[0].id}, Version=${data[0].version}`);
    } else {
      console.log('Keine Dokumente gefunden');
    }
    
    return data as Document[];
  } catch (error) {
    console.error('Fehler beim Laden der Dokumentversionen:', error);
    return [];
  }
}

/**
 * Prüft, ob für eine Konversation ein Dokument existiert
 * @param conversationId Die ID der Konversation
 * @returns true, wenn ein Dokument existiert, sonst false
 */
export async function hasDocument(conversationId: string): Promise<boolean> {
  try {
    const { count, error } = await supabase
      .from('documents')
      .select('id', { count: 'exact', head: true })
      .eq('conversation_id', conversationId);

    if (error) {
      console.error('Fehler beim Prüfen auf Dokument:', error);
      return false;
    }

    return (count || 0) > 0;
  } catch (error) {
    console.error('Fehler beim Prüfen auf Dokument:', error);
    return false;
  }
}

/**
 * Löscht eine spezifische Dokumentversion
 * @param documentId Die ID des zu löschenden Dokuments
 * @returns true, wenn erfolgreich gelöscht, sonst false
 */
export async function deleteDocumentVersion(documentId: string): Promise<boolean> {
  try {
    console.log(`=== LÖSCH-OPERATION GESTARTET FÜR DOKUMENT ID ${documentId} ===`);
    
    // Prüfe zuerst, ob das Dokument existiert
    const { data: existingData, error: checkError } = await supabase
      .from('documents')
      .select('id')
      .eq('id', documentId)
      .single();
      
    if (checkError) {
      console.error('Fehler beim Prüfen, ob das Dokument existiert:', checkError);
      console.error('Details:', JSON.stringify(checkError));
      return false;
    }
    
    if (!existingData) {
      console.error('Dokument nicht gefunden:', documentId);
      return false;
    }
    
    console.log('Dokument gefunden, führe Löschung durch...');
    
    // Führe die eigentliche Löschung durch
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId);
      
    if (error) {
      console.error('Fehler beim Löschen der Dokumentversion:', error);
      console.error('Vollständige Fehlermeldung:', JSON.stringify(error));
      return false;
    }
    
    console.log(`=== DOKUMENT ${documentId} ERFOLGREICH GELÖSCHT ===`);
    return true;
  } catch (error) {
    console.error('Unerwarteter Fehler beim Löschen der Dokumentversion:', error);
    if (error instanceof Error) {
      console.error('Fehlerstack:', error.stack);
    }
    return false;
  }
}