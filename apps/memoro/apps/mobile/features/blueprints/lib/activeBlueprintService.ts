import { getAuthenticatedClient } from '~/features/auth/lib/supabaseClient';
import { authService } from '~/features/auth/services/authService';

/**
 * Prüft, ob ein Blueprint für den aktuellen Nutzer aktiviert ist
 * 
 * @param blueprintId Die ID des Blueprints
 * @returns true, wenn der Blueprint aktiviert ist, sonst false
 */
export const isActiveBlueprintForUser = async (blueprintId: string): Promise<boolean> => {
  try {
    // Prüfe zuerst, ob der Nutzer authentifiziert ist
    const isAuthenticated = await authService.isAuthenticated();
    if (!isAuthenticated) {
      console.debug('Nutzer ist nicht authentifiziert');
      return false;
    }
    
    // Hole den aktuellen Nutzer aus dem Token
    const userData = await authService.getUserFromToken();
    
    if (!userData || !userData.id) {
      console.debug('Keine Nutzer-ID gefunden');
      return false;
    }
    
    const supabase = await getAuthenticatedClient();
    if (!supabase) {
      console.debug('Konnte keinen authentifizierten Client erstellen');
      return false;
    }
    
    // Prüfe, ob der Blueprint bereits aktiviert ist
    const { data, error } = await supabase
      .from('user_active_blueprints')
      .select('is_active')
      .eq('user_id', userData.id)
      .eq('blueprint_id', blueprintId)
      .single();
      
    if (error) {
      // Wenn der Fehler "No rows found" ist, bedeutet das, dass der Blueprint nicht aktiviert ist
      if (error.code === 'PGRST116') {
        return false;
      }
      
      console.debug('Datenbankfehler beim Prüfen des Blueprint-Status:', error);
      return false;
    }
    
    return data?.is_active ?? false;
  } catch (error) {
    console.debug('Fehler beim Prüfen des Blueprint-Status:', error);
    return false;
  }
};

/**
 * Aktiviert oder deaktiviert einen Blueprint für den aktuellen Nutzer
 * 
 * @param blueprintId Die ID des Blueprints
 * @param isActive true, um den Blueprint zu aktivieren, false, um ihn zu deaktivieren
 * @returns true bei Erfolg, false bei Fehler
 */
export const toggleBlueprintActive = async (blueprintId: string, isActive: boolean): Promise<boolean> => {
  try {
    // Prüfe zuerst, ob der Nutzer authentifiziert ist
    const isAuthenticated = await authService.isAuthenticated();
    if (!isAuthenticated) {
      console.debug('Nutzer ist nicht authentifiziert');
      return false;
    }
    
    // Hole den aktuellen Nutzer aus dem Token
    const userData = await authService.getUserFromToken();
    
    if (!userData || !userData.id) {
      console.debug('Keine Nutzer-ID gefunden');
      return false;
    }
    
    const supabase = await getAuthenticatedClient();
    if (!supabase) {
      console.debug('Konnte keinen authentifizierten Client erstellen');
      return false;
    }
    
    // Prüfe, ob der Blueprint bereits existiert
    const { data: existingData, error: queryError } = await supabase
      .from('user_active_blueprints')
      .select('id')
      .eq('user_id', userData.id)
      .eq('blueprint_id', blueprintId)
      .maybeSingle(); // Verwende maybeSingle statt single, um Fehler zu vermeiden
    
    if (queryError && queryError.code !== 'PGRST116') { // PGRST116 = No rows found
      console.debug('Fehler beim Abfragen des Blueprint-Status:', queryError);
      return false;
    }
      
    if (existingData?.id) {
      // Aktualisiere den bestehenden Eintrag
      const { error } = await supabase
        .from('user_active_blueprints')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('id', existingData.id);
      
      if (error) {
        console.debug('Fehler beim Aktualisieren des Blueprint-Status:', error);
        return false;
      }
      
      return true;
    } else {
      // Erstelle einen neuen Eintrag
      const { error } = await supabase
        .from('user_active_blueprints')
        .insert({
          user_id: userData.id,
          blueprint_id: blueprintId,
          is_active: isActive,
        });
      
      if (error) {
        console.debug('Fehler beim Erstellen des Blueprint-Status:', error);
        return false;
      }
      
      return true;
    }
  } catch (error) {
    console.debug('Fehler beim Aktivieren/Deaktivieren des Blueprints:', error);
    return false;
  }
};

/**
 * Ruft alle aktiven Blueprints für den aktuellen Nutzer ab
 * 
 * @returns Ein Array mit den IDs der aktiven Blueprints
 */
export const getActiveBlueprintsForUser = async (): Promise<string[]> => {
  try {
    // Prüfe zuerst, ob der Nutzer authentifiziert ist
    const isAuthenticated = await authService.isAuthenticated();
    if (!isAuthenticated) {
      console.debug('Nutzer ist nicht authentifiziert');
      return [];
    }
    
    // Hole den aktuellen Nutzer aus dem Token
    const userData = await authService.getUserFromToken();
    
    if (!userData || !userData.id) {
      console.debug('Keine Nutzer-ID gefunden');
      return [];
    }
    
    const supabase = await getAuthenticatedClient();
    if (!supabase) {
      console.debug('Konnte keinen authentifizierten Client erstellen');
      return [];
    }
    
    // Hole alle aktiven Blueprints
    const { data, error } = await supabase
      .from('user_active_blueprints')
      .select('blueprint_id')
      .eq('user_id', userData.id)
      .eq('is_active', true);
      
    if (error) {
      console.debug('Datenbankfehler beim Abrufen der aktiven Blueprints:', error);
      return [];
    }
    
    return data?.map(item => item.blueprint_id) || [];
  } catch (error) {
    console.debug('Fehler beim Abrufen der aktiven Blueprints:', error);
    return [];
  }
};
