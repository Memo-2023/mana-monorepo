import { supabase } from '../../utils/supabase';

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
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const period = url.searchParams.get('period') || 'month';
    
    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID ist erforderlich' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Lade die Tokennutzung nach Modell
    const { data: modelUsage, error: modelError } = await supabase
      .rpc('get_user_model_usage', { user_id: userId });
      
    if (modelError) {
      console.error('Fehler beim Laden der Modellnutzung:', modelError);
      return new Response(JSON.stringify({ error: 'Fehler beim Laden der Modellnutzung' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Lade die Tokennutzung nach Zeitraum
    const { data: periodUsage, error: periodError } = await supabase
      .rpc('get_user_usage_by_period', { 
        user_id: userId,
        period: period
      });
      
    if (periodError) {
      console.error('Fehler beim Laden der Zeitraumnutzung:', periodError);
      return new Response(JSON.stringify({ error: 'Fehler beim Laden der Zeitraumnutzung' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Berechne Gesamtkosten und Token
    const totalCost = (modelUsage as ModelUsage[]).reduce((sum, model) => sum + model.total_cost, 0);
    const totalTokens = (modelUsage as ModelUsage[]).reduce((sum, model) => sum + model.total_tokens, 0);
    
    return Response.json({
      modelUsage,
      periodUsage,
      summary: {
        totalCost,
        totalTokens
      }
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
    
    // Lade die Tokennutzung für die Konversation
    const { data: conversationUsage, error } = await supabase
      .rpc('get_conversation_usage', { conversation_id: conversationId });
      
    if (error) {
      console.error('Fehler beim Laden der Konversationsnutzung:', error);
      return new Response(JSON.stringify({ error: 'Fehler beim Laden der Konversationsnutzung' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Berechne Gesamtkosten und Token für diese Konversation
    const usage = conversationUsage as ConversationUsage[];
    const totalCost = usage.reduce((sum, item) => sum + item.estimated_cost, 0);
    const totalTokens = usage.reduce((sum, item) => sum + item.total_tokens, 0);
    
    return Response.json({
      conversationUsage,
      summary: {
        totalCost,
        totalTokens,
        messageCount: usage.length
      }
    });
  } catch (error) {
    console.error('Fehler beim Verarbeiten der Anfrage:', error);
    return new Response(JSON.stringify({ error: 'Interner Serverfehler' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}