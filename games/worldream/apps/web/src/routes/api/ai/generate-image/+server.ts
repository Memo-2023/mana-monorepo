import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateImageWithFlux } from '$lib/ai/replicate-flux';
import { translateToImagePrompt } from '$lib/ai/openai';
import { createClient } from '$lib/supabase/server';
import { uploadImage } from '$lib/storage/images';
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
			kind,
			title,
			description,
			style = 'fantasy',
			context,
			nodeId,
			aspectRatio,
			imagePrompt,
		} = body as {
			kind: NodeKind;
			title: string;
			description?: string;
			style?: 'realistic' | 'fantasy' | 'anime' | 'concept-art' | 'illustration';
			context?: any;
			nodeId?: string;
			aspectRatio?: string;
			imagePrompt?: string;
		};

		if (!kind || !title) {
			return json({ error: 'Kind und Title sind erforderlich' }, { status: 400 });
		}

		// Bestimme die beste Beschreibung für die Bildgenerierung
		let finalDescription = description;

		// 1. Nutze vorhandenen imagePrompt falls vorhanden
		if (imagePrompt) {
			finalDescription = imagePrompt;
		}
		// 2. Falls deutsche Beschreibung vorhanden, übersetze sie
		else if (context?.appearance && context.appearance.length > 10) {
			try {
				console.log('Übersetze deutsche Beschreibung ins Englische...');
				finalDescription = await translateToImagePrompt(context.appearance, kind, title, style);
				console.log('Übersetzung erfolgreich:', finalDescription.substring(0, 100) + '...');
			} catch (error) {
				console.warn('Übersetzung fehlgeschlagen, verwende deutsche Beschreibung:', error);
				finalDescription = context.appearance;
			}
		}

		// Generiere Bild mit Flux Schnell über Replicate
		const result = await generateImageWithFlux({
			kind,
			title,
			description: finalDescription,
			style,
			context: {
				...context,
				// Überschreibe appearance mit übersetzter Version
				appearance: finalDescription,
			},
			aspectRatio,
		});

		// Wenn ein Bild generiert wurde, speichere es in Supabase
		let uploadedImageUrl = null;
		if (result.imageUrl) {
			try {
				let imageBlob: Blob;

				// Prüfe ob es Base64 oder eine URL ist
				if (result.imageUrl.startsWith('data:')) {
					// Base64 zu Blob konvertieren
					const base64Data = result.imageUrl.split(',')[1];
					const byteCharacters = atob(base64Data);
					const byteNumbers = new Array(byteCharacters.length);
					for (let i = 0; i < byteCharacters.length; i++) {
						byteNumbers[i] = byteCharacters.charCodeAt(i);
					}
					const byteArray = new Uint8Array(byteNumbers);
					imageBlob = new Blob([byteArray], { type: 'image/png' });
				} else {
					// Lade das Bild von der URL herunter
					const imageResponse = await fetch(result.imageUrl);
					imageBlob = await imageResponse.blob();
				}

				// Generiere eine temporäre nodeId falls keine vorhanden
				const tempNodeId = nodeId || `temp-${Date.now()}`;

				const uploadResult = await uploadImage(
					supabase,
					user.id,
					tempNodeId,
					imageBlob,
					`${title.toLowerCase().replace(/\s+/g, '-')}.png`
				);

				if (uploadResult) {
					uploadedImageUrl = uploadResult.url;
				}
			} catch (uploadError) {
				console.error('Fehler beim Hochladen des Bildes:', uploadError);
				// Gebe trotzdem die Original-URL zurück
				uploadedImageUrl = result.imageUrl;
			}
		}

		return json({
			success: true,
			imageUrl: uploadedImageUrl || result.imageUrl || null,
			prompt: result.prompt,
			message: uploadedImageUrl
				? 'Bild erfolgreich generiert und gespeichert'
				: result.imageUrl
					? 'Bild generiert (temporäre URL)'
					: 'Bildgenerierung fehlgeschlagen',
		});
	} catch (error) {
		console.error('Fehler bei Bildgenerierung:', error);
		return json({ error: 'Fehler bei der Bildgenerierung' }, { status: 500 });
	}
};
