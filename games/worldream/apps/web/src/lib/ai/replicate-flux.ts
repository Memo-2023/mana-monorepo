import Replicate from 'replicate';
import { REPLICATE_API_TOKEN } from '$env/static/private';
import type { NodeKind } from '$lib/types/content';

// Prüfe ob Token vorhanden
if (!REPLICATE_API_TOKEN) {
	console.error('REPLICATE_API_TOKEN ist nicht definiert. Bitte in .env eintragen.');
}

const replicate = new Replicate({
	auth: REPLICATE_API_TOKEN || '',
});

interface ImageGenerationOptions {
	kind: NodeKind;
	title: string;
	description?: string;
	style?: 'realistic' | 'fantasy' | 'anime' | 'concept-art' | 'illustration';
	context?: {
		world?: string;
		appearance?: string;
		atmosphere?: string;
	};
	aspectRatio?: string;
}

export async function generateImageWithFlux(options: ImageGenerationOptions): Promise<{
	imageUrl: string;
	prompt: string;
}> {
	const { kind, title, description, style = 'fantasy', context, aspectRatio = '1:1' } = options;

	// Prüfe Token nochmals
	if (!REPLICATE_API_TOKEN) {
		throw new Error('REPLICATE_API_TOKEN nicht konfiguriert. Bitte Token in .env Datei eintragen.');
	}

	const prompt = buildImagePrompt(kind, title, description, style, context);

	try {
		console.log('Generating image with Flux Schnell, prompt:', prompt);
		console.log('Using aspect ratio:', aspectRatio, 'for kind:', kind);

		// Verwende die Standard run() API ohne Stream
		const output = await replicate.run('black-forest-labs/flux-schnell', {
			input: {
				prompt: prompt,
				num_outputs: 1,
				aspect_ratio: aspectRatio,
				output_format: 'webp',
				output_quality: 80,
			},
		});

		console.log('Flux Raw Output Type:', typeof output);
		console.log('Flux Raw Output:', output);

		// Verarbeite das Output - Type als unknown, da Replicate verschiedene Formate zurückgibt
		let imageUrl: string = '';
		const result = output as unknown;

		// Wenn es ein Array mit ReadableStreams ist
		if (Array.isArray(result) && result.length > 0) {
			const firstItem = result[0];

			// Wenn es ein ReadableStream ist, konvertiere zu Base64
			if (
				firstItem instanceof ReadableStream ||
				(firstItem && typeof firstItem === 'object' && 'locked' in firstItem)
			) {
				console.log('Verarbeite ReadableStream mit Binärdaten...');

				// Prüfe ob Stream bereits gelesen wurde
				if (firstItem.locked || (firstItem as any).state === 'closed') {
					console.error('Stream ist bereits geschlossen oder gesperrt');
					throw new Error('Stream konnte nicht gelesen werden');
				}

				const reader = firstItem.getReader();
				const chunks = [];

				try {
					while (true) {
						const { done, value } = await reader.read();
						if (done) break;
						chunks.push(value);
					}

					// Kombiniere alle Chunks zu einem Uint8Array
					const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
					const combinedArray = new Uint8Array(totalLength);
					let offset = 0;
					for (const chunk of chunks) {
						combinedArray.set(chunk, offset);
						offset += chunk.length;
					}

					// Konvertiere zu Base64
					// Verwende Buffer wenn verfügbar (Node.js), sonst btoa (Browser)
					let base64String = '';
					if (typeof Buffer !== 'undefined') {
						// Node.js Umgebung
						base64String = Buffer.from(combinedArray).toString('base64');
					} else {
						// Browser Umgebung (falls jemals direkt verwendet)
						const binaryString = Array.from(combinedArray)
							.map((byte) => String.fromCharCode(byte))
							.join('');
						base64String = btoa(binaryString);
					}

					// Erstelle Data URL (WebP Format basierend auf den Einstellungen)
					imageUrl = `data:image/webp;base64,${base64String}`;
					console.log('Bild als Base64 Data URL konvertiert');
				} catch (streamError) {
					console.error('Fehler beim Lesen des Streams:', streamError);
					throw new Error('Stream konnte nicht verarbeitet werden');
				} finally {
					reader.releaseLock();
				}
			}
			// Wenn es bereits eine URL ist
			else if (typeof firstItem === 'string' && firstItem.startsWith('http')) {
				imageUrl = firstItem;
			}
		}
		// Wenn es direkt ein String ist
		else if (typeof result === 'string' && result.startsWith('http')) {
			imageUrl = result;
		}

		if (!imageUrl) {
			console.error('Konnte keine URL extrahieren aus:', output);
			throw new Error('Keine gültige Bild-URL von Flux erhalten');
		}

		console.log('Flux finale Bild-URL:', imageUrl);

		return {
			imageUrl,
			prompt,
		};
	} catch (error: any) {
		console.error('Flux Schnell Fehler:', error);

		// Gebe detaillierten Fehler zurück
		throw new Error(`Bildgenerierung fehlgeschlagen: ${error.message || 'Unbekannter Fehler'}`);
	}
}

function buildImagePrompt(
	kind: NodeKind,
	title: string,
	description?: string,
	style: string = 'fantasy',
	context?: any
): string {
	const styleDescriptions = {
		realistic: 'photorealistic, highly detailed, professional photography, 8k resolution',
		fantasy:
			'fantasy art style, magical atmosphere, detailed digital illustration, artstation quality',
		anime: 'anime art style, vibrant colors, expressive, studio ghibli inspired',
		'concept-art': 'concept art, professional digital painting, atmospheric, cinematic lighting',
		illustration: 'detailed illustration, artistic, hand-drawn quality, storybook style',
	};

	const kindPrompts: Record<NodeKind, string> = {
		character: `Character portrait of ${title}. ${description || ''} ${context?.appearance || ''}. ${styleDescriptions[style as keyof typeof styleDescriptions]}. Detailed face, expressive eyes, professional character design`,

		place: `Environment concept art of ${title}. ${description || ''} ${context?.atmosphere || ''}. Wide shot, establishing view. ${styleDescriptions[style as keyof typeof styleDescriptions]}. Epic landscape, atmospheric perspective`,

		object: `Item design of ${title}. ${description || ''} Centered composition, clear details. ${styleDescriptions[style as keyof typeof styleDescriptions]}. Product shot, clean background, professional presentation`,

		world: `World map or panoramic view of ${title}. ${description || ''} Epic scale, diverse landscapes. ${styleDescriptions[style as keyof typeof styleDescriptions]}. Bird's eye view, detailed geography`,

		story: `Key scene illustration from "${title}". ${description || ''} Dramatic composition, narrative moment. ${styleDescriptions[style as keyof typeof styleDescriptions]}. Dynamic action, emotional impact`,
	};

	let fullPrompt = kindPrompts[kind];

	if (context?.world) {
		fullPrompt += ` Set in the world of ${context.world}.`;
	}

	// Flux-spezifische Optimierungen
	fullPrompt +=
		' Masterpiece, best quality, ultra-detailed, sharp focus. No watermarks, no text, no logos.';

	// Flux Prompt-Limit
	if (fullPrompt.length > 1000) {
		fullPrompt = fullPrompt.substring(0, 1000) + '...';
	}

	return fullPrompt;
}
