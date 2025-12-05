// Quick debug script to check character slugs
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'your_supabase_url';
const supabaseKey = 'your_supabase_anon_key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSlugs() {
	const { data, error } = await supabase
		.from('nodes')
		.select('slug, title, kind')
		.eq('kind', 'character')
		.ilike('title', '%magier%');

	console.log('Found characters with "magier":', data);
}

// checkSlugs()
