// TODO: Implement usage statistics via Backend API
// The Backend needs endpoints for user usage statistics

// Typ für die Token-Nutzung pro Modell
export type ModelUsage = {
  model_id: string;
  model_name: string;
  total_prompt_tokens: number;
  total_completion_tokens: number;
  total_tokens: number;
  total_cost: number;
};

// Typ für die Token-Nutzung nach Zeitraum
export type UsageByPeriod = {
  time_period: string;
  total_tokens: number;
  total_cost: number;
};

// Typ für die Token-Nutzung einer Konversation
export type ConversationUsage = {
  message_id: string;
  created_at: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  estimated_cost: number;
};

// Handler für GET /api/usage
// TODO: Backend-Endpoints für Usage-Statistiken implementieren
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID ist erforderlich' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Usage-Statistiken sind noch nicht über die Backend-API verfügbar
    // Gebe leere Daten zurück
    console.log('Usage-Statistiken: Backend-Endpoints noch nicht implementiert');

    return Response.json({
      modelUsage: [],
      periodUsage: [],
      summary: {
        totalCost: 0,
        totalTokens: 0
      },
      message: 'Usage-Statistiken sind derzeit nicht verfügbar'
    });
  } catch (error) {
    console.error('Fehler beim Verarbeiten der Anfrage:', error);
    return new Response(JSON.stringify({ error: 'Interner Serverfehler' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handler für GET /api/usage/conversation
// TODO: Backend-Endpoints für Conversation-Usage implementieren
export async function GET_conversation(request: Request) {
  try {
    const url = new URL(request.url);
    const conversationId = url.searchParams.get('conversationId');

    if (!conversationId) {
      return new Response(JSON.stringify({ error: 'Conversation ID ist erforderlich' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Usage-Statistiken sind noch nicht über die Backend-API verfügbar
    // Gebe leere Daten zurück
    console.log('Conversation-Usage: Backend-Endpoints noch nicht implementiert');

    return Response.json({
      conversationUsage: [],
      summary: {
        totalCost: 0,
        totalTokens: 0,
        messageCount: 0
      },
      message: 'Usage-Statistiken sind derzeit nicht verfügbar'
    });
  } catch (error) {
    console.error('Fehler beim Verarbeiten der Anfrage:', error);
    return new Response(JSON.stringify({ error: 'Interner Serverfehler' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
