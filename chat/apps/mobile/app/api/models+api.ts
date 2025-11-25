import { supabase } from '../../utils/supabase';

// Definiere den Typ für ein Modell
export type Model = {
  id: string;
  name: string;
  description: string;
  parameters?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
};

// Fallback-Modelle, falls keine aus der Datenbank geladen werden können
const FALLBACK_MODELS: Model[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'GPT-O3-Mini',
    description: 'Azure OpenAI O3-Mini: Effizientes Modell für schnelle Antworten.',
    parameters: {
      temperature: 0.7,
      max_tokens: 800,
      provider: 'azure',
      deployment: 'gpt-o3-mini-se',
      endpoint: 'https://memoroseopenai.openai.azure.com',
      api_version: '2024-12-01-preview'
    }
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    name: 'GPT-4o-Mini',
    description: 'Azure OpenAI GPT-4o-Mini: Kompaktes, leistungsstarkes KI-Modell.',
    parameters: {
      temperature: 0.7,
      max_tokens: 1000,
      provider: 'azure',
      deployment: 'gpt-4o-mini-se',
      endpoint: 'https://memoroseopenai.openai.azure.com',
      api_version: '2024-12-01-preview'
    }
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440005',
    name: 'GPT-4o',
    description: 'Azure OpenAI GPT-4o: Das fortschrittlichste multimodale KI-Modell.',
    parameters: {
      temperature: 0.7,
      max_tokens: 1200,
      provider: 'azure',
      deployment: 'gpt-4o-se',
      endpoint: 'https://memoroseopenai.openai.azure.com',
      api_version: '2024-12-01-preview'
    }
  }
];

// GET-Handler für Modelle
export async function GET(request: Request) {
  try {
    // Versuche, Modelle aus der Supabase-Datenbank zu laden
    let models: Model[] = FALLBACK_MODELS;
    
    // Wenn Supabase konfiguriert ist, versuche die Modelle von dort zu laden
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('models')
          .select('*');
          // Entfernt: .order('created_at', { ascending: false })
        
        if (error) {
          console.error('Fehler beim Laden der Modelle aus Supabase:', error);
        } else if (data && data.length > 0) {
          models = data as Model[];
        }
      }
    } catch (e) {
      console.error('Fehler bei der Supabase-Verbindung:', e);
      // Fallback zu den vordefinierten Modellen
    }
    
    return Response.json(models);
  } catch (error) {
    console.error('Fehler beim Verarbeiten der Anfrage:', error);
    return new Response(JSON.stringify({ error: 'Interner Serverfehler' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

// POST-Handler zum Erstellen eines neuen Modells
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validiere die Eingabedaten
    if (!body.name || !body.description) {
      return new Response(JSON.stringify({ error: 'Name und Beschreibung sind erforderlich' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    
    // Erstelle ein neues Modell in der Datenbank
    if (supabase) {
      const { data, error } = await supabase
        .from('models')
        .insert([{
          name: body.name,
          description: body.description,
          parameters: body.parameters || {},
        }])
        .select();
      
      if (error) {
        console.error('Fehler beim Erstellen des Modells:', error);
        return new Response(JSON.stringify({ error: 'Fehler beim Erstellen des Modells' }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }
      
      return Response.json(data[0]);
    } else {
      // Wenn Supabase nicht verfügbar ist, gib einen Fehler zurück
      return new Response(JSON.stringify({ error: 'Datenbank nicht verfügbar' }), {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
  } catch (error) {
    console.error('Fehler beim Verarbeiten der Anfrage:', error);
    return new Response(JSON.stringify({ error: 'Interner Serverfehler' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
