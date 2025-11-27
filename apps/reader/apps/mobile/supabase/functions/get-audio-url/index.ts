import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AudioUrlRequest {
  textId: string;
  chunkId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get user from JWT token
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { textId, chunkId }: AudioUrlRequest = await req.json();

    // Validate input
    if (!textId || !chunkId) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify text belongs to user
    const { data: text, error: textError } = await supabaseClient
      .from('texts')
      .select('data')
      .eq('id', textId)
      .eq('user_id', user.id)
      .single();

    if (textError || !text) {
      return new Response(JSON.stringify({ error: 'Text not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Find the chunk
    const chunk = text.data.audio?.chunks?.find((c: any) => c.id === chunkId);
    if (!chunk) {
      return new Response(JSON.stringify({ error: 'Chunk not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate signed URL for the audio file with user-specific path
    const filePath = `${user.id}/${textId}/${chunkId}.mp3`;
    const { data: urlData, error: urlError } = await supabaseClient.storage
      .from('audio')
      .createSignedUrl(filePath, 3600); // 1 hour expiration

    if (urlError) {
      throw urlError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        url: urlData.signedUrl,
        chunk: {
          id: chunk.id,
          start: chunk.start,
          end: chunk.end,
          duration: chunk.duration,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in get-audio-url function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
