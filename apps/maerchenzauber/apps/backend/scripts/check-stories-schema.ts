import { createClient } from '@supabase/supabase-js';

/**
 * Script to check the current schema of the stories table
 *
 * Usage:
 *   npx tsx scripts/check-stories-schema.ts
 */

const SUPABASE_URL = process.env.MAERCHENZAUBER_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.MAERCHENZAUBER_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
	console.error('❌ Missing required environment variables:');
	console.error('   MAERCHENZAUBER_SUPABASE_URL');
	console.error('   MAERCHENZAUBER_SUPABASE_SERVICE_ROLE_KEY');
	process.exit(1);
}

async function checkStoriesSchema() {
	console.log('🔍 Checking stories table schema...\n');
	console.log(`🔗 Supabase URL: ${SUPABASE_URL}\n`);

	// Create Supabase client with service role key
	const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
		auth: {
			persistSession: false,
		},
	});

	try {
		// Query information_schema to get column details
		const { data: columns, error: columnsError } = await supabase
			.from('information_schema.columns')
			.select('column_name, data_type, is_nullable, column_default')
			.eq('table_name', 'stories')
			.order('ordinal_position');

		if (columnsError) {
			console.error('❌ Error fetching schema:', columnsError);

			// Try alternative method - just get a sample row
			console.log('\n🔄 Trying alternative method - fetching sample story...\n');

			const { data: sampleStory, error: sampleError } = await supabase
				.from('stories')
				.select('*')
				.limit(1)
				.single();

			if (sampleError) {
				console.error('❌ Error fetching sample story:', sampleError);
				process.exit(1);
			}

			if (sampleStory) {
				console.log('✅ Sample story structure:');
				console.log('─'.repeat(60));
				Object.keys(sampleStory).forEach((key) => {
					const value = sampleStory[key];
					const type = typeof value;
					console.log(`  ${key.padEnd(30)} ${type.padEnd(10)} ${value === null ? '(null)' : ''}`);
				});
				console.log('─'.repeat(60));
			}
			return;
		}

		if (columns && columns.length > 0) {
			console.log('✅ Stories table schema:');
			console.log('─'.repeat(80));
			console.log('Column Name'.padEnd(30) + 'Type'.padEnd(20) + 'Nullable'.padEnd(15) + 'Default');
			console.log('─'.repeat(80));

			columns.forEach((col: any) => {
				console.log(
					col.column_name.padEnd(30) +
						col.data_type.padEnd(20) +
						col.is_nullable.padEnd(15) +
						(col.column_default || '').substring(0, 30)
				);
			});
			console.log('─'.repeat(80));

			// Check for specific columns we're interested in
			const columnNames = columns.map((col: any) => col.column_name);
			console.log('\n📋 Column checks:');
			console.log(
				`  ✓ is_favorite: ${columnNames.includes('is_favorite') ? '✅ EXISTS' : '❌ MISSING'}`
			);
			console.log(
				`  ✓ is_published: ${columnNames.includes('is_published') ? '✅ EXISTS' : '❌ MISSING'}`
			);
			console.log(
				`  ✓ visibility: ${columnNames.includes('visibility') ? '✅ EXISTS' : '❌ MISSING'}`
			);
			console.log(`  ✓ archived: ${columnNames.includes('archived') ? '✅ EXISTS' : '❌ MISSING'}`);
		} else {
			console.log('⚠️  No columns found or table does not exist');
		}

		// Check for story_votes table
		console.log('\n🔍 Checking story_votes table...');
		const { data: votesTable, error: votesError } = await supabase
			.from('story_votes')
			.select('*')
			.limit(1);

		if (votesError) {
			if (votesError.message.includes('does not exist')) {
				console.log('  ❌ story_votes table DOES NOT EXIST');
			} else {
				console.log(`  ⚠️  Error: ${votesError.message}`);
			}
		} else {
			console.log('  ✅ story_votes table EXISTS');
			if (votesTable && votesTable.length > 0) {
				console.log(`  📊 Sample vote record:`, votesTable[0]);
			}
		}
	} catch (error) {
		console.error('❌ Error:', error);
		process.exit(1);
	}
}

checkStoriesSchema();
