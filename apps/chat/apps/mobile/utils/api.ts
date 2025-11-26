/**
 * API-Hilfsmodul für Chat-Anfragen
 * Verwendet das Backend für sichere AI API Aufrufe
 */
import { ChatMessage } from '../services/openai';
import { sendChatCompletion, ChatCompletionResponse, TokenUsage } from './backendApi';

// Re-export types for backward compatibility
export type { TokenUsage };

// Rückgabetyp für die Chat-Anfrage
export type ChatRequestResult = {
  content: string;
  usage: TokenUsage;
};

/**
 * Sendet eine Chat-Anfrage über das Backend
 * @param messages Array von Nachrichten
 * @param temperature Kreativität (0.0 - 1.0)
 * @param maxTokens Maximale Token in der Antwort
 * @param config Model-Konfiguration (für modelId Extraktion)
 * @returns Die Antwort des Modells als Text mit Tokennutzung
 */
export async function sendChatRequest(
  messages: ChatMessage[],
  temperature: number = 0.7,
  maxTokens: number = 800,
  config: {
    endpoint?: string;
    apiKey?: string;
    deployment: string;
    apiVersion?: string;
  }
): Promise<string | ChatRequestResult> {
  console.log('sendChatRequest via Backend:', {
    messagesCount: messages.length,
    deployment: config.deployment,
    temperature,
    maxTokens,
  });

  try {
    // Map deployment name to model ID
    const modelId = getModelIdFromDeployment(config.deployment);

    // Send request through backend
    const result = await sendChatCompletion(
      messages,
      modelId,
      temperature,
      maxTokens
    );

    return {
      content: result.content,
      usage: result.usage,
    };
  } catch (error) {
    console.error('Fehler beim Backend API-Aufruf:', error);

    // Return user-friendly error message
    const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
    return `Es konnte keine Antwort generiert werden. Bitte stelle sicher, dass das Backend läuft. Fehler: ${errorMessage}`;
  }
}

/**
 * Maps deployment names to model IDs
 * This ensures backward compatibility with existing code
 */
function getModelIdFromDeployment(deployment: string): string {
  const deploymentToModelId: Record<string, string> = {
    'gpt-o3-mini-se': '550e8400-e29b-41d4-a716-446655440000',
    'gpt-4o-mini-se': '550e8400-e29b-41d4-a716-446655440004',
    'gpt-4o-se': '550e8400-e29b-41d4-a716-446655440005',
  };

  const modelId = deploymentToModelId[deployment];

  if (!modelId) {
    console.warn(`Unknown deployment: ${deployment}, using default model`);
    return '550e8400-e29b-41d4-a716-446655440000'; // Default to GPT-O3-Mini
  }

  return modelId;
}
