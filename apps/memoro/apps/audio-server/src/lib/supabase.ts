import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  const supabaseUrl = process.env.MEMORO_SUPABASE_URL;
  const supabaseServiceKey = process.env.MEMORO_SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing required env vars: MEMORO_SUPABASE_URL, MEMORO_SUPABASE_SERVICE_KEY');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function downloadAudioFromStorage(audioPath: string): Promise<Buffer> {
  const supabase = getSupabaseClient();

  console.log(`[Supabase] Downloading audio from storage: ${audioPath}`);

  const { data, error } = await supabase.storage.from('user-uploads').download(audioPath);

  if (error) {
    console.error(`[Supabase] Failed to download audio: ${error.message}`);
    throw new Error(`Failed to download audio from storage: ${error.message}`);
  }

  if (!data) {
    throw new Error(`No data returned for audio path: ${audioPath}`);
  }

  const arrayBuffer = await data.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  console.log(`[Supabase] Downloaded audio: ${buffer.length} bytes`);

  return buffer;
}
