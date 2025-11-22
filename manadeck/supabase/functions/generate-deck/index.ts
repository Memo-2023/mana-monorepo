import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import * as jose from "https://deno.land/x/jose@v5.9.6/index.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

// System prompt for consistent card generation
const SYSTEM_PROMPT = `Du bist ein Experte für die Erstellung von Lernkarten. Erstelle strukturierte Lernkarten basierend auf dem gegebenen Thema.

Regeln für die Kartenerstellung:
1. Erstelle abwechslungsreiche Karten (Flashcards und Quiz-Karten)
2. Formuliere klare, präzise Fragen und Antworten
3. Verwende die deutsche Sprache
4. Stelle sicher, dass die Karten aufeinander aufbauen
5. Füge hilfreiche Hinweise und Erklärungen hinzu

Du musst die Karten als JSON-Array zurückgeben mit folgendem Format:
[
  {
    "card_type": "flashcard" | "quiz",
    "content": {
      // Für flashcard:
      "front": "Frage oder Begriff",
      "back": "Antwort oder Definition",
      "hint": "Optionaler Hinweis"

      // Für quiz:
      "question": "Die Frage",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correct_answer": 0, // Index der richtigen Antwort (0-3)
      "explanation": "Erklärung zur richtigen Antwort"
    },
    "position": 1, // Position in der Reihenfolge
    "title": "Kurzer Titel für die Karte"
  }
]

Erstelle GENAU die angeforderte Anzahl von Karten.`;

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Extract the Mana app token
    const appToken = authHeader.replace('Bearer ', '');

    // Get Mana Core JWKS URL from environment variable
    const manaJwksUrl = Deno.env.get('JWKS_URL');
    if (!manaJwksUrl) {
      throw new Error('JWKS_URL not configured');
    }

    // Verify the Mana token using JWKS
    const JWKS = jose.createRemoteJWKSet(new URL(manaJwksUrl));
    const { payload } = await jose.jwtVerify(appToken, JWKS);

    const userId = payload.sub as string;
    if (!userId) {
      throw new Error('Invalid token: no user ID');
    }

    console.log(`Authenticated user: ${userId}`);

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Use the userId from the Mana token
    const user = { id: userId };

    // Parse request body
    const requestData = await req.json();
    const {
      prompt: userPrompt,
      deckTitle,
      deckDescription = '',
      cardCount = 10,
      cardTypes = ['flashcard', 'quiz'],
      difficulty = 'intermediate',
      tags = []
    } = requestData;

    // Validate input
    if (!userPrompt || !deckTitle) {
      throw new Error('userPrompt and deckTitle are required');
    }
    if (cardCount < 1 || cardCount > 50) {
      throw new Error('cardCount must be between 1 and 50');
    }

    // Get OpenAI API key from environment
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Prepare the user message with specific instructions
    const userMessage = `
Thema: ${userPrompt}
Anzahl Karten: ${cardCount}
Kartentypen: ${cardTypes.join(', ')}
Schwierigkeit: ${difficulty}
Tags: ${tags.length > 0 ? tags.join(', ') : 'keine spezifischen Tags'}

Erstelle ${cardCount} Lernkarten zum obigen Thema. Mische die Kartentypen ab und stelle sicher, dass die Karten progressiv aufeinander aufbauen.`;

    console.log('Generating cards with OpenAI...');

    // Call OpenAI API
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 4000,
        response_format: { type: "json_object" }
      })
    });

    if (!openAIResponse.ok) {
      const error = await openAIResponse.text();
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${error}`);
    }

    const aiData = await openAIResponse.json();
    const content = aiData.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    // Parse the JSON response
    let generatedCards;
    try {
      const parsed = JSON.parse(content);
      generatedCards = Array.isArray(parsed) ? parsed : parsed.cards || parsed.karten || [];
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', content);
      throw new Error('Invalid response format from AI');
    }

    if (!Array.isArray(generatedCards) || generatedCards.length === 0) {
      throw new Error('No cards generated');
    }

    console.log(`Generated ${generatedCards.length} cards`);

    // Create the deck in the database
    const { data: deck, error: deckError } = await supabase
      .from('decks')
      .insert({
        user_id: user.id,
        title: deckTitle,
        description: deckDescription || `KI-generiertes Deck zum Thema: ${userPrompt}`,
        is_public: false,
        tags: tags,
        metadata: {
          ai_generated: true,
          generation_prompt: userPrompt,
          generation_date: new Date().toISOString(),
          model: 'gpt-4o-mini'
        }
      })
      .select()
      .single();

    if (deckError || !deck) {
      console.error('Failed to create deck:', deckError);
      throw new Error('Failed to create deck');
    }

    // Prepare cards for insertion
    const cardsToInsert = generatedCards.map((card, index) => ({
      deck_id: deck.id,
      card_type: card.card_type,
      content: card.content,
      position: card.position || index + 1,
      title: card.title || `Karte ${index + 1}`,
      ai_model: 'gpt-4o-mini',
      ai_prompt: userPrompt,
      version: 1,
      is_favorite: false
    }));

    // Insert all cards
    const { data: cards, error: cardsError } = await supabase
      .from('cards')
      .insert(cardsToInsert)
      .select();

    if (cardsError) {
      console.error('Failed to create cards:', cardsError);
      await supabase.from('decks').delete().eq('id', deck.id);
      throw new Error('Failed to create cards: ' + JSON.stringify(cardsError));
    }

    console.log(`Successfully created deck with ${cards?.length} cards`);

    // Track the generation (optional)
    try {
      await supabase.from('ai_generations').insert({
        user_id: user.id,
        deck_id: deck.id,
        function_name: 'generate-deck',
        prompt: userPrompt,
        model: 'gpt-4o-mini',
        status: 'completed',
        metadata: {
          card_count: cards?.length,
          card_types: cardTypes,
          difficulty: difficulty
        },
        completed_at: new Date().toISOString()
      });
    } catch (trackingError) {
      console.log('Could not track generation:', trackingError);
    }

    // Return success response
    return new Response(JSON.stringify({
      success: true,
      deck: {
        id: deck.id,
        title: deck.title,
        description: deck.description,
        card_count: cards?.length || 0
      },
      cards: cards,
      message: `Deck "${deckTitle}" mit ${cards?.length} Karten erfolgreich erstellt!`
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });

  } catch (error) {
    console.error('Error in generate-deck function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Ein unerwarteter Fehler ist aufgetreten'
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: error.message?.includes('authorization') ? 401 : 400
    });
  }
});
