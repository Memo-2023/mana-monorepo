// Skript zum Aktualisieren der Modelle in der Supabase-Datenbank
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Lade Umgebungsvariablen aus .env
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Supabase-Client erstellen
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
	console.error(
		'Fehler: EXPO_PUBLIC_SUPABASE_URL und EXPO_PUBLIC_SUPABASE_ANON_KEY müssen in der .env-Datei definiert sein.'
	);
	process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Modelle, die wir in die Datenbank einfügen wollen
const models = [
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
			api_version: '2024-12-01-preview',
		},
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
			api_version: '2024-12-01-preview',
		},
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
			api_version: '2024-12-01-preview',
		},
	},
];

async function updateModels() {
	console.log('Aktualisiere Modelle in der Supabase-Datenbank...');

	// Prüfe, ob die Tabelle existiert
	const { error: tableError } = await supabase.from('models').select('id').limit(1);

	if (tableError) {
		console.error('Fehler beim Zugriff auf die models-Tabelle:', tableError.message);
		console.log('Erstelle models-Tabelle...');

		// Erstelle die Tabelle, falls sie nicht existiert
		const { error: createError } = await supabase.rpc('create_models_table');

		if (createError) {
			console.error('Fehler beim Erstellen der models-Tabelle:', createError.message);
			return;
		}
	}

	// Füge die Modelle ein oder aktualisiere sie
	for (const model of models) {
		const { error } = await supabase.from('models').upsert(model, { onConflict: 'id' });

		if (error) {
			console.error(`Fehler beim Aktualisieren des Modells ${model.name}:`, error.message);
		} else {
			console.log(`Modell ${model.name} erfolgreich aktualisiert.`);
		}
	}

	console.log('Modellaktualisierung abgeschlossen.');
}

// Führe die Funktion aus
updateModels()
	.catch((error) => {
		console.error('Unerwarteter Fehler:', error);
	})
	.finally(() => {
		process.exit(0);
	});
