const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3001';

// Definiere den Typ für ein Modell
export type Model = {
  id: string;
  name: string;
  description: string;
  parameters?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
};

// Fallback-Modelle, falls keine aus dem Backend geladen werden können
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
    // Versuche, Modelle vom Backend zu laden
    let models: Model[] = FALLBACK_MODELS;

    try {
      const response = await fetch(`${BACKEND_URL}/api/chat/models`);

      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          models = data as Model[];
        }
      } else {
        console.error('Fehler beim Laden der Modelle vom Backend:', response.status);
      }
    } catch (e) {
      console.error('Fehler bei der Backend-Verbindung:', e);
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

// POST-Handler zum Erstellen eines neuen Modells (nicht unterstützt ohne Backend-Endpoint)
export async function POST(request: Request) {
  return new Response(JSON.stringify({ error: 'Modell-Erstellung wird über das Backend nicht unterstützt' }), {
    status: 501,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
