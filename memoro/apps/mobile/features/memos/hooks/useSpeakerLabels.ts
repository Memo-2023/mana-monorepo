import { useCallback } from 'react';
import { Alert } from 'react-native';
import { getAuthenticatedClient } from '~/features/auth/lib/supabaseClient';

// Type definitions
interface MemoData {
  id: string;
  metadata?: {
    speakerLabels?: Record<string, string>;
    [key: string]: any;
  };
  source?: {
    speakers?: Record<string, Array<{text: string; offset?: number; duration?: number}>>;
    additional_recordings?: Array<{
      speakers?: Record<string, Array<{text: string; offset?: number; duration?: number}>>;
    }>;
  };
}

interface SpeakerMappingInput {
  id: string;
  label: string;
}

interface SpeakerLabelsState {
  speakerMappings: Record<string, string>;
}

interface SpeakerLabelsActions {
  getSpeakerIds: () => string[];
  handleLabelSpeakersPress: () => void;
  handleUpdateSpeakerLabels: (speakerMappings: SpeakerMappingInput[]) => Promise<void>;
}

interface SpeakerLabelsHookParams {
  memo: MemoData | null;
  memoId: string | undefined;
  speakerMappings: Record<string, string>;
  setSpeakerMappings: (mappings: Record<string, string>) => void;
  setMemo: (memo: MemoData) => void;
  setIsSpeakerLabelModalVisible: (visible: boolean) => void;
  updateLoadingState?: (key: string, value: boolean) => void;
  onSuccess?: () => void;
}

export function useSpeakerLabels({
  memo,
  memoId,
  speakerMappings,
  setSpeakerMappings,
  setMemo,
  setIsSpeakerLabelModalVisible,
  updateLoadingState,
  onSuccess
}: SpeakerLabelsHookParams): SpeakerLabelsState & SpeakerLabelsActions {

  /**
   * Sammelt alle Sprecher-IDs aus dem Memo, sowohl aus dem Haupttranskript als auch aus additional_recordings
   */
  const getSpeakerIds = useCallback((): string[] => {
    const speakerIds = new Set<string>();
    
    // Sprecher aus dem Haupttranskript hinzufügen
    if (memo?.source?.speakers) {
      Object.keys(memo.source.speakers).forEach(id => speakerIds.add(id));
    }
    
    // Sprecher aus additional_recordings hinzufügen
    memo?.source?.additional_recordings?.forEach((recording, index) => {
      if (recording.speakers) {
        Object.keys(recording.speakers).forEach(id => {
          // Die speaker IDs in additional_recordings sollten bereits das Präfix haben
          // Falls nicht (für alte Daten), fügen wir es hier hinzu
          if (!id.startsWith('rec') && !id.includes('_speaker')) {
            // Alte Daten: Füge Präfix hinzu um Konflikte zu vermeiden
            speakerIds.add(`rec${index}_${id}`);
          } else {
            // Neue Daten: Verwende die ID wie sie ist
            speakerIds.add(id);
          }
        });
      }
    });
    
    return Array.from(speakerIds);
  }, [memo]);

  /**
   * Öffnet das Speaker Label Modal
   */
  const handleLabelSpeakersPress = useCallback(() => {
    console.debug('Opening speaker label modal for memo:', memoId);
    
    // Debug-Ausgabe der Memo-Struktur
    console.debug('Memo source structure:', memo?.source);
    
    // Initialisiere die Sprecher-Mappings mit den vorhandenen Werten oder Standardwerten
    const initialMappings = { ...speakerMappings };
    setIsSpeakerLabelModalVisible(true);
  }, [memoId, memo?.source, speakerMappings, setIsSpeakerLabelModalVisible]);

  /**
   * Aktualisiert die Namen der Sprecher im Transkript und speichert die Änderungen in der Datenbank.
   */
  const handleUpdateSpeakerLabels = useCallback(async (speakerMappings: SpeakerMappingInput[]) => {
    if (!memo || !memoId) {
      console.debug('Kein Memo zum Bearbeiten vorhanden');
      return;
    }
    
    try {
      // Use updateLoadingState if available, otherwise fallback to a generic loading approach
      if (updateLoadingState) {
        updateLoadingState('critical', true);
      }
      
      // Konvertiere das Array in ein Record-Objekt für einfacheren Zugriff
      const mappingsRecord: Record<string, string> = {};
      speakerMappings.forEach(mapping => {
        mappingsRecord[mapping.id] = mapping.label;
      });
      
      // Speichere die Mappings im lokalen State
      setSpeakerMappings(mappingsRecord);
      
      // Hole den authentifizierten Supabase-Client
      const supabase = await getAuthenticatedClient();
      
      // Speichere die Sprecher-Mappings in den Metadaten des Memos
      const updatedMetadata = {
        ...memo.metadata,
        speakerLabels: mappingsRecord
      };
      
      // Aktualisiere das Memo in der Datenbank
      const { data, error } = await supabase
        .from('memos')
        .update({
          metadata: updatedMetadata,
          updated_at: new Date().toISOString()
        })
        .eq('id', memoId)
        .select()
        .single();
      
      if (error) {
        console.debug('Fehler beim Aktualisieren der Sprecher-Labels:', error.message);
        Alert.alert('Fehler', 'Die Sprecher-Namen konnten nicht gespeichert werden.');
        return;
      }
      
      console.debug('Sprecher-Labels erfolgreich aktualisiert');
      
      // Aktualisiere das lokale Memo-Objekt
      setMemo({
        ...memo,
        metadata: updatedMetadata
      });
      
      // Zeige eine Erfolgsmeldung an (falls callback bereitgestellt)
      if (onSuccess) {
        onSuccess();
      } else {
        // Fallback zu System Alert wenn kein callback
        Alert.alert('Erfolg', 'Die Sprecher-Namen wurden erfolgreich aktualisiert.');
      }
      
      // Schließe das Modal automatisch
      setIsSpeakerLabelModalVisible(false);
      
    } catch (error) {
      console.debug('Fehler bei der Aktualisierung der Sprecher-Labels:', error);
      Alert.alert('Fehler', 'Bei der Aktualisierung der Sprecher-Namen ist ein Fehler aufgetreten.');
    } finally {
      if (updateLoadingState) {
        updateLoadingState('critical', false);
      }
    }
  }, [memo, memoId, setSpeakerMappings, setMemo, setIsSpeakerLabelModalVisible, updateLoadingState, onSuccess]);

  return {
    // State (passed through from parent)
    speakerMappings,
    
    // Actions
    getSpeakerIds,
    handleLabelSpeakersPress,
    handleUpdateSpeakerLabels,
  };
}