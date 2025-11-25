// Chat Service - AI API Aufrufe werden über das Backend gehandhabt
import { availableModels } from '../config/azure';
import { sendChatRequest as sendChatRequestApi } from '../utils/api';
import { supabase } from '../utils/supabase';

// Typdefinition für eine Nachricht
export type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

// Typdefinition für die Chat-Antwort vom o3-mini-Modell
export type ChatResponse = {
  id: string;
  choices: {
    // Für o3-mini-Modell
    content_filter_results?: any;
    finish_reason: string;
    index: number;
    logprobs: any;
    message?: {
      content: string;
      refusal?: any;
      role: string;
    };
  }[];
  created: number;
  model: string;
  object: string;
  prompt_filter_results?: any[];
  system_fingerprint?: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    completion_tokens_details?: any;
    prompt_tokens_details?: any;
  };
};

// Token-Nutzungsinformationen
export type TokenUsage = {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
};

// Rückgabetyp für die Chat-Anfrage
export type ChatRequestResult = {
  content: string;
  usage: TokenUsage;
};

// Backend-URL für sichere API-Aufrufe
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3001';

// Logging der Konfiguration
console.log('Chat Service Konfiguration:', {
  backendUrl: BACKEND_URL,
  availableModels: availableModels.length,
});

/**
 * Berechnet die geschätzten Kosten einer LLM-Anfrage
 * @param promptTokens Anzahl der Eingabe-Tokens
 * @param completionTokens Anzahl der Ausgabe-Tokens
 * @param modelId ID des verwendeten Modells
 * @returns Geschätzte Kosten in der kleinsten Währungseinheit (z.B. Cent)
 */
export async function calculateTokenCost(
  promptTokens: number,
  completionTokens: number,
  modelId: string
): Promise<number> {
  try {
    // Hole die Kosteninformationen aus dem Modell
    const { data: modelData, error } = await supabase
      .from('models')
      .select('cost_settings')
      .eq('id', modelId)
      .single();
      
    if (error || !modelData || !modelData.cost_settings) {
      console.warn('Fehler beim Laden der Kosteninformationen, verwende Standardwerte:', error);
      // Standardwerte verwenden
      const promptCost = 0.0001; // pro 1K Tokens
      const completionCost = 0.0002; // pro 1K Tokens
      
      // Berechne die Kosten
      const cost = (promptTokens * promptCost + completionTokens * completionCost) / 1000;
      return Number(cost.toFixed(6));
    }
    
    // Extrahiere die Kostensätze
    const promptCost = parseFloat(modelData.cost_settings.prompt_per_1k_tokens) || 0.0001;
    const completionCost = parseFloat(modelData.cost_settings.completion_per_1k_tokens) || 0.0002;
    
    // Berechne die Kosten
    const cost = (promptTokens * promptCost + completionTokens * completionCost) / 1000;
    return Number(cost.toFixed(6));
  } catch (error) {
    console.error('Fehler bei der Kostenberechnung:', error);
    // Fallback: vereinfachte Berechnung
    return Number(((promptTokens * 0.0001 + completionTokens * 0.0002) / 1000).toFixed(6));
  }
}

/**
 * Speichert die Token-Nutzung in der Datenbank
 * @param usage Token-Nutzungsinformationen
 * @param conversationId ID der Konversation
 * @param messageId ID der Nachricht
 * @param userId ID des Benutzers
 * @param modelId ID des verwendeten Modells
 */
export async function logTokenUsage(
  usage: TokenUsage,
  conversationId: string,
  messageId: string,
  userId: string,
  modelId: string
): Promise<void> {
  try {
    // Berechne die geschätzten Kosten
    const estimatedCost = await calculateTokenCost(
      usage.prompt_tokens,
      usage.completion_tokens,
      modelId
    );
    
    // Speichere die Nutzungsinformationen
    const { error } = await supabase
      .from('usage_logs')
      .insert({
        conversation_id: conversationId,
        message_id: messageId,
        user_id: userId,
        model_id: modelId,
        prompt_tokens: usage.prompt_tokens,
        completion_tokens: usage.completion_tokens,
        total_tokens: usage.total_tokens,
        estimated_cost: estimatedCost
      });
      
    if (error) {
      console.error('Fehler beim Speichern der Token-Nutzung:', error);
    } else {
      console.log('Token-Nutzung erfolgreich gespeichert:', {
        conversationId,
        messageId,
        totalTokens: usage.total_tokens,
        estimatedCost
      });
    }
  } catch (error) {
    console.error('Fehler beim Loggen der Token-Nutzung:', error);
  }
}

/**
 * Sendet eine Chat-Anfrage über das Backend
 * Das Backend handhabt die Azure OpenAI API Aufrufe sicher
 * @param messages Array von Nachrichten im Chat
 * @param temperature Kreativität der Antwort (0.0 - 1.0)
 * @param maxTokens Maximale Anzahl der Tokens in der Antwort
 * @returns Die Antwort des LLM-Modells und Tokeninformationen
 */
export async function sendChatRequest(
  messages: ChatMessage[],
  temperature: number = 0.7,
  maxTokens: number = 800
): Promise<string | ChatRequestResult> {
  console.log('sendChatRequest gestartet mit:', {
    messagesCount: messages.length,
    maxTokens
  });

  try {
    // Hole aktuelle Modellparameter aus der Konversation (für Modellwechsel)
    let deployment = '';

    // System-Nachricht mit Modell-Präfix suchen
    const systemMessage = messages.find(msg => msg.role === 'system' && msg.content.startsWith('MODEL:'));
    if (systemMessage) {
      deployment = systemMessage.content.split(':')[1].trim();
      console.log('Modell in system Nachricht erkannt:', deployment);
    } else {
      console.warn('Keine System-Nachricht mit MODEL-Präfix gefunden!');
    }

    // Falls kein Modell angegeben wurde, setze auf Fallback gpt-o3-mini-se
    const deploymentToUse = deployment || 'gpt-o3-mini-se';
    console.log('Verwende Deployment:', deploymentToUse);

    // Konfiguration für den API-Wrapper (Backend benötigt nur deployment)
    const config = {
      deployment: deploymentToUse
    };

    // Verwende den zentralen API-Wrapper - dieser ruft das Backend auf
    const result = await sendChatRequestApi(messages, temperature, maxTokens, config);

    // Wenn es ein einfacher String ist (Fehlerfall), diesen zurückgeben
    if (typeof result === 'string') {
      return result;
    }

    // Ansonsten die vollständige Antwort mit Token-Nutzung zurückgeben
    return {
      content: result.content,
      usage: result.usage
    };
  } catch (error) {
    console.error('Fehler bei der Chat-Anfrage:', error);

    // Versuche, mehr Informationen über den Fehler zu erhalten
    if (error instanceof Error) {
      console.error('Fehlerdetails:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }

    // Gib eine benutzerfreundliche Fehlermeldung zurück, anstatt den Fehler zu werfen
    return `Es tut mir leid, aber ich konnte keine Antwort generieren. Bitte stelle sicher, dass das Backend läuft. Fehlerdetails: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`;
  }
}
