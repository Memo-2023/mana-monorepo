import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.prod
dotenv.config({ path: path.resolve(__dirname, '../.env.prod') });

const supabaseUrl = process.env.MAERCHENZAUBER_SUPABASE_URL;
const supabaseKey = process.env.MAERCHENZAUBER_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
	console.error('Missing Supabase credentials');
	process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBlurHashes() {
	console.log('🔍 Checking BlurHash implementation...\n');

	// Check characters
	console.log('📸 Characters:');
	const { data: characters, error: charError } = await supabase
		.from('characters')
		.select('id, name, blur_hash, created_at')
		.order('created_at', { ascending: false })
		.limit(5);

	if (charError) {
		console.error('Error fetching characters:', charError);
	} else {
		console.log(`Found ${characters?.length || 0} recent characters:`);
		characters?.forEach((char) => {
			const hasBlurHash = !!char.blur_hash;
			const preview = char.blur_hash ? char.blur_hash.substring(0, 30) + '...' : 'null';
			console.log(`  - ${char.name}: ${hasBlurHash ? '✅' : '❌'} ${preview}`);
		});
	}

	console.log('\n📚 Stories:');
	const { data: stories, error: storyError } = await supabase
		.from('stories')
		.select('id, title, blur_hash, pages_data, created_at')
		.order('created_at', { ascending: false })
		.limit(3);

	if (storyError) {
		console.error('Error fetching stories:', storyError);
	} else {
		console.log(`Found ${stories?.length || 0} recent stories:`);
		stories?.forEach((story) => {
			const hasBlurHash = !!story.blur_hash;
			const blurHashPreview = story.blur_hash ? story.blur_hash.substring(0, 30) + '...' : 'null';
			console.log(`\n  📖 ${story.title || 'Untitled'}:`);
			console.log(`     Story BlurHash: ${hasBlurHash ? '✅' : '❌'} ${blurHashPreview}`);

			// Check pages_data for blur_hash
			if (story.pages_data && Array.isArray(story.pages_data)) {
				const pagesWithBlurHash = story.pages_data.filter((page: any) => page.blur_hash).length;
				const totalPages = story.pages_data.length;
				console.log(
					`     Pages with BlurHash: ${pagesWithBlurHash}/${totalPages} ${
						pagesWithBlurHash === totalPages ? '✅' : '⚠️'
					}`
				);

				// Show first page example
				if (story.pages_data.length > 0) {
					const firstPage = story.pages_data[0];
					const pageBlurHash = firstPage.blur_hash
						? firstPage.blur_hash.substring(0, 30) + '...'
						: 'null';
					console.log(`     Example (Page 1): ${pageBlurHash}`);
				}
			}
		});
	}

	console.log('\n✅ Check complete!');
}

checkBlurHashes().catch(console.error);
