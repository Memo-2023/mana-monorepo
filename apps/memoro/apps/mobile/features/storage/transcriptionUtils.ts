import { Alert } from 'react-native';
import { analyzeNetworkErrorSync } from '../errorHandling/utils/networkErrorUtils';

/**
 * Utility functions for audio transcription
 * Routes all requests through memoro-service for intelligent backend routing
 */

const MEMORO_SERVICE_URL = process.env.EXPO_PUBLIC_MEMORO_MIDDLEWARE_URL?.replace(/\/$/, '') || 'https://memoro-service-111768794939.europe-west3.run.app';

/**
 * Transcribes via Memoro Service (which handles intelligent routing)
 */
const transcribeViaMemoryService = async (
  audioPath: string,
  appToken: string,
  duration: number,
  memoId?: string,
  spaceId?: string,
  recordingLanguages?: string[],
  title?: string,
  blueprintId?: string
): Promise<Response> => {
  console.debug('🎯 Using Memoro Service for intelligent transcription routing');

  return fetch(`${MEMORO_SERVICE_URL}/memoro/process-uploaded-audio`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${appToken}`,
    },
    body: JSON.stringify({
      filePath: audioPath,
      duration,
      memoId,
      spaceId,
      recordingLanguages,
      title,
      blueprintId
    }),
  });
};

/**
 * Enhanced transcription result with network error information
 */
export interface TranscriptionRequestResult {
  success: boolean;
  error?: string;
  isNetworkError?: boolean;
  userMessage?: string;
  technicalMessage?: string;
}

/**
 * Triggers transcription via memoro-service (which handles intelligent routing)
 */
export const triggerTranscription = async ({
  userId,
  fileName,
  duration,
  memoId,
  spaceId,
  recordingLanguages,
  title,
  blueprintId,
  showAlerts = true,
  t = (key: string, fallback: string) => fallback
}: {
  userId: string;
  fileName: string;
  duration: number;
  memoId?: string;
  spaceId?: string;
  recordingLanguages?: string[];
  title?: string;
  blueprintId?: string;
  showAlerts?: boolean;
  t?: (key: string, fallback: string) => string;
}): Promise<TranscriptionRequestResult> => {
  try {
    // Get the app token for authenticated requests
    const { tokenManager } = await import('~/features/auth/services/tokenManager');
    const appToken = await tokenManager.getValidToken();
    if (!appToken) {
      const errorMsg = t('audio_archive.no_auth_token', 'Kein authentifizierter Token gefunden');
      if (showAlerts) {
        Alert.alert(t('common.error', 'Fehler'), errorMsg);
      }
      return { success: false, error: errorMsg };
    }

    const audioPath = `${userId}/${fileName}`;

    console.debug('🎯 Triggering transcription with:', {
      audioPath,
      duration,
      memoId,
      spaceId,
      title,
      blueprintId,
      recordingLanguages
    });

    // Let memoro-service handle the intelligent routing
    const transcribeResponse = await transcribeViaMemoryService(
      audioPath,
      appToken,
      duration,
      memoId,
      spaceId,
      recordingLanguages,
      title,
      blueprintId
    );
    
    // Handle response
    if (!transcribeResponse.ok) {
      const errorText = await transcribeResponse.text();
      console.debug('Fehler beim Aufruf der Transcription via Memoro Service:', {
        status: transcribeResponse.status,
        statusText: transcribeResponse.statusText,
        errorText
      });
      
      // Create an error object with status for network analysis
      const transcriptionError = new Error(`Transcription failed: ${errorText}`);
      (transcriptionError as any).status = transcribeResponse.status;
      
      // Analyze if this is a network-related error
      const networkErrorInfo = analyzeNetworkErrorSync(transcriptionError);
      
      if (networkErrorInfo.isNetworkError) {
        // For network errors, return the user-friendly message but don't show alert here
        // Let the calling code decide how to display it (toast vs alert)
        return {
          success: false,
          error: errorText,
          isNetworkError: true,
          userMessage: networkErrorInfo.userMessage,
          technicalMessage: networkErrorInfo.technicalMessage
        };
      } else {
        const errorMsg = t('audio_archive.transcription_start_error', 'Die Transkription konnte nicht gestartet werden.');
        if (showAlerts) {
          Alert.alert(t('common.error', 'Fehler'), errorMsg);
        }
        return { 
          success: false, 
          error: errorMsg,
          isNetworkError: false,
          userMessage: errorMsg,
          technicalMessage: errorText
        };
      }
    }
       
    console.debug('✅ Transcription started successfully via Memoro Service');
    return { success: true };
    
  } catch (error) {
    console.debug('Error triggering transcription:', error);
    
    // Analyze if this is a network-related error
    const networkErrorInfo = analyzeNetworkErrorSync(error);
    
    if (networkErrorInfo.isNetworkError) {
      return {
        success: false,
        error: String(error),
        isNetworkError: true,
        userMessage: networkErrorInfo.userMessage,
        technicalMessage: networkErrorInfo.technicalMessage
      };
    } else {
      const errorMsg = t('audio_archive.transcription_error', 'Beim Starten der Transkription ist ein Fehler aufgetreten.');
      if (showAlerts) {
        Alert.alert(t('common.error', 'Fehler'), errorMsg);
      }
      return { 
        success: false, 
        error: errorMsg,
        isNetworkError: false,
        userMessage: errorMsg,
        technicalMessage: String(error)
      };
    }
  }
};