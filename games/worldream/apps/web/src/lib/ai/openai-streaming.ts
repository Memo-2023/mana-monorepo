import OpenAI from 'openai';
import { OPENAI_API_KEY } from '$env/static/private';
import type { ContentData, NodeKind } from '$lib/types/content';

const openai = new OpenAI({
	apiKey: OPENAI_API_KEY,
});

interface StreamOptions {
	kind: NodeKind;
	prompt: string;
	context?: any;
	onChunk?: (chunk: string) => void;
	onComplete?: (result: any) => void;
}

// Streaming-Version für bessere UX (zeigt Fortschritt)
export async function generateContentStream(options: StreamOptions): Promise<{
	title: string;
	summary: string;
	content: Partial<ContentData>;
	tags: string[];
}> {
	const { kind, prompt, context, onChunk, onComplete } = options;

	if (kind === 'world') {
		return generateWorldContentStream(prompt, context, onChunk, onComplete);
	}

	// Für andere Content-Typen
	const systemPrompt = getStreamingPrompt(kind, context);

	const stream = await openai.chat.completions.create({
		model: 'gpt-5-mini',
		messages: [
			{ role: 'system', content: systemPrompt },
			{ role: 'user', content: prompt },
		],
		// temperature: 1 ist default für GPT-4o-mini
		stream: true,
		max_completion_tokens: 2000,
	});

	let fullContent = '';

	for await (const chunk of stream) {
		const content = chunk.choices[0]?.delta?.content || '';
		fullContent += content;
		onChunk?.(content);
	}

	// Parse das Ergebnis
	try {
		const result = parseGeneratedContent(fullContent, kind);
		onComplete?.(result);
		return result;
	} catch (error) {
		console.error('Failed to parse generated content:', error);
		// Fallback: Versuche trotzdem etwas zu extrahieren
		return extractFallbackContent(fullContent, kind);
	}
}

// Optimierte zweistufige Welt-Generierung mit Streaming
async function generateWorldContentStream(
	prompt: string,
	context: any,
	onChunk?: (chunk: string) => void,
	onComplete?: (result: any) => void
): Promise<{
	title: string;
	summary: string;
	content: Partial<ContentData>;
	tags: string[];
}> {
	// Stufe 1: Basis-Info mit strukturiertem Output
	onChunk?.('🌍 Erstelle Grundlagen der Welt...\n\n');

	const basePrompt = `Erstelle eine neue Welt. Antworte in folgendem Format:

TITEL: [Name der Welt]
ZUSAMMENFASSUNG: [1-2 Sätze Beschreibung]
TAGS: [tag1, tag2, tag3]

ERSCHEINUNG:
[2-3 Absätze über Landschaften und Atmosphäre]

GESCHICHTE:
[2-3 Absätze über Entstehung und Historie]

REGELN:
[Wichtigste Naturgesetze und Einschränkungen als Stichpunkte]`;

	const baseStream = await openai.chat.completions.create({
		model: 'gpt-5-mini',
		messages: [
			{ role: 'system', content: 'Du bist ein kreativer Weltenbauer.' },
			{ role: 'user', content: prompt },
		],
		// temperature: 1 ist default für GPT-4o-mini
		stream: true,
		max_completion_tokens: 1000,
	});

	let baseContent = '';
	for await (const chunk of baseStream) {
		const content = chunk.choices[0]?.delta?.content || '';
		baseContent += content;
		onChunk?.(content);
	}

	// Parse Basis-Ergebnis
	const baseResult = parseWorldBase(baseContent);

	// Stufe 2: Details
	onChunk?.('\n\n📚 Erweitere Details...\n\n');

	const detailPrompt = `Für die Welt "${baseResult.title}", erstelle:

CANON-FAKTEN:
[3-5 unveränderliche Wahrheiten]

GLOSSAR:
[5-7 wichtige Begriffe mit Erklärungen]

TIMELINE:
[3-5 historische Ereignisse]

RICHTLINIEN:
[Stil-Richtlinien für weitere Inhalte]`;

	const detailStream = await openai.chat.completions.create({
		model: 'gpt-5-mini',
		messages: [
			{ role: 'system', content: 'Erweitere die Welt-Details.' },
			{ role: 'user', content: detailPrompt },
		],
		// temperature: 1 ist default für GPT-4o-mini
		stream: true,
		max_completion_tokens: 800,
	});

	let detailContent = '';
	for await (const chunk of detailStream) {
		const content = chunk.choices[0]?.delta?.content || '';
		detailContent += content;
		onChunk?.(content);
	}

	const detailResult = parseWorldDetails(detailContent);

	const finalResult = {
		title: baseResult.title,
		summary: baseResult.summary,
		tags: baseResult.tags,
		content: {
			appearance: baseResult.appearance,
			lore: baseResult.lore,
			constraints: baseResult.constraints,
			canon_facts_text: detailResult.canon_facts_text,
			glossary_text: detailResult.glossary_text,
			timeline_text: detailResult.timeline_text,
			prompt_guidelines: detailResult.prompt_guidelines,
		},
	};

	onComplete?.(finalResult);
	return finalResult;
}

// Helper: Parse strukturierten Text für Welt-Basis
function parseWorldBase(text: string): any {
	const lines = text.split('\n');
	const result: any = {
		title: '',
		summary: '',
		tags: [],
		appearance: '',
		lore: '',
		constraints: '',
	};

	let currentSection = '';
	let sectionContent: string[] = [];

	for (const line of lines) {
		if (line.startsWith('TITEL:')) {
			result.title = line.replace('TITEL:', '').trim();
		} else if (line.startsWith('ZUSAMMENFASSUNG:')) {
			result.summary = line.replace('ZUSAMMENFASSUNG:', '').trim();
		} else if (line.startsWith('TAGS:')) {
			result.tags = line
				.replace('TAGS:', '')
				.trim()
				.split(',')
				.map((t) => t.trim());
		} else if (line.startsWith('ERSCHEINUNG:')) {
			if (currentSection && sectionContent.length) {
				result[currentSection] = sectionContent.join('\n').trim();
			}
			currentSection = 'appearance';
			sectionContent = [];
		} else if (line.startsWith('GESCHICHTE:')) {
			if (currentSection && sectionContent.length) {
				result[currentSection] = sectionContent.join('\n').trim();
			}
			currentSection = 'lore';
			sectionContent = [];
		} else if (line.startsWith('REGELN:')) {
			if (currentSection && sectionContent.length) {
				result[currentSection] = sectionContent.join('\n').trim();
			}
			currentSection = 'constraints';
			sectionContent = [];
		} else if (currentSection) {
			sectionContent.push(line);
		}
	}

	// Letzten Abschnitt speichern
	if (currentSection && sectionContent.length) {
		result[currentSection] = sectionContent.join('\n').trim();
	}

	return result;
}

// Helper: Parse Details
function parseWorldDetails(text: string): any {
	const lines = text.split('\n');
	const result: any = {};

	let currentSection = '';
	let sectionContent: string[] = [];

	for (const line of lines) {
		if (line.startsWith('CANON-FAKTEN:')) {
			if (currentSection && sectionContent.length) {
				result[currentSection] = sectionContent.join('\n').trim();
			}
			currentSection = 'canon_facts_text';
			sectionContent = [];
		} else if (line.startsWith('GLOSSAR:')) {
			if (currentSection && sectionContent.length) {
				result[currentSection] = sectionContent.join('\n').trim();
			}
			currentSection = 'glossary_text';
			sectionContent = [];
		} else if (line.startsWith('TIMELINE:')) {
			if (currentSection && sectionContent.length) {
				result[currentSection] = sectionContent.join('\n').trim();
			}
			currentSection = 'timeline_text';
			sectionContent = [];
		} else if (line.startsWith('RICHTLINIEN:')) {
			if (currentSection && sectionContent.length) {
				result[currentSection] = sectionContent.join('\n').trim();
			}
			currentSection = 'prompt_guidelines';
			sectionContent = [];
		} else if (currentSection) {
			sectionContent.push(line);
		}
	}

	// Letzten Abschnitt speichern
	if (currentSection && sectionContent.length) {
		result[currentSection] = sectionContent.join('\n').trim();
	}

	return result;
}

// Helper für andere Content-Typen
function getStreamingPrompt(kind: NodeKind, context?: any): string {
	const prompts: Record<NodeKind, string> = {
		character: `Erstelle einen Charakter. Format:
TITEL: [Name]
ZUSAMMENFASSUNG: [Kurzbeschreibung]
TAGS: [tag1, tag2]

AUSSEHEN:
[Beschreibung]

GESCHICHTE:
[Hintergrund]

FÄHIGKEITEN:
[Liste]

MOTIVATION:
[Ziele und Antriebe]`,

		place: `Erstelle einen Ort. Format:
TITEL: [Name]
ZUSAMMENFASSUNG: [Kurzbeschreibung]
TAGS: [tag1, tag2]

AUSSEHEN:
[Beschreibung]

GESCHICHTE:
[Hintergrund]

BESONDERHEITEN:
[Was macht diesen Ort einzigartig]`,

		object: `Erstelle ein Objekt. Format:
TITEL: [Name]
ZUSAMMENFASSUNG: [Kurzbeschreibung]
TAGS: [tag1, tag2]

AUSSEHEN:
[Beschreibung]

FUNKTION:
[Zweck und Fähigkeiten]

GESCHICHTE:
[Herkunft]`,

		story: `Erstelle eine Story. Format:
TITEL: [Name]
ZUSAMMENFASSUNG: [Plot-Zusammenfassung]
TAGS: [genre1, genre2]

HANDLUNG:
[Story-Verlauf]

CHARAKTERE:
[Wichtige Personen]

WENDEPUNKTE:
[Schlüsselmomente]`,

		world: '', // Wird oben speziell behandelt
	};

	return prompts[kind] || prompts.character;
}

// Parse generierte Inhalte aus strukturiertem Text
function parseGeneratedContent(text: string, kind: NodeKind): any {
	// Ähnlich wie parseWorldBase, aber für alle Content-Typen
	const lines = text.split('\n');
	const result: any = {
		title: '',
		summary: '',
		tags: [],
		content: {},
	};

	// Extrahiere Basis-Info
	for (const line of lines) {
		if (line.startsWith('TITEL:')) {
			result.title = line.replace('TITEL:', '').trim();
		} else if (line.startsWith('ZUSAMMENFASSUNG:')) {
			result.summary = line.replace('ZUSAMMENFASSUNG:', '').trim();
		} else if (line.startsWith('TAGS:')) {
			result.tags = line
				.replace('TAGS:', '')
				.trim()
				.split(',')
				.map((t) => t.trim());
		}
	}

	// Content-spezifische Felder
	if (kind === 'character') {
		result.content.appearance = extractSection(text, 'AUSSEHEN:');
		result.content.lore = extractSection(text, 'GESCHICHTE:');
		result.content.capabilities = extractSection(text, 'FÄHIGKEITEN:');
		result.content.motivations = extractSection(text, 'MOTIVATION:');
	} else if (kind === 'place') {
		result.content.appearance = extractSection(text, 'AUSSEHEN:');
		result.content.lore = extractSection(text, 'GESCHICHTE:');
		result.content.capabilities = extractSection(text, 'BESONDERHEITEN:');
	} else if (kind === 'object') {
		result.content.appearance = extractSection(text, 'AUSSEHEN:');
		result.content.capabilities = extractSection(text, 'FUNKTION:');
		result.content.lore = extractSection(text, 'GESCHICHTE:');
	} else if (kind === 'story') {
		result.content.lore = extractSection(text, 'HANDLUNG:');
		result.content.references = extractSection(text, 'CHARAKTERE:');
		result.content.timeline_text = extractSection(text, 'WENDEPUNKTE:');
	}

	return result;
}

// Helper: Extrahiere Sektion aus Text
function extractSection(text: string, marker: string): string {
	const startIndex = text.indexOf(marker);
	if (startIndex === -1) return '';

	const nextMarkers = [
		'TITEL:',
		'ZUSAMMENFASSUNG:',
		'TAGS:',
		'AUSSEHEN:',
		'GESCHICHTE:',
		'FÄHIGKEITEN:',
		'MOTIVATION:',
		'BESONDERHEITEN:',
		'FUNKTION:',
		'HANDLUNG:',
		'CHARAKTERE:',
		'WENDEPUNKTE:',
		'CANON-FAKTEN:',
		'GLOSSAR:',
		'TIMELINE:',
		'RICHTLINIEN:',
		'REGELN:',
	];

	let endIndex = text.length;
	for (const nextMarker of nextMarkers) {
		const idx = text.indexOf(nextMarker, startIndex + marker.length);
		if (idx > -1 && idx < endIndex) {
			endIndex = idx;
		}
	}

	return text.substring(startIndex + marker.length, endIndex).trim();
}

// Fallback wenn Parsing fehlschlägt
function extractFallbackContent(text: string, kind: NodeKind): any {
	// Versuche zumindest Titel zu extrahieren
	const titleMatch = text.match(/TITEL:\s*(.+)/i);
	const summaryMatch = text.match(/ZUSAMMENFASSUNG:\s*(.+)/i);

	return {
		title: titleMatch?.[1] || 'Unbenannt',
		summary: summaryMatch?.[1] || text.substring(0, 100),
		tags: [],
		content: {
			lore: text, // Speichere alles als lore
		},
	};
}
