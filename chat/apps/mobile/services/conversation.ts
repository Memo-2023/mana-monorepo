import { supabase } from '../utils/supabase';
import { sendChatRequest, ChatMessage, logTokenUsage, ChatRequestResult } from './openai';

// Typdefinitionen für Konversationen und Nachrichten
export type Conversation = {
  id: string; // UUID
  user_id: string; // UUID des Benutzers (auth.uid)
  model_id: string; // UUID
  template_id?: string; // UUID, optional
  conversation_mode: 'free' | 'guided' | 'template';
  document_mode: boolean; // Gibt an, ob der Dokumentmodus aktiviert ist
  title?: string; // Titel der Konversation
  is_archived: boolean; // Gibt an, ob die Konversation archiviert wurde
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender: 'user' | 'assistant' | 'system';
  message_text: string;
  created_at: string;
  updated_at: string;
};

export type TokenUsageType = {
  id: string;
  conversation_id: string;
  message_id: string;
  user_id: string;
  model_id: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  estimated_cost: number;
  created_at: string;
};

/**
 * Erstellt eine neue Konversation in der Datenbank
 */
export async function createConversation(
  userId: string,
  modelId: string,
  mode: 'free' | 'guided' | 'template' = 'free',
  templateId?: string,
  documentMode: boolean = false,
  spaceId?: string
): Promise<string | null> {
  try {
    console.log("🔵 Erstelle Konversation mit Space ID:", spaceId || "keine");
    
    // Erstelle einen neuen Eintrag in der Conversations-Tabelle
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        user_id: userId,
        model_id: modelId,
        template_id: templateId,
        conversation_mode: mode,
        document_mode: documentMode,
        space_id: spaceId,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Fehler beim Erstellen der Konversation:', error);
      return null;
    }

    return data.id;
  } catch (error) {
    console.error('Fehler beim Erstellen der Konversation:', error);
    return null;
  }
}

/**
 * Fügt eine neue Nachricht zur Konversation hinzu
 */
export async function addMessage(
  conversationId: string,
  sender: 'user' | 'assistant' | 'system',
  messageText: string
): Promise<string | null> {
  try {
    // Führe eine Prüfung und Validierung des Senders durch
    let validSender = sender;
    
    // Stelle sicher, dass der Sender den zulässigen Werten entspricht
    // Das scheint das Problem zu sein - die Datenbank akzeptiert nur bestimmte Werte
    if (!['user', 'assistant', 'system'].includes(validSender)) {
      console.error('Ungültiger Sender-Wert:', sender);
      validSender = 'user'; // Fallback auf 'user'
    }
    
    console.log('Füge Nachricht hinzu mit Sender:', validSender);
    
    // Füge eine neue Nachricht in die Messages-Tabelle ein
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender: validSender,
        message_text: messageText,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Fehler beim Hinzufügen der Nachricht:', error);
      return null;
    }

    return data.id;
  } catch (error) {
    console.error('Fehler beim Hinzufügen der Nachricht:', error);
    return null;
  }
}

/**
 * Lädt alle Nachrichten einer Konversation
 */
export async function getMessages(conversationId: string): Promise<Message[]> {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Fehler beim Laden der Nachrichten:', error);
      return [];
    }

    return data as Message[];
  } catch (error) {
    console.error('Fehler beim Laden der Nachrichten:', error);
    return [];
  }
}

/**
 * Generiert einen Titel für die Konversation basierend auf der ersten Benutzeranfrage
 * @param userQuestion Die erste Frage des Benutzers 
 * @returns Generierter Titel
 */
export async function generateConversationTitle(userQuestion: string): Promise<string> {
  try {
    console.log('Generiere Titel für Konversation basierend auf:', 
                userQuestion.substring(0, 50) + (userQuestion.length > 50 ? '...' : ''));
    
    // Verwende speziell GPT-4o-Mini für die Titelerstellung
    const titlePrompt = `Schreibe eine kurze, prägnante Überschrift (maximal 5 Wörter) für unseren Chat mit dieser Frage: "${userQuestion}"`;
    
    // Manuell 4o-mini-Modell festlegen
    const chatMessages: ChatMessage[] = [
      {
        role: 'system',
        content: 'MODEL:gpt-4o-mini-se'
      },
      {
        role: 'user',
        content: titlePrompt
      }
    ];
    
    // Sende die Anfrage mit niedrigerer Temperatur für zuverlässigere Ergebnisse
    const titleResponse = await sendChatRequest(chatMessages, 0.3, 50);

    // Extrahiere den Text aus der Antwort
    const responseText = typeof titleResponse === 'string'
      ? titleResponse
      : titleResponse.content;

    // Entferne Anführungszeichen und Punkt am Ende, falls vorhanden
    let cleanTitle = responseText.trim()
      .replace(/^["']|["']$/g, '') // Entferne Anführungszeichen am Anfang und Ende
      .replace(/\.$/g, ''); // Entferne Punkt am Ende
    
    // Begrenze die Länge auf 100 Zeichen (für Datenbank)
    if (cleanTitle.length > 100) {
      cleanTitle = cleanTitle.substring(0, 97) + '...';
    }
    
    console.log('Generierter Titel:', cleanTitle);
    return cleanTitle;
  } catch (error) {
    console.error('Fehler bei der Titelgenerierung:', error);
    // Fallback-Titel bei Fehler
    return 'Neue Konversation';
  }
}

/**
 * Aktualisiert den Titel einer Konversation
 */
export async function updateConversationTitle(conversationId: string, title: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('conversations')
      .update({ title })
      .eq('id', conversationId);
    
    if (error) {
      console.error('Fehler beim Aktualisieren des Konversationstitels:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Konversationstitels:', error);
    return false;
  }
}

/**
 * Lädt einen System-Prompt aus einer Vorlage
 * @param templateId Die ID der Vorlage
 * @returns Der System-Prompt der Vorlage oder null
 */
export async function getSystemPromptFromTemplate(templateId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('templates')
      .select('system_prompt')
      .eq('id', templateId)
      .single();
      
    if (error) {
      console.error('Fehler beim Laden der Vorlage:', error);
      return null;
    }
    
    return data.system_prompt;
  } catch (error) {
    console.error('Fehler beim Laden der Vorlage:', error);
    return null;
  }
}

/**
 * Sendet eine Benutzeranfrage an das LLM-Modell und speichert die Antwort
 */
export async function sendMessageAndGetResponse(
  conversationId: string,
  userMessage: string,
  modelId: string,
  templateId?: string,
  documentMode: boolean = false
): Promise<{ userMessageId: string | null; assistantMessageId: string | null; assistantResponse: string; title?: string; documentContent?: string }> {
  try {
    console.log('Starte sendMessageAndGetResponse mit:', {
      conversationId,
      userMessage: userMessage.substring(0, 50) + (userMessage.length > 50 ? '...' : ''),
      modelId
    });
    
    // Lade das Modell aus der Datenbank oder verwende Fallback
    const { data: modelData, error: modelError } = await supabase
      .from('models')
      .select('*')
      .eq('id', modelId)
      .single();
      
    if (modelError) {
      console.error('Fehler beim Laden des Modells:', modelError);
      console.log('Verwende Standard-Parameter, da Modell nicht geladen werden konnte');
    } else {
      console.log('Modell geladen:', {
        id: modelData.id,
        name: modelData.name,
        parameters: modelData.parameters,
        deployment: modelData.parameters?.deployment
      });
    }

    // Variable für die Benutzer-Nachricht-ID
    let userMessageId: string | null = null;
    
    // Überprüfe, ob die Nachricht bereits in der Datenbank existiert
    const { data: existingMessages } = await supabase
      .from('messages')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('sender', 'user')
      .eq('message_text', userMessage)
      .limit(1);
      
    if (existingMessages && existingMessages.length > 0) {
      // Wenn die Nachricht bereits existiert, verwende diese ID
      userMessageId = existingMessages[0].id;
      console.log('Bestehende Benutzernachricht gefunden mit ID:', userMessageId);
    } else {
      // Speichere die Benutzernachricht nur, wenn sie nicht bereits existiert
      userMessageId = await addMessage(conversationId, 'user', userMessage);
      console.log('Neue Benutzernachricht gespeichert mit ID:', userMessageId);
    }

    // Lade alle bisherigen Nachrichten für Kontext
    const messages = await getMessages(conversationId);
    console.log(`${messages.length} Nachrichten für Kontext geladen`);

    // Konvertiere die Nachrichten in das Format für die OpenAI-API
    const chatMessages: ChatMessage[] = [];
    
    // Lade den System-Prompt aus der Vorlage, falls template_id vorhanden
    let systemPrompt: string | null = null;
    if (templateId) {
      systemPrompt = await getSystemPromptFromTemplate(templateId);
      if (systemPrompt) {
        console.log('System-Prompt aus Vorlage geladen');
        
        // Wenn Dokumentmodus aktiv ist, füge spezielle Anweisungen hinzu
        if (documentMode) {
          const documentModePrompt = `
${systemPrompt}

WICHTIG: Du befindest dich im Dokumentmodus. Deine Aufgabe ist es, dem Benutzer zu helfen, ein Dokument zu erstellen und zu verbessern.

1. Das Dokument wird in einem separaten Bereich neben dem Chat angezeigt.
2. Wenn der Benutzer Feedback zu dem Dokument gibt, sollst du eine Überarbeitung des Dokuments vorschlagen.
3. Formatiere deine Vorschläge für das Dokument in gut strukturiertem Markdown-Format.
4. Verwende bei längeren Dokumenten Überschriften, Listen und andere Markdown-Elemente zur besseren Gliederung.
5. Antworte IMMER in diesem Format:

CHAT: Hier antwortest du auf die Frage oder das Feedback des Nutzers.

DOKUMENT:
Hier steht dein Vorschlag für das Dokument in Markdown-Format, ohne Codeblock-Markierungen.
`;
          // Ersetze den Original-Prompt durch den Dokumentmodus-Prompt
          chatMessages.push({
            role: 'system',
            content: documentModePrompt
          });
          
          console.log('Dokumentmodus-Prompt hinzugefügt');
        } else {
          // Standard-Prompt ohne Dokumentmodus
          chatMessages.push({
            role: 'system',
            content: systemPrompt
          });
        }
      }
    } else if (documentMode) {
      // Wenn kein Template, aber Dokumentmodus aktiv ist
      const documentModePrompt = `
Du befindest dich im Dokumentmodus. Deine Aufgabe ist es, dem Benutzer zu helfen, ein Dokument zu erstellen und zu verbessern.

1. Das Dokument wird in einem separaten Bereich neben dem Chat angezeigt.
2. Wenn der Benutzer Feedback zu dem Dokument gibt, sollst du eine Überarbeitung des Dokuments vorschlagen.
3. Formatiere deine Vorschläge für das Dokument in gut strukturiertem Markdown-Format.
4. Verwende bei längeren Dokumenten Überschriften, Listen und andere Markdown-Elemente zur besseren Gliederung.
5. Antworte IMMER in diesem Format:

CHAT: Hier antwortest du auf die Frage oder das Feedback des Nutzers.

DOKUMENT:
Hier steht dein Vorschlag für das Dokument in Markdown-Format, ohne Codeblock-Markierungen.
`;
      chatMessages.push({
        role: 'system',
        content: documentModePrompt
      });
      
      console.log('Standard-Dokumentmodus-Prompt hinzugefügt');
    }
    
    // Füge eine System-Nachricht mit der Modell-ID hinzu, falls ein Modell geladen wurde
    if (modelData && modelData.parameters && modelData.parameters.deployment) {
      console.log(`Nutze deployment '${modelData.parameters.deployment}' für Modell ${modelData.name}`);
      // Stelle die Modell-Identifikation ganz am Anfang ein
      chatMessages.unshift({
        role: 'system',
        content: `MODEL:${modelData.parameters.deployment}`
      });
    } else {
      // Versuche, das Deployment über die Modell-ID zu finden
      console.warn('Kein Modell-Deployment in Modell-Daten gefunden, suche in verfügbaren Modellen');
      // Lade dynamisch die Modelle
      try {
        const { data: availableModels } = await supabase
          .from('models')
          .select('id, parameters, name');
          
        const matchingModel = availableModels?.find(m => m.id === modelId);
        
        if (matchingModel && matchingModel.parameters && matchingModel.parameters.deployment) {
          console.log(`Nutze deployment '${matchingModel.parameters.deployment}' für Modell ${matchingModel.name}`);
          chatMessages.unshift({
            role: 'system',
            content: `MODEL:${matchingModel.parameters.deployment}`
          });
        } else {
          console.warn('Kein passendes Modell-Deployment gefunden, verwende Standard-Deployment');
        }
      } catch (error) {
        console.error('Fehler beim Laden der verfügbaren Modelle:', error);
      }
    }
    
    // Füge alle normalen Nachrichten hinzu
    chatMessages.push(...messages.map(msg => ({
      role: msg.sender === 'user' ? 'user' : msg.sender === 'assistant' ? 'assistant' : 'system',
      content: msg.message_text
    })));
    
    console.log('Nachrichten für OpenAI konvertiert:', chatMessages.length, 'Nachrichten');

    // Sende die Anfrage an das LLM-Modell
    console.log('Sende Anfrage an LLM-Modell mit Parametern:', {
      temperature: modelData?.parameters?.temperature || 0.7,
      maxTokens: modelData?.parameters?.max_tokens || 800
    });
    
    const result = await sendChatRequest(
      chatMessages,
      modelData?.parameters?.temperature || 0.7,
      modelData?.parameters?.max_tokens || 800
    );
    
    // Extrahiere die Antwort und Token-Nutzung aus dem Ergebnis
    let assistantResponse: string;
    let tokenUsage;
    
    if (typeof result === 'string') {
      // Falls nur ein String zurückgegeben wurde (Fehlerfall)
      assistantResponse = result;
      console.log('Einfache String-Antwort vom LLM-Modell erhalten (kein Tokennutzungs-Tracking):', {
        length: assistantResponse.length,
        preview: assistantResponse.substring(0, 50) + (assistantResponse.length > 50 ? '...' : '')
      });
    } else {
      // Bei vollständigem Ergebnis mit Token-Nutzung
      assistantResponse = result.content;
      tokenUsage = result.usage;
      
      console.log('Antwort vom LLM-Modell erhalten:', {
        length: assistantResponse.length,
        preview: assistantResponse.substring(0, 50) + (assistantResponse.length > 50 ? '...' : ''),
        tokenUsage
      });
    }

    // Dokumentinhalt extrahieren, wenn im Dokumentmodus
    let documentContent: string | undefined;
    let chatResponse = assistantResponse;
    
    if (documentMode) {
      // Nach dem Format "CHAT: ... DOKUMENT: ```markdown ... ```" suchen
      console.log("Analysiere LLM-Antwort für Dokumentextraktion:", assistantResponse.substring(0, 200) + "...");
      
      const chatMatch = assistantResponse.match(/CHAT:(.*?)(?=DOKUMENT:|$)/s);
      const documentMatch = assistantResponse.match(/DOKUMENT:[\s\n]*(```markdown|```|`markdown)?([^`].*?)(?:```|`+)?$/s);
      
      console.log("Dokument-Regex Match:", documentMatch ? "Ja" : "Nein");
      
      if (chatMatch && chatMatch[1]) {
        chatResponse = chatMatch[1].trim();
        console.log('Chat-Antwort extrahiert:', chatResponse.substring(0, 50) + '...');
      }
      
      if (documentMatch && documentMatch[2]) {
        documentContent = documentMatch[2].trim();
        console.log('Dokument-Inhalt extrahiert:', (documentContent?.substring(0, 50) || '') + '...');
      } else if (documentMatch) {
        console.log('Dokument-Match gefunden, aber kein Inhalt in Gruppe 2');
        console.log('Dokument-Match-Gruppen:', documentMatch.length);
        for (let i = 0; i < documentMatch.length; i++) {
          console.log(`Gruppe ${i}:`, documentMatch[i]?.substring(0, 30));
        }
      }
    }

    // Speichere die Antwort des Assistenten
    const assistantMessageId = await addMessage(conversationId, 'assistant', chatResponse);
    console.log('Assistentenantwort gespeichert mit ID:', assistantMessageId);
    
    // Token-Nutzung loggen, falls verfügbar
    if (tokenUsage && assistantMessageId && userMessageId && modelData) {
      try {
        // Lade die Konversation, um die user_id zu erhalten
        const { data: conversationData, error: convError } = await supabase
          .from('conversations')
          .select('user_id')
          .eq('id', conversationId)
          .single();
          
        if (convError || !conversationData) {
          console.error('Fehler beim Laden der Konversation für Token-Logging:', convError);
        } else {
          const userId = conversationData.user_id;
          
          // Logge die Token-Nutzung
          await logTokenUsage(
            tokenUsage,
            conversationId,
            assistantMessageId,
            userId,
            modelId
          );
          console.log('Token-Nutzung erfolgreich geloggt');
        }
      } catch (error) {
        console.error('Fehler beim Loggen der Token-Nutzung:', error);
        // Wir werfen keinen Fehler, da das Token-Logging nicht kritisch ist
      }
    }

    // Prüfe, ob dies die erste Nachricht in der Konversation ist
    // Wenn ja, generiere einen Titel und aktualisiere die Konversation
    const { count } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('conversation_id', conversationId);
      
    let title;
    // Nur für die erste oder zweite Nachricht (die erste könnte eine System-Nachricht sein)
    if (count === 1 || count === 2) {
      // Generiere einen Titel basierend auf der Benutzernachricht
      title = await generateConversationTitle(userMessage);
      
      // Aktualisiere den Titel in der Datenbank
      const success = await updateConversationTitle(conversationId, title);
      console.log('Konversationstitel aktualisiert:', success ? 'erfolgreich' : 'fehlgeschlagen');
    }
    
    return {
      userMessageId,
      assistantMessageId,
      assistantResponse: chatResponse,
      title,
      documentContent
    };
  } catch (error) {
    console.error('Fehler beim Senden der Nachricht:', error);
    
    // Detaillierte Fehlerinformationen ausgeben
    if (error instanceof Error) {
      console.error('Fehlerdetails:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    
    return {
      userMessageId: null,
      assistantMessageId: null,
      assistantResponse: `Es ist ein Fehler aufgetreten: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}. Bitte versuche es später erneut.`
    };
  }
}

/**
 * Lädt alle aktiven (nicht archivierten) Konversationen eines Benutzers
 * Optional: Mit spaceId werden nur Konversationen aus diesem Space geladen
 */
export async function getConversations(userId: string, spaceId?: string): Promise<Conversation[]> {
  try {
    let query = supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .eq('is_archived', false);
      
    // Wenn eine Space-ID angegeben wurde, filtere nach diesem Space
    if (spaceId) {
      query = query.eq('space_id', spaceId);
    }
    
    const { data, error } = await query.order('updated_at', { ascending: false });

    if (error) {
      console.error('Fehler beim Laden der Konversationen:', error);
      return [];
    }

    return data as Conversation[];
  } catch (error) {
    console.error('Fehler beim Laden der Konversationen:', error);
    return [];
  }
}

/**
 * Lädt alle archivierten Konversationen eines Benutzers
 */
export async function getArchivedConversations(userId: string): Promise<Conversation[]> {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .eq('is_archived', true)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Fehler beim Laden der archivierten Konversationen:', error);
      return [];
    }

    return data as Conversation[];
  } catch (error) {
    console.error('Fehler beim Laden der archivierten Konversationen:', error);
    return [];
  }
}

/**
 * Archiviert eine Konversation
 */
export async function archiveConversation(conversationId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('conversations')
      .update({ is_archived: true })
      .eq('id', conversationId);

    if (error) {
      console.error('Fehler beim Archivieren der Konversation:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Fehler beim Archivieren der Konversation:', error);
    return false;
  }
}

/**
 * Stellt eine archivierte Konversation wieder her
 */
export async function unarchiveConversation(conversationId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('conversations')
      .update({ is_archived: false })
      .eq('id', conversationId);

    if (error) {
      console.error('Fehler beim Wiederherstellen der Konversation:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Fehler beim Wiederherstellen der Konversation:', error);
    return false;
  }
}

/**
 * Löscht eine Konversation dauerhaft
 */
export async function deleteConversation(conversationId: string): Promise<boolean> {
  try {
    // Lösche zuerst alle zugehörigen Nachrichten
    const { error: messagesError } = await supabase
      .from('messages')
      .delete()
      .eq('conversation_id', conversationId);

    if (messagesError) {
      console.error('Fehler beim Löschen der Nachrichten:', messagesError);
      return false;
    }

    // Lösche dann die Konversation selbst
    const { error: conversationError } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId);

    if (conversationError) {
      console.error('Fehler beim Löschen der Konversation:', conversationError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Fehler beim Löschen der Konversation:', error);
    return false;
  }
}
