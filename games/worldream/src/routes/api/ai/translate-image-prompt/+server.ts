import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { translateToImagePrompt } from '$lib/ai/openai';
import { createClient } from '$lib/supabase/server';
import type { NodeKind } from '$lib/types/content';

export const POST: RequestHandler = async (event) => {
	const { request } = event;

	try {
		const supabase = createClient(event);

		// Prüfe Authentifizierung
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser();
		if (authError || !user) {
			return json({ error: 'Nicht authentifiziert' }, { status: 401 });
		}

		const body = await request.json();
		const {
			germanDescription,
			kind,
			title,
			style = 'fantasy',
		} = body as {
			germanDescription: string;
			kind: NodeKind;
			title: string;
			style?: 'realistic' | 'fantasy' | 'anime' | 'concept-art' | 'illustration';
		};

		if (!germanDescription || !kind || !title) {
			return json(
				{ error: 'German description, kind und title sind erforderlich' },
				{ status: 400 }
			);
		}

		// Übersetze deutsche Beschreibung ins Englische
		console.log('Übersetze deutsche Beschreibung:', germanDescription.substring(0, 100) + '...');

		const englishPrompt = await translateToImagePrompt(germanDescription, kind, title, style);

		console.log('Übersetzung erfolgreich:', englishPrompt.substring(0, 100) + '...');

		return json({
			success: true,
			englishPrompt,
			message: 'Übersetzung erfolgreich',
		});
	} catch (error) {
		console.error('Fehler bei der Prompt-Übersetzung:', error);
		return json({ error: 'Übersetzung fehlgeschlagen' }, { status: 500 });
	}
};
