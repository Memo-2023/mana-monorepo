import OpenAI from 'openai';
import { OPENAI_API_KEY } from '$env/static/private';
import type { ContentNode, NodeKind } from '$lib/types/content';
import { aiLogger } from '$lib/utils/logger';

const openai = new OpenAI({
	apiKey: OPENAI_API_KEY,
});

interface EditContentOptions {
	node: ContentNode;
	command: string;
}

function getEditSystemPrompt(kind: NodeKind): string {
	const basePrompt = `Du bist ein AI-Editor für Content Nodes in einem Worldbuilding-System. 
Du erhältst die aktuellen Daten einer ${kind} Entity und einen Bearbeitungsbefehl.

DEINE AUFGABE:
- Interpretiere den Befehl und identifiziere welche Felder geändert werden sollen
- Gib NUR die geänderten Felder als JSON zurück
- Behalte den bestehenden Stil und Ton bei
- Bei slug-Änderungen: automatisch URL-safe formatieren (lowercase, hyphens)
- WICHTIG: Bei Umbenennungen durchsuche ALLE Felder nach dem alten Namen und aktualisiere sie

BEFEHLSTYPEN:
- "Benenne um zu X" → title und slug ändern + ALLE anderen Felder nach altem Namen durchsuchen und ersetzen
- "Ändere [Feld] zu/auf X" → spezifisches Feld updaten  
- "Füge zu [Feld] hinzu: X" → bestehenden Inhalt erweitern
- "Entferne aus [Feld]: X" → spezifischen Inhalt löschen
- "Aktualisiere [Feld]: X" → Feld komplett ersetzen

FELDER nach NodeKind:`;

	const fieldMappings = {
		character: `
- title: Name des Charakters
- slug: URL-freundlicher Identifier
- summary: Kurze Zusammenfassung
- tags: Array von Tags
- content.appearance: Aussehen/Beschreibung
- content.lore: Hintergrundgeschichte  
- content.voice_style: Sprechweise
- content.capabilities: Fähigkeiten
- content.constraints: Einschränkungen
- content.motivations: Ziele/Motivationen
- content.secrets: Geheimnisse
- content.relationships_text: Beziehungen
- content.inventory_text: Inventar/Besitz
- content.timeline_text: Wichtige Ereignisse
- content.state_text: Aktueller Zustand`,

		place: `
- title: Name des Orts
- slug: URL-freundlicher Identifier  
- summary: Kurze Zusammenfassung
- tags: Array von Tags
- content.appearance: Erscheinungsbild
- content.lore: Geschichte/Bedeutung
- content.capabilities: Was ist möglich
- content.constraints: Gefahren/Einschränkungen
- content.state_text: Aktueller Zustand
- content.secrets: Verborgene Aspekte`,

		object: `
- title: Name des Objekts
- slug: URL-freundlicher Identifier
- summary: Kurze Zusammenfassung  
- tags: Array von Tags
- content.appearance: Aussehen/Material
- content.lore: Herkunft/Geschichte
- content.capabilities: Eigenschaften/Fähigkeiten
- content.constraints: Einschränkungen/Nachteile
- content.state_text: Zustand/Besitzer`,

		world: `
- title: Name der Welt
- slug: URL-freundlicher Identifier
- summary: Kurze Zusammenfassung
- tags: Array von Tags  
- content.appearance: Beschreibung
- content.lore: Geschichte/Lore
- content.canon_facts_text: Kanon-Fakten
- content.glossary_text: Glossar
- content.constraints: Regeln/Einschränkungen
- content.timeline_text: Zeitlinie
- content.prompt_guidelines: KI-Richtlinien`,

		story: `
- title: Titel der Geschichte
- slug: URL-freundlicher Identifier
- summary: Kurze Zusammenfassung
- tags: Array von Tags
- content.lore: Story-Verlauf/Plot
- content.references: Referenzen/Verweise
- content.prompt_guidelines: LLM-Richtlinien`,
	};

	return (
		basePrompt +
		fieldMappings[kind] +
		`

BEISPIELE:
User: "Benenne um zu Gandalf der Graue" 
→ {"title": "Gandalf der Graue", "slug": "gandalf-der-graue", "content": {"appearance": "Gandalf der Graue trägt...", "lore": "Gandalf der Graue wurde..."}}
(Alle Felder durchsuchen wo "Gandalf" erwähnt wird und zu "Gandalf der Graue" ändern)

User: "Füge zur Erscheinung hinzu: trägt einen blauen Mantel"
→ {"content": {"appearance": "[BESTEHENDER TEXT] trägt einen blauen Mantel"}}

User: "Ändere die Fähigkeiten zu: Meister der Feuermagie"  
→ {"content": {"capabilities": "Meister der Feuermagie"}}

WICHTIG:
- Gib NUR ein gültiges JSON-Objekt zurück
- Keine Erklärungen oder zusätzlicher Text
- Bei content-Feldern: Nur die geänderten Unterfelder einschließen
- Bestehende @mentions und Formatierung beibehalten`
	);
}

export async function editContentWithAI(
	options: EditContentOptions
): Promise<Partial<ContentNode>> {
	const { node, command } = options;

	aiLogger.info(`Starting AI content editing for ${node.kind}`, {
		nodeId: node.id,
		nodeSlug: node.slug,
		commandLength: command.length,
	});

	const systemPrompt = getEditSystemPrompt(node.kind);
	const endTimer = aiLogger.startTimer(`editContent-${node.kind}`);

	try {
		const userPrompt = `AKTUELLE DATEN:
${JSON.stringify(
	{
		title: node.title,
		slug: node.slug,
		summary: node.summary,
		tags: node.tags,
		content: node.content,
	},
	null,
	2
)}

BEFEHL: ${command}`;

		const requestParams = {
			model: 'gpt-5-mini',
			messages: [
				{ role: 'system', content: systemPrompt },
				{ role: 'user', content: userPrompt },
			],
			response_format: { type: 'json_object' },
			max_completion_tokens: 5000,
			// Keine temperature - GPT-4o-mini unterstützt nur default (1.0)
		};

		aiLogger.apiRequest('OpenAI', 'chat.completions.create', requestParams);

		const completion = await openai.chat.completions.create(requestParams as any);

		const duration = endTimer();

		if (!completion.choices[0]?.message?.content) {
			throw new Error('No content received from AI');
		}

		const rawResponse = completion.choices[0].message.content;

		aiLogger.debug('Raw AI editing response', {
			contentLength: rawResponse.length,
			first500Chars: rawResponse.substring(0, 500),
			tokensUsed: completion.usage?.completion_tokens || 0,
			finishReason: completion.choices[0].finish_reason,
		});

		// Parse AI response
		let updates: Partial<ContentNode>;
		try {
			updates = JSON.parse(rawResponse);
		} catch (parseError) {
			aiLogger.error('Failed to parse AI response as JSON', { rawResponse, parseError });
			throw new Error('AI returned invalid JSON format');
		}

		// Validate and clean updates
		const cleanedUpdates = validateAndCleanUpdates(updates, node);

		aiLogger.apiResponse('OpenAI', 'chat.completions.create', completion, duration);
		aiLogger.info('Content edited successfully', {
			nodeSlug: node.slug,
			fieldsChanged: Object.keys(cleanedUpdates),
			duration,
		});

		return cleanedUpdates;
	} catch (error) {
		const duration = endTimer();
		aiLogger.error('AI content editing failed', {
			nodeSlug: node.slug,
			command,
			duration,
			error: error instanceof Error ? error.message : String(error),
		});
		throw error;
	}
}

function validateAndCleanUpdates(updates: any, originalNode: ContentNode): Partial<ContentNode> {
	const cleaned: Partial<ContentNode> = {};

	// Validate basic fields
	if (updates.title && typeof updates.title === 'string') {
		cleaned.title = updates.title.trim();
	}

	if (updates.slug && typeof updates.slug === 'string') {
		// Ensure slug is URL-safe
		cleaned.slug = updates.slug
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '');
	}

	if (updates.summary && typeof updates.summary === 'string') {
		cleaned.summary = updates.summary.trim();
	}

	if (updates.tags && Array.isArray(updates.tags)) {
		cleaned.tags = updates.tags.filter((tag) => typeof tag === 'string').map((tag) => tag.trim());
	}

	// Validate content updates
	if (updates.content && typeof updates.content === 'object') {
		// WICHTIG: Starte mit dem originalen Content, nicht mit einem leeren Objekt!
		// So bleiben alle nicht-geänderten Felder erhalten
		cleaned.content = { ...(originalNode.content || {}) };

		// Merge content fields, handling append operations
		for (const [key, value] of Object.entries(updates.content)) {
			if (typeof value === 'string') {
				const trimmedValue = value.trim();
				// Update or add the field
				cleaned.content[key] = trimmedValue;
			} else if (value === null || value === undefined) {
				// Allow deletion of fields if explicitly set to null
				delete cleaned.content[key];
			}
		}
	}

	// Always update timestamp when making changes
	if (Object.keys(cleaned).length > 0) {
		cleaned.updated_at = new Date().toISOString();
	}

	return cleaned;
}
