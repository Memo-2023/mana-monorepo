import { useState, useEffect } from 'react';
import { StyleSheet, View, Alert } from 'react-native';
import { useTheme } from '~/features/theme/ThemeProvider';
import { useTranslation } from 'react-i18next';
import Text from '~/components/atoms/Text';
import AudioPlayer from '~/components/organisms/AudioPlayer';
import TranscriptDisplay from '~/components/organisms/TranscriptDisplay';
import { getAuthenticatedClient } from '~/features/auth/lib/supabaseClient';

interface AdditionalRecordingProps {
  recording: {
    path: string;
    type: string;
    timestamp: string;
    status: string;
    transcript?: string;
    speakers?: Record<string, Array<{text: string; offset?: number; duration?: number}>>;    
    languages?: string[];
    memo_metadata?: {
      original_title?: string;
      display_title?: string;
      display_date?: string;
      original_created_at?: string;
      combine_index?: number;
    };
    utterances?: Array<{ text: string; speakerId: string; offset: number; duration: number }>;
  };
  index: number;
  isEditMode: boolean;
  getSignedUrl: (filePath: string) => Promise<string | null>;
  containerStyle?: object;
  speakerLabels?: Record<string, string>;
  handleUpdateSpeakerLabels?: (speakerMappings: Array<{id: string; label: string}>) => Promise<void>;
  setIsSpeakerLabelModalVisible?: (visible: boolean) => void;
  memo?: any; // Memo object for transcript updates
  memoId?: string;
  onDelete?: () => void;
}

export default function AdditionalRecording({
  recording,
  index,
  isEditMode,
  getSignedUrl,
  containerStyle,
  speakerLabels,
  handleUpdateSpeakerLabels,
  setIsSpeakerLabelModalVisible,
  memo,
  memoId,
  onDelete
}: AdditionalRecordingProps) {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  
  // Formatiere das Datum für die Anzeige
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  // Prüfe ob es sich um ein kombiniertes Memo ohne Audio handelt
  const isCombinedMemoWithoutAudio = recording.type === 'combined_memo';
  const hasAudio = recording.type === 'audio' && recording.path && !recording.path.startsWith('combined-memo-');
  
  // Lade die signierte URL für echte Audiodateien
  useEffect(() => {
    const loadUrl = async () => {
      if (hasAudio && recording.path) {
        try {
          const url = await getSignedUrl(recording.path);
          setRecordingUrl(url);
        } catch (error) {
          console.debug('Fehler beim Generieren der URL für zusätzliche Aufnahme:', error);
        }
      } else if (isCombinedMemoWithoutAudio || !hasAudio) {
        // Für kombinierte Memos ohne Audio ist keine URL nötig
        setRecordingUrl('no-audio');
      }
    };
    
    loadUrl();
  }, [recording.path, getSignedUrl, hasAudio, isCombinedMemoWithoutAudio]);
  
  // Warte bis URL-Status geklärt ist
  if (!recordingUrl) {
    return null;
  }
  
  const styles = StyleSheet.create({
    container: {
      marginBottom: 16,
      backgroundColor: isDark ? 'rgba(30, 30, 30, 0.5)' : 'rgba(245, 245, 245, 0.5)',
      borderRadius: 12,
      overflow: 'hidden',
      padding: 8,
      ...containerStyle
    },
    transcriptContainer: {
      marginTop: 8
    },
    statusText: {
      fontSize: 14,
      color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
      fontStyle: 'italic',
      textAlign: 'center',
      padding: 12
    }
  });
  
  // Bestimme den passenden Titel basierend auf den Metadaten
  const getDisplayTitle = () => {
    // Für kombinierte Memos: Verwende den ursprünglichen Titel
    if (recording.memo_metadata?.display_title || recording.memo_metadata?.original_title) {
      return recording.memo_metadata.display_title || recording.memo_metadata.original_title;
    }
    // Fallback für normale zusätzliche Aufnahmen
    return t('memo.additional_recording', 'Zusätzliche Aufnahme {{number}}', { number: index + 1 });
  };

  const getDisplayDate = () => {
    // Für kombinierte Memos: Verwende das ursprüngliche Erstellungsdatum wenn verfügbar
    if (recording.memo_metadata?.original_created_at) {
      return t('memo.created_on', 'Erstellt am {{date}}', { 
        date: formatDate(recording.memo_metadata.original_created_at) 
      });
    }
    // Fallback für normale zusätzliche Aufnahmen
    return recording.timestamp ? t('memo.recorded_on', 'Aufgenommen am {{date}}', { 
      date: formatDate(recording.timestamp) 
    }) : '';
  };

  const getTranscriptTitle = () => {
    // Für kombinierte Memos: Verwende "Transkript: [Original Titel]"
    if (recording.memo_metadata?.display_title || recording.memo_metadata?.original_title) {
      const originalTitle = recording.memo_metadata.display_title || recording.memo_metadata.original_title;
      return `Transkript: ${originalTitle}`;
    }
    // Fallback für normale zusätzliche Aufnahmen
    return t('memo.transcript_number', 'Transkript {{number}}', { number: index + 1 });
  };

  // For combined memos, don't wrap in container
  if (isCombinedMemoWithoutAudio || recording.memo_metadata) {
    return (
      <>
        {/* Audio Player für Aufnahmen mit Audio-Dateien */}
        {hasAudio && recordingUrl && recordingUrl !== 'no-audio' && (
          <View style={{ marginBottom: 16, marginHorizontal: 20 }}>
            <AudioPlayer
              audioUri={recordingUrl}
              headlineText={getDisplayTitle()}
              dateText={getDisplayDate()}
              onDelete={onDelete}
            />
          </View>
        )}
        
        {/* Für Aufnahmen ohne Audio: Zeige nur Titel und Datum */}
        {!hasAudio && (
          <View style={{ padding: 12, marginBottom: 8 }}>
            <Text 
              style={{ 
                fontSize: 16, 
                fontWeight: 'bold', 
                marginBottom: 4,
                color: isDark ? 'white' : 'black'
              }}
            >
              {getDisplayTitle()}
            </Text>
            <Text 
              style={{ 
                fontSize: 14, 
                opacity: 0.7,
                color: isDark ? 'white' : 'black'
              }}
            >
              {getDisplayDate()}
            </Text>
          </View>
        )}
        
        {/* Transkript der zusätzlichen Aufnahme - immer mit TranscriptDisplay anzeigen */}
        {recording.transcript && (
          <View style={{ marginBottom: 16 }}>
            <TranscriptDisplay 
              data={{
                ...recording,
                type: 'audio',
                utterances: recording.utterances || [],
                speakers: recording.speakers || {}
              }} 
              defaultExpanded={true}
              title={getTranscriptTitle()}
              speakerLabels={speakerLabels}
              onUpdateSpeakerLabels={handleUpdateSpeakerLabels}
              onNameSpeakersPress={() => setIsSpeakerLabelModalVisible?.(true)}
              isEditing={isEditMode}
              onTranscriptChange={isEditMode ? async (newTranscript) => {
                try {
                  const supabase = await getAuthenticatedClient();
                  
                  // Update the additional recording's transcript
                  const updatedRecordings = [...(memo?.metadata?.additional_recordings || [])];
                  if (updatedRecordings[index]) {
                    updatedRecordings[index] = {
                      ...updatedRecordings[index],
                      transcript: newTranscript
                    };
                  }
                  
                  const updatedMetadata = {
                    ...memo?.metadata,
                    additional_recordings: updatedRecordings
                  };
                  
                  const { error } = await supabase
                    .from('memos')
                    .update({ metadata: updatedMetadata })
                    .eq('id', memo?.id);
                    
                  if (error) {
                    console.debug('Error updating additional recording transcript:', error.message);
                    Alert.alert('Fehler', 'Das Transkript konnte nicht aktualisiert werden.');
                    return;
                  }
                  
                  console.debug('Additional recording transcript updated successfully');
                } catch (error) {
                  console.debug('Error in onTranscriptChange:', error);
                  Alert.alert('Fehler', 'Ein unerwarteter Fehler ist aufgetreten.');
                }
              } : undefined}
            />
          </View>
        )}
        
        {/* Zeige Verarbeitungsstatus an, wenn keine Transkription vorhanden ist */}
        {!recording.transcript && recording.status === 'processing' && (
          <View style={{ marginBottom: 16, padding: 12 }}>
            <Text style={styles.statusText}>{t('memo.transcribing', 'Transkription wird verarbeitet...')}</Text>
          </View>
        )}
      </>
    );
  }

  // For regular additional recordings, keep the container
  return (
    <View style={styles.container}>
      {/* Audio Player für Aufnahmen mit Audio-Dateien */}
      {hasAudio && recordingUrl && recordingUrl !== 'no-audio' && (
        <AudioPlayer
          audioUri={recordingUrl}
          headlineText={getDisplayTitle()}
          dateText={getDisplayDate()}
          onDelete={onDelete}
        />
      )}
      
      {/* Für Aufnahmen ohne Audio: Zeige nur Titel und Datum */}
      {!hasAudio && (
        <View style={{ padding: 12 }}>
          <Text 
            style={{ 
              fontSize: 16, 
              fontWeight: 'bold', 
              marginBottom: 4,
              color: isDark ? 'white' : 'black'
            }}
          >
            {getDisplayTitle()}
          </Text>
          <Text 
            style={{ 
              fontSize: 14, 
              opacity: 0.7,
              color: isDark ? 'white' : 'black'
            }}
          >
            {getDisplayDate()}
          </Text>
        </View>
      )}
      
      {/* Transkript der zusätzlichen Aufnahme - immer mit TranscriptDisplay anzeigen */}
      {recording.transcript && (
        <View style={styles.transcriptContainer}>
          <TranscriptDisplay 
            data={{
              ...recording,
              type: 'audio',
              utterances: recording.utterances || [],
              speakers: recording.speakers || {}
            }} 
            defaultExpanded={true}
            title={getTranscriptTitle()}
            speakerLabels={speakerLabels}
            onUpdateSpeakerLabels={handleUpdateSpeakerLabels}
            onNameSpeakersPress={() => setIsSpeakerLabelModalVisible?.(true)}
            isEditing={isEditMode}
            onTranscriptChange={isEditMode ? async (newTranscript) => {
              try {
                const supabase = await getAuthenticatedClient();
                
                // Update the additional recording's transcript
                const updatedRecordings = [...(memo?.metadata?.additional_recordings || [])];
                if (updatedRecordings[index]) {
                  updatedRecordings[index] = {
                    ...updatedRecordings[index],
                    transcript: newTranscript
                  };
                }
                
                const updatedMetadata = {
                  ...memo?.metadata,
                  additional_recordings: updatedRecordings
                };
                
                const { error } = await supabase
                  .from('memos')
                  .update({ metadata: updatedMetadata })
                  .eq('id', memo?.id);
                  
                if (error) {
                  console.debug('Error updating additional recording transcript:', error.message);
                  Alert.alert('Fehler', 'Das Transkript konnte nicht aktualisiert werden.');
                  return;
                }
                
                console.debug('Additional recording transcript updated successfully');
              } catch (error) {
                console.debug('Error in onTranscriptChange:', error);
                Alert.alert('Fehler', 'Ein unerwarteter Fehler ist aufgetreten.');
              }
            } : undefined}
          />
        </View>
      )}
      
      {/* Zeige Verarbeitungsstatus an, wenn keine Transkription vorhanden ist */}
      {!recording.transcript && recording.status === 'processing' && (
        <View style={styles.transcriptContainer}>
          <Text style={styles.statusText}>{t('memo.transcribing', 'Transkription wird verarbeitet...')}</Text>
        </View>
      )}
    </View>
  );
}